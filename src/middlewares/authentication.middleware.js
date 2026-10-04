const { verifyToken, isRevoked, loadPrincipal } = require('../utils/authTokens');

function readBearer(req) {
  const h = req.headers['authorization'] || '';
  const [scheme, token] = h.split(' ');
  return scheme && /^Bearer$/i.test(scheme) && token ? token.trim() : null;
}

/**
 * Verifies the JWT, rejects logged-out / revoked tokens and disabled accounts,
 * and attaches:
 *   req.user  -> { id, username, role, isSuperAdmin, clientId, staffId, accessLevel }
 *   req.token -> decoded JWT (used by logout)
 */
exports.authenticateToken = async (req, res, next) => {
  const token = readBearer(req);
  if (!token) return res.status(401).json({ message: 'Access token required' });

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    const expired = error && error.name === 'TokenExpiredError';
    return res.status(401).json({ message: expired ? 'Session expired, please log in again' : 'Invalid token' });
  }

  try {
    if (await isRevoked(decoded)) {
      return res.status(401).json({ message: 'Session has ended, please log in again' });
    }
    const principal = await loadPrincipal(decoded.id);
    if (!principal) return res.status(401).json({ message: 'Account not found' });
    if (principal.disabled) return res.status(403).json({ message: 'Account is disabled' });

    req.user = principal;
    req.token = decoded;
    return next();
  } catch (error) {
    return next(error);
  }
};

/** Allow only the listed roles. */
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Access token required' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ message: 'You do not have permission for this action' });
  return next();
};

/** Super admin, client admin, or staff with "Full Access" (matches what the UI shows). */
exports.requireManager = (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: 'Access token required' });
  if (u.role === 'super admin' || u.role === 'admin') return next();
  if (u.role === 'staff' && u.accessLevel === 'Full Access') return next();
  return res.status(403).json({ message: 'You do not have permission for this action' });
};
