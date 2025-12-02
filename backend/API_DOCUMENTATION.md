# ArtCollab API Documentation

## Base Information

- **Base URL**: `http://localhost:5000/api`
- **Authentication**: JWT Bearer Token
- **Content-Type**: `application/json`
- **API Version**: 1.0.0

## Authentication

### Register User

**Endpoint**: `POST /auth/register`

**Description**: Create a new user account with email verification.

**Request Body**:
```json
{
  "email": "artist@example.com",
  "username": "uniqueartist",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Artist",
  "bio": "Digital artist specializing in landscapes",
  "specializations": ["digital_art", "painting"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "artist@example.com",
    "username": "uniqueartist",
    "firstName": "Jane",
    "lastName": "Artist",
    "fullName": "Jane Artist",
    "bio": "Digital artist specializing in landscapes",
    "specializations": ["digital_art", "painting"],
    "profilePicture": "",
    "socialLinks": {
      "website": "",
      "instagram": "",
      "twitter": "",
      "linkedin": ""
    },
    "isActive": true,
    "isVerified": false,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email"
    },
    {
      "field": "password",
      "message": "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "value": "weak"
    }
  ]
}
```

### Login User

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "artist@example.com",
  "password": "SecurePass123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "artist@example.com",
    "username": "uniqueartist",
    "firstName": "Jane",
    "lastName": "Artist",
    "lastLogin": "2024-01-15T14:30:00.000Z"
  }
}
```

### Get Current User

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "email": "artist@example.com",
    "username": "uniqueartist",
    "firstName": "Jane",
    "lastName": "Artist",
    "bio": "Digital artist specializing in landscapes",
    "specializations": ["digital_art", "painting"],
    "mediaCount": 15,
    "projectCount": 3,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Update User Details

**Endpoint**: `PUT /auth/updatedetails`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "bio": "Updated bio with new information",
  "specializations": ["digital_art", "painting", "illustration"],
  "socialLinks": {
    "website": "https://janesmith.art",
    "instagram": "janesmith_art",
    "twitter": "janesmithart"
  }
}
```

### Logout User

**Endpoint**: `POST /auth/logout`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

## Users

### Get All Users

**Endpoint**: `GET /users`

**Query Parameters**:
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `search` (string): Search by name or username
- `specialization` (string): Filter by specialization
- `sort` (string): Sort field (createdAt, firstName, lastName, -createdAt)

