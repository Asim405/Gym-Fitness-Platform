const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/exercises.controller');

const router = express.Router();
router.use(authenticate);

router.get('/', ctrl.list); // all roles can browse the library

router.post(
  '/',
  authorize('admin', 'trainer'),
  [
    body('name').trim().notEmpty(),
    body('targetMuscle').trim().notEmpty(),
  ],
  validate,
  ctrl.create
);

router.put('/:id', authorize('admin', 'trainer'), ctrl.update);
router.delete('/:id', authorize('admin', 'trainer'), ctrl.remove);

module.exports = router;
