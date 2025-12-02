# ArtCollab Database Schema Documentation

## Overview

The ArtCollab database is designed using MongoDB with Mongoose ODM to support a collaborative art platform. The schema is optimized for performance, scalability, and data integrity while maintaining flexibility for future enhancements.

## Database Design Principles

### 1. Document-Oriented Design
- **Embedded Documents**: Related data that is frequently accessed together is embedded within the same document
- **References**: Large or frequently changing data uses references to maintain consistency
- **Denormalization**: Strategic denormalization for read performance optimization

### 2. Indexing Strategy
- **Compound Indexes**: Multi-field indexes for complex queries
- **Text Indexes**: Full-text search capabilities for content discovery
- **Sparse Indexes**: Optional fields to save storage space
- **TTL Indexes**: Automatic cleanup of temporary data

### 3. Data Validation
- **Schema Validation**: Mongoose schema validation at the application level
- **Custom Validators**: Business logic validation for complex rules
- **Pre/Post Hooks**: Data transformation and consistency checks

## Collections

### Users Collection

**Purpose**: Stores user account information, authentication data, and profile details.

**Collection Name**: `users`

#### Schema Definition

```javascript
{
  // Authentication Fields
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Profile Information
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ""
  },
  profilePicture: {
    type: String,
    default: ""
  },
  
  // Artist Specializations
  specializations: [{
    type: String,
    enum: [
      'painting', 'music', 'design', 'illustration', 
      'storytelling', 'photography', 'sculpture', 
      'digital_art', 'other'
    ]
  }],
  
  // Social Links
  socialLinks: {
    website: { type: String, default: "" },
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    linkedin: { type: String, default: "" }
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Authentication Tokens
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
  
  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Activity Tracking
  lastLogin: {
    type: Date,
    default: Date.now
  }
}
```

#### Indexes

```javascript
// Unique indexes for authentication
{ email: 1 } // unique: true
{ username: 1 } // unique: true

// Query optimization indexes
{ specializations: 1 }
{ isActive: 1, createdAt: -1 }
{ "socialLinks.website": 1 } // sparse: true
```

#### Virtual Fields

- `fullName`: Computed from firstName + lastName
- `mediaCount`: Count of media items owned by user
- `projectCount`: Count of projects owned or participated in

#### Methods

- `matchPassword(password)`: Compare entered password with hashed password
- `getSignedJwtToken()`: Generate JWT token for authentication
- `getPublicProfile()`: Return user data excluding sensitive fields

### Media Collection

**Purpose**: Manages artwork metadata, file references, and collaboration information.

**Collection Name**: `media`

#### Schema Definition

```javascript
{
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 1000,
    default: ""
  },
  
  // Media Classification
  mediaType: {
    type: String,
    required: true,
    enum: ['image', 'audio', 'video', 'document', 'other']
  },
  category: {
    type: String,
    required: true,
    enum: [
      'painting', 'music', 'design', 'illustration',
      'storytelling', 'photography', 'sculpture',
      'digital_art', 'other'
    ]
  },
  
  // File Information
  fileName: { type: String, required: true },
  originalName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  
  // Storage URLs
  cloudUrl: { type: String, required: true },
  thumbnailUrl: { type: String, default: "" },
  
  // Ownership and Access Control
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
  
  // Metadata and Tags
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Media-Specific Metadata
  metadata: {
    // For images
    dimensions: {
      width: Number,
      height: Number
    },
    // For audio/video
    duration: Number,
    // General metadata
    format: String,
    quality: String
  },
  
  // Engagement Metrics
  views: { type: Number, default: 0 },
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
  
  // Content Status
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  isFeatured: { type: Boolean, default: false }
}
```

#### Indexes

```javascript
// Owner and time-based queries
{ owner: 1, createdAt: -1 }

// Category and type filtering
{ mediaType: 1, category: 1 }

// Tag-based search
{ tags: 1 }

// Visibility and status filtering
{ visibility: 1, status: 1 }

// Featured content
{ isFeatured: 1, createdAt: -1 }

// Text search index
{
  title: "text",
  description: "text",
  tags: "text"
}
```

#### Virtual Fields

- `likeCount`: Number of likes
- `commentCount`: Number of comments (from Feedback collection)

#### Methods

- `canView(userId)`: Check if user can view this media
- `canEdit(userId)`: Check if user can edit this media
- `addLike(userId)`: Add a like from user
- `removeLike(userId)`: Remove a like from user
- `incrementViews()`: Increment view counter

### Projects Collection

**Purpose**: Handles collaborative project management, participant roles, and project lifecycle.

**Collection Name**: `projects`

#### Schema Definition

