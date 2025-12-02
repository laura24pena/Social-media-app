const express = require('express');
const {
  getUsers,
  getUser,
  getUserMedia,
  getUserProjects,
  toggleFollow,
  getUserStats
} = require('../controllers/userController');

const { protect, optionalAuth } = require('../middleware/auth');
const { validateObjectId, validatePagination, validateSearch } = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validateSearch, getUsers);
router.get('/:id', validateObjectId('id'), getUser);
router.get('/:id/media', validateObjectId('id'), validatePagination, validateSearch, optionalAuth, getUserMedia);
router.get('/:id/projects', validateObjectId('id'), validatePagination, validateSearch, optionalAuth, getUserProjects);
router.get('/:id/stats', validateObjectId('id'), getUserStats);

// Protected routes
router.post('/:id/follow', validateObjectId('id'), protect, toggleFollow);

module.exports = router;

