/**
 * EvalzNow API - Security test suite
 *
 * Run (uses a DEDICATED TEST DATABASE - all tables are recreated):
 *   TEST_ALLOW_DB_RESET=1 DB_NAME=evalznow_test ... npm run test:security
 */
process.env.LOGIN_MAX_ATTEMPTS = process.env.LOGIN_MAX_ATTEMPTS || '10';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-'.padEnd(48, 'x');

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const { seed, PASSWORD } = require('./helpers/seed');
const { makeRow } = require('./helpers/factory');
const db = require('../src/models');
const app = require('../src/app');
// Optional helpers (lets the same suite run against the old code for a before/after comparison)
const optional = (p, name) => { try { return require(p)[name]; } catch { return async () => {}; } };
const ensureDb = optional('../src/config/ensureDb', 'ensureDb');
const clearAuthCaches = optional('../src/utils/authTokens', 'clearAuthCaches');
const clearOwnerCache = optional('../src/middlewares/tenant.middleware', 'clearOwnerCache');

const API = '/api/v1';
let S;                 // seed result
const T = {};          // tokens
const B = {};          // tenant B record ids
const A = {};          // tenant A record ids

async function login(username, password = PASSWORD) {
  const r = await request(app).post(`${API}/account`).send({ username, password });
  return r;
}
const auth = (t) => ({ Authorization: `Bearer ${t}` });

// ---------------------------------------------------------------------------
// Collect every API route (method + full path) straight from the router files
// ---------------------------------------------------------------------------
function allRoutes() {
  const src = fs.readFileSync(path.join(__dirname, '../src/routes/index.js'), 'utf8');
  const mounts = [
    ...[...src.matchAll(/mount\('([^']+)',\s*'([^']+)'/g)].map((m) => [m[1], m[2]]),
    // older style: router.use('/x', require('./file'))
    ...[...src.matchAll(/router\.use\('([^']+)',\s*require\('([^']+)'\)\)/g)].map((m) => [m[1], m[2]]),
  ].filter(([b]) => b !== '/account' && b !== '/users');
  mounts.push(['/account', './account.routes']);
  const out = [];
  for (const [base, file] of mounts) {
    const router = require(path.join(__dirname, '../src/routes', file));
    for (const layer of router.stack) {
      if (!layer.route) continue;
      for (const method of Object.keys(layer.route.methods)) {
        out.push({ method, base, path: layer.route.path, full: base + (layer.route.path === '/' ? '' : layer.route.path) });
      }
    }
  }
  return out;
}
const PUBLIC = new Set(['post /account', 'post /account/recover', 'post /account/reset-password']);

function fill(p, ids, base) {
  const idFor = {
    '/clients': ids.client, '/staffs': ids.staff, '/candidates': ids.candidate, '/units': ids.unit,
    '/unit_roster': ids.roster, '/assessment_block_manager': ids.block, '/insert-score': ids.score,
    '/irregulaties': ids.irregularity, '/benchmark': ids.benchmark, '/ethinicity': ids.ethinicity,
    '/income': ids.income, '/scoring-criteria': ids.criteria, '/projection': ids.projection,
  }[base];
  const auxId = { lesson: ids.lesson, marks: ids.marks, leader: ids.leader, assessment: ids.need, chain: ids.chain };
  return p
    .replace(':clientId', ids.client).replace(':unitId', ids.unit)
    .replace(':candidateId', ids.candidate).replace(':candidate_id', ids.candidate)
    .replace(':blockId', ids.block).replace(':ppId', 1)
    .replace(':sessionId', base === '/neuro-science' ? ids.neuro : ids.projection)
    .replace(':id', base === '/auxiliary' ? auxId[p.slice(base.length).split('/')[1]] : idFor);
}

