const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/memberships.controller');

const router = express.Router();
router.use(authenticate);

// ---- Plans (catalog) ----
router.get('/plans', ctrl.listPlans);
router.post(
  '/plans',
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('durationDays').isInt({ min: 1 }),
  ],
  validate,
  ctrl.createPlan
);

// ---- Member subscriptions ----
router.get('/', authorize('admin', 'trainer', 'member'), ctrl.list);
router.post(
  '/assign',
  authorize('admin'),
  [
    body('memberId').isInt(),
    body('membershipPlanId').isInt(),
  ],
  validate,
  ctrl.assign
);
router.patch(
  '/:id/status',
  authorize('admin'),
  [body('status').isIn(['active', 'expired', 'pending', 'cancelled'])],
  validate,
  ctrl.updateStatus
);

module.exports = router;
