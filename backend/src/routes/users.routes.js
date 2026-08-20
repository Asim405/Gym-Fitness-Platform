const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/users.controller');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'trainer'), ctrl.list);
router.get('/:id', authorize('admin', 'trainer', 'member'), ctrl.getById);

router.post(
  '/',
  authorize('admin'),
  [
    body('fullName').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['admin', 'trainer', 'member']),
  ],
  validate,
  ctrl.create
);

router.put('/:id', authorize('admin', 'trainer', 'member'), ctrl.update);
router.delete('/:id', authorize('admin'), ctrl.remove);

module.exports = router;
