const { validationResult } = require('express-validator');

// Run after an array of express-validator checks; short-circuits with 422 on failure.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  }
  next();
}

module.exports = validate;
