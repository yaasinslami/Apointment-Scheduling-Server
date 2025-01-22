const { body } = require('express-validator');

exports.validateCreateService = [
  body('name')
    .notEmpty().withMessage('Service name is required.')
    .isString().withMessage('Service name must be a string.')
    .isLength({ max: 100 }).withMessage('Service name must not exceed 100 characters.'),

  body('description')
    .notEmpty().withMessage('Description is required.')
    .isString().withMessage('Description must be a string.')
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters.'),

  body('images')
    .optional()
    .isArray().withMessage('Images must be an array of strings.')
    .custom((images) => {
      if (images.some(img => typeof img !== 'string')) {
        throw new Error('All images must be valid URLs as strings.');
      }
      return true;
    }),

  body('price')
    .notEmpty().withMessage('Price is required.')
    .isFloat({ gt: 0, lt: 10000 }).withMessage('Price must be a positive number between 0 and 10,000.'),

  body('duration')
    .notEmpty().withMessage('Duration is required.')
    .isInt({ gt: 0, lt: 1440 }).withMessage('Duration must be a positive number (in minutes) and less than 24 hours.'),

  body('preparationTime')
    .optional()
    .isInt({ gte: 0 }).withMessage('Preparation time must be a non-negative integer.'),

  body('cleanupTime')
    .optional()
    .isInt({ gte: 0 }).withMessage('Cleanup time must be a non-negative integer.'),

  body('category')
    .optional()
    .isString().withMessage('Category must be a string.')
    .isLength({ max: 50 }).withMessage('Category must not exceed 50 characters.'),
];
