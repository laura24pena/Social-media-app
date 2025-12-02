const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  // Basic information
  title: {
    type: String,
    required: [true, 'Media title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  
  // Media type and format
  mediaType: {
    type: String,
    required: [true, 'Media type is required'],
    enum: ['image', 'audio', 'video', 'document', 'other']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'other']
  },
  
  // File information
  fileName: {
    type: String,
    required: [true, 'File name is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  
  // Storage information
  cloudUrl: {
    type: String,
    required: [true, 'Cloud storage URL is required']
  },
  thumbnailUrl: {
    type: String,
    default: ''
  },
  
  // Ownership and permissions
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Owner is required']
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'collaborators'],
    default: 'public'
  },
  
  // Collaboration
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'co-owner'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Tags and metadata
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Media-specific metadata
  metadata: {
    // For images
    dimensions: {
      width: Number,
      height: Number
    },
    // For audio
    duration: Number,
    // For any media
    format: String,
    quality: String
  },
  
  // Engagement metrics
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
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  
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

// Virtual for like count
mediaSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Virtual for comment count
mediaSchema.virtual('commentCount', {
  ref: 'Feedback',
  localField: '_id',
  foreignField: 'targetId',
  count: true,
  match: { targetType: 'Media', feedbackType: 'comment' }
});

// Index for better performance
mediaSchema.index({ owner: 1, createdAt: -1 });
mediaSchema.index({ mediaType: 1, category: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ visibility: 1, status: 1 });

// Method to check if user can view this media
mediaSchema.methods.canView = function(userId) {
  if (this.visibility === 'public') return true;
  if (this.visibility === 'private') return this.owner.toString() === userId.toString();
  if (this.visibility === 'collaborators') {
    if (this.owner.toString() === userId.toString()) return true;
    return this.collaborators.some(collab => collab.user.toString() === userId.toString());
  }
  return false;
};

// Method to check if user can edit this media
mediaSchema.methods.canEdit = function(userId) {
  if (this.owner.toString() === userId.toString()) return true;
  return this.collaborators.some(collab => 
    collab.user.toString() === userId.toString() && 
    ['editor', 'co-owner'].includes(collab.role)
  );
};

// Method to add a like
mediaSchema.methods.addLike = function(userId) {
  const existingLike = this.likes.find(like => like.user.toString() === userId.toString());
  if (!existingLike) {
    this.likes.push({ user: userId });
  }
  return this.save();
};

// Method to remove a like
mediaSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to increment view count
mediaSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

module.exports = mongoose.model('Media', mediaSchema);

