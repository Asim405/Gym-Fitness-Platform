const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

// POST /api/auth/register
// Public registration always creates a "member" — admin/trainer accounts
// are created by an admin via /api/users (protected route).
async function register(req, res) {
  const { fullName, email, password } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'member')
       RETURNING id, full_name, email, role, created_at`,
      [fullName, email, passwordHash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    await logActivity({ userId: user.id, action: 'REGISTER', ip: req.ip });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user);
    await logActivity({ userId: user.id, action: 'LOGIN', ip: req.ip });

    delete user.password_hash;
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
}

// GET /api/auth/me
async function me(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, full_name, email, role, phone, date_of_birth, gender, height_cm, is_active, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

module.exports = { register, login, me };