**Example Request**:
```
GET /users?page=1&limit=10&search=jane&specialization=digital_art&sort=-createdAt
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalUsers": 47,
    "hasNext": true,
    "hasPrev": false
  },
  "users": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "username": "uniqueartist",
      "firstName": "Jane",
      "lastName": "Artist",
      "bio": "Digital artist specializing in landscapes",
      "specializations": ["digital_art", "painting"],
      "profilePicture": "https://storage.example.com/profiles/jane.jpg",
      "mediaCount": 15,
      "projectCount": 3,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get User by ID

**Endpoint**: `GET /users/:id`

**Response** (200 OK):
```json
{
  "success": true,
  "user": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "username": "uniqueartist",
    "firstName": "Jane",
    "lastName": "Artist",
    "fullName": "Jane Artist",
    "bio": "Digital artist specializing in landscapes",
    "specializations": ["digital_art", "painting"],
    "profilePicture": "https://storage.example.com/profiles/jane.jpg",
    "socialLinks": {
      "website": "https://janesmith.art",
      "instagram": "janesmith_art"
    },
    "mediaCount": 15,
    "projectCount": 3,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Get User's Media

**Endpoint**: `GET /users/:id/media`

**Query Parameters**:
- `page`, `limit`: Pagination
- `category`: Filter by media category
- `mediaType`: Filter by media type
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "success": true,
  "count": 12,
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalMedia": 15,
    "hasNext": true,
    "hasPrev": false
  },
  "media": [
    {
      "_id": "64f8b1c2d3e4f5g6h7i8j9k0",
      "title": "Mountain Sunset",
      "description": "Digital painting of a serene mountain landscape",
      "mediaType": "image",
      "category": "digital_art",
      "cloudUrl": "https://storage.example.com/media/mountain_sunset.jpg",
      "thumbnailUrl": "https://storage.example.com/thumbs/mountain_sunset_thumb.jpg",
      "owner": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "firstName": "Jane",
        "lastName": "Artist",
        "username": "uniqueartist",
        "profilePicture": "https://storage.example.com/profiles/jane.jpg"
      },
      "visibility": "public",
      "tags": ["landscape", "sunset", "mountains", "digital"],
      "likes": [],
      "likeCount": 23,
      "views": 156,
      "createdAt": "2024-01-10T15:45:00.000Z"
    }
  ]
}
```

## Media

### Get All Media

**Endpoint**: `GET /media`

**Query Parameters**:
- `page`, `limit`: Pagination
- `q`: Search query (title, description, tags)
- `category`: Filter by category (painting, music, design, etc.)
- `mediaType`: Filter by type (image, audio, video, document)
- `tags`: Comma-separated tags
- `featured`: Show only featured content (true/false)
- `sort`: Sort field (createdAt, -createdAt, likes, -likes, views, -views, title)

**Example Request**:
```
GET /media?category=digital_art&tags=landscape,nature&sort=-likes&limit=12
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 12,
  "pagination": {
    "currentPage": 1,
    "totalPages": 8,
    "totalMedia": 94,
    "hasNext": true,
    "hasPrev": false
  },
  "media": [
    {
      "_id": "64f8b1c2d3e4f5g6h7i8j9k0",
      "title": "Mountain Sunset",
      "description": "Digital painting of a serene mountain landscape at golden hour",
      "mediaType": "image",
      "category": "digital_art",
      "fileName": "mountain_sunset_2024.jpg",
      "fileSize": 2048576,
      "mimeType": "image/jpeg",
      "cloudUrl": "https://storage.example.com/media/mountain_sunset.jpg",
      "thumbnailUrl": "https://storage.example.com/thumbs/mountain_sunset_thumb.jpg",
      "owner": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "firstName": "Jane",
        "lastName": "Artist",
        "username": "uniqueartist",
        "profilePicture": "https://storage.example.com/profiles/jane.jpg"
      },
      "visibility": "public",
      "collaborators": [],
      "tags": ["landscape", "sunset", "mountains", "digital", "nature"],
      "metadata": {
        "dimensions": {
          "width": 1920,
          "height": 1080
        },
        "format": "JPEG",
        "quality": "high"
      },
      "likes": [],
      "likeCount": 23,
      "views": 156,
      "status": "published",
      "isFeatured": false,
      "createdAt": "2024-01-10T15:45:00.000Z",
      "updatedAt": "2024-01-12T09:20:00.000Z"
    }
  ]
}
```

### Get Single Media Item

**Endpoint**: `GET /media/:id`

**Headers** (optional):
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "media": {
    "_id": "64f8b1c2d3e4f5g6h7i8j9k0",
    "title": "Mountain Sunset",
    "description": "Digital painting of a serene mountain landscape at golden hour. This piece explores the interplay of light and shadow during the magical moments of sunset.",
    "mediaType": "image",
    "category": "digital_art",
    "fileName": "mountain_sunset_2024.jpg",
    "originalName": "My Mountain Sunset Painting.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "cloudUrl": "https://storage.example.com/media/mountain_sunset.jpg",
    "thumbnailUrl": "https://storage.example.com/thumbs/mountain_sunset_thumb.jpg",
    "owner": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Jane",
      "lastName": "Artist",
      "username": "uniqueartist",
      "profilePicture": "https://storage.example.com/profiles/jane.jpg",
      "bio": "Digital artist specializing in landscapes"
    },
    "visibility": "public",
    "collaborators": [
      {
        "user": {
          "_id": "64f8c2d3e4f5g6h7i8j9k0l1",
          "firstName": "John",
          "lastName": "Collaborator",
          "username": "johncollabs",
          "profilePicture": "https://storage.example.com/profiles/john.jpg"
        },
        "role": "editor",
        "addedAt": "2024-01-11T10:00:00.000Z"
      }
    ],
    "tags": ["landscape", "sunset", "mountains", "digital", "nature"],
    "metadata": {
      "dimensions": {
        "width": 1920,
        "height": 1080
      },
      "format": "JPEG",
      "quality": "high"
    },
    "likes": [
      {
        "user": {
          "_id": "64f8d3e4f5g6h7i8j9k0l1m2",
          "firstName": "Art",
          "lastName": "Lover",
          "username": "artlover123"
        },
        "likedAt": "2024-01-11T14:30:00.000Z"
      }
    ],
    "likeCount": 23,
    "commentCount": 8,
    "views": 157,
    "status": "published",
    "isFeatured": false,
    "createdAt": "2024-01-10T15:45:00.000Z",
    "updatedAt": "2024-01-12T09:20:00.000Z"
  }
}
```

