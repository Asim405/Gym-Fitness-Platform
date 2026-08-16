const pool = require('../config/db');
const { canTrainerAccessMember } = require('../services/memberAccess');
const logActivity = require('../utils/logActivity');

async function listTrainers(req, res) {
  try {
    const result = await pool.query(
      `SELECT u.id, u.full_name, u.email, u.phone, u.profile_image, u.is_active,
              tp.specialization, tp.experience_years, tp.bio, tp.availability_note,
              tp.personal_training_cost, tp.max_members, tp.is_available,
              COUNT(ta.id) AS assigned_members
       FROM users u
       LEFT JOIN trainer_profiles tp ON tp.trainer_id = u.id
       LEFT JOIN trainer_assignments ta ON ta.trainer_id = u.id AND ta.status = 'active'
       WHERE u.role = 'trainer' AND u.is_active = TRUE
       GROUP BY u.id, u.full_name, u.email, u.phone, u.profile_image, u.is_active,
                tp.specialization, tp.experience_years, tp.bio, tp.availability_note,
                tp.personal_training_cost, tp.max_members, tp.is_available
       ORDER BY u.full_name ASC`
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
}

async function upsertProfile(req, res) {
  const trainerId = req.user.role === 'trainer' ? req.user.id : Number(req.params.trainerId);
  const { specialization, experienceYears, bio, availabilityNote, personalTrainingCost, maxMembers, isAvailable } = req.body;
  if (!trainerId) return res.status(400).json({ error: 'trainerId is required' });
  try {
    const user = await pool.query(`SELECT id FROM users WHERE id = $1 AND role = 'trainer'`, [trainerId]);
    if (!user.rows.length) return res.status(404).json({ error: 'Trainer not found' });

    const profileValues = [
      trainerId,
      specialization ?? null,
      experienceYears ?? null,
      bio ?? null,
      availabilityNote ?? null,
      personalTrainingCost ?? null,
      maxMembers ?? 20,
      isAvailable ?? true,
    ];

    if (pool.dbType === 'mysql') {
      await pool.query(
        `INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           specialization = VALUES(specialization),
           experience_years = VALUES(experience_years),
           bio = VALUES(bio),
           availability_note = VALUES(availability_note),
           personal_training_cost = VALUES(personal_training_cost),
           max_members = VALUES(max_members),
           is_available = VALUES(is_available)`,
        profileValues
      );
    } else {
      await pool.query(
        `INSERT INTO trainer_profiles (trainer_id, specialization, experience_years, bio, availability_note, personal_training_cost, max_members, is_available)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (trainer_id) DO UPDATE SET specialization=COALESCE(EXCLUDED.specialization, trainer_profiles.specialization), experience_years=COALESCE(EXCLUDED.experience_years, trainer_profiles.experience_years), bio=COALESCE(EXCLUDED.bio, trainer_profiles.bio), availability_note=COALESCE(EXCLUDED.availability_note, trainer_profiles.availability_note), personal_training_cost=COALESCE(EXCLUDED.personal_training_cost, trainer_profiles.personal_training_cost), max_members=COALESCE(EXCLUDED.max_members, trainer_profiles.max_members), is_available=COALESCE(EXCLUDED.is_available, trainer_profiles.is_available), updated_at=NOW()`,
        profileValues
      );
    }
    const profile = await pool.query('SELECT * FROM trainer_profiles WHERE trainer_id = $1', [trainerId]);
    res.json(profile.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save trainer profile' });
  }
}

async function requestTrainer(req, res) {
  const { trainerId, note } = req.body;
  try {
    const trainer = await pool.query(
      `SELECT u.id, u.is_active, COALESCE(tp.is_available, TRUE) AS is_available
       FROM users u LEFT JOIN trainer_profiles tp ON tp.trainer_id = u.id
       WHERE u.id = $1 AND u.role = 'trainer'`, [trainerId]
    );
    if (!trainer.rows.length || !trainer.rows[0].is_active || !trainer.rows[0].is_available) {
      return res.status(400).json({ error: 'This trainer is not available for requests' });
    }
    const existing = await pool.query(
      `SELECT id FROM trainer_requests WHERE member_id=$1 AND trainer_id=$2 AND status='pending'`, [req.user.id, trainerId]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'A request for this trainer is already pending' });
    if (pool.dbType === 'mysql') {
      const created = await pool.query(
        `INSERT INTO trainer_requests (member_id, trainer_id, note) VALUES (?, ?, ?)`,
        [req.user.id, trainerId, note || null]
      );
      const request = (await pool.query('SELECT * FROM trainer_requests WHERE id = ?', [created.insertId])).rows[0];
      await logActivity({ userId: req.user.id, action: 'TRAINER_REQUESTED', details: { trainerId } });
      return res.status(201).json(request);
    }

    const created = await pool.query(
      `INSERT INTO trainer_requests (member_id, trainer_id, note) VALUES ($1,$2,$3) RETURNING *`,
      [req.user.id, trainerId, note || null]
    );
    const request = created.rows[0];
    await logActivity({ userId: req.user.id, action: 'TRAINER_REQUESTED', details: { trainerId } });
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to request trainer' });
  }
}

async function listRequests(req, res) {
  const params = [];
  let where = '';
  if (req.user.role === 'member') { params.push(req.user.id); where = `WHERE tr.member_id = $${params.length}`; }
  if (req.user.role === 'trainer') { params.push(req.user.id); where = `WHERE tr.trainer_id = $${params.length}`; }
  try {
    const result = await pool.query(
      `SELECT tr.*, m.full_name AS member_name, t.full_name AS trainer_name
       FROM trainer_requests tr JOIN users m ON m.id=tr.member_id JOIN users t ON t.id=tr.trainer_id
       ${where} ORDER BY tr.created_at DESC`, params
    );
    res.json({ data: result.rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch trainer requests' }); }
}

async function approveRequest(req, res) {
  const request = await pool.query('SELECT * FROM trainer_requests WHERE id = $1', [req.params.id]);
  if (!request.rows.length) return res.status(404).json({ error: 'Trainer request not found' });
  const item = request.rows[0];
  if (req.user.role === 'trainer' && item.trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only review your own requests' });
  if (item.status !== 'pending') return res.status(409).json({ error: 'Only pending requests can be approved' });
  try {
    const trainer = await pool.query(
      `SELECT u.is_active, COALESCE(tp.is_available, TRUE) AS is_available, COALESCE(tp.max_members, 20) AS max_members,
              (SELECT COUNT(*) FROM trainer_assignments WHERE trainer_id = $1 AND status = 'active') AS assigned_count
       FROM users u
       LEFT JOIN trainer_profiles tp ON tp.trainer_id = u.id
       WHERE u.id = $1 AND u.role = 'trainer'`,
      [item.trainer_id]
    );
    const details = trainer.rows[0];
    if (!details?.is_active || !details.is_available || Number(details.assigned_count) >= Number(details.max_members)) return res.status(409).json({ error: 'Trainer is unavailable or at capacity' });
    const active = await pool.query(`SELECT id FROM trainer_assignments WHERE member_id=$1 AND status='active'`, [item.member_id]);
    if (active.rows.length) return res.status(409).json({ error: 'Member already has an active trainer assignment' });
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(`INSERT INTO trainer_assignments (member_id, trainer_id, assigned_by) VALUES ($1,$2,$3)`, [item.member_id, item.trainer_id, req.user.id]);
      await client.query(`UPDATE trainer_requests SET status='approved', reviewed_by=$1, reviewed_at=NOW(), updated_at=NOW() WHERE id=$2`, [req.user.id, item.id]);
      await client.query('COMMIT');
    } catch (err) { await client.query('ROLLBACK'); throw err; } finally { client.release(); }
    const updated = await pool.query('SELECT * FROM trainer_requests WHERE id = $1', [item.id]);
    await logActivity({ userId: req.user.id, action: 'TRAINER_REQUEST_APPROVED', details: { requestId: item.id } });
    res.json(updated.rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to approve trainer request' }); }
}

async function updateRequestStatus(req, res) {
  const { status } = req.body;
  const found = await pool.query('SELECT * FROM trainer_requests WHERE id=$1', [req.params.id]);
  if (!found.rows.length) return res.status(404).json({ error: 'Trainer request not found' });
  const item = found.rows[0];
  const allowed = (req.user.role === 'member' && item.member_id === req.user.id && status === 'cancelled') || req.user.role === 'admin' || (req.user.role === 'trainer' && item.trainer_id === req.user.id && status === 'rejected');
  if (!allowed || item.status !== 'pending') return res.status(403).json({ error: 'This status change is not allowed' });
  await pool.query(`UPDATE trainer_requests SET status=$1, reviewed_by=$2, reviewed_at=NOW(), updated_at=NOW() WHERE id=$3`, [status, req.user.id, item.id]);
  res.json((await pool.query('SELECT * FROM trainer_requests WHERE id=$1', [item.id])).rows[0]);
}

async function myAssignment(req, res) {
  try {
    const result = await pool.query(
      `SELECT ta.*, u.full_name, u.email, u.phone, u.profile_image, tp.specialization, tp.experience_years, tp.bio, tp.availability_note
       FROM trainer_assignments ta JOIN users u ON u.id=ta.trainer_id LEFT JOIN trainer_profiles tp ON tp.trainer_id=u.id
       WHERE ta.member_id=$1 AND ta.status='active'`, [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch trainer assignment' }); }
}

async function endAssignment(req, res) {
  const assignment = await pool.query('SELECT * FROM trainer_assignments WHERE id=$1', [req.params.id]);
  if (!assignment.rows.length) return res.status(404).json({ error: 'Trainer assignment not found' });
  const item = assignment.rows[0];
  if (req.user.role === 'trainer' && item.trainer_id !== req.user.id) return res.status(403).json({ error: 'You can only manage your own assignments' });
  if (req.user.role === 'member' && item.member_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  await pool.query(`UPDATE trainer_assignments SET status='ended', ended_at=NOW() WHERE id=$1 AND status='active'`, [item.id]);
  res.status(204).send();
}

module.exports = { listTrainers, upsertProfile, requestTrainer, listRequests, approveRequest, updateRequestStatus, myAssignment, endAssignment };
