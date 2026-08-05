const pool = require('../config/db');

function calcBmi(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(2));
}

// POST /api/progress  { weightKg, bodyFatPct, goalNote, recordedAt }
// Members log their own metrics; height comes from their profile for BMI.
async function create(req, res) {
  const { weightKg, bodyFatPct, goalNote, recordedAt } = req.body;
  const memberId = req.user.role === 'member' ? req.user.id : req.body.memberId;

  try {
    const userResult = await pool.query('SELECT height_cm FROM users WHERE id = $1', [memberId]);
    const heightCm = userResult.rows[0]?.height_cm;
    const bmi = calcBmi(weightKg, heightCm);

    const result = await pool.query(
      `INSERT INTO progress_metrics (member_id, weight_kg, body_fat_pct, bmi, goal_note, recorded_at)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE)) RETURNING *`,
      [memberId, weightKg, bodyFatPct || null, bmi, goalNote || null, recordedAt || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log progress' });
  }
}

// GET /api/progress?memberId=  (history, oldest -> newest, for charting)
async function history(req, res) {
  const memberId = req.user.role === 'member' ? req.user.id : req.query.memberId;
  if (!memberId) return res.status(400).json({ error: 'memberId is required' });

  try {
    const result = await pool.query(
      `SELECT * FROM progress_metrics WHERE member_id = $1 ORDER BY recorded_at ASC`,
      [memberId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch progress history' });
  }
}

// POST /api/progress/bmi  { weightKg, heightCm, age? } -> instant calculator, no DB write
function bmiCalculator(req, res) {
  const { weightKg, heightCm } = req.body;
  const bmi = calcBmi(Number(weightKg), Number(heightCm));
  if (bmi === null) return res.status(422).json({ error: 'weightKg and heightCm are required' });

  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 25 && bmi < 30) category = 'Overweight';
  else if (bmi >= 30) category = 'Obese';

  res.json({ bmi, category });
}

module.exports = { create, history, bmiCalculator };