async function seedTenantRecords(key, ids) {
  const unitId = S.units[key].id;
  const candidateId = S.candidates[key][0].id;
  const clientId = key === 'A' ? S.clientA.id : S.clientB.id;
  ids.client = clientId;
  ids.unit = unitId;
  ids.candidate = candidateId;
  ids.block = S.blocks[key][0].id;
  ids.staff = (await db.Staff.findOne({ where: { clientId } })).id;
  ids.roster = (await db.UnitRoster.findOne({ where: { unitId } })).id;
  ids.score = (await db.InsertScore.findOne({ where: { unitId } })).id;
  ids.irregularity = (await makeRow('Irregularity', { candidateId })).id;
  ids.benchmark = (await makeRow('Benchmark', { unitId })).id;
  ids.ethinicity = (await makeRow('Ethinicity', { clientId })).id;
  ids.income = (await makeRow('Income', { clientId })).id;
  ids.criteria = (await makeRow('ScoringCriteria', { unitId })).id;
  ids.projection = (await makeRow('ProjectionSession', { unitId, candidateId })).id;
  ids.neuro = (await makeRow('NeuroScienceSession', { unitId, candidateId, assessmentBlockId: ids.block })).id;
  ids.lesson = (await makeRow('UnitImprovement', { unitId })).id;
  ids.marks = (await makeRow('CandidateMarks', { unitId, candidateId })).id;
  ids.leader = (await makeRow('LeaderMarks', { unitId })).id;
  ids.need = (await makeRow('CandidateNeedAssessment', { unitId, candidateId })).id;
  ids.chain = (await makeRow('AssessmentChain', { unitId, candidateId })).id;
}

before(async () => {
  S = await seed({ candidatesPerClient: 5, scoresPerCandidate: 5 });
  await ensureDb();
  clearAuthCaches(); clearOwnerCache();
  await seedTenantRecords('A', A);
  await seedTenantRecords('B', B);
  for (const [k, u] of [['super', 'super@test.com'], ['adminA', 'admina@test.com'], ['adminB', 'adminb@test.com'],
    ['staffA', 'staffa@test.com'], ['leaderA', 'leadera@test.com']]) {
    const r = await login(u);
    assert.equal(r.status, 200, `login ${u}`);
    T[k] = r.body.token;
  }
});

after(async () => { await db.sequelize.close(); setTimeout(() => process.exit(process.exitCode || 0), 500).unref(); });

