# ArtCollab Backend API

A comprehensive Node.js backend API for the ArtCollab platform - an online community where artists can showcase their work, collaborate on projects, and share feedback in a supportive environment.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Security Features](#security-features)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

ArtCollab Backend provides a robust REST API that powers an online platform for artists to:

- **Showcase Artwork**: Upload and display paintings, music, designs, illustrations, and storytelling content
- **Collaborate**: Work together on creative projects with role-based permissions
- **Community Engagement**: Share feedback, comments, ratings, and interact with other artists
- **User Management**: Secure authentication, profile management, and social features

The backend is built with modern Node.js technologies, featuring comprehensive security measures, input validation, and scalable database design optimized for creative collaboration workflows.

## Features

### Core Functionality

- **User Authentication & Authorization**
  - JWT-based authentication with refresh tokens
  - Secure password hashing with bcrypt
  - Role-based access control
  - Password reset and email verification flows

- **Media Management**
  - Support for multiple media types (images, audio, video, documents)
  - Cloud storage integration ready
  - Metadata management and tagging
  - Collaborative media sharing with permissions

- **Project Collaboration**
  - Create and manage collaborative projects
  - Invite participants with specific roles and permissions
  - Project milestones and timeline management
  - Media attachment and organization

- **Feedback System**
  - Comments, ratings, and reviews
  - Threaded discussions with reply support
  - Helpful voting and content moderation
  - Spam and abuse reporting

### Technical Features

- **Security**
  - Input validation and sanitization
  - Rate limiting and DDoS protection
  - CORS configuration
  - SQL injection prevention
  - XSS protection

- **Performance**
  - Database indexing for optimal queries
  - Pagination for large datasets
  - Efficient aggregation pipelines
  - Connection pooling

- **Scalability**
  - Modular architecture
  - Separation of concerns
  - Environment-based configuration
  - Graceful error handling

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Database**: MongoDB 6.x with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, CORS, bcryptjs, express-rate-limit
- **Validation**: express-validator
- **Development**: Nodemon for hot reloading

## Installation

### Prerequisites

- Node.js 18.0 or higher
- MongoDB 6.0 or higher (local installation or MongoDB Atlas)
- npm or yarn package manager

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd artcollab-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # For local MongoDB installation
   mongod
   
   # Or use MongoDB Atlas connection string in .env
   ```

5. **Run the application**
   ```bash
   # Development mode with hot reloading
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` by default.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/artcollab
DB_NAME=artcollab

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Security Configuration

- **JWT_SECRET**: Use a strong, randomly generated secret key (minimum 32 characters)
- **BCRYPT_ROUNDS**: Higher values increase security but impact performance (12 is recommended)
- **Rate Limiting**: Adjust based on expected traffic patterns

## Database Schema

### Collections Overview

The database consists of four main collections designed for optimal performance and data integrity:

#### Users Collection

Stores user account information, authentication data, and profile details.

**Key Fields:**
- `email`: Unique email address for authentication
- `username`: Unique username for public identification
- `password`: Bcrypt-hashed password
- `firstName`, `lastName`: User's full name
- `bio`: Optional profile description
- `specializations`: Array of artistic specializations
- `socialLinks`: Social media profile links
- `profilePicture`: URL to profile image
- `isActive`, `isVerified`: Account status flags

**Indexes:**
- `email` (unique)
- `username` (unique)

#### Media Collection

Manages artwork metadata and file references.

**Key Fields:**
- `title`, `description`: Media information
- `mediaType`: Type (image, audio, video, document, other)
- `category`: Artistic category (painting, music, design, etc.)
- `fileName`, `originalName`: File identification
- `cloudUrl`, `thumbnailUrl`: Storage URLs
- `owner`: Reference to User who uploaded
- `visibility`: Access control (public, private, collaborators)
- `collaborators`: Array of users with access permissions
- `tags`: Searchable keywords
- `likes`: Array of user likes with timestamps
- `views`: View counter

**Indexes:**
- `owner` + `createdAt`
- `mediaType` + `category`
- `tags`
- `visibility` + `status`

#### Projects Collection

Handles collaborative project management.

**Key Fields:**
- `title`, `description`: Project information
- `category`: Project type (painting, music, mixed_media, etc.)
- `projectType`: Collaboration type (solo, collaboration, commission, contest)
- `owner`: Project creator
- `participants`: Array of collaborators with roles and permissions
- `media`: Linked media items with roles (primary, reference, draft, final)
- `milestones`: Project timeline and deliverables
- `status`: Current state (planning, active, completed, etc.)
- `visibility`: Access control
- `settings`: Project configuration options

**Indexes:**
- `owner` + `createdAt`
- `participants.user`
- `category` + `status`
- `tags`

#### Feedback Collection

Manages comments, ratings, and user interactions.

**Key Fields:**
- `targetId`, `targetType`: Reference to Media, Project, or User
- `feedbackType`: Type (comment, rating, review, suggestion)
- `content`: Text content for comments/reviews
- `rating`: Numeric rating (1-5) for ratings/reviews
- `author`: User who created the feedback
- `parentFeedback`: For threaded replies
- `likes`: User likes on feedback
- `helpfulVotes`: Helpful/not helpful votes
- `isFlagged`: Moderation flag

**Indexes:**
- `targetId` + `targetType`
- `author` + `createdAt`
- `parentFeedback`
- `feedbackType`

### Relationships

The schema uses MongoDB references to maintain data consistency:

- **Users** → **Media**: One-to-many (owner relationship)
- **Users** → **Projects**: One-to-many (owner) and many-to-many (participants)
- **Projects** → **Media**: Many-to-many (linked media)
- **Feedback** → **Users/Media/Projects**: Many-to-one (polymorphic references)

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "artist@example.com",
  "username": "artistname",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "bio": "Digital artist and designer",
  "specializations": ["digital_art", "design"]
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "email": "artist@example.com",
    "username": "artistname",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### POST /auth/login
Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "artist@example.com",
  "password": "SecurePass123"
}
```

#### GET /auth/me
Get current authenticated user profile.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### User Endpoints

#### GET /users
Get paginated list of public user profiles.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `search`: Search by name or username
- `specialization`: Filter by artistic specialization
- `sort`: Sort field (createdAt, firstName, lastName)

#### GET /users/:id
Get specific user profile by ID.

#### GET /users/:id/media
Get user's public media with pagination and filtering.

#### GET /users/:id/projects
Get user's public projects with pagination and filtering.

### Media Endpoints

#### GET /media
Get paginated list of public media.

**Query Parameters:**
- `page`, `limit`: Pagination
- `q`: Search query
- `category`: Filter by category
- `mediaType`: Filter by media type
- `tags`: Filter by tags (comma-separated)
- `featured`: Show only featured content
- `sort`: Sort by createdAt, likes, views, title

#### POST /media
Create new media item (requires authentication).

**Request Body:**
```json
{
  "title": "Sunset Landscape",
  "description": "Digital painting of mountain sunset",
  "mediaType": "image",
  "category": "digital_art",
  "fileName": "sunset_landscape.jpg",
  "originalName": "My Sunset Painting.jpg",
  "fileSize": 2048576,
  "mimeType": "image/jpeg",
  "cloudUrl": "https://storage.example.com/images/sunset_landscape.jpg",
  "thumbnailUrl": "https://storage.example.com/thumbs/sunset_landscape_thumb.jpg",
  "visibility": "public",
  "tags": ["landscape", "sunset", "mountains", "digital"]
}
```

#### PUT /media/:id
Update media item (owner or collaborator with edit permission).

#### DELETE /media/:id
Delete media item (owner only).

#### POST /media/:id/like
Toggle like on media item.

### Project Endpoints

#### GET /projects
Get paginated list of public projects.

#### POST /projects
Create new project (requires authentication).

**Request Body:**
```json
{
  "title": "Community Mural Project",
  "description": "Collaborative mural design for local community center",
  "category": "painting",
  "projectType": "collaboration",
  "visibility": "public",
  "tags": ["mural", "community", "collaboration"],
  "deadline": "2024-12-31T23:59:59.000Z"
}
```

#### POST /projects/:id/invite
Invite user to project (owner or user with invite permission).

#### POST /projects/:id/join
Accept project invitation.

#### POST /projects/:id/leave
Leave project (participants only, not owner).

### Feedback Endpoints

#### GET /feedback
Get feedback for specific target.

**Query Parameters:**
- `targetId`: ID of target (Media, Project, or User)
- `targetType`: Type of target (Media, Project, User)
- `feedbackType`: Filter by type (comment, rating, review, suggestion)
- `includeReplies`: Include threaded replies (default: false)

#### POST /feedback
Create new feedback.

**Request Body:**
```json
{
  "targetId": "media_or_project_id",
  "targetType": "Media",
  "feedbackType": "comment",
  "content": "Amazing work! Love the color composition.",
  "parentFeedback": null
}
```

For ratings/reviews:
```json
{
  "targetId": "media_or_project_id",
  "targetType": "Media",
  "feedbackType": "review",
  "content": "Excellent technique and creativity",
  "rating": 5
}
```

### Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    }
  ]
}
```

**Common HTTP Status Codes:**
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `429`: Too Many Requests (rate limit exceeded)
- `500`: Internal Server Error

## Authentication

### JWT Token Structure

The API uses JSON Web Tokens for stateless authentication. Tokens contain:

```json
{
  "id": "user_id",
  "email": "user@example.com",
  "username": "username",
  "iat": 1640995200,
  "exp": 1641600000
}
```

### Token Usage

Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Token Expiration

- **Default Expiration**: 7 days
- **Refresh Strategy**: Implement token refresh on the client side
- **Security**: Tokens are signed with a secret key and verified on each request

### Protected Routes

Routes requiring authentication are marked in the API documentation. Attempting to access protected routes without a valid token returns a 401 Unauthorized response.

## Security Features

### Input Validation

All user inputs are validated using express-validator:

- **Email Format**: RFC-compliant email validation
- **Password Strength**: Minimum length, character requirements
- **Data Types**: Strict type checking for all fields
- **Length Limits**: Maximum lengths to prevent buffer overflow
- **Sanitization**: XSS prevention through input cleaning

### Rate Limiting

API endpoints are protected against abuse:

- **Global Limit**: 100 requests per 15-minute window per IP
- **Authentication Endpoints**: Stricter limits on login/register
- **Customizable**: Adjust limits based on endpoint sensitivity

### CORS Configuration

Cross-Origin Resource Sharing is configured for security:

- **Development**: Allows all origins for testing
- **Production**: Whitelist specific domains
- **Credentials**: Supports cookie-based authentication
- **Methods**: Restricts allowed HTTP methods

### Data Protection

- **Password Hashing**: bcrypt with configurable rounds
- **Sensitive Data**: Excluded from API responses
- **Database Injection**: Mongoose provides built-in protection
- **Error Handling**: Prevents information leakage

## Development

### Project Structure

```
artcollab-backend/
├── app.js                 # Main application entry point
├── config/
│   └── database.js        # Database connection configuration
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── userController.js
│   ├── mediaController.js
│   ├── projectController.js
│   └── feedbackController.js
├── middleware/            # Custom middleware
│   ├── auth.js           # Authentication middleware
│   └── validation.js     # Input validation rules
├── models/               # Mongoose schemas
│   ├── User.js
│   ├── Media.js
│   ├── Project.js
│   └── Feedback.js
├── routes/               # API route definitions
│   ├── auth.js
│   ├── users.js
│   ├── media.js
│   ├── projects.js
│   └── feedback.js
├── utils/                # Utility functions
│   ├── security.js       # Security helpers
│   └── database.js       # Database helpers
├── .env                  # Environment variables
├── package.json          # Dependencies and scripts
└── README.md            # This documentation
```

### Development Workflow

1. **Setup Development Environment**
   ```bash
   npm run dev  # Starts server with nodemon
   ```

2. **Code Style**
   - Use consistent indentation (2 spaces)
   - Follow JavaScript ES6+ standards
   - Add JSDoc comments for functions
   - Use meaningful variable names

3. **Testing API Endpoints**
   - Use Postman, Insomnia, or curl for testing
   - Test both success and error scenarios
   - Verify authentication and authorization
   - Check input validation

4. **Database Management**
   - Use MongoDB Compass for visual database exploration
   - Monitor query performance with explain()
   - Regularly backup development data

### Adding New Features

1. **Create Model** (if needed)
   - Define Mongoose schema in `models/`
   - Add validation rules and middleware
   - Create appropriate indexes

2. **Add Controller**
   - Implement business logic in `controllers/`
   - Handle errors gracefully
   - Follow existing patterns

3. **Define Routes**
   - Add route definitions in `routes/`
   - Apply appropriate middleware
   - Include validation rules

4. **Update Documentation**
   - Add API endpoint documentation
   - Update README if needed
   - Include example requests/responses

## Deployment

### Production Checklist

- [ ] Set strong JWT_SECRET (minimum 32 characters)
- [ ] Configure production MongoDB connection
- [ ] Set NODE_ENV=production
- [ ] Configure CORS for production domains
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Test all endpoints in production environment

### Environment Variables for Production

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/artcollab
JWT_SECRET=your_production_jwt_secret_minimum_32_characters
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Docker Deployment (Optional)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Cloud Deployment Options

- **Heroku**: Easy deployment with MongoDB Atlas
- **AWS**: EC2 with DocumentDB or MongoDB Atlas
- **Google Cloud**: App Engine with Cloud MongoDB
- **DigitalOcean**: Droplets with managed MongoDB

## Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

### Code Standards

- Follow existing code style and patterns
- Add appropriate error handling
- Include input validation for new endpoints
- Update documentation for API changes
- Test both success and failure scenarios

### Pull Request Process

1. Ensure all tests pass
2. Update documentation if needed
3. Add description of changes
4. Request review from maintainers
5. Address feedback and make necessary changes


For questions, issues, or contributions, please visit the project repository or contact the development team.

