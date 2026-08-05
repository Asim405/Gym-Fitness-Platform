const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/workoutPlans.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);

router.post(
  '/',
  authorize('admin', 'trainer'),
  [body('title').trim().notEmpty()],
  validate,
  ctrl.create
);

router.delete('/:id', authorize('admin', 'trainer'), ctrl.remove);

module.exports = router;