// ===========================================================================
describe('1. Authentication - every endpoint requires a valid login', () => {
  it('SEC-01 all protected API endpoints reject requests with no token (401)', async () => {
    const routes = allRoutes().filter((r) => !PUBLIC.has(`${r.method} ${r.full}`));
    assert.ok(routes.length > 100, `expected >100 routes, got ${routes.length}`);
    const failures = [];
    for (const r of routes) {
      const res = await request(app)[r.method](API + fill(r.full, B, r.base)).send({});
      if (res.status !== 401 && res.status !== 403) failures.push(`${r.method.toUpperCase()} ${r.full} -> ${res.status}`);
    }
    assert.deepEqual(failures, [], failures.join('\n'));
    console.log(`      checked ${routes.length} endpoints`);
  });

  it('SEC-02 token forged with the old default secret "your_secret_key" is rejected', async () => {
    const forged = jwt.sign({ id: 1, role: 'super admin' }, 'your_secret_key');
    const res = await request(app).get(`${API}/clients`).set(auth(forged));
    assert.ok([401, 403].includes(res.status), `status ${res.status}`);
  });

  it('SEC-03 unsigned token (alg "none") is rejected', async () => {
    const none = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url')}.${Buffer.from('{"id":1,"role":"super admin"}').toString('base64url')}.`;
    const res = await request(app).get(`${API}/clients`).set(auth(none));
    assert.ok([401, 403].includes(res.status), `status ${res.status}`);
  });

  it('SEC-04 tampered token (role changed to super admin) is rejected', async () => {
    const [h, p, s] = T.adminA.split('.');
    const payload = JSON.parse(Buffer.from(p, 'base64url'));
    payload.role = 'super admin'; payload.id = 1;
    const tampered = `${h}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${s}`;
    const res = await request(app).get(`${API}/clients`).set(auth(tampered));
    assert.ok([401, 403].includes(res.status), `status ${res.status}`);
  });

  it('SEC-05 expired token is rejected', async () => {
    const expired = jwt.sign({ id: 2, role: 'admin', iat: Math.floor(Date.now() / 1000) - 7200 }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get(`${API}/clients`).set(auth(expired));
    assert.ok([401, 403].includes(res.status), `status ${res.status}`);
  });

  it('SEC-06 session lifetime is limited (8 hours, previously 30 days)', async () => {
    const { exp, iat } = jwt.decode(T.adminA);
    assert.ok(exp - iat <= 8 * 3600, `lifetime ${(exp - iat) / 3600}h`);
  });
});

// ===========================================================================
describe('2. Logout & session revocation', () => {
  it('SEC-07 after logout the same token can no longer be used', async () => {
    const t = (await login('admina@test.com')).body.token;
    assert.equal((await request(app).get(`${API}/clients`).set(auth(t))).status, 200);
    assert.equal((await request(app).post(`${API}/account/logout`).set(auth(t))).status, 200);
    assert.equal((await request(app).get(`${API}/clients`).set(auth(t))).status, 401);
  });

  it('SEC-08 logout is remembered in the database (survives cache clear / server restart)', async () => {
    const t = (await login('admina@test.com')).body.token;
    await request(app).post(`${API}/account/logout`).set(auth(t));
    clearAuthCaches();
    assert.equal((await request(app).get(`${API}/clients`).set(auth(t))).status, 401);
  });

  it('SEC-09 "logout from all devices" ends every session of the account', async () => {
    const t1 = (await login('adminb@test.com')).body.token;
    const t2 = (await login('adminb@test.com')).body.token;
    await request(app).post(`${API}/account/logout-all`).set(auth(t1));
    assert.equal((await request(app).get(`${API}/clients`).set(auth(t1))).status, 401);
    assert.equal((await request(app).get(`${API}/clients`).set(auth(t2))).status, 401);
    T.adminB = (await login('adminb@test.com')).body.token; // new session works
    assert.equal((await request(app).get(`${API}/clients`).set(auth(T.adminB))).status, 200);
  });

  it('SEC-10 a password reset signs out all existing sessions', async () => {
    const old = (await login('staffa@test.com')).body.token;
    const raw = crypto.randomBytes(32).toString('hex');
    const acc = await db.Account.findOne({ where: { username: 'staffa@test.com' } });
    acc.resetToken = crypto.createHash('sha256').update(raw).digest('hex');
    acc.resetTokenExpiry = new Date(Date.now() + 600000);
    await acc.save();
    const r = await request(app).post(`${API}/account/reset-password`).send({ token: raw, password: PASSWORD, confirmPassword: PASSWORD });
    assert.equal(r.status, 200);
    assert.equal((await request(app).get(`${API}/clients`).set(auth(old))).status, 401);
    T.staffA = (await login('staffa@test.com')).body.token;
    assert.ok(T.staffA);
  });
});

// ===========================================================================
describe('3. Login & password protection', () => {
  it('SEC-11 brute-force: login is blocked after repeated wrong passwords', async () => {
    let last;
    for (let i = 0; i < 12; i++) last = await login('adminb@test.com', 'wrong-password');
    assert.equal(last.status, 429);
    // correct password from same IP for that user is also blocked during the lock window
    assert.equal((await login('adminb@test.com')).status, 429);
  });

  it('SEC-12 same error for unknown user and wrong password (no username discovery)', async () => {
    const a = await login('nobody@test.com', 'x1');
    const b = await login('admina@test.com', 'x1');
    assert.equal(a.status, 401); assert.equal(b.status, 401);
    assert.equal(a.body.message, b.body.message);
  });

  it('SEC-13 password recovery does not reveal whether an email is registered', async () => {
    const a = await request(app).post(`${API}/account/recover`).send({ username: 'nobody@test.com' });
    const b = await request(app).post(`${API}/account/recover`).send({ username: 'leadera@test.com' });
    assert.equal(a.status, 200); assert.equal(b.status, 200);
    assert.equal(a.body.message, b.body.message);
  });

  it('SEC-14 reset tokens are stored hashed (a database leak cannot reset passwords)', async () => {
    const acc = await db.Account.findOne({ where: { username: 'leadera@test.com' } });
    assert.match(acc.resetToken, /^[a-f0-9]{64}$/);
    const r = await request(app).post(`${API}/account/reset-password`)
      .send({ token: acc.resetToken, password: 'NewPass123', confirmPassword: 'NewPass123' });
    assert.equal(r.status, 400);
  });

  it('SEC-15 weak passwords (< 8 characters) are refused on reset', async () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const acc = await db.Account.findOne({ where: { username: 'leadera@test.com' } });
    acc.resetToken = crypto.createHash('sha256').update(raw).digest('hex');
    acc.resetTokenExpiry = new Date(Date.now() + 600000);
    await acc.save();
    const r = await request(app).post(`${API}/account/reset-password`).send({ token: raw, password: 'abc', confirmPassword: 'abc' });
    assert.equal(r.status, 400);
  });

  it('SEC-16 NoSQL/operator injection in login body is refused', async () => {
    const r = await request(app).post(`${API}/account`).send({ username: { $ne: '' }, password: { $ne: '' } });
    assert.equal(r.status, 400);
  });

  it('SEC-17 disabled staff accounts cannot log in', async () => {
    const r = await login('disabled@test.com');
    assert.equal(r.status, 403);
  });

  it('SEC-18 password hashes / reset tokens are never returned by the API', async () => {
    const r = await request(app).get(`${API}/clients`).set(auth(T.super));
    const text = JSON.stringify(r.body);
    assert.ok(!/"password"/.test(text) && !/"resetToken"/.test(text) && !/\$2[aby]\$/.test(text));
  });
});

