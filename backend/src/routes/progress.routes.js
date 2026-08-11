const express = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const ctrl = require('../controllers/progress.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.history);
router.post(
  '/',
  [
    body('weightKg').isFloat({ gt: 0 }),
    body('bodyFatPct').optional().isFloat({ min: 0 }),
    body('photoUrl').optional().isURL(),
  ],
  validate,
  ctrl.create
);
router.post(
  '/bmi',
  [
    body('weightKg').isFloat({ gt: 0 }),
    body('heightCm').isFloat({ gt: 0 }),
  ],
  validate,
  ctrl.bmiCalculator
);

module.exports = router;
