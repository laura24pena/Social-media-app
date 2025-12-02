<<<<<<< HEAD
// backend/models/User.js
=======
>>>>>>> main
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Authentication fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
<<<<<<< HEAD

  // Profile information
  firstName: {
    type: String,
    // 🔽 Ya no required
=======
  
  // Profile information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
>>>>>>> main
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
<<<<<<< HEAD
    // 🔽 Ya no required
=======
    required: [true, 'Last name is required'],
>>>>>>> main
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: ''
  },
<<<<<<< HEAD

=======
  
>>>>>>> main
  // Artist specializations
  specializations: [{
    type: String,
    enum: ['painting', 'music', 'design', 'illustration', 'storytelling', 'photography', 'sculpture', 'digital_art', 'other']
  }],
<<<<<<< HEAD

=======
  
>>>>>>> main
  // Social links
  socialLinks: {
    website: { type: String, default: '' },
    instagram: { type: String, default: '' },
    twitter: { type: String, default: '' },
    linkedin: { type: String, default: '' }
  },
<<<<<<< HEAD

=======
  
>>>>>>> main
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
<<<<<<< HEAD

=======
  
>>>>>>> main
  // Authentication tokens
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }],
<<<<<<< HEAD

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Account verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,

=======
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Account verification
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
>>>>>>> main
  // Timestamps
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
<<<<<<< HEAD
  return `${this.firstName || ''} ${this.lastName || ''}`.trim();
=======
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for user's media count
userSchema.virtual('mediaCount', {
  ref: 'Media',
  localField: '_id',
  foreignField: 'owner',
  count: true
});

// Virtual for user's project count
userSchema.virtual('projectCount', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'owner',
  count: true
>>>>>>> main
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
<<<<<<< HEAD
  if (!this.isModified('password')) return next();

  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const salt = await bcrypt.genSalt(rounds);
=======
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
>>>>>>> main
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate JWT token
userSchema.methods.getSignedJwtToken = function() {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
<<<<<<< HEAD
    {
=======
    { 
>>>>>>> main
      id: this._id,
      email: this.email,
      username: this.username
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

<<<<<<< HEAD
// Method to get public profile
=======
// Method to get public profile (exclude sensitive data)
>>>>>>> main
userSchema.methods.getPublicProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshTokens;
  delete userObject.resetPasswordToken;
  delete userObject.resetPasswordExpire;
  delete userObject.emailVerificationToken;
  delete userObject.emailVerificationExpire;
  return userObject;
};

module.exports = mongoose.model('User', userSchema);
<<<<<<< HEAD
=======

>>>>>>> main
