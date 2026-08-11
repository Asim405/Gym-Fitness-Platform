const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/dietPlans.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'trainer', 'member'), ctrl.list);
router.get('/:id', authorize('admin', 'trainer', 'member'), ctrl.getById);
router.post(
  '/',
  authorize('admin', 'trainer'),
  [
    body('memberId').isInt(),
    body('title').trim().notEmpty(),
    body('calories').optional().isInt({ min: 0 }),
    body('protein').optional().isInt({ min: 0 }),
    body('carbs').optional().isInt({ min: 0 }),
    body('fats').optional().isInt({ min: 0 }),
  ],
  validate,
  ctrl.create
);
router.put('/:id', authorize('admin', 'trainer'), ctrl.update);
router.delete('/:id', authorize('admin', 'trainer'), ctrl.remove);

module.exports = router;
