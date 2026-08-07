require('dotenv').config();
const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // Fail fast if the database is unreachable
    await pool.query('SELECT 1');
    console.log('✅ Database connection established');

    app.listen(PORT, () => {
      console.log(`🚀 Gym & Fitness Platform API running on port ${PORT}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   API docs:     http://localhost:${PORT}/api-docs`);
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
