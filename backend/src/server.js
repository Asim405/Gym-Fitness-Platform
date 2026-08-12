require('dotenv').config();
const bcrypt = require('bcrypt');
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;
const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const DEFAULT_ADMIN_EMAIL = process.env.DEFAULT_ADMIN_EMAIL || 'admin@pulsefit.com';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@1234';
const DEFAULT_ADMIN_NAME = process.env.DEFAULT_ADMIN_NAME || 'Super Admin';

async function ensureDefaultAdmin() {
  try {
    const result = await pool.query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    if (result.rows.length) {
      return;
    }

    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, SALT_ROUNDS);
    await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [DEFAULT_ADMIN_NAME, DEFAULT_ADMIN_EMAIL, passwordHash, 'admin']
    );

    console.log('✅ Created default admin account:');
    console.log(`   Email: ${DEFAULT_ADMIN_EMAIL}`);
    console.log(`   Password: ${DEFAULT_ADMIN_PASSWORD}`);
  } catch (err) {
    console.warn('⚠️ Could not ensure default admin user:', err.message);
  }
}

async function start() {
  try {
    // Fail fast if the database is unreachable
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');
    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`🚀 Gym & Fitness Platform API running on port ${PORT}`);
      console.log(`   API docs:     http://localhost:${PORT}/api-docs`);
      console.log("server is running in " + process.env.NODE_ENV + " mode");
    });
  } catch (err) {
    console.error('❌ Failed to start server — could not connect to the database:', err.message);
    process.exit(1);
  }
}

start();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled promise rejection:', err);
  console.error('Shutting down the server due to unhandled promise rejection');
});
