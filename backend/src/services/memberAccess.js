const pool = require('../config/db');

async function canTrainerAccessMember(trainerId, memberId) {
  const result = await pool.query(
    `SELECT id FROM trainer_assignments
     WHERE trainer_id = $1 AND member_id = $2 AND status = 'active'`,
    [trainerId, memberId]
  );
  return result.rows.length > 0;
}

async function requireMemberAccess(req, res, memberId) {
  if (req.user.role === 'admin' || Number(memberId) === req.user.id) return true;
  if (req.user.role === 'trainer' && await canTrainerAccessMember(req.user.id, memberId)) return true;
  res.status(403).json({ error: 'You are not authorized to access this member' });
  return false;
}

module.exports = { canTrainerAccessMember, requireMemberAccess };
