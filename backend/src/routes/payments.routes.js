const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/payments.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'trainer', 'member'), ctrl.list);
router.get('/:id', authorize('admin', 'trainer', 'member'), ctrl.getById);
router.post(
  '/',
  authorize('admin'),
  [
    body('memberId').isInt(),
    body('amount').isFloat({ min: 0 }),
    body('paymentMethod').trim().notEmpty(),
    body('invoiceId').optional().isInt(),
  ],
  validate,
  ctrl.create
);

module.exports = router;