```javascript
{
  // Basic Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  
  // Project Classification
  category: {
    type: String,
    required: true,
    enum: [
      'painting', 'music', 'design', 'illustration',
      'storytelling', 'photography', 'sculpture',
      'digital_art', 'mixed_media', 'other'
    ]
  },
  projectType: {
    type: String,
    required: true,
    enum: ['solo', 'collaboration', 'commission', 'contest']
  },
  
  // Ownership
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Participants and Roles
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
    joinedAt: { type: Date, default: Date.now },
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
  
  // Project Media and Assets
  media: [{
    mediaItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media'
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: { type: Date, default: Date.now },
    role: {
      type: String,
      enum: ['primary', 'reference', 'draft', 'final'],
      default: 'primary'
    }
  }],
  
  // Project Timeline
  milestones: [{
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
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
  
  // Project Status and Visibility
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
  
  // Project Settings
  settings: {
    allowPublicApplications: { type: Boolean, default: false },
    requireApprovalForJoining: { type: Boolean, default: true },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 1,
      max: 50
    }
  },
  
  // Tags and Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Important Dates
  startDate: { type: Date, default: Date.now },
  endDate: Date,
  deadline: Date,
  
  // Engagement Metrics
  views: { type: Number, default: 0 },
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: { type: Date, default: Date.now }
  }],
  
  // Featured Flag
  isFeatured: { type: Boolean, default: false }
}
```

#### Indexes

```javascript
// Owner and time-based queries
{ owner: 1, createdAt: -1 }

// Participant queries
{ "participants.user": 1 }

// Category and status filtering
{ category: 1, status: 1 }

// Tag-based search
{ tags: 1 }

// Visibility and status
{ visibility: 1, status: 1 }

// Deadline tracking
{ deadline: 1, status: 1 }

// Text search
{
  title: "text",
  description: "text",
  tags: "text"
}
```

#### Virtual Fields

- `participantCount`: Number of active participants
- `likeCount`: Number of likes
- `commentCount`: Number of comments
- `mediaCount`: Number of linked media items

#### Methods

- `canView(userId)`: Check if user can view this project
- `canEdit(userId)`: Check if user can edit this project
- `getUserRole(userId)`: Get user's role in the project
- `addParticipant(userId, role, invitedBy)`: Add a new participant
- `removeParticipant(userId)`: Remove a participant
- `addLike(userId)`: Add a like
- `removeLike(userId)`: Remove a like

### Feedback Collection

**Purpose**: Manages comments, ratings, reviews, and user interactions across the platform.

**Collection Name**: `feedback`

#### Schema Definition

```javascript
{
  // Target Reference (Polymorphic)
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  targetType: {
    type: String,
    required: true,
    enum: ['Media', 'Project', 'User']
  },
  
  // Feedback Type
  feedbackType: {
    type: String,
    required: true,
    enum: ['comment', 'rating', 'review', 'suggestion']
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  content: {
    type: String,
    required: function() {
      return ['comment', 'review', 'suggestion'].includes(this.feedbackType);
    },
    maxlength: 1000,
    trim: true
  },
  
  // Rating (for rating and review types)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return ['rating', 'review'].includes(this.feedbackType);
    }
  },
  
  // Threading Support
  parentFeedback: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Feedback'
  }],
  
  // Engagement
  likes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: { type: Date, default: Date.now }
  }],
  
  // Moderation Fields
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Flagging System
  isFlagged: { type: Boolean, default: false },
  flaggedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'copyright', 'other']
    },
    flaggedAt: { type: Date, default: Date.now }
  }],
  
  // Visibility Control
  visibility: {
    type: String,
    enum: ['public', 'private', 'hidden'],
    default: 'public'
  },
  
  // Helpful Voting (for reviews and suggestions)
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isHelpful: { type: Boolean, required: true },
    votedAt: { type: Date, default: Date.now }
  }]
}
```

#### Indexes

```javascript
// Target-based queries
{ targetId: 1, targetType: 1 }

// Author and time-based queries
{ author: 1, createdAt: -1 }

// Threading support
{ parentFeedback: 1 }

// Feedback type filtering
{ feedbackType: 1 }

// Moderation queries
{ visibility: 1, isDeleted: 1 }

// Flagged content
{ isFlagged: 1, createdAt: -1 }

// Compound index for efficient queries
{ targetId: 1, targetType: 1, feedbackType: 1, visibility: 1 }
```

#### Virtual Fields

- `likeCount`: Number of likes
- `replyCount`: Number of replies
- `helpfulCount`: Number of helpful votes
- `notHelpfulCount`: Number of not helpful votes

#### Methods

- `canView(userId)`: Check if user can view this feedback
- `canEdit(userId)`: Check if user can edit this feedback
- `canDelete(userId)`: Check if user can delete this feedback
- `addLike(userId)`: Add a like
- `removeLike(userId)`: Remove a like
- `addReply(replyId)`: Add a reply reference
- `addHelpfulVote(userId, isHelpful)`: Add helpful vote
- `flagFeedback(userId, reason)`: Flag feedback for moderation
- `softDelete(deletedBy)`: Soft delete the feedback

## Relationships and Data Flow

### User-Centric Relationships

```
User (1) ──→ (N) Media [owner]
User (1) ──→ (N) Projects [owner]
User (N) ←──→ (N) Projects [participants]
User (1) ──→ (N) Feedback [author]
User (N) ←──→ (N) Media [collaborators]
```

### Content Relationships