### Create Media Item

**Endpoint**: `POST /media`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Ocean Waves",
  "description": "Abstract representation of ocean waves using watercolor techniques",
  "mediaType": "image",
  "category": "painting",
  "fileName": "ocean_waves_abstract.jpg",
  "originalName": "Ocean Waves Watercolor.jpg",
  "fileSize": 1536000,
  "mimeType": "image/jpeg",
  "cloudUrl": "https://storage.example.com/media/ocean_waves_abstract.jpg",
  "thumbnailUrl": "https://storage.example.com/thumbs/ocean_waves_abstract_thumb.jpg",
  "visibility": "public",
  "tags": ["ocean", "waves", "abstract", "watercolor", "blue"],
  "metadata": {
    "dimensions": {
      "width": 1600,
      "height": 1200
    },
    "format": "JPEG",
    "quality": "high"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "media": {
    "_id": "64f8e4f5g6h7i8j9k0l1m2n3",
    "title": "Ocean Waves",
    "description": "Abstract representation of ocean waves using watercolor techniques",
    "mediaType": "image",
    "category": "painting",
    "fileName": "ocean_waves_abstract.jpg",
    "originalName": "Ocean Waves Watercolor.jpg",
    "fileSize": 1536000,
    "mimeType": "image/jpeg",
    "cloudUrl": "https://storage.example.com/media/ocean_waves_abstract.jpg",
    "thumbnailUrl": "https://storage.example.com/thumbs/ocean_waves_abstract_thumb.jpg",
    "owner": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Jane",
      "lastName": "Artist",
      "username": "uniqueartist",
      "profilePicture": "https://storage.example.com/profiles/jane.jpg"
    },
    "visibility": "public",
    "collaborators": [],
    "tags": ["ocean", "waves", "abstract", "watercolor", "blue"],
    "metadata": {
      "dimensions": {
        "width": 1600,
        "height": 1200
      },
      "format": "JPEG",
      "quality": "high"
    },
    "likes": [],
    "likeCount": 0,
    "views": 0,
    "status": "published",
    "isFeatured": false,
    "createdAt": "2024-01-15T16:30:00.000Z",
    "updatedAt": "2024-01-15T16:30:00.000Z"
  }
}
```

### Update Media Item

**Endpoint**: `PUT /media/:id`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body** (partial update):
```json
{
  "title": "Ocean Waves - Updated",
  "description": "Updated description with more details about the technique",
  "tags": ["ocean", "waves", "abstract", "watercolor", "blue", "seascape"],
  "visibility": "public"
}
```

### Delete Media Item

**Endpoint**: `DELETE /media/:id`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Media deleted successfully"
}
```

