const pool = require('../config/db');

// Dashboard widgets are independent. An optional module that has not been
// migrated yet must not make the entire admin home unavailable.
async function dashboardQuery(label, statement, fallback = []) {
  try {
    return await pool.query(statement);
  } catch (err) {
    console.error(`Admin dashboard query unavailable (${label}):`, err.message);
    return { rows: fallback };
  }
}

// GET /api/dashboard/admin
async function adminSummary(req, res) {
  try {
    const isMySQL = pool.dbType === 'mysql';
    const last14Days = isMySQL ? "DATE_SUB(NOW(), INTERVAL 14 DAY)" : "NOW() - INTERVAL '14 days'";
    const last12Months = isMySQL ? "DATE_SUB(NOW(), INTERVAL 12 MONTH)" : "NOW() - INTERVAL '12 months'";
    const monthExpr = isMySQL ? "DATE_FORMAT(created_at, '%Y-%m')" : "TO_CHAR(created_at, 'YYYY-MM')";
    const hourExpr = isMySQL ? "HOUR(checked_in_at)" : "EXTRACT(HOUR FROM checked_in_at)";

    const [members, trainers, revenue, statusBreakdown, attendanceTrend, activeCounts, monthlyRevenue, registrations, trainerAllocation, invoiceSummary, unpaidFees, lowStock, recentMembers, upcomingClasses] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'member'`),
      pool.query(`SELECT COUNT(*) AS total FROM users WHERE role = 'trainer' AND is_active=TRUE`),
      pool.query(`SELECT COALESCE(SUM(amount_paid), 0) AS total FROM memberships`),
      pool.query(`SELECT status, COUNT(*) AS count FROM memberships GROUP BY status`),
      pool.query(
        `SELECT DATE(checked_in_at) AS day, COUNT(*) AS count
         FROM attendance
         WHERE checked_in_at IS NOT NULL AND checked_in_at >= ${last14Days}
         GROUP BY DATE(checked_in_at) ORDER BY day ASC`
      ),
      pool.query(
        `SELECT
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
        `SELECT ${monthExpr} AS month, COUNT(*) AS count
         FROM users
         WHERE role='member' AND created_at >= ${last12Months}
         GROUP BY ${monthExpr} ORDER BY month ASC`
      ),
      dashboardQuery('trainer workload', `
        SELECT u.id AS trainer_id, u.full_name AS trainer_name,
               COUNT(DISTINCT ta.id) AS assigned_members,
               COUNT(DISTINCT cs.id) AS classes_count
        FROM users u
        LEFT JOIN trainer_assignments ta ON ta.trainer_id=u.id AND ta.status='active'
        LEFT JOIN class_schedules cs ON cs.trainer_id = u.id
        LEFT JOIN workout_plans wp ON wp.trainer_id = u.id
        WHERE u.role = 'trainer'
        GROUP BY u.id, u.full_name
        ORDER BY assigned_members DESC, classes_count DESC
        LIMIT 10`
      ),
      dashboardQuery('invoice summary', `
        SELECT
          COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paidAmount,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pendingAmount,
          COALESCE(SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END), 0) AS overdueAmount,
          COUNT(CASE WHEN status = 'paid' THEN 1 END) AS paidInvoices,
          COUNT(CASE WHEN status IN ('pending', 'overdue') THEN 1 END) AS unpaidInvoices
        FROM invoices`, [{}]
      ),
      dashboardQuery('unpaid invoices', `
        SELECT i.id, i.invoice_number, u.full_name AS member_name, i.amount, i.status, i.due_date
        FROM invoices i
        JOIN users u ON u.id = i.member_id
        WHERE i.status IN ('pending','overdue')
        ORDER BY i.due_date ASC, i.amount DESC
        LIMIT 10`
      ),
      dashboardQuery('low stock', `SELECT id, name, quantity, minimum_stock, status FROM inventory_items WHERE quantity <= minimum_stock ORDER BY quantity ASC, name ASC LIMIT 10`),
      dashboardQuery('recent members', `SELECT id, full_name, email, created_at FROM users WHERE role='member' ORDER BY created_at DESC LIMIT 5`),
      dashboardQuery('upcoming classes', `SELECT cs.*, u.full_name AS trainer_name FROM class_schedules cs JOIN users u ON u.id=cs.trainer_id WHERE cs.start_time >= NOW() AND cs.status='scheduled' ORDER BY cs.start_time ASC LIMIT 5`)
    ]);

    res.json({
      totalMembers: members.rows[0].total,
      totalTrainers: trainers.rows[0].total,
      totalRevenue: Number(revenue.rows[0].total || 0) + Number(invoiceSummary.rows[0].paidAmount || 0),
      membershipStatusBreakdown: statusBreakdown.rows,
      dailyAttendanceTrend: attendanceTrend.rows,
      activeMembers: Number(activeCounts.rows[0].activeMembers || 0),
      expiredMembers: Number(activeCounts.rows[0].expiredMembers || 0),
      monthlyRevenue: monthlyRevenue.rows,
      memberRegistrations: registrations.rows,
      trainerAllocation: trainerAllocation.rows,
      revenueSummary: {
        paidAmount: Number(invoiceSummary.rows[0].paidAmount || 0),
        pendingAmount: Number(invoiceSummary.rows[0].pendingAmount || 0),
        overdueAmount: Number(invoiceSummary.rows[0].overdueAmount || 0),
        paidInvoices: Number(invoiceSummary.rows[0].paidInvoices || 0),
        unpaidInvoices: Number(invoiceSummary.rows[0].unpaidInvoices || 0),
      },
      unpaidFees: unpaidFees.rows,
      lowStockItems: lowStock.rows,
      recentMembers: recentMembers.rows,
      upcomingClasses: upcomingClasses.rows,
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
// FIXED: Prioritise active memberships over pending
async function memberSummary(req, res) {
  const memberId = req.user.id;
  try {
    // 1. Membership – show active if exists, otherwise latest pending/expired
    const membershipResult = await pool.query(
      `SELECT m.*, mp.name AS plan_name FROM memberships m
       JOIN membership_plans mp ON mp.id = m.membership_plan_id
       WHERE m.member_id = $1
       ORDER BY CASE WHEN m.status = 'active' THEN 0 ELSE 1 END, m.created_at DESC
       LIMIT 1`,
      [memberId]
    );
    const membership = membershipResult.rows[0] || null;

    // 2. Workout plans
    const plans = await pool.query(
      `SELECT * FROM workout_plans WHERE member_id = $1 ORDER BY created_at DESC LIMIT 5`,
      [memberId]
    );

    // 3. Upcoming classes
    const upcomingClasses = await pool.query(
      `SELECT cs.* FROM attendance a
       JOIN class_schedules cs ON cs.id = a.class_schedule_id
       WHERE a.member_id = $1 AND cs.start_time >= NOW() AND a.status != 'cancelled'
       ORDER BY cs.start_time ASC LIMIT 5`,
      [memberId]
    );

    // 4. Progress history
    const progress = await pool.query(
      `SELECT * FROM progress_metrics WHERE member_id = $1 ORDER BY recorded_at ASC`,
      [memberId]
    );

    res.json({
      membership: membership,
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