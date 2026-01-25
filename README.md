ArtCollab is an online platform designed to bring artists together in one shared digital space. It functions as a gallery, collaboration hub, and creative community where users can explore artwork, present their own creations, and engage with others across disciplines such as illustration, photography, design, and storytelling.

This repository represents the Minimum Viable Product (MVP) developed as a semester-long project, with an emphasis on clean architecture, real-world workflows, and scalable design decisions.

**Goal & MVP Scope**

Primary Goal:
Deliver a functional MVP that demonstrates full-stack web development concepts, including authentication, secure password handling, and frontend–backend integration.

MVP Features

User authentication (Sign up, Log in)
Password reset flow using email (Mailtrap for development)
Public marketing pages (Home, About)
Frontend-only contact form
Support for image and written content (media upload features planned for future iterations)

Out of Scope (for MVP)

Audio and video uploads
Advanced collaboration tools
Public comments and rating systems

**Development Approach**
This project follows an Agile (Scrum) methodology to allow iterative development and continuous improvement.

2-week sprints
Sprint phases: Planning, Development, Review, Retrospective
Total duration: 14 weeks (7 sprints)
This approach supports flexibility, learning, and gradual feature expansion.

**Tech Stack**
Frontend

Languages: HTML, CSS, JavaScript
Framework: React + Vite
State Management: Redux
Routing: React Router
Styling: CSS Modules + Global Styles
Icons: Lucide Icons
HTTP Client: Axios / Fetch
Notifications: react-hot-toast
Wireframes: WebFlow

Backend

Runtime: Node.js
Framework: Express.js
Database: MongoDB (via Mongoose)
Authentication:
JSON Web Tokens (JWT)
Password hashing with bcryptjs
Email (Development): Nodemailer + Mailtrap SMTP
Security:
Auth middleware
Environment-based configuration

**Project Architecture**

The application is split into two independent services that communicate over HTTP:
artcollab-frontend/ → React + Vite (SPA)
artcollab-backend/ → Express + MongoDB (REST API)

**Development URLs**

Frontend: http://localhost:5173
Backend API: http://localhost:5001/api

**Frontend Structure**

Key frontend files and directories:

src/main.jsx – Application entry point
src/App.jsx – App shell and layout
src/routes/routes.jsx – Route definitions
src/api/client.js – API client configuration
src/styles/global.css – Global styles and layout rules
src/components/ – Shared UI components (Navbar, Footer)
src/pages/ – Page-level components and styles

*Available Pages*
/ or /homepage – Homepage
/about – About page
/login – Login
/signup – Sign up
/forgot-password – Request password reset
/reset-password – Reset password via email token

**Backend Structure**

Key backend files and directories:

app.js – Express app configuration
config/database.js – MongoDB connection
models/User.js – User schema
controllers/authController.js – Authentication logic
routes/auth.js – Auth routes
middleware/auth.js – JWT authentication middleware
utils/sendEmail.js – Centralized email utility

**Password Reset Flow (Development)**

A complete password reset workflow is implemented to simulate a production-ready system.

*Flow Summary*
User submits email via Forgot Password page.
Backend generates a secure token and expiration time.
Reset link is emailed using Mailtrap.
User clicks the link and submits a new password.
Backend validates the token, updates the password, and clears reset data.

This allows safe testing without sending real emails.

**Environment Configuration**
Backend .env Example
NODE_ENV=development
PORT=5001

MONGO_URI=mongodb://127.0.0.1:27017/artcollab

JWT_SECRET=your_secret_here
JWT_EXPIRE=7d

BCRYPT_ROUNDS=12

FRONTEND_URL=http://localhost:5173

MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USER=your_mailtrap_user
MAIL_PASS=your_mailtrap_pass
MAIL_FROM="ArtCollab <no-reply@artcollab.test>"

**Running the Project Locally**
*Backend*
cd backend
npm install
npm run dev

*Frontend*
cd frontend
npm install
npm run dev
Then open http://localhost:5173 in your browser.


The application is split into two independent services that communicate over HTTP:
