const Feedback = require('../models/Feedback');
const Media = require('../models/Media');
const Project = require('../models/Project');
const User = require('../models/User');
const mongoose = require('mongoose');

// @desc    Get feedback for a target (media, project, or user)
// @route   GET /api/feedback
// @access  Public
const getFeedback = async (req, res) => {
  try {
    const { targetId, targetType } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        error: 'targetId and targetType are required'
      });
    }
    
    // Build query
    let query = {
      targetId,
      targetType,
      isDeleted: false,
      visibility: 'public'
    };
    
    // Filter by feedback type
    if (req.query.feedbackType) {
      query.feedbackType = req.query.feedbackType;
    }
    
    // Only show top-level feedback (no replies) by default
    if (req.query.includeReplies !== 'true') {
      query.parentFeedback = null;
    }
    
    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1; // Default sort by newest
    }
    
    const feedback = await Feedback.find(query)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('parentFeedback', 'author content')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'firstName lastName username profilePicture'
        }
      })
      .sort(sortBy)
      .limit(limit * 1)
      .skip(startIndex);
    
    const total = await Feedback.countDocuments(query);
    
    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalFeedback: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
    
    res.status(200).json({
      success: true,
      count: feedback.length,
      pagination,
      feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single feedback item
// @route   GET /api/feedback/:id
// @access  Public
const getFeedbackItem = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('author', 'firstName lastName username profilePicture')
      .populate('parentFeedback', 'author content')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'firstName lastName username profilePicture'
        }
      });
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can view this feedback
    const userId = req.user ? req.user._id : null;
    if (!feedback.canView(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this feedback'
      });
    }
    
    res.status(200).json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Get feedback item error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
const createFeedback = async (req, res) => {
  try {
    const {
      targetId,
      targetType,
      feedbackType,
      content,
      rating,
      parentFeedback
    } = req.body;
    
    // Verify target exists and user can access it
    let target;
    if (targetType === 'Media') {
      target = await Media.findById(targetId);
    } else if (targetType === 'Project') {
      target = await Project.findById(targetId);
    } else if (targetType === 'User') {
      target = await User.findById(targetId);
    }
    
    if (!target) {
      return res.status(404).json({
        success: false,
        error: 'Target not found'
      });
    }
    
    // Check if user can view the target (required to leave feedback)
    if (target.canView && !target.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to leave feedback on this item'
      });
    }
    
    // If this is a reply, verify parent feedback exists
    if (parentFeedback) {
      const parentFeedbackItem = await Feedback.findById(parentFeedback);
      if (!parentFeedbackItem || parentFeedbackItem.targetId.toString() !== targetId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid parent feedback'
        });
      }
    }
    
    const feedback = await Feedback.create({
      targetId,
      targetType,
      feedbackType,
      content,
      rating,
      parentFeedback,
      author: req.user._id
    });
    
    // If this is a reply, add it to parent's replies array
    if (parentFeedback) {
      await Feedback.findByIdAndUpdate(
        parentFeedback,
        { $push: { replies: feedback._id } }
      );
    }
    
    await feedback.populate('author', 'firstName lastName username profilePicture');
    
    res.status(201).json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private (author only)
const updateFeedback = async (req, res) => {
  try {
    let feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can edit this feedback
    if (!feedback.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this feedback'
      });
    }
    
    const allowedFields = ['content', 'rating'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('author', 'firstName lastName username profilePicture');
    
    res.status(200).json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (author only)
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can delete this feedback
    if (!feedback.canDelete(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this feedback'
      });
    }
    
    // Soft delete
    await feedback.softDelete(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Like/Unlike feedback
// @route   POST /api/feedback/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can view this feedback
    if (!feedback.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this feedback'
      });
    }
    
    const existingLike = feedback.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );
    
    let action;
    if (existingLike) {
      await feedback.removeLike(req.user._id);
      action = 'unliked';
    } else {
      await feedback.addLike(req.user._id);
      action = 'liked';
    }
    
    // Get updated feedback with like count
    const updatedFeedback = await Feedback.findById(req.params.id)
      .populate('author', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      action,
      likeCount: updatedFeedback.likeCount,
      feedback: updatedFeedback
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Vote on feedback helpfulness
// @route   POST /api/feedback/:id/helpful
// @access  Private
const voteHelpful = async (req, res) => {
  try {
    const { isHelpful } = req.body;
    
    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'isHelpful must be a boolean value'
      });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can view this feedback
    if (!feedback.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this feedback'
      });
    }
    
    // Only allow voting on reviews and suggestions
    if (!['review', 'suggestion'].includes(feedback.feedbackType)) {
      return res.status(400).json({
        success: false,
        error: 'Can only vote on reviews and suggestions'
      });
    }
    
    await feedback.addHelpfulVote(req.user._id, isHelpful);
    
    res.status(200).json({
      success: true,
      message: 'Vote recorded successfully',
      helpfulCount: feedback.helpfulCount,
      notHelpfulCount: feedback.notHelpfulCount
    });
  } catch (error) {
    console.error('Vote helpful error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Flag feedback
// @route   POST /api/feedback/:id/flag
// @access  Private
const flagFeedback = async (req, res) => {
  try {
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required'
      });
    }
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Check if user can view this feedback
    if (!feedback.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this feedback'
      });
    }
    
    await feedback.flagFeedback(req.user._id, reason);
    
    res.status(200).json({
      success: true,
      message: 'Feedback flagged successfully'
    });
  } catch (error) {
    console.error('Flag feedback error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get feedback statistics for a target
// @route   GET /api/feedback/stats
// @access  Public
const getFeedbackStats = async (req, res) => {
  try {
    const { targetId, targetType } = req.query;
    
    if (!targetId || !targetType) {
      return res.status(400).json({
        success: false,
        error: 'targetId and targetType are required'
      });
    }
    
    // Get feedback statistics
    const stats = await Feedback.aggregate([
      {
        $match: {
          targetId: mongoose.Types.ObjectId(targetId),
          targetType,
          isDeleted: false,
          visibility: 'public'
        }
      },
      {
        $group: {
          _id: '$feedbackType',
          count: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      }
    ]);
    
    // Get total counts
    const totalFeedback = await Feedback.countDocuments({
      targetId,
      targetType,
      isDeleted: false,
      visibility: 'public'
    });
    
    const totalRatings = await Feedback.countDocuments({
      targetId,
      targetType,
      feedbackType: { $in: ['rating', 'review'] },
      isDeleted: false,
      visibility: 'public'
    });
    
    // Calculate overall average rating
    const ratingStats = await Feedback.aggregate([
      {
        $match: {
          targetId: mongoose.Types.ObjectId(targetId),
          targetType,
          feedbackType: { $in: ['rating', 'review'] },
          isDeleted: false,
          visibility: 'public'
        }
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const overallRating = ratingStats.length > 0 ? ratingStats[0].avgRating : 0;
    
    res.status(200).json({
      success: true,
      stats: {
        totalFeedback,
        totalRatings,
        overallRating: Math.round(overallRating * 10) / 10, // Round to 1 decimal
        byType: stats
      }
    });
  } catch (error) {
    console.error('Get feedback stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getFeedback,
  getFeedbackItem,
  createFeedback,
  updateFeedback,
  deleteFeedback,
  toggleLike,
  voteHelpful,
  flagFeedback,
  getFeedbackStats
};

