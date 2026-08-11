const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/attendance.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);
router.get('/qr', authorize('member'), ctrl.qrCode);
router.post('/book', authorize('member'), ctrl.book);
router.post('/scan', authorize('admin', 'trainer'), ctrl.scan);
router.patch('/:id/check-in', authorize('admin', 'trainer'), ctrl.checkIn);
router.patch('/:id/cancel', authorize('admin', 'trainer', 'member'), ctrl.cancel);

module.exports = router;