// ===========================================================================
describe('4. Authorisation - roles', () => {
  it('SEC-19 only super admin can create raw login accounts (was open to anyone)', async () => {
    const body = { username: 'evil@x.com', password: 'Password123', role: 'super admin' };
    assert.equal((await request(app).post(`${API}/account/create`).send(body)).status, 401);
    assert.equal((await request(app).post(`${API}/account/create`).set(auth(T.adminA)).send(body)).status, 403);
    assert.equal(await db.Account.count({ where: { username: 'evil@x.com' } }), 0);
  });

  it('SEC-20 only super admin can create / edit / delete client organisations', async () => {
    assert.equal((await request(app).post(`${API}/clients`).set(auth(T.adminA)).send({})).status, 403);
    assert.equal((await request(app).put(`${API}/clients/${A.client}`).set(auth(T.adminA)).send({ companyName: 'x' })).status, 403);
    assert.equal((await request(app).delete(`${API}/clients/${B.client}`).set(auth(T.adminA))).status, 403);
  });

  it('SEC-21 staff with "Leaders Access" cannot add / change / delete staff', async () => {
    const leader = (await login('leadera@test.com')).body.token || (await login('leadera@test.com', 'NewPass123')).body.token;
    assert.ok(leader);
    assert.equal((await request(app).post(`${API}/staffs`).set(auth(leader)).send({ clientId: A.client })).status, 403);
    assert.equal((await request(app).delete(`${API}/staffs/${A.staff}`).set(auth(leader))).status, 403);
  });

  it('SEC-22 lists that contain every organisation\'s data are super-admin only', async () => {
    for (const p of ['/insert-score', '/assessment_block_manager', '/scoring-criteria', '/benchmark', '/irregulaties']) {
      assert.equal((await request(app).get(API + p).set(auth(T.adminA))).status, 403, p);
      assert.equal((await request(app).get(API + p).set(auth(T.super))).status, 200, p);
    }
  });
});

