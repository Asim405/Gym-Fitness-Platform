const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/progress.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.history);
router.post('/', ctrl.create);
router.post('/bmi', ctrl.bmiCalculator);

module.exports = router;
