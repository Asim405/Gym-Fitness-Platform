const pool = require('../config/db');
const logActivity = require('../utils/logActivity');

// POST /api/attendance/book  { classScheduleId }
async function book(req, res) {
  const { classScheduleId } = req.body;
  const memberId = req.user.id;
  try {
    const cls = await pool.query(
      `SELECT cs.capacity,
              (SELECT COUNT(*)::int FROM attendance a WHERE a.class_schedule_id = cs.id AND a.status != 'cancelled') AS booked
       FROM class_schedules cs WHERE cs.id = $1`,
      [classScheduleId]
    );
    if (!cls.rows.length) return res.status(404).json({ error: 'Class not found' });
    if (cls.rows[0].booked >= cls.rows[0].capacity) {
      return res.status(400).json({ error: 'Class is at full capacity' });
    }

    const result = await pool.query(
      `INSERT INTO attendance (class_schedule_id, member_id) VALUES ($1, $2)
       ON CONFLICT (class_schedule_id, member_id) DO UPDATE SET status = 'booked'
       RETURNING *`,
      [classScheduleId, memberId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book class' });
  }
}

// PATCH /api/attendance/:id/check-in  (trainer/admin marks a member present)
async function checkIn(req, res) {
  try {
    const result = await pool.query(
      `UPDATE attendance SET status = 'checked_in', checked_in_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    await logActivity({ userId: req.user.id, action: 'ATTENDANCE_CHECK_IN', details: { attendanceId: req.params.id } });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

// PATCH /api/attendance/:id/cancel
async function cancel(req, res) {
  try {
    const result = await pool.query(
      `UPDATE attendance SET status = 'cancelled' WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

// GET /api/attendance?classScheduleId=&memberId=
async function list(req, res) {
  const { classScheduleId, memberId } = req.query;
  const conditions = [];
  const params = [];
  if (classScheduleId) { params.push(classScheduleId); conditions.push(`a.class_schedule_id = $${params.length}`); }
  if (memberId) { params.push(memberId); conditions.push(`a.member_id = $${params.length}`); }
  if (req.user.role === 'member') { params.push(req.user.id); conditions.push(`a.member_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT a.*, cs.title AS class_title, cs.start_time, u.full_name AS member_name
       FROM attendance a
       JOIN class_schedules cs ON cs.id = a.class_schedule_id
       JOIN users u ON u.id = a.member_id
       ${where} ORDER BY cs.start_time DESC`,
      params
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
}

module.exports = { book, checkIn, cancel, list };
