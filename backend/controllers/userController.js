const User = require('../models/User');
const Media = require('../models/Media');
const Project = require('../models/Project');

// @desc    Get all users (public profiles)
// @route   GET /api/users
// @access  Public
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const startIndex = (page - 1) * limit;
    
    // Build query
    let query = { isActive: true };
    
    // Search by name or username
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { username: searchRegex }
      ];
    }
    
    // Filter by specialization
    if (req.query.specialization) {
      query.specializations = req.query.specialization;
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
    
    const users = await User.find(query)
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .populate('mediaCount')
      .populate('projectCount')
      .sort(sortBy)
      .limit(limit * 1)
      .skip(startIndex);
    
    const total = await User.countDocuments(query);
    
    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalUsers: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
    
    res.status(200).json({
      success: true,
      count: users.length,
      pagination,
      users: users.map(user => user.getPublicProfile())
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Public
const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshTokens -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .populate('mediaCount')
      .populate('projectCount');
    
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user's media
// @route   GET /api/users/:id/media
// @access  Public
const getUserMedia = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Build query - only show public media or user's own media
    let query = { 
      owner: req.params.id,
      status: 'published'
    };
    
    // If not the owner, only show public media
    if (!req.user || req.user._id.toString() !== req.params.id) {
      query.visibility = 'public';
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by media type
    if (req.query.mediaType) {
      query.mediaType = req.query.mediaType;
    }
    
    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1;
    }
    
    const media = await Media.find(query)
      .populate('owner', 'firstName lastName username profilePicture')
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
    console.error('Get user media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user's projects
// @route   GET /api/users/:id/projects
// @access  Public
const getUserProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Build query - projects owned by user or where user is participant
    let query = {
      $or: [
        { owner: req.params.id },
        { 'participants.user': req.params.id, 'participants.status': 'active' }
      ]
    };
    
    // If not the user or participant, only show public projects
    if (!req.user || req.user._id.toString() !== req.params.id) {
      query.visibility = 'public';
    }
    
    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Sort options
    let sortBy = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.slice(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1;
    }
    
    const projects = await Project.find(query)
      .populate('owner', 'firstName lastName username profilePicture')
      .populate('participants.user', 'firstName lastName username profilePicture')
      .sort(sortBy)
      .limit(limit * 1)
      .skip(startIndex);
    
    const total = await Project.countDocuments(query);
    
    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalProjects: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };
    
    res.status(200).json({
      success: true,
      count: projects.length,
      pagination,
      projects
    });
  } catch (error) {
    console.error('Get user projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Follow/Unfollow user
// @route   POST /api/users/:id/follow
// @access  Private
const toggleFollow = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user._id;
    
    if (targetUserId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot follow yourself'
      });
    }
    
    const targetUser = await User.findById(targetUserId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // For now, we'll just return success
    // In a full implementation, you'd add followers/following fields to the User model
    res.status(200).json({
      success: true,
      message: 'Follow status updated'
    });
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/:id/stats
// @access  Public
const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user || !user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Get media stats
    const mediaStats = await Media.aggregate([
      { $match: { owner: user._id, status: 'published', visibility: 'public' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalViews: { $sum: '$views' },
          totalLikes: { $sum: { $size: '$likes' } }
        }
      }
    ]);
    
    // Get project stats
    const projectStats = await Project.aggregate([
      { 
        $match: { 
          $or: [
            { owner: user._id },
            { 'participants.user': user._id, 'participants.status': 'active' }
          ]
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get total counts
    const totalMedia = await Media.countDocuments({ 
      owner: userId, 
      status: 'published',
      visibility: 'public'
    });
    
    const totalProjects = await Project.countDocuments({
      $or: [
        { owner: userId },
        { 'participants.user': userId, 'participants.status': 'active' }
      ]
    });
    
    res.status(200).json({
      success: true,
      stats: {
        totalMedia,
        totalProjects,
        mediaByCategory: mediaStats,
        projectsByStatus: projectStats,
        memberSince: user.createdAt,
        lastActive: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
  getUsers,
  getUser,
  getUserMedia,
  getUserProjects,
  toggleFollow,
  getUserStats
};

