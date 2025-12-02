const Project = require('../models/Project');
const User = require('../models/User');
const Media = require('../models/Media');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    
    // Build query - only show public projects by default
    let query = { visibility: 'public' };
    
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
    
    // Filter by project type
    if (req.query.projectType) {
      query.projectType = req.query.projectType;
    }
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
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
      sortBy[sortField] = sortOrder;
    } else {
      sortBy.createdAt = -1; // Default sort by newest
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
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public/Private (depends on visibility)
const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName username profilePicture bio')
      .populate('participants.user', 'firstName lastName username profilePicture')
      .populate('participants.invitedBy', 'firstName lastName username')
      .populate('media.mediaItem', 'title cloudUrl thumbnailUrl mediaType category')
      .populate('media.addedBy', 'firstName lastName username')
      .populate('likes.user', 'firstName lastName username');
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user can view this project
    const userId = req.user ? req.user._id : null;
    if (!project.canView(userId)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this project'
      });
    }
    
    // Increment view count (only if not a participant)
    if (!userId || !project.participants.some(p => 
      p.user._id.toString() === userId.toString() && p.status === 'active'
    )) {
      project.views += 1;
      await project.save();
    }
    
    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      projectType,
      visibility,
      tags,
      deadline,
      settings
    } = req.body;
    
    const project = await Project.create({
      title,
      description,
      category,
      projectType,
      owner: req.user._id,
      visibility: visibility || 'participants_only',
      tags: tags || [],
      deadline,
      settings: settings || {}
    });
    
    // Add owner as first participant with full permissions
    project.participants.push({
      user: req.user._id,
      role: 'owner',
      permissions: {
        canEdit: true,
        canInvite: true,
        canManageMedia: true,
        canDelete: true
      },
      status: 'active'
    });
    
    await project.save();
    await project.populate('owner', 'firstName lastName username profilePicture');
    
    res.status(201).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (owner or participant with edit permission)
const updateProject = async (req, res) => {
  try {
    let project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user can edit this project
    if (!project.canEdit(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to edit this project'
      });
    }
    
    const allowedFields = [
      'title',
      'description',
      'category',
      'visibility',
      'tags',
      'deadline',
      'status',
      'settings'
    ];
    
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    ).populate('owner', 'firstName lastName username profilePicture')
     .populate('participants.user', 'firstName lastName username profilePicture');
    
    res.status(200).json({
      success: true,
      project
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (owner only)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Only owner can delete project
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this project'
      });
    }
    
    await Project.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Like/Unlike project
// @route   POST /api/projects/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user can view this project
    if (!project.canView(req.user._id)) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this project'
      });
    }
    
    const existingLike = project.likes.find(
      like => like.user.toString() === req.user._id.toString()
    );
    
    let action;
    if (existingLike) {
      await project.removeLike(req.user._id);
      action = 'unliked';
    } else {
      await project.addLike(req.user._id);
      action = 'liked';
    }
    
    // Get updated project with like count
    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'firstName lastName username');
    
    res.status(200).json({
      success: true,
      action,
      likeCount: updatedProject.likeCount,
      project: updatedProject
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Invite user to project
// @route   POST /api/projects/:id/invite
// @access  Private (owner or participant with invite permission)
const inviteUser = async (req, res) => {
  try {
    const { userId, role } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user can invite to this project
    const userRole = project.getUserRole(req.user._id);
    const participant = project.participants.find(p => 
      p.user.toString() === req.user._id.toString() && p.status === 'active'
    );
    
    if (!userRole || (userRole !== 'owner' && (!participant || !participant.permissions.canInvite))) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to invite users to this project'
      });
    }
    
    // Check if user exists
    const invitedUser = await User.findById(userId);
    if (!invitedUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Add participant
    await project.addParticipant(userId, role || 'contributor', req.user._id);
    
    await project.populate('participants.user', 'firstName lastName username profilePicture');
    
    res.status(200).json({
      success: true,
      message: 'User invited successfully',
      project
    });
  } catch (error) {
    console.error('Invite user error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Join project (accept invitation)
// @route   POST /api/projects/:id/join
// @access  Private
const joinProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    const participant = project.participants.find(p => 
      p.user.toString() === req.user._id.toString()
    );
    
    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'No invitation found for this project'
      });
    }
    
    if (participant.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Already a member of this project'
      });
    }
    
    if (participant.status !== 'invited') {
      return res.status(400).json({
        success: false,
        error: 'Invalid invitation status'
      });
    }
    
    participant.status = 'active';
    participant.joinedAt = new Date();
    
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully joined project',
      project
    });
  } catch (error) {
    console.error('Join project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Leave project
// @route   POST /api/projects/:id/leave
// @access  Private
const leaveProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Owner cannot leave their own project
    if (project.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Project owner cannot leave the project'
      });
    }
    
    const participant = project.participants.find(p => 
      p.user.toString() === req.user._id.toString() && p.status === 'active'
    );
    
    if (!participant) {
      return res.status(400).json({
        success: false,
        error: 'Not a member of this project'
      });
    }
    
    participant.status = 'left';
    
    await project.save();
    
    res.status(200).json({
      success: true,
      message: 'Successfully left project'
    });
  } catch (error) {
    console.error('Leave project error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// @desc    Add media to project
// @route   POST /api/projects/:id/media
// @access  Private (participants with media management permission)
const addMedia = async (req, res) => {
  try {
    const { mediaId, role } = req.body;
    
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }
    
    // Check if user can manage media in this project
    const userRole = project.getUserRole(req.user._id);
    const participant = project.participants.find(p => 
      p.user.toString() === req.user._id.toString() && p.status === 'active'
    );
    
    if (!userRole || (userRole !== 'owner' && (!participant || !participant.permissions.canManageMedia))) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to manage media in this project'
      });
    }
    
    // Check if media exists and user can access it
    const media = await Media.findById(mediaId);
    if (!media || !media.canView(req.user._id)) {
      return res.status(404).json({
        success: false,
        error: 'Media not found or not accessible'
      });
    }
    
    // Check if media is already in project
    const existingMedia = project.media.find(m => m.mediaItem.toString() === mediaId);
    if (existingMedia) {
      return res.status(400).json({
        success: false,
        error: 'Media already added to project'
      });
    }
    
    project.media.push({
      mediaItem: mediaId,
      addedBy: req.user._id,
      role: role || 'primary'
    });
    
    await project.save();
    await project.populate('media.mediaItem', 'title cloudUrl thumbnailUrl mediaType category');
    
    res.status(200).json({
      success: true,
      message: 'Media added to project successfully',
      project
    });
  } catch (error) {
    console.error('Add media error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

module.exports = {
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
};

