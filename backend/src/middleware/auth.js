const jwt = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * Verifies the JWT sent in the Authorization header (Bearer token).
 * Attaches the decoded payload ({ id, role, email }) to req.user.
 */
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT id, role, email, is_active FROM users WHERE id = $1`,
      [payload.id]
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Account is inactive or no longer exists' });
    }
    // Roles are read from the database to make role changes effective immediately.
    req.user = { id: user.id, role: user.role, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Role-based access control. Usage: authorize('admin', 'trainer')
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