### Like/Unlike Media

**Endpoint**: `POST /media/:id/like`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "action": "liked",
  "likeCount": 24,
  "media": {
    "_id": "64f8b1c2d3e4f5g6h7i8j9k0",
    "title": "Mountain Sunset",
    "likeCount": 24,
    "owner": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Jane",
      "lastName": "Artist",
      "username": "uniqueartist"
    }
  }
}
```

### Get Media Categories

**Endpoint**: `GET /media/categories`

**Response** (200 OK):
```json
{
  "success": true,
  "categories": [
    {
      "name": "painting",
      "count": 45
    },
    {
      "name": "digital_art",
      "count": 38
    },
    {
      "name": "photography",
      "count": 29
    },
    {
      "name": "illustration",
      "count": 22
    },
    {
      "name": "music",
      "count": 15
    },
    {
      "name": "design",
      "count": 12
    },
    {
      "name": "sculpture",
      "count": 8
    },
    {
      "name": "storytelling",
      "count": 5
    },
    {
      "name": "other",
      "count": 3
    }
  ]
}
```

## Projects

### Get All Projects

**Endpoint**: `GET /projects`

**Query Parameters**:
- `page`, `limit`: Pagination
- `q`: Search query
- `category`: Filter by category
- `projectType`: Filter by type (solo, collaboration, commission, contest)
- `status`: Filter by status (planning, active, completed, etc.)
- `tags`: Comma-separated tags
- `featured`: Show only featured projects
- `sort`: Sort field

**Response** (200 OK):
```json
{
  "success": true,
  "count": 10,
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalProjects": 28,
    "hasNext": true,
    "hasPrev": false
  },
  "projects": [
    {
      "_id": "64f8f5g6h7i8j9k0l1m2n3o4",
      "title": "Community Art Mural",
      "description": "Collaborative mural project for the downtown community center",
      "category": "painting",
      "projectType": "collaboration",
      "owner": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
        "firstName": "Jane",
        "lastName": "Artist",
        "username": "uniqueartist",
        "profilePicture": "https://storage.example.com/profiles/jane.jpg"
      },
      "participants": [
        {
          "user": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
            "firstName": "Jane",
            "lastName": "Artist",
            "username": "uniqueartist",
            "profilePicture": "https://storage.example.com/profiles/jane.jpg"
          },
          "role": "owner",
          "status": "active"
        },
        {
          "user": {
            "_id": "64f8c2d3e4f5g6h7i8j9k0l1",
            "firstName": "John",
            "lastName": "Collaborator",
            "username": "johncollabs",
            "profilePicture": "https://storage.example.com/profiles/john.jpg"
          },
          "role": "contributor",
          "status": "active"
        }
      ],
      "status": "active",
      "visibility": "public",
      "tags": ["mural", "community", "collaboration", "public_art"],
      "participantCount": 5,
      "likeCount": 12,
      "mediaCount": 8,
      "startDate": "2024-01-01T00:00:00.000Z",
      "deadline": "2024-06-30T23:59:59.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z"
    }
  ]
}
```

### Get Single Project

**Endpoint**: `GET /projects/:id`

**Headers** (optional):
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response** (200 OK):
```json
{
  "success": true,
  "project": {
    "_id": "64f8f5g6h7i8j9k0l1m2n3o4",
    "title": "Community Art Mural",
    "description": "A large-scale collaborative mural project designed to beautify the downtown community center and bring together local artists of all skill levels.",
    "category": "painting",
    "projectType": "collaboration",
    "owner": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Jane",
      "lastName": "Artist",
      "username": "uniqueartist",
      "profilePicture": "https://storage.example.com/profiles/jane.jpg",
      "bio": "Digital artist specializing in landscapes"
    },
    "participants": [
      {
        "user": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "firstName": "Jane",
          "lastName": "Artist",
          "username": "uniqueartist",
          "profilePicture": "https://storage.example.com/profiles/jane.jpg"
        },
        "role": "owner",
        "permissions": {
          "canEdit": true,
          "canInvite": true,
          "canManageMedia": true,
          "canDelete": true
        },
        "joinedAt": "2024-01-01T10:00:00.000Z",
        "status": "active"
      }
    ],
    "media": [
      {
        "mediaItem": {
          "_id": "64f8b1c2d3e4f5g6h7i8j9k0",
          "title": "Mural Concept Sketch",
          "cloudUrl": "https://storage.example.com/media/mural_concept.jpg",
          "thumbnailUrl": "https://storage.example.com/thumbs/mural_concept_thumb.jpg",
          "mediaType": "image",
          "category": "design"
        },
        "addedBy": {
          "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
          "firstName": "Jane",
          "lastName": "Artist",
          "username": "uniqueartist"
        },
        "addedAt": "2024-01-02T14:30:00.000Z",
        "role": "primary"
      }
    ],
    "milestones": [
      {
        "_id": "64f9g6h7i8j9k0l1m2n3o4p5",
        "title": "Design Approval",
        "description": "Get community approval for the final mural design",
        "dueDate": "2024-02-15T23:59:59.000Z",
        "status": "completed",
        "completedAt": "2024-02-10T16:00:00.000Z",
        "assignedTo": ["64f8a1b2c3d4e5f6a7b8c9d0"]
      }
    ],
    "status": "active",
    "visibility": "public",
    "settings": {
      "allowPublicApplications": true,
      "requireApprovalForJoining": true,
      "maxParticipants": 15
    },
    "tags": ["mural", "community", "collaboration", "public_art"],
    "startDate": "2024-01-01T00:00:00.000Z",
    "deadline": "2024-06-30T23:59:59.000Z",
    "views": 89,
    "likes": [],
    "likeCount": 12,
    "commentCount": 6,
    "participantCount": 5,
    "mediaCount": 8,
    "isFeatured": true,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-15T09:45:00.000Z"
  }
}
```

### Create Project

**Endpoint**: `POST /projects`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "title": "Digital Art Exhibition",
  "description": "Curating a virtual exhibition showcasing contemporary digital art from emerging artists worldwide",
  "category": "digital_art",
  "projectType": "collaboration",
  "visibility": "public",
  "tags": ["digital_art", "exhibition", "virtual", "contemporary"],
  "deadline": "2024-08-31T23:59:59.000Z",
  "settings": {
    "allowPublicApplications": true,
    "requireApprovalForJoining": true,
    "maxParticipants": 20
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "project": {
    "_id": "64f9h7i8j9k0l1m2n3o4p5q6",
    "title": "Digital Art Exhibition",
    "description": "Curating a virtual exhibition showcasing contemporary digital art from emerging artists worldwide",
    "category": "digital_art",
    "projectType": "collaboration",
    "owner": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "firstName": "Jane",
      "lastName": "Artist",
      "username": "uniqueartist",
      "profilePicture": "https://storage.example.com/profiles/jane.jpg"
    },
    "participants": [
      {
        "user": "64f8a1b2c3d4e5f6a7b8c9d0",
        "role": "owner",
        "permissions": {
          "canEdit": true,
          "canInvite": true,
          "canManageMedia": true,
          "canDelete": true
        },
        "status": "active"
      }
    ],
    "media": [],
    "milestones": [],
    "status": "planning",
    "visibility": "public",
    "settings": {
      "allowPublicApplications": true,
      "requireApprovalForJoining": true,
      "maxParticipants": 20
    },
    "tags": ["digital_art", "exhibition", "virtual", "contemporary"],
    "startDate": "2024-01-15T16:45:00.000Z",
    "deadline": "2024-08-31T23:59:59.000Z",
    "views": 0,
    "likes": [],
    "likeCount": 0,
    "participantCount": 1,
    "mediaCount": 0,
    "isFeatured": false,
    "createdAt": "2024-01-15T16:45:00.000Z",
    "updatedAt": "2024-01-15T16:45:00.000Z"
  }
}
```

