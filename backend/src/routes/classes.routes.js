const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/classes.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list);

router.post(
  '/',
  authorize('admin', 'trainer'),
  [
    body('title').trim().notEmpty(),
    body('startTime').isISO8601(),
    body('endTime').isISO8601(),
  ],
  validate,
  ctrl.create
);

router.put('/:id', authorize('admin', 'trainer'), ctrl.update);
router.delete('/:id', authorize('admin', 'trainer'), ctrl.remove);

module.exports = router;
