const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/inventory.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', authorize('admin', 'trainer'), ctrl.list);
router.get('/:id', authorize('admin', 'trainer'), ctrl.getById);
router.post(
  '/',
  authorize('admin'),
  [
    body('name').trim().notEmpty(),
    body('quantity').isInt({ min: 0 }),
    body('status').optional().isIn(['available', 'maintenance', 'out_of_stock']),
  ],
  validate,
  ctrl.create
);
router.put('/:id', authorize('admin'), ctrl.update);
router.post('/:id/adjust-stock', authorize('admin'), [body('quantityChange').isInt().not().equals(0), body('reason').optional().isLength({ max: 255 })], validate, ctrl.adjustStock);
router.get('/:id/stock-history', authorize('admin'), ctrl.stockHistory);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
