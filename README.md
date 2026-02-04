# Employee Task Management System

Real-time employee task management tool with manager and employee authentication, employee CRUD management, and real-time chat.

## Features

- **Manager Authentication**: Phone number + SMS OTP via Twilio
- **Employee Authentication**: Email + OTP verification
- **Employee Management**: Add, edit, delete employees with schedule management
- **Real-time Chat**: Socket.io powered messaging between managers and employees
- **Email Invitations**: Automatic invitation emails for new employees

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Vite + React + TypeScript |
| UI | Tailwind CSS |
| Backend | Express.js + TypeScript |
| Database | Firebase Firestore |
| Real-time | Socket.io |
| SMS | Twilio |
| Email | Nodemailer + Gmail |
| Auth | JWT tokens |

## Prerequisites

- Node.js 18+ LTS
- Firebase project with Firestore enabled
- Twilio account (for SMS)
- Gmail account with App Password (for email)

## Project Structure

```
employee-task-management/
├── backend/           # Express.js API server
│   ├── src/
│   │   ├── config/    # Firebase, env config
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── socket/     # Socket.io handlers
│   │   └── types/
│   └── package.json
├── frontend/          # React application
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   └── package.json
└── README.md
```

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd employee-task-management

# Install root dependencies (concurrently)
npm install

# Install all project dependencies
npm run install:all
```

### 2. Configure Environment

**Centralized Configuration:**

All environment variables are managed in a single `.env` file at the project root.

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=3001
FRONTEND_URL=http://localhost:5173

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com

# JWT
JWT_SECRET=your-32-char-secret-key-here

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend
VITE_API_URL=http://localhost:3001
```

### 3. Run the Application

**Run both frontend and backend simultaneously (recommended):**
```bash
npm run dev
```

**Or run them separately:**

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```

Open http://localhost:5173 in your browser.

## Available npm Scripts

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Firestore Database
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Use the values in your `.env` file

### Firestore Collections

The app will create these collections automatically:
- `users` - User accounts (managers and employees)
- `employees` - Employee profiles
- `messages` - Chat messages

## Twilio Setup

1. Sign up at [Twilio](https://www.twilio.com)
2. Get your Account SID and Auth Token from the console
3. Get a phone number for sending SMS
4. Add credentials to `.env`

## Gmail Setup (Nodemailer)

1. Enable 2-Factor Authentication on your Google account
2. Go to Google Account > Security > App passwords
3. Generate an app password for "Mail"
4. Use this password in `EMAIL_PASS`

## API Endpoints

### Manager Authentication
- `POST /api/auth/manager/send-code` - Send SMS OTP
- `POST /api/auth/manager/verify-code` - Verify OTP

### Employee Authentication
- `GET /api/auth/employee/validate-token` - Validate setup link
- `POST /api/auth/employee/setup` - Complete account setup
- `POST /api/auth/employee/send-code` - Send email OTP
- `POST /api/auth/employee/verify-code` - Verify OTP

### Employee Management (Manager only)
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Profile (Employee only)
- `GET /api/profile` - Get my profile
- `PUT /api/profile` - Update my profile

## Socket.io Events

| Event | Direction | Description |
|-------|-----------|-------------|
| join-chat | Client→Server | Join chat room |
| leave-chat | Client→Server | Leave chat room |
| send-message | Client→Server | Send message |
| receive-message | Server→Client | New message |
| typing | Client→Server | Typing indicator |
| message-read | Client→Server | Mark as read |

## Screenshots

See the `screenshots/` directory for application screenshots.

## Development

### Run both services
```bash
npm run dev          # Runs backend + frontend concurrently
```

### Run separately
```bash
npm run dev:backend  # Backend only (port 3001)
npm run dev:frontend # Frontend only (port 5173)
```

### Build for production
```bash
npm run build        # Build both frontend and backend
npm run build:backend
npm run build:frontend
```

### Start production server
```bash
npm run start        # Start backend production server
```

### Other commands
```bash
npm run lint         # Lint both frontend and backend
npm run install:all  # Install all dependencies
```

## License

MIT
