const pool = require('../config/db');

/**
 * Writes an entry into activity_logs. Never throws — logging failures
 * should not break the primary request.
 */
async function logActivity({ userId = null, action, details = {}, ip = null }) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)`,
      [userId, action, JSON.stringify(details), ip]
    );
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = logActivity;