### Invite User to Project

**Endpoint**: `POST /projects/:id/invite`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body**:
```json
{
  "userId": "64f8c2d3e4f5g6h7i8j9k0l1",
  "role": "contributor"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "User invited successfully",
  "project": {
    "_id": "64f8f5g6h7i8j9k0l1m2n3o4",
    "title": "Community Art Mural",
    "participants": [
      {
        "user": {
          "_id": "64f8c2d3e4f5g6h7i8j9k0l1",
          "firstName": "John",
          "lastName": "Collaborator",
          "username": "johncollabs",
          "profilePicture": "https://storage.example.com/profiles/john.jpg"
        },
        "role": "contributor",
        "status": "invited",
        "invitedBy": "64f8a1b2c3d4e5f6a7b8c9d0",
        "joinedAt": "2024-01-15T17:00:00.000Z"
      }
    ]
  }
}
```

## Feedback

### Get Feedback

**Endpoint**: `GET /feedback`

**Query Parameters**:
- `targetId` (required): ID of the target (Media, Project, or User)
- `targetType` (required): Type of target (Media, Project, User)
- `page`, `limit`: Pagination
- `feedbackType`: Filter by type (comment, rating, review, suggestion)
- `includeReplies`: Include threaded replies (default: false)
- `sort`: Sort field (createdAt, -createdAt, likes, -likes)

