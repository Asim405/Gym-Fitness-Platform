const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/dashboard.controller');

const router = express.Router();
router.use(authenticate);

router.get('/admin', authorize('admin'), ctrl.adminSummary);
router.get('/trainer', authorize('trainer', 'admin'), ctrl.trainerSummary);
router.get('/member', authorize('member', 'admin'), ctrl.memberSummary);

module.exports = router;
