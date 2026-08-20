const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/classes.controller');
const attendanceCtrl = require('../controllers/attendance.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/book', authorize('member'), attendanceCtrl.book);
router.patch('/book/:id/cancel', authorize('admin', 'trainer', 'member'), attendanceCtrl.cancel);

router.post(
  '/',
  authorize('admin', 'trainer'),
  [
    body('title').trim().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
    body('trainerId').optional().isInt(),
    body('capacity').optional().isInt({ min: 1 }),
    body('status').optional().isIn(['scheduled', 'cancelled', 'completed']),
  ],
  validate,
  ctrl.create
);

router.put('/:id', authorize('admin', 'trainer'), [body('title').optional().trim().notEmpty(), body('startTime').optional().isISO8601(), body('endTime').optional().isISO8601(), body('trainerId').optional().isInt(), body('capacity').optional().isInt({ min: 1 }), body('status').optional().isIn(['scheduled', 'cancelled', 'completed'])], validate, ctrl.update);
router.delete('/:id', authorize('admin', 'trainer'), ctrl.remove);

module.exports = router;
