const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a string using SHA256
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hashString = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Generate a JWT token with custom payload
 * @param {object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {string} expiresIn - Token expiration
 * @returns {string} - JWT token
 */
const generateJWT = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRE) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @returns {object} - Decoded payload
 */
const verifyJWT = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input
 * @returns {string} - Sanitized input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > characters
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} - Validation result
 */
const validatePassword = (password) => {
  const result = {
    isValid: true,
    errors: []
  };
  
  if (password.length < 6) {
    result.isValid = false;
    result.errors.push('Password must be at least 6 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    result.isValid = false;
    result.errors.push('Password must contain at least one number');
  }
  
  return result;
};

/**
 * Generate a secure filename
 * @param {string} originalName - Original filename
 * @returns {string} - Secure filename
 */
const generateSecureFilename = (originalName) => {
  const timestamp = Date.now();
  const randomString = generateSecureToken(8);
  const extension = originalName.split('.').pop();
  
  return `${timestamp}_${randomString}.${extension}`;
};

/**
 * Rate limiting key generator
 * @param {object} req - Express request object
 * @returns {string} - Rate limiting key
 */
const generateRateLimitKey = (req) => {
  // Use IP address and user ID (if authenticated) for rate limiting
  const ip = req.ip || req.connection.remoteAddress;
  const userId = req.user ? req.user._id : 'anonymous';
  return `${ip}_${userId}`;
};

/**
 * Check if request is from allowed origin
 * @param {string} origin - Request origin
 * @param {array} allowedOrigins - Array of allowed origins
 * @returns {boolean} - Is allowed origin
 */
const isAllowedOrigin = (origin, allowedOrigins = []) => {
  if (!origin) return true; // Allow requests with no origin (mobile apps, etc.)
  
  if (process.env.NODE_ENV === 'development') {
    return true; // Allow all origins in development
  }
  
  return allowedOrigins.includes(origin);
};

/**
 * Mask sensitive data in logs
 * @param {object} data - Data to mask
 * @returns {object} - Masked data
 */
const maskSensitiveData = (data) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key'];
  const masked = { ...data };
  
  sensitiveFields.forEach(field => {
    if (masked[field]) {
      masked[field] = '***MASKED***';
    }
  });
  
  return masked;
};

/**
 * Generate CSRF token
 * @returns {string} - CSRF token
 */
const generateCSRFToken = () => {
  return generateSecureToken(32);
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} sessionToken - Session token
 * @returns {boolean} - Is valid token
 */
const validateCSRFToken = (token, sessionToken) => {
  return token === sessionToken;
};

module.exports = {
  generateSecureToken,
  hashString,
  generateJWT,
  verifyJWT,
  sanitizeInput,
  isValidEmail,
  validatePassword,
  generateSecureFilename,
  generateRateLimitKey,
  isAllowedOrigin,
  maskSensitiveData,
  generateCSRFToken,
  validateCSRFToken
};

