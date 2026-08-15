const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/trainerRelations.controller');

const router = express.Router();
router.use(authenticate);
router.get('/trainers', ctrl.listTrainers);
router.put('/trainers/:trainerId/profile', authorize('admin', 'trainer'), ctrl.upsertProfile);
router.post('/trainer-requests', authorize('member'), [body('trainerId').isInt(), body('note').optional().isLength({ max: 500 })], validate, ctrl.requestTrainer);
router.get('/trainer-requests', authorize('admin', 'trainer', 'member'), ctrl.listRequests);
router.patch('/trainer-requests/:id/approve', authorize('admin', 'trainer'), ctrl.approveRequest);
router.patch('/trainer-requests/:id/status', [body('status').isIn(['rejected', 'cancelled'])], validate, ctrl.updateRequestStatus);
router.get('/trainer-assignments/me', authorize('member'), ctrl.myAssignment);
router.delete('/trainer-assignments/:id', authorize('admin', 'trainer', 'member'), ctrl.endAssignment);

module.exports = router;