**Example Request**:
```
GET /feedback?targetId=64f8b1c2d3e4f5g6h7i8j9k0&targetType=Media&feedbackType=comment&page=1&limit=10
```

**Response** (200 OK):
```json
{
  "success": true,
  "count": 8,
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalFeedback": 8,
    "hasNext": false,
    "hasPrev": false
  },
  "feedback": [
    {
      "_id": "64f9i8j9k0l1m2n3o4p5q6r7",
      "targetId": "64f8b1c2d3e4f5g6h7i8j9k0",
      "targetType": "Media",
      "feedbackType": "comment",
      "content": "Absolutely stunning work! The way you captured the light in this piece is incredible.",
      "author": {
        "_id": "64f8d3e4f5g6h7i8j9k0l1m2",
        "firstName": "Art",
        "lastName": "Enthusiast",
        "username": "artenthusiast",
        "profilePicture": "https://storage.example.com/profiles/art_enthusiast.jpg"
      },
      "parentFeedback": null,
      "replies": [
        {
          "_id": "64f9j9k0l1m2n3o4p5q6r7s8",
          "content": "Thank you so much! I spent a lot of time getting the lighting just right.",
          "author": {
            "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
            "firstName": "Jane",
            "lastName": "Artist",
            "username": "uniqueartist",
            "profilePicture": "https://storage.example.com/profiles/jane.jpg"
          }
        }
      ],
      "likes": [],
      "likeCount": 5,
      "replyCount": 1,
      "isEdited": false,
      "visibility": "public",
      "createdAt": "2024-01-12T14:30:00.000Z",
      "updatedAt": "2024-01-12T14:30:00.000Z"
    }
  ]
}
```

### Create Feedback

**Endpoint**: `POST /feedback`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Body** (Comment):
```json
{
  "targetId": "64f8b1c2d3e4f5g6h7i8j9k0",
  "targetType": "Media",
  "feedbackType": "comment",
  "content": "This is an amazing piece! I love the color palette you chose.",
  "parentFeedback": null
}
```

**Request Body** (Rating):
```json
{
  "targetId": "64f8b1c2d3e4f5g6h7i8j9k0",
  "targetType": "Media",
  "feedbackType": "rating",
  "rating": 5
}
```

