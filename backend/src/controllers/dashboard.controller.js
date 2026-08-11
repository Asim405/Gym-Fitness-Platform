const pool = require('../config/db');

// GET /api/dashboard/admin
async function adminSummary(req, res) {
  try {
    const isMySQL = pool.dbType === 'mysql';
    const last14Days = isMySQL ? "DATE_SUB(NOW(), INTERVAL 14 DAY)" : "NOW() - INTERVAL '14 days'";
    const last30Days = isMySQL ? "DATE_SUB(NOW(), INTERVAL 30 DAY)" : "NOW() - INTERVAL '30 days'";
    const last12Months = isMySQL ? "DATE_SUB(NOW(), INTERVAL 12 MONTH)" : "NOW() - INTERVAL '12 months'";
    const monthExpr = isMySQL ? "DATE_FORMAT(created_at, '%Y-%m')" : "TO_CHAR(created_at, 'YYYY-MM')";

    const [members, revenue, statusBreakdown, attendanceTrend, activeCounts, monthlyRevenue, peakHours, trainerAllocation] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'member'`),
      pool.query(`SELECT COALESCE(SUM(amount_paid), 0) AS total FROM memberships`),
      pool.query(`SELECT status, COUNT(*) AS count FROM memberships GROUP BY status`),
      pool.query(
        `SELECT DATE(checked_in_at) AS day, COUNT(*) AS count
         FROM attendance
         WHERE checked_in_at IS NOT NULL AND checked_in_at >= ${last14Days}
         GROUP BY DATE(checked_in_at) ORDER BY day ASC`
      ),
      pool.query(`
        SELECT
          SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS activeMembers,
          SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) AS expiredMembers
        FROM memberships`
      ),
      pool.query(
        `SELECT ${monthExpr} AS month, SUM(amount_paid) AS total
         FROM memberships
         WHERE created_at >= ${last12Months}
         GROUP BY ${monthExpr}
         ORDER BY month ASC`
      ),
      pool.query(
        `SELECT EXTRACT(HOUR FROM checked_in_at) AS hour, COUNT(*) AS count
         FROM attendance
         WHERE checked_in_at IS NOT NULL AND checked_in_at >= ${last30Days}
         GROUP BY EXTRACT(HOUR FROM checked_in_at) ORDER BY count DESC LIMIT 8`
      ),
      pool.query(`
        SELECT u.id AS trainer_id, u.full_name AS trainer_name,
               COUNT(DISTINCT cs.id) AS classes_count,
               COUNT(DISTINCT wp.id) AS workout_plans_count
        FROM users u
        LEFT JOIN class_schedules cs ON cs.trainer_id = u.id
        LEFT JOIN workout_plans wp ON wp.trainer_id = u.id
        WHERE u.role = 'trainer'
        GROUP BY u.id, u.full_name
        ORDER BY classes_count DESC, workout_plans_count DESC
        LIMIT 10`
      ),
    ]);

    res.json({
      totalMembers: members.rows[0].total,
      totalRevenue: revenue.rows[0].total,
      membershipStatusBreakdown: statusBreakdown.rows,
      dailyAttendanceTrend: attendanceTrend.rows,
      activeMembers: Number(activeCounts.rows[0].activeMembers || 0),
      expiredMembers: Number(activeCounts.rows[0].expiredMembers || 0),
      monthlyRevenue: monthlyRevenue.rows,
      peakHours: peakHours.rows,
      trainerAllocation: trainerAllocation.rows,
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
