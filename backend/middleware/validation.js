const { body, param, query, validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errorMessages
    });
  }
  next();
};

// Custom validator for MongoDB ObjectId
const isValidObjectId = (value) => {
  return mongoose.Types.ObjectId.isValid(value);
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name is required and must not exceed 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name is required and must not exceed 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('specializations.*')
    .optional()
    .isIn(['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'other'])
    .withMessage('Invalid specialization'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateUserUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must not exceed 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must not exceed 50 characters'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('specializations.*')
    .optional()
    .isIn(['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'other'])
    .withMessage('Invalid specialization'),
  body('socialLinks.website')
    .optional()
    .isURL()
    .withMessage('Website must be a valid URL'),
  body('socialLinks.instagram')
    .optional()
    .matches(/^[a-zA-Z0-9_.]+$/)
    .withMessage('Invalid Instagram username'),
  body('socialLinks.twitter')
    .optional()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Invalid Twitter username'),
  body('socialLinks.linkedin')
    .optional()
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage('Invalid LinkedIn username'),
  handleValidationErrors
];

// Media validation rules
const validateMediaUpload = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must not exceed 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('mediaType')
    .isIn(['image', 'audio', 'video', 'document', 'other'])
    .withMessage('Invalid media type'),
  body('category')
    .isIn(['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'other'])
    .withMessage('Invalid category'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'collaborators'])
    .withMessage('Invalid visibility setting'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  handleValidationErrors
];

// Project validation rules
const validateProjectCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Title is required and must not exceed 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Description is required and must not exceed 2000 characters'),
  body('category')
    .isIn(['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'mixed_media', 'other'])
    .withMessage('Invalid category'),
  body('projectType')
    .isIn(['solo', 'collaboration', 'commission', 'contest'])
    .withMessage('Invalid project type'),
  body('visibility')
    .optional()
    .isIn(['public', 'private', 'participants_only'])
    .withMessage('Invalid visibility setting'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Deadline must be a valid date'),
  handleValidationErrors
];

// Feedback validation rules
const validateFeedbackCreation = [
  body('targetId')
    .custom(isValidObjectId)
    .withMessage('Invalid target ID'),
  body('targetType')
    .isIn(['Media', 'Project', 'User'])
    .withMessage('Invalid target type'),
  body('feedbackType')
    .isIn(['comment', 'rating', 'review', 'suggestion'])
    .withMessage('Invalid feedback type'),
  body('content')
    .if(body('feedbackType').isIn(['comment', 'review', 'suggestion']))
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content is required for this feedback type and must not exceed 1000 characters'),
  body('rating')
    .if(body('feedbackType').isIn(['rating', 'review']))
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('parentFeedback')
    .optional()
    .custom(isValidObjectId)
    .withMessage('Invalid parent feedback ID'),
  handleValidationErrors
];

// Parameter validation
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .custom(isValidObjectId)
    .withMessage(`Invalid ${paramName}`),
  handleValidationErrors
];

// Query validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'updatedAt', '-updatedAt', 'title', '-title', 'likes', '-likes'])
    .withMessage('Invalid sort parameter'),
  handleValidationErrors
];

const validateSearch = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  query('category')
    .optional()
    .isIn(['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'mixed_media', 'other'])
    .withMessage('Invalid category'),
  query('mediaType')
    .optional()
    .isIn(['image', 'audio', 'video', 'document', 'other'])
    .withMessage('Invalid media type'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateMediaUpload,
  validateProjectCreation,
  validateFeedbackCreation,
  validateObjectId,
  validatePagination,
  validateSearch
};

