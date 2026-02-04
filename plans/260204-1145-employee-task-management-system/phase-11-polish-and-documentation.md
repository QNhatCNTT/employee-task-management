# Phase 11: Polish and Documentation

## Context Links

- [Parent Plan](./plan.md)
- [Phase 10: Employee Dashboard UI](./phase-10-employee-dashboard-ui.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P2 - High |
| Effort | 2h |
| Implementation Status | pending |
| Review Status | pending |

Add final polish with loading states, error handling, toast notifications, and comprehensive documentation with README and screenshots.

## Key Insights

- shadcn/ui toast for notifications
- Consistent error handling across app
- Loading skeletons improve UX
- README essential for running the project
- Screenshots document functionality

## Requirements

### Functional
- Toast notifications on all actions
- Loading states with skeletons
- Error boundaries catch crashes
- Comprehensive README.md
- Screenshots of key screens

### Non-Functional
- Consistent UI patterns
- Clear error messages
- Easy setup instructions

## Architecture

### Error Handling Flow
```
Component → Try Action → Success → Toast Success
                ↓ Error
           Error Handler → Toast Error → Log Details
```

### Loading State Pattern
```
Initial Load → Skeleton → Data Ready → Content
      ↓ Error
   Error State
```

## Related Code Files

### Files to Create
- `frontend/src/components/ui/loading-skeleton.tsx`
- `frontend/src/components/error-boundary.tsx`
- `README.md` (project root)
- `backend/README.md`
- `frontend/README.md`
- `screenshots/` directory

### Files to Modify
- Multiple components (add loading/error states)
- `frontend/src/App.tsx` (add error boundary)

## Implementation Steps

### 1. Setup Toast (if not done)

```bash
cd frontend
npx shadcn@latest add toast
```

Create toast hook if needed:
`frontend/src/components/ui/use-toast.ts` (shadcn provides this)

### 2. Create Error Boundary

`frontend/src/components/error-boundary.tsx`:
```typescript
import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-red-600">Something went wrong</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                An unexpected error occurred. Please try refreshing the page.
              </p>
              {this.state.error && (
                <pre className="bg-gray-100 p-2 rounded text-sm overflow-auto mb-4">
                  {this.state.error.message}
                </pre>
              )}
              <Button onClick={() => window.location.reload()}>
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Create Loading Skeleton

`frontend/src/components/ui/loading-skeleton.tsx`:
```typescript
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn('animate-pulse rounded bg-gray-200', className)}
    />
  );
};

export const CardSkeleton = () => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
};

export const ListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
};
```

### 4. Add Toaster to App

Update `frontend/src/App.tsx`:
```typescript
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from './components/error-boundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <AppRoutes />
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
```

### 5. Create Main README

`README.md` (project root):
```markdown
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
| UI | shadcn/ui + Tailwind CSS |
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
│   │   ├── socket/    # Socket.io handlers
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

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

Create `.env` files from examples:

**Backend** (`backend/.env`):
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
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:3001
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

### 3. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

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

### Backend
```bash
cd backend
npm run dev      # Development with hot reload
npm run build    # Build for production
npm start        # Run production build
```

### Frontend
```bash
cd frontend
npm run dev      # Development server
npm run build    # Production build
npm run preview  # Preview production build
```

## License

MIT
```

### 6. Create Screenshots Directory

Create `screenshots/` directory with placeholder files:
- `screenshots/01-manager-login.png`
- `screenshots/02-otp-verify.png`
- `screenshots/03-manager-dashboard.png`
- `screenshots/04-add-employee.png`
- `screenshots/05-chat.png`
- `screenshots/06-employee-setup.png`
- `screenshots/07-employee-dashboard.png`

### 7. Add API Response Types

Ensure consistent API responses across the app by documenting the standard response format:

```typescript
// Standard API Response Format
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### 8. Final Code Review Checklist

- [ ] All forms have validation
- [ ] All API calls have error handling
- [ ] All async operations show loading states
- [ ] Toast notifications on success/error
- [ ] Console.log statements removed (except errors)
- [ ] TypeScript strict mode passes
- [ ] No hardcoded URLs or secrets

## Todo List

- [ ] Add shadcn toast component
- [ ] Create error boundary
- [ ] Create loading skeletons
- [ ] Add toaster to App
- [ ] Update components with loading states
- [ ] Create main README.md
- [ ] Create backend README.md
- [ ] Create frontend README.md
- [ ] Take screenshots of all pages
- [ ] Final code review
- [ ] Test full application flow
- [ ] Verify all env variables documented

## Success Criteria

- [ ] All actions show toast notifications
- [ ] Loading states display during fetches
- [ ] Error boundary catches crashes
- [ ] README explains setup clearly
- [ ] Screenshots document all features
- [ ] App runs from scratch with README instructions

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missing env documentation | Medium | High | Comprehensive .env.example |
| Setup instructions unclear | Medium | Medium | Test from scratch |
| Screenshots outdated | Low | Low | Update before release |

## Security Considerations

- Ensure no secrets in screenshots
- Remove all console.log with sensitive data
- Verify .gitignore includes .env files

## Project Complete

After this phase:
- All features implemented
- Documentation complete
- Ready for deployment or submission
