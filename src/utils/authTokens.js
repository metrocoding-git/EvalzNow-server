const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const db = require('../models');

const ALG = 'HS256';

/** Small in-memory TTL cache (keeps per-request auth checks off the database). */
class TTLCache {
  constructor(ttlMs, max = 5000) { this.ttl = ttlMs; this.max = max; this.map = new Map(); }
  get(k) {
    const e = this.map.get(k);
    if (!e) return undefined;
    if (e.exp < Date.now()) { this.map.delete(k); return undefined; }
    return e.v;
  }
  set(k, v) {
    if (this.map.size >= this.max) this.map.delete(this.map.keys().next().value);
    this.map.set(k, { v, exp: Date.now() + this.ttl });
  }
  delete(k) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const revokedJti = new Set();                  // tokens logged out by this process (instant)
const accountNotBefore = new Map();            // accountId -> epoch ms
const revocationCache = new TTLCache(30 * 1000); // DB lookups, 30 s
const principalCache = new TTLCache(30 * 1000);  // account -> tenant info, 30 s

function signToken(account) {
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign(
    { id: account.id, username: account.username, role: account.role, t: Date.now() },
    env.JWT_SECRET,
    { algorithm: ALG, expiresIn: env.JWT_EXPIRES_IN, jwtid: jti }
  );
  return token;
}

// Cache of already-verified tokens (performance): the browser sends the same token on
// every request, so the HMAC check runs once per token per minute instead of every call.
// Only successfully verified tokens are cached, and never past their expiry time.
const verifiedCache = new TTLCache(60 * 1000, 10000);

function verifyToken(token) {
  const hit = verifiedCache.get(token);
  if (hit) {
    if (!hit.exp || hit.exp * 1000 > Date.now()) return hit;
    verifiedCache.delete(token);
  }
  // Pin the algorithm: blocks "alg: none" and algorithm-confusion attacks.
  const decoded = jwt.verify(token, env.JWT_SECRET, { algorithms: [ALG] });
  verifiedCache.set(token, decoded);
  return decoded;
}

async function revokeToken(decoded) {
  if (!decoded?.jti) return;
  revokedJti.add(decoded.jti);
  revocationCache.delete(`j:${decoded.jti}`);
  const expiresAt = new Date((decoded.exp || Math.floor(Date.now() / 1000) + 86400) * 1000);
  try {
    await db.AuthRevocation.findOrCreate({
      where: { jti: decoded.jti },
      defaults: { jti: decoded.jti, accountId: decoded.id, expiresAt },
    });
  } catch (e) {
    console.error('[auth] failed to persist revocation:', e.message);
  }
}

/** Invalidate every existing session of an account (password reset, account change). */
async function revokeAllForAccount(accountId) {
  const now = Date.now();
  accountNotBefore.set(Number(accountId), now);
  revocationCache.delete(`a:${accountId}`);
  principalCache.delete(Number(accountId));
  try {
    // Keep the row long enough to outlive any token issued before now.
    const expiresAt = new Date(Date.now() + 31 * 24 * 3600 * 1000);
    await db.AuthRevocation.create({ accountId, notBefore: new Date(now), expiresAt });
  } catch (e) {
    console.error('[auth] failed to persist account revocation:', e.message);
  }
}

async function isRevoked(decoded) {
  if (!decoded) return true;
  if (decoded.jti && revokedJti.has(decoded.jti)) return true;

  // issued-at in ms (custom claim `t`), falling back to the standard seconds claim
  const issuedMs = Number(decoded.t) || (decoded.iat || 0) * 1000;
  const localNb = accountNotBefore.get(Number(decoded.id));
  if (localNb && issuedMs <= localNb) return true;

  if (decoded.jti) {
    const key = `j:${decoded.jti}`;
    let hit = revocationCache.get(key);
    if (hit === undefined) {
      hit = Boolean(await db.AuthRevocation.findOne({ where: { jti: decoded.jti }, attributes: ['id'] }));
      revocationCache.set(key, hit);
    }
    if (hit) { revokedJti.add(decoded.jti); return true; }
  }

  const akey = `a:${decoded.id}`;
  let nb = revocationCache.get(akey);
  if (nb === undefined) {
    const row = await db.AuthRevocation.findOne({
      where: { accountId: decoded.id, notBefore: { [Op.ne]: null } },
      order: [['notBefore', 'DESC']],
      attributes: ['notBefore'],
    });
    nb = row ? new Date(row.notBefore).getTime() : 0;
    revocationCache.set(akey, nb);
  }
  return Boolean(nb && issuedMs <= nb);
}

/**
 * Who is calling and which tenant (client) they belong to.
 * Mirrors the existing login logic: staff -> Staff.clientId, admin/super admin -> Client by email.
 */
async function loadPrincipal(accountId) {
  const cached = principalCache.get(Number(accountId));
  if (cached !== undefined) return cached;

  const account = await db.Account.findByPk(accountId, { attributes: ['id', 'username', 'role'] });
  if (!account) { principalCache.set(Number(accountId), null); return null; }

  const p = {
    id: account.id,
    username: account.username,
    role: account.role,
    isSuperAdmin: account.role === 'super admin',
    clientId: null,
    staffId: null,
    accessLevel: null,
    disabled: false,
  };

  if (account.role === 'staff') {
    const staff = await db.Staff.findOne({
      where: { emailAddress: account.username },
      attributes: ['id', 'clientId', 'accessLevel', 'accountStatus'],
    });
    if (staff) {
      p.clientId = staff.clientId;
      p.staffId = staff.id;
      p.accessLevel = staff.accessLevel;
      p.disabled = staff.accountStatus === 'Disabled';
    }
  } else {
    const client = await db.Client.findOne({ where: { emailAddress: account.username }, attributes: ['id'] });
    p.clientId = client ? client.id : null;
  }

  principalCache.set(Number(accountId), p);
  return p;
}

/** Periodically purge expired rows so the table stays tiny. */
function startRevocationCleanup() {
  const run = () => db.AuthRevocation.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } })
    .catch(() => null);
  const t = setInterval(run, 6 * 3600 * 1000);
  t.unref();
}

function clearAuthCaches() {
  verifiedCache.clear(); revokedJti.clear(); accountNotBefore.clear(); revocationCache.clear(); principalCache.clear();
}

module.exports = {
  signToken, verifyToken, revokeToken, revokeAllForAccount, isRevoked, loadPrincipal,
  startRevocationCleanup, clearAuthCaches, TTLCache, principalCache,
};
