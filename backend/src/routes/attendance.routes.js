const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/attendance.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.post('/book', authorize('member'), ctrl.book);
router.patch('/:id/check-in', authorize('admin', 'trainer'), ctrl.checkIn);
router.patch('/:id/cancel', authorize('admin', 'trainer', 'member'), ctrl.cancel);

module.exports = router;