**Request Body** (Review):
```json
{
  "targetId": "64f8b1c2d3e4f5g6h7i8j9k0",
  "targetType": "Media",
  "feedbackType": "review",
  "content": "Exceptional work with great attention to detail. The composition is well-balanced and the technique is masterful.",
  "rating": 5
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "feedback": {
    "_id": "64f9k0l1m2n3o4p5q6r7s8t9",
    "targetId": "64f8b1c2d3e4f5g6h7i8j9k0",
    "targetType": "Media",
    "feedbackType": "comment",
    "content": "This is an amazing piece! I love the color palette you chose.",
    "author": {
      "_id": "64f8d3e4f5g6h7i8j9k0l1m2",
      "firstName": "Art",
      "lastName": "Enthusiast",
      "username": "artenthusiast",
      "profilePicture": "https://storage.example.com/profiles/art_enthusiast.jpg"
    },
    "parentFeedback": null,
    "replies": [],
    "likes": [],
    "likeCount": 0,
    "replyCount": 0,
    "helpfulCount": 0,
    "notHelpfulCount": 0,
    "isEdited": false,
    "isDeleted": false,
    "isFlagged": false,
    "visibility": "public",
    "createdAt": "2024-01-15T17:15:00.000Z",
    "updatedAt": "2024-01-15T17:15:00.000Z"
  }
}
```

### Get Feedback Statistics

**Endpoint**: `GET /feedback/stats`

**Query Parameters**:
- `targetId` (required): ID of the target
- `targetType` (required): Type of target

**Example Request**:
```
GET /feedback/stats?targetId=64f8b1c2d3e4f5g6h7i8j9k0&targetType=Media
```

**Response** (200 OK):
```json
{
  "success": true,
  "stats": {
    "totalFeedback": 25,
    "totalRatings": 12,
    "overallRating": 4.3,
    "byType": [
      {
        "_id": "comment",
        "count": 15,
        "avgRating": null,
        "totalLikes": 45
      },
      {
        "_id": "rating",
        "count": 8,
        "avgRating": 4.2,
        "totalLikes": 12
      },
      {
        "_id": "review",
        "count": 4,
        "avgRating": 4.5,
        "totalLikes": 18
      }
    ]
  }
}
```

## Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

### Validation Error Response

For validation failures, additional details are provided:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Please provide a valid email",
      "value": "invalid-email-format"
    },
    {
      "field": "password",
      "message": "Password must be at least 6 characters long",
      "value": "123"
    }
  ]
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, DELETE requests
- **201 Created**: Successful POST requests that create resources
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid authentication but insufficient permissions
- **404 Not Found**: Requested resource doesn't exist
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Unexpected server error

### Rate Limiting

The API implements rate limiting to prevent abuse:

- **Global Limit**: 100 requests per 15-minute window per IP address
- **Authentication Endpoints**: Stricter limits may apply
- **Headers**: Rate limit information is included in response headers:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Requests remaining in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets

When rate limit is exceeded:

```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

## Authentication Flow Examples

### Complete Registration and Login Flow

1. **Register New User**:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newartist@example.com",
    "username": "newartist",
    "password": "SecurePass123",
    "firstName": "New",
    "lastName": "Artist"
  }'
```

2. **Login with Credentials**:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newartist@example.com",
    "password": "SecurePass123"
  }'
```

3. **Use Token for Authenticated Requests**:
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Media Upload Flow

1. **Upload file to cloud storage** (external service)
2. **Create media record**:
```bash
curl -X POST http://localhost:5000/api/media \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Artwork",
    "description": "Description of the artwork",
    "mediaType": "image",
    "category": "digital_art",
    "fileName": "artwork.jpg",
    "originalName": "My Artwork.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "cloudUrl": "https://storage.example.com/artwork.jpg",
    "visibility": "public",
    "tags": ["art", "digital", "creative"]
  }'
```

This comprehensive API documentation provides all the necessary information to integrate with the ArtCollab backend system. Each endpoint includes detailed request/response examples, authentication requirements, and error handling information.

