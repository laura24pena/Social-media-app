const express = require('express');
const {
  getMedia,
  getMediaItem,
  createMedia,
  updateMedia,
  deleteMedia,
  toggleLike,
  addCollaborator,
  removeCollaborator,
  getCategories
} = require('../controllers/mediaController');

const { protect, optionalAuth } = require('../middleware/auth');
const {
  validateMediaUpload,
  validateObjectId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', validatePagination, validateSearch, getMedia);
router.get('/categories', getCategories);
router.get('/:id', validateObjectId('id'), optionalAuth, getMediaItem);

// Protected routes
router.post('/', protect, validateMediaUpload, createMedia);
router.put('/:id', validateObjectId('id'), protect, updateMedia);
router.delete('/:id', validateObjectId('id'), protect, deleteMedia);
router.post('/:id/like', validateObjectId('id'), protect, toggleLike);
router.post('/:id/collaborators', validateObjectId('id'), protect, addCollaborator);
router.delete('/:id/collaborators/:userId', validateObjectId('id'), validateObjectId('userId'), protect, removeCollaborator);

module.exports = router;

