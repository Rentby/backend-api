const { body, validationResult } = require('express-validator');

const validateResource = [
  body('name').isString().notEmpty(),
  body('salary').isNumeric(),
  body('country').isString().notEmpty(),
  body('city').isString().notEmpty(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = validateResource;
