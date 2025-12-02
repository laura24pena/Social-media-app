const express = require('express');
const {
  getFeedback,
  getFeedbackItem,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  toggleLike,
  voteHelpful,
  flagFeedback,
  getFeedbackStats
} = require('../controllers/feedbackController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateFeedbackCreation,
  validateObjectId,
  validatePagination
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validatePagination, getFeedback);
router.get('/stats', getFeedbackStats);
router.get('/:id', validateObjectId('id'), optionalAuth, getFeedbackItem);

// Protected routes
router.post('/', protect, validateFeedbackCreation, createFeedback);
router.put('/:id', validateObjectId('id'), protect, updateFeedback);
router.delete('/:id', validateObjectId('id'), protect, deleteFeedback);
router.post('/:id/like', validateObjectId('id'), protect, toggleLike);
router.post('/:id/helpful', validateObjectId('id'), protect, voteHelpful);
router.post('/:id/flag', validateObjectId('id'), protect, flagFeedback);

module.exports = router;

