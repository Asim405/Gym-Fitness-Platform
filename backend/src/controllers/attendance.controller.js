const pool = require('../config/db');
const logActivity = require('../utils/logActivity');
const { requireMemberAccess } = require('../services/memberAccess');

// Helper: convert ISO string to MySQL datetime format (if needed)
function toMySQLDateTime(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper: adapt PostgreSQL placeholders to MySQL
function adaptSql(sql, params) {
  if (pool.dbType !== 'mysql') return { sql, params };
  const newParams = [];
  const newSql = sql.replace(/\$(\d+)/g, (match, p1) => {
    const idx = parseInt(p1, 10) - 1;
    newParams.push(params[idx]);
    return '?';
  });
  return { sql: newSql, params: newParams.length ? newParams : params };
}

async function dbQuery(sql, params = []) {
  const { sql: adaptedSql, params: adaptedParams } = adaptSql(sql, params);
  return pool.query(adaptedSql, adaptedParams);
}

// ---- Book a class (member) ----
async function book(req, res) {
  const { classScheduleId } = req.body;
  const memberId = req.user.id;
  try {
    // Check active membership
    const membership = await dbQuery(
      `SELECT id FROM memberships WHERE member_id=$1 AND status='active' AND end_date >= CURRENT_DATE ORDER BY end_date DESC LIMIT 1`,
      [memberId]
    );
    if (!membership.rows.length) {
      return res.status(403).json({ error: 'An active membership is required to book classes' });
    }

    // Check class capacity and start time – no status column
    const cls = await dbQuery(
      `SELECT cs.capacity, cs.start_time,
              (SELECT COUNT(*) FROM attendance a WHERE a.class_schedule_id = cs.id AND a.status != 'cancelled') AS booked
       FROM class_schedules cs WHERE cs.id = $1`,
      [classScheduleId]
    );
    if (!cls.rows.length) {
      return res.status(404).json({ error: 'Class not found' });
    }
    if (cls.rows[0].booked >= cls.rows[0].capacity) {
      return res.status(400).json({ error: 'Class is at full capacity' });
    }

    // Optional: check if class already started
    const now = new Date();
    const classStart = new Date(cls.rows[0].start_time);
    if (classStart < now) {
      return res.status(400).json({ error: 'Cannot book a class that has already started' });
    }

    // Insert/update booking
    if (pool.dbType === 'mysql') {
      await dbQuery(
        `INSERT INTO attendance (class_schedule_id, member_id, status) VALUES ($1, $2, 'booked')
         ON DUPLICATE KEY UPDATE status = 'booked'`,
        [classScheduleId, memberId]
      );
    } else {
      await dbQuery(
        `INSERT INTO attendance (class_schedule_id, member_id, status)
         VALUES ($1, $2, 'booked')
         ON CONFLICT (class_schedule_id, member_id) DO UPDATE SET status = 'booked'`,
        [classScheduleId, memberId]
      );
    }

    const attendanceResult = await dbQuery(
      `SELECT * FROM attendance WHERE class_schedule_id = $1 AND member_id = $2`,
      [classScheduleId, memberId]
    );
    res.status(201).json(attendanceResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to book class' });
  }
}

// ---- Generate QR payload ----
async function qrCode(req, res) {
  try {
    if (req.user.role !== 'member') {
      return res.status(403).json({ error: 'Only members can generate a QR pass' });
    }
    const payload = `member:${req.user.id}:${encodeURIComponent(req.user.email)}`;
    res.json({ payload });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR payload' });
  }
}

// ---- Scan QR (admin/trainer) ----
async function scan(req, res) {
  const { qrPayload, classScheduleId } = req.body;
  try {
    if (!qrPayload || !classScheduleId) {
      return res.status(422).json({ error: 'qrPayload and classScheduleId are required' });
    }

    const parts = qrPayload.split(':');
    if (parts.length < 3 || parts[0] !== 'member') {
      return res.status(400).json({ error: 'Invalid QR payload format' });
    }

    const memberId = Number(parts[1]);
    const member = await dbQuery('SELECT id, full_name, is_active FROM users WHERE id = $1', [memberId]);
    if (!member.rows.length || !member.rows[0].is_active) {
      return res.status(404).json({ error: 'Member not found or inactive' });
    }

    // Check class – no status column
    const cls = await dbQuery('SELECT capacity, trainer_id, start_time FROM class_schedules WHERE id = $1', [classScheduleId]);
    if (!cls.rows.length) {
      return res.status(404).json({ error: 'Class not found' });
    }
    if (new Date(cls.rows[0].start_time) <= new Date()) {
      return res.status(409).json({ error: 'This class has already started' });
    }
    if (req.user.role === 'trainer' && cls.rows[0].trainer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only scan attendance for your own classes' });
    }

    const booking = await dbQuery(
      `SELECT id FROM attendance WHERE class_schedule_id=$1 AND member_id=$2 AND status IN ('booked', 'checked_in')`,
      [classScheduleId, memberId]
    );
    if (!booking.rows.length) {
      return res.status(409).json({ error: 'Member does not have an active booking for this class' });
    }

    // Check in
    if (pool.dbType === 'mysql') {
      await dbQuery(
        `INSERT INTO attendance (class_schedule_id, member_id, status, checked_in_at)
         VALUES ($1, $2, 'checked_in', NOW())
         ON DUPLICATE KEY UPDATE status = 'checked_in', checked_in_at = NOW()`,
        [classScheduleId, memberId]
      );
    } else {
      await dbQuery(
        `INSERT INTO attendance (class_schedule_id, member_id, status, checked_in_at)
         VALUES ($1, $2, 'checked_in', NOW())
         ON CONFLICT (class_schedule_id, member_id)
         DO UPDATE SET status = 'checked_in', checked_in_at = NOW()`,
        [classScheduleId, memberId]
      );
    }

    const attendanceResult = await dbQuery(
      `SELECT a.*, u.full_name AS member_name FROM attendance a JOIN users u ON u.id = a.member_id WHERE a.class_schedule_id = $1 AND a.member_id = $2`,
      [classScheduleId, memberId]
    );

    await logActivity({ userId: req.user.id, action: 'ATTENDANCE_SCAN', details: { memberId, classScheduleId } });
    res.json(attendanceResult.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to scan attendance' });
  }
}

// ---- Check-in (mark member present) ----
async function checkIn(req, res) {
  try {
    const booking = await dbQuery(
      `SELECT a.member_id, cs.trainer_id, cs.start_time FROM attendance a JOIN class_schedules cs ON cs.id=a.class_schedule_id WHERE a.id=$1`,
      [req.params.id]
    );
    if (!booking.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (req.user.role === 'trainer' && booking.rows[0].trainer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only check in attendees for your classes' });
    }
    await dbQuery(
      `UPDATE attendance SET status = 'checked_in', checked_in_at = NOW() WHERE id = $1`,
      [req.params.id]
    );
    const result = await dbQuery(`SELECT * FROM attendance WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    await logActivity({ userId: req.user.id, action: 'ATTENDANCE_CHECK_IN', details: { attendanceId: req.params.id } });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to check in' });
  }
}

// ---- Cancel booking ----
async function cancel(req, res) {
  try {
    const booking = await dbQuery(
      `SELECT a.member_id, cs.trainer_id, cs.start_time FROM attendance a JOIN class_schedules cs ON cs.id=a.class_schedule_id WHERE a.id=$1`,
      [req.params.id]
    );
    if (!booking.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (req.user.role === 'member' && booking.rows[0].member_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only cancel your own booking' });
    }
    if (req.user.role === 'member' && new Date(booking.rows[0].start_time) <= new Date()) {
      return res.status(409).json({ error: 'Bookings cannot be cancelled after the class starts' });
    }
    if (req.user.role === 'trainer' && booking.rows[0].trainer_id !== req.user.id) {
      return res.status(403).json({ error: 'You can only manage bookings for your classes' });
    }
    await dbQuery(`UPDATE attendance SET status = 'cancelled' WHERE id = $1`, [req.params.id]);
    const result = await dbQuery(`SELECT * FROM attendance WHERE id = $1`, [req.params.id]);
    if (!result.rows.length) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
}

// ---- List attendance ----
async function list(req, res) {
  const { classScheduleId, memberId } = req.query;
  const conditions = [];
  const params = [];
  if (classScheduleId) { params.push(classScheduleId); conditions.push(`a.class_schedule_id = $${params.length}`); }
  if (memberId) { params.push(memberId); conditions.push(`a.member_id = $${params.length}`); }
  if (req.user.role === 'member') { params.push(req.user.id); conditions.push(`a.member_id = $${params.length}`); }
  if (req.user.role === 'trainer') { params.push(req.user.id); conditions.push(`cs.trainer_id = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await dbQuery(
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

module.exports = { book, qrCode, scan, checkIn, cancel, list };