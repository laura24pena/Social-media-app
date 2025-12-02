const Media = require('../models/Media');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// @desc    Get all media
// @route   GET /api/media
// @access  Public
const getMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Build query - only show public published media by default
    let query = { 
      visibility: 'public',
      status: 'published'
    };
    
    // Search by title or description
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by media type
    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }
    
    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tags };
    }
    
    // Filter featured
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }
    
    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      
      if (sortField === 'likes') {
        // Sort by like count (virtual field)
        sortBy = { 'likes': sortOrder };
      } else {
        sortBy[sortField] = sortOrder;
      }
    } else {
      sortBy.createdAt = -1; // Default sort by newest
    }
    
    const media = await Media.find(query)
      .populate('owner', 'firstName lastName username profilePicture')
      .populate('collaborators.user', 'firstName lastName username')
      .sort(sortBy)
      .limit(limit * 1)
      .skip(startIndex);
    
    const total = await Media.countDocuments(query);
    
    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalMedia: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
    
    res.status(200).json({
      success: true,
      count: media.length,
      pagination,
      media
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single media item
// @route   GET /api/media/:id
// @access  Public/Private (depends on visibility)
const getMediaItem = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id)
      .populate('owner', 'firstName lastName username profilePicture bio')
      .populate('collaborators.user', 'firstName lastName username profilePicture')
      .populate('likes.user', 'firstName lastName username');
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Check if user can view this media
    const userId = req.user ? req.user._id : null;
    if (!media.canView(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this media'
      });
    }
    
    // Increment view count (only if not the owner)
    if (!userId || userId.toString() !== media.owner._id.toString()) {
      await media.incrementViews();
    }
    
    res.status(200).json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Get media item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create new media item
// @route   POST /api/media
// @access  Private
const createMedia = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaType,
      category,
      fileName,
      originalName,
      fileSize,
      mimeType,
      cloudUrl,
      thumbnailUrl,
      visibility,
      tags,
      metadata
    } = req.body;
    
    const media = await Media.create({
      title,
      description,
      mediaType,
      category,
      fileName,
      originalName,
      fileSize,
      mimeType,
      cloudUrl,
      thumbnailUrl: thumbnailUrl || '',
      owner: req.user._id,
      visibility: visibility || 'public',
      tags: tags || [],
      metadata: metadata || {}
    });
    
    await media.populate('owner', 'firstName lastName username profilePicture');
    
    res.status(201).json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Create media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update media item
// @route   PUT /api/media/:id
// @access  Private (owner or collaborator with edit permission)
const updateMedia = async (req, res) => {
  try {
    let media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Check if user can edit this media
    if (!media.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this media'
      });
    }
    
    const allowedFields = [
      'title',
      'description',
      'category',
      'visibility',
      'tags',
      'metadata'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    media = await Media.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('owner', 'firstName lastName username profilePicture')
     .populate('collaborators.user', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Update media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete media item
// @route   DELETE /api/media/:id
// @access  Private (owner only)
const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Only owner can delete media
    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this media'
      });
    }
    
    await Media.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Like/Unlike media
// @route   POST /api/media/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Check if user can view this media
    if (!media.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this media'
      });
    }
    
    const existingLike = media.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );
    
    let action;
    if (existingLike) {
      await media.removeLike(req.user._id);
      action = 'unliked';
    } else {
      await media.addLike(req.user._id);
      action = 'liked';
    }
    
    // Get updated media with like count
    const updatedMedia = await Media.findById(req.params.id)
      .populate('owner', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      action,
      likeCount: updatedMedia.likeCount,
      media: updatedMedia
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add collaborator to media
// @route   POST /api/media/:id/collaborators
// @access  Private (owner only)
const addCollaborator = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Only owner can add collaborators
    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to add collaborators'
      });
    }
    
    // Check if user exists
    const collaborator = await User.findById(userId);
    if (!collaborator) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Check if already a collaborator
    const existingCollaborator = media.collaborators.find(
      collab => collab.user.toString() === userId
    );
    
    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        error: 'User is already a collaborator'
      });
    }
    
    media.collaborators.push({
      user: userId,
      role: role || 'viewer'
    });
    
    await media.save();
    await media.populate('collaborators.user', 'firstName lastName username profilePicture');
    
    res.status(200).json({
      success: true,
      message: 'Collaborator added successfully',
      media
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Remove collaborator from media
// @route   DELETE /api/media/:id/collaborators/:userId
// @access  Private (owner only)
const removeCollaborator = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    
    if (!media) {
      return res.status(404).json({
        success: false,
        error: 'Media not found'
      });
    }
    
    // Only owner can remove collaborators
    if (media.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to remove collaborators'
      });
    }
    
    media.collaborators = media.collaborators.filter(
      collab => collab.user.toString() !== req.params.userId
    );
    
    await media.save();
    
    res.status(200).json({
      success: true,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    console.error('Remove collaborator error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get media categories
// @route   GET /api/media/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = [
      'painting',
      'music',
      'design',
      'illustration',
      'storytelling',
      'photography',
      'sculpture',
      'digital_art',
      'other'
    ];
    
    // Get category counts
    const categoryCounts = await Media.aggregate([
      { $match: { visibility: 'public', status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    const categoriesWithCounts = categories.map(category => {
      const categoryData = categoryCounts.find(c => c._id === category);
      return {
        name: category,
        count: categoryData ? categoryData.count : 0
      };
    });
    
    res.status(200).json({
      success: true,
      categories: categoriesWithCounts
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getMedia,
  getMediaItem,
  createMedia,
  updateMedia,
  deleteMedia,
  toggleLike,
  addCollaborator,
  removeCollaborator,
  getCategories
};

