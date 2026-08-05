const pool = require('../config/db');

// GET /api/dashboard/admin
async function adminSummary(req, res) {
  try {
    const [members, revenue, statusBreakdown, attendanceTrend] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'member'`),
      pool.query(`SELECT COALESCE(SUM(amount_paid), 0) AS total FROM memberships`),
      pool.query(`SELECT status, COUNT(*) AS count FROM memberships GROUP BY status`),
      pool.query(`
        SELECT DATE(checked_in_at) AS day, COUNT(*) AS count
        FROM attendance
        WHERE checked_in_at IS NOT NULL AND checked_in_at >= NOW() - INTERVAL 14 DAY
        GROUP BY DATE(checked_in_at) ORDER BY day ASC`),
    ]);

    res.json({
      totalMembers: members.rows[0].total,
      totalRevenue: revenue.rows[0].total,
      membershipStatusBreakdown: statusBreakdown.rows,
      dailyAttendanceTrend: attendanceTrend.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load admin dashboard data' });
  }
}

// GET /api/dashboard/trainer
async function trainerSummary(req, res) {
  const trainerId = req.user.id;
  try {
    const [assignedMembers, upcomingClasses, recentPlans] = await Promise.all([
      pool.query(
        `SELECT DISTINCT u.id, u.full_name FROM workout_plans wp
         JOIN users u ON u.id = wp.member_id WHERE wp.trainer_id = $1`,
        [trainerId]
      ),
      pool.query(
        `SELECT * FROM class_schedules WHERE trainer_id = $1 AND start_time >= NOW() ORDER BY start_time ASC LIMIT 5`,
        [trainerId]
      ),
      pool.query(
        `SELECT * FROM workout_plans WHERE trainer_id = $1 ORDER BY created_at DESC LIMIT 5`,
        [trainerId]
      ),
    ]);

    res.json({
      assignedMembers: assignedMembers.rows,
      upcomingClasses: upcomingClasses.rows,
      recentPlans: recentPlans.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load trainer dashboard data' });
  }
}

// GET /api/dashboard/member
async function memberSummary(req, res) {
  const memberId = req.user.id;
  try {
    const [membership, plans, upcomingClasses, progress] = await Promise.all([
      pool.query(
        `SELECT m.*, mp.name AS plan_name FROM memberships m
         JOIN membership_plans mp ON mp.id = m.membership_plan_id
         WHERE m.member_id = $1 ORDER BY m.created_at DESC LIMIT 1`,
        [memberId]
      ),
      pool.query(`SELECT * FROM workout_plans WHERE member_id = $1 ORDER BY created_at DESC LIMIT 5`, [memberId]),
      pool.query(
        `SELECT cs.* FROM attendance a JOIN class_schedules cs ON cs.id = a.class_schedule_id
         WHERE a.member_id = $1 AND cs.start_time >= NOW() AND a.status != 'cancelled'
         ORDER BY cs.start_time ASC LIMIT 5`,
        [memberId]
      ),
      pool.query(`SELECT * FROM progress_metrics WHERE member_id = $1 ORDER BY recorded_at ASC`, [memberId]),
    ]);

    res.json({
      membership: membership.rows[0] || null,
      workoutPlans: plans.rows,
      upcomingClasses: upcomingClasses.rows,
      progressHistory: progress.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load member dashboard data' });
  }
}

module.exports = { adminSummary, trainerSummary, memberSummary };
