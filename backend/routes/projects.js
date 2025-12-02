const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  toggleLike,
  inviteUser,
  joinProject,
  leaveProject,
  addMedia
} = require('../controllers/projectController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateProjectCreation,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validateSearch, getProjects);
router.get('/:id', validateObjectId('id'), optionalAuth, getProject);

// Protected routes
router.post('/', protect, validateProjectCreation, createProject);
router.put('/:id', validateObjectId('id'), protect, updateProject);
router.delete('/:id', validateObjectId('id'), protect, deleteProject);
router.post('/:id/like', validateObjectId('id'), protect, toggleLike);
router.post('/:id/invite', validateObjectId('id'), protect, inviteUser);
router.post('/:id/join', validateObjectId('id'), protect, joinProject);
router.post('/:id/leave', validateObjectId('id'), protect, leaveProject);
router.post('/:id/media', validateObjectId('id'), protect, addMedia);

module.exports = router;