// ===========================================================================
describe('5. Tenant isolation - an organisation can never reach another organisation\'s data', () => {
  const tenantRoutes = () => allRoutes().filter((r) =>
    !PUBLIC.has(`${r.method} ${r.full}`) && /:(clientId|unitId|candidateId|candidate_id|blockId|id|sessionId)\b/.test(r.full)
    && !r.full.startsWith('/account'));

  it('SEC-23 Organisation A is denied (403) on EVERY endpoint when using Organisation B ids', async () => {
    const routes = tenantRoutes();
    const failures = [];
    for (const r of routes) {
      const url = API + fill(r.full, B, r.base);
      const res = await request(app)[r.method](url).set(auth(T.adminA)).send({});
      if (res.status !== 403) failures.push(`${r.method.toUpperCase()} ${url} -> ${res.status}`);
    }
    assert.deepEqual(failures, [], failures.join('\n'));
    console.log(`      checked ${routes.length} endpoints with another organisation's ids`);
  });

  it('SEC-24 Organisation A still has normal access to its OWN data on every GET endpoint', async () => {
    const routes = tenantRoutes().filter((r) => r.method === 'get');
    const failures = [];
    for (const r of routes) {
      const url = API + fill(r.full, A, r.base);
      const res = await request(app).get(url).set(auth(T.adminA));
      if (res.status === 401 || res.status === 403) failures.push(`GET ${url} -> ${res.status}`);
    }
    assert.deepEqual(failures, [], failures.join('\n'));
  });

  it('SEC-25 staff of Organisation A are also isolated', async () => {
    assert.equal((await request(app).get(`${API}/candidates/${B.client}`).set(auth(T.staffA))).status, 403);
    assert.equal((await request(app).get(`${API}/candidates/${A.client}`).set(auth(T.staffA))).status, 200);
  });

  it('SEC-26 ids hidden in query strings are checked (scoring trends, tabulation)', async () => {
    for (const p of [`/scoring-trends?unitId=${B.unit}&candidate_id=${B.candidate}`,
      `/scoring-trends/se?unitId=${A.unit}&candidate_id=${B.candidate}`,
      `/tabulation/proficiency?unitId=${A.unit}&candidate_id=${A.candidate},${B.candidate}`,
      `/insert-score/summary?unitId=${B.unit}&candidate_id=${B.candidate}`]) {
      assert.equal((await request(app).get(API + p).set(auth(T.adminA))).status, 403, p);
    }
    assert.equal((await request(app).get(`${API}/scoring-trends?unitId=${A.unit}&candidate_id=${A.candidate}`).set(auth(T.adminA))).status, 200);
  });

  it('SEC-27 ids hidden in request bodies are checked (create / bulk / distributions)', async () => {
    const cases = [
      ['post', '/candidates', { clientId: B.client, firstName: 'x' }],
      ['post', '/unit_roster', { unitId: B.unit, candidateId: B.candidate }],
      ['post', '/unit_roster', [{ unitId: A.unit, candidateId: A.candidate }, { unitId: B.unit, candidateId: B.candidate }]],
      ['post', '/insert-score', { unitId: B.unit, candidate_id: B.candidate, assessmentBlockId: B.block }],
      ['post', '/unit-distribution/normal-dist', { unitId: B.unit, candidatePpList: [{ candidateId: B.candidate, ppId: 1 }] }],
      ['post', '/unit-distribution/t-dist', { unitId: A.unit, candidatePpList: [{ candidateId: B.candidate, ppId: 1 }] }],
      ['post', '/auxiliary/marks', { unitId: B.unit, candidateId: B.candidate }],
    ];
    for (const [m, p, body] of cases) {
      assert.equal((await request(app)[m](API + p).set(auth(T.adminA)).send(body)).status, 403, `${m} ${p}`);
    }
  });

  it('SEC-28 a record cannot be moved into another organisation (mass-assignment)', async () => {
    const r = await request(app).put(`${API}/candidates/${A.candidate}`).set(auth(T.adminA)).send({ clientId: B.client });
    assert.equal(r.status, 403);
    const c = await db.Candidate.findByPk(A.candidate);
    assert.equal(c.clientId, A.client);
  });

  it('SEC-29 deleting another organisation\'s record is refused and the record survives', async () => {
    assert.equal((await request(app).delete(`${API}/candidates/${B.candidate}`).set(auth(T.adminA))).status, 403);
    assert.ok(await db.Candidate.findByPk(B.candidate));
    assert.equal((await request(app).delete(`${API}/units/${B.unit}`).set(auth(T.adminA))).status, 403);
    assert.ok(await db.Unit.findByPk(B.unit));
  });

  it('SEC-30 client list and roster list only contain the caller\'s own organisation', async () => {
    const c = await request(app).get(`${API}/clients`).set(auth(T.adminA));
    assert.deepEqual(c.body.map((x) => x.id), [A.client]);
    const r = await request(app).get(`${API}/unit_roster`).set(auth(T.adminA));
    assert.ok(r.body.length > 0 && r.body.every((x) => x.unitId === A.unit));
  });

  it('SEC-31 super admin keeps full access to all organisations', async () => {
    assert.equal((await request(app).get(`${API}/candidates/${B.client}`).set(auth(T.super))).status, 200);
    assert.equal((await request(app).get(`${API}/candidates/${A.client}`).set(auth(T.super))).status, 200);
  });
});

