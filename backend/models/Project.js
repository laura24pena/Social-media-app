const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  // Basic information
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Project category and type
  category: {
    type: String,
    required: [true, 'Project category is required'],
    enum: ['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'mixed_media', 'other']
  },
  projectType: {
    type: String,
    required: [true, 'Project type is required'],
    enum: ['solo', 'collaboration', 'commission', 'contest']
  },
  
  // Ownership and leadership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  
  // Participants and roles
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['owner', 'co-lead', 'contributor', 'reviewer', 'viewer'],
      default: 'contributor'
    },
    permissions: {
      canEdit: { type: Boolean, default: false },
      canInvite: { type: Boolean, default: false },
      canManageMedia: { type: Boolean, default: false },
      canDelete: { type: Boolean, default: false }
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'invited', 'left', 'removed'],
      default: 'active'
    }
  }],
  
  // Project media and assets
  media: [{
    mediaItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    },
    role: {
      type: String,
      enum: ['primary', 'reference', 'draft', 'final'],
      default: 'primary'
    }
  }],
  
  // Project timeline and milestones
  milestones: [{
    title: {
      type: String,
      required: true,
      maxlength: [100, 'Milestone title cannot exceed 100 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Milestone description cannot exceed 500 characters']
    },
    dueDate: Date,
    completedAt: Date,
    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'overdue'],
      default: 'pending'
    }
  }],
  
  // Project status and visibility
  status: {
    type: String,
    enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
    default: 'planning'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'participants_only'],
    default: 'participants_only'
  },
  
  // Project settings
  settings: {
    allowPublicApplications: {
      type: Boolean,
      default: false
    },
    requireApprovalForJoining: {
      type: Boolean,
      default: true
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    }
  },
  
  // Tags and search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  deadline: Date,
  
  // Engagement
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Featured flag
  isFeatured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for participant count
projectSchema.virtual('participantCount').get(function() {
  return this.participants ? this.participants.filter(p => p.status === 'active').length : 0;
});

// Virtual for like count
projectSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
projectSchema.virtual('commentCount', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'targetId',
  count: true,
  match: { targetType: 'Project', feedbackType: 'comment' }
});

// Virtual for media count
projectSchema.virtual('mediaCount').get(function() {
  return this.media ? this.media.length : 0;
});

// Indexes for better performance
projectSchema.index({ owner: 1, createdAt: -1 });
projectSchema.index({ 'participants.user': 1 });
projectSchema.index({ category: 1, status: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ visibility: 1, status: 1 });

// Method to check if user can view this project
projectSchema.methods.canView = function(userId) {
  if (this.visibility === 'public') return true;
  if (this.visibility === 'private') return this.owner.toString() === userId.toString();
  if (this.visibility === 'participants_only') {
    if (this.owner.toString() === userId.toString()) return true;
    return this.participants.some(p => 
      p.user.toString() === userId.toString() && p.status === 'active'
    );
  }
  return false;
};

// Method to check if user can edit this project
projectSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.status === 'active'
  );
  return participant && participant.permissions.canEdit;
};

// Method to get user's role in project
projectSchema.methods.getUserRole = function(userId) {
  if (this.owner.toString() === userId.toString()) return 'owner';
  const participant = this.participants.find(p => 
    p.user.toString() === userId.toString() && p.status === 'active'
  );
  return participant ? participant.role : null;
};

// Method to add participant
projectSchema.methods.addParticipant = function(userId, role = 'contributor', invitedBy = null) {
  const existingParticipant = this.participants.find(p => p.user.toString() === userId.toString());
  
  if (existingParticipant) {
    if (existingParticipant.status === 'left' || existingParticipant.status === 'removed') {
      existingParticipant.status = 'invited';
      existingParticipant.joinedAt = new Date();
      existingParticipant.invitedBy = invitedBy;
    }
    return this.save();
  }
  
  // Set permissions based on role
  let permissions = {
    canEdit: false,
    canInvite: false,
    canManageMedia: false,
    canDelete: false
  };
  
  if (role === 'co-lead') {
    permissions = {
      canEdit: true,
      canInvite: true,
      canManageMedia: true,
      canDelete: false
    };
  } else if (role === 'contributor') {
    permissions.canManageMedia = true;
  }
  
  this.participants.push({
    user: userId,
    role,
    permissions,
    invitedBy,
    status: 'invited'
  });
  
  return this.save();
};

// Method to remove participant
projectSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(p => p.user.toString() === userId.toString());
  if (participant) {
    participant.status = 'removed';
  }
  return this.save();
};

// Method to add like
projectSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
  return this.save();
};

// Method to remove like
projectSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Project', projectSchema);