```
Media (N) ←──→ (N) Projects [linked media]
Media (1) ──→ (N) Feedback [target]
Projects (1) ──→ (N) Feedback [target]
Users (1) ──→ (N) Feedback [target]
```

### Hierarchical Relationships

```
Feedback (1) ──→ (N) Feedback [replies/threading]
Projects (1) ──→ (N) Milestones [embedded]
Users (1) ──→ (N) RefreshTokens [embedded]
```

## Query Patterns and Performance

### Common Query Patterns

1. **User Dashboard Queries**
   ```javascript
   // Get user's media with pagination
   Media.find({ owner: userId, status: 'published' })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('owner', 'firstName lastName username');
   
   // Get user's active projects
   Project.find({
     $or: [
       { owner: userId },
       { 'participants.user': userId, 'participants.status': 'active' }
     ]
   }).populate('owner participants.user');
   ```

2. **Content Discovery Queries**
   ```javascript
   // Search media by category and tags
   Media.find({
     category: 'digital_art',
     tags: { $in: ['landscape', 'nature'] },
     visibility: 'public',
     status: 'published'
   }).sort({ createdAt: -1 });
   
   // Featured content
   Media.find({ isFeatured: true, visibility: 'public' })
        .sort({ views: -1, likes: -1 });
   ```

3. **Collaboration Queries**
   ```javascript
   // Get project participants with roles
   Project.findById(projectId)
          .populate('participants.user', 'firstName lastName username profilePicture')
          .populate('media.mediaItem', 'title cloudUrl thumbnailUrl');
   
   // Check user permissions
   Project.findOne({
     _id: projectId,
     'participants.user': userId,
     'participants.status': 'active'
   });
   ```

4. **Feedback and Engagement Queries**
   ```javascript
   // Get comments for media with threading
   Feedback.find({
     targetId: mediaId,
     targetType: 'Media',
     parentFeedback: null,
     isDeleted: false
   }).populate('author replies.author');
   
   // Get rating statistics
   Feedback.aggregate([
     { $match: { targetId: mediaId, feedbackType: { $in: ['rating', 'review'] } } },
     { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
   ]);
   ```

### Performance Optimizations

1. **Index Usage**
   - Compound indexes for multi-field queries
   - Sparse indexes for optional fields
   - Text indexes for search functionality

2. **Aggregation Pipelines**
   - Pre-computed statistics using aggregation
   - Efficient data transformation and grouping
   - Memory-optimized pipeline stages

3. **Population Strategy**
   - Selective field population to reduce data transfer
   - Nested population for complex relationships
   - Virtual population for computed fields

4. **Caching Strategy**
   - Application-level caching for frequently accessed data
   - Database query result caching
   - CDN caching for media URLs

## Data Integrity and Validation

### Schema-Level Validation

1. **Required Fields**: Critical fields marked as required
2. **Data Types**: Strict type checking for all fields
3. **String Validation**: Length limits, format validation, trimming
4. **Enum Validation**: Restricted values for categorical fields
5. **Custom Validators**: Business logic validation

### Application-Level Validation

1. **Input Sanitization**: XSS prevention and data cleaning
2. **Business Rules**: Complex validation logic in middleware
3. **Referential Integrity**: Ensuring referenced documents exist
4. **Permission Checks**: Authorization validation before operations

### Data Consistency

1. **Transactions**: Multi-document operations wrapped in transactions
2. **Atomic Updates**: Using atomic operators for concurrent updates
3. **Cascade Operations**: Proper cleanup when documents are deleted
4. **Audit Trail**: Tracking changes for important operations

## Security Considerations

### Authentication and Authorization

1. **Password Security**: bcrypt hashing with configurable rounds
2. **JWT Tokens**: Secure token generation and validation
3. **Session Management**: Refresh token rotation and cleanup
4. **Permission System**: Role-based access control

### Data Protection

1. **Sensitive Data**: Exclusion from API responses and logs
2. **Input Validation**: Prevention of injection attacks
3. **Rate Limiting**: Protection against abuse and DoS attacks
4. **CORS Configuration**: Controlled cross-origin access

### Privacy Controls

1. **Visibility Settings**: Granular privacy controls for content
2. **Data Anonymization**: Safe deletion and data masking
3. **Consent Management**: User control over data sharing
4. **Audit Logging**: Tracking access to sensitive information

## Backup and Recovery

### Backup Strategy

1. **Regular Backups**: Automated daily backups with retention policy
2. **Point-in-Time Recovery**: Ability to restore to specific timestamps
3. **Cross-Region Replication**: Geographic distribution for disaster recovery
4. **Backup Validation**: Regular testing of backup integrity

### Data Migration

1. **Schema Versioning**: Tracking schema changes over time
2. **Migration Scripts**: Automated data transformation scripts
3. **Rollback Procedures**: Safe rollback mechanisms for failed migrations
4. **Testing Strategy**: Comprehensive testing before production deployment

This comprehensive database schema documentation provides the foundation for understanding, maintaining, and extending the ArtCollab platform's data layer. The design balances performance, scalability, and data integrity while supporting the complex relationships inherent in a collaborative creative platform.