// ===========================================================================
describe('6. Input handling & information leakage', () => {
  it('SEC-32 SQL-injection style ids do not leak data', async () => {
    for (const p of [`/candidates/${A.client}%20OR%201=1`, `/units/id/1'%20OR%20'1'='1`, `/staffs/${B.client};DROP%20TABLE%20staff`]) {
      const r = await request(app).get(API + p).set(auth(T.adminA));
      const leaked = Array.isArray(r.body) && r.body.some((x) => x.clientId === B.client);
      assert.ok(!leaked, p);
    }
    assert.ok(await db.Staff.count() > 0);
  });

  it('SEC-33 server errors do not expose SQL / stack details', async () => {
    const r = await request(app).get(`${API}/units/id/not-a-number`).set(auth(T.super));
    const text = JSON.stringify(r.body);
    assert.ok(!/SELECT|sequelize|at .*\.js|ER_/i.test(text), text);
  });

  it('SEC-34 malformed JSON gets a clean 400', async () => {
    const r = await request(app).post(`${API}/account`).set('Content-Type', 'application/json').send('{"username":');
    assert.equal(r.status, 400);
  });

  it('SEC-35 oversized request bodies are rejected (413)', async () => {
    const big = 'x'.repeat(3 * 1024 * 1024);
    const r = await request(app).post(`${API}/account`).send({ username: big, password: 'x' });
    assert.equal(r.status, 413);
  });

  it('SEC-36 unknown routes return 404 without details', async () => {
    const r = await request(app).get('/api/v1/does-not-exist').set(auth(T.super));
    assert.equal(r.status, 404);
  });
});

// ===========================================================================
describe('7. HTTP security headers & CORS', () => {
  it('SEC-37 security headers are present and framework is not advertised', async () => {
    const r = await request(app).get(`${API}/clients`).set(auth(T.super));
    assert.equal(r.headers['x-powered-by'], undefined);
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.ok(r.headers['x-frame-options']);
    assert.ok(r.headers['content-security-policy']);
    assert.match(r.headers['cache-control'], /no-store/);
  });

  it('SEC-38 browsers on unknown websites cannot call the API (CORS)', async () => {
    const bad = await request(app).options(`${API}/clients`).set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'GET');
    assert.equal(bad.headers['access-control-allow-origin'], undefined);
    const good = await request(app).options(`${API}/clients`).set('Origin', 'http://localhost:3000').set('Access-Control-Request-Method', 'GET');
    assert.equal(good.headers['access-control-allow-origin'], 'http://localhost:3000');
  });

  it('SEC-39 removed broken /users endpoint', async () => {
    const r = await request(app).get(`${API}/users`).set(auth(T.super));
    assert.equal(r.status, 404);
  });
});
