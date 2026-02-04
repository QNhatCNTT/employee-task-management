# Brainstorm Report: Employee Task Management System

**Date:** 2026-02-04
**Status:** Complete
**Type:** Greenfield Full-Stack Application

---

## Problem Statement

Build a real-time employee task management tool with:
- Manager authentication via phone + SMS OTP
- Employee authentication via email verification
- Employee CRUD management
- Real-time chat between managers and employees
- Task assignment and tracking

## Technology Stack (Agreed)

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
| Structure | Monorepo (/frontend, /backend) |

---

## Evaluated Approaches

### Approach 1: Backend-First Development ✓ RECOMMENDED
**Pros:**
- API contracts defined early, frontend can mock
- Database schema validated before UI complexity
- Authentication flow tested independently
- Easier debugging without frontend noise

**Cons:**
- No visual feedback initially
- Requires API testing tools (Postman/Insomnia)

### Approach 2: Frontend-First Development
**Pros:**
- Visual progress visible immediately
- UI/UX feedback early

**Cons:**
- Mock data management overhead
- Integration issues discovered late
- Authentication harder to test

### Approach 3: Full-Stack Parallel Development
**Pros:**
- Faster if multiple developers

**Cons:**
- Complex coordination for single developer
- Integration conflicts likely
- Harder to debug

**Decision:** Backend-First with rapid frontend follow-up.

---

## Database Schema (Firestore Collections)

### `users` Collection
```typescript
{
  id: string;              // Auto-generated
  phoneNumber?: string;    // For managers
  email?: string;          // For employees
  role: 'manager' | 'employee';
  name: string;
  accessCode?: string;     // Temporary OTP
  accessCodeExpiry?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `employees` Collection
```typescript
{
  id: string;
  userId: string;          // Reference to users collection
  name: string;
  email: string;
  phone?: string;
  department: string;
  role: string;            // Job title
  managerId: string;       // Who created them
  schedule?: {
    workDays: string[];    // ['Mon', 'Tue', ...]
    startTime: string;     // '09:00'
    endTime: string;       // '17:00'
  };
  isActive: boolean;
  setupCompleted: boolean;
  setupToken?: string;     // For email verification
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### `tasks` Collection (Future)
```typescript
{
  id: string;
  title: string;
  description: string;
  assignedTo: string;      // Employee ID
  assignedBy: string;      // Manager ID
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
}
```

### `messages` Collection
```typescript
{
  id: string;
  chatId: string;          // Composite: managerId_employeeId
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  createdAt: Timestamp;
}
```

---

## API Endpoints Design

### Manager Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/manager/send-code | Send SMS OTP to phone |
| POST | /api/auth/manager/verify-code | Validate OTP, return JWT |

### Employee Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/employee/send-code | Send email OTP |
| POST | /api/auth/employee/verify-code | Validate OTP, return JWT |
| POST | /api/auth/employee/setup | Complete account setup |

### Employee Management (Manager only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List all employees |
| GET | /api/employees/:id | Get single employee |
| POST | /api/employees | Create employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |

### Chat (Socket.io Events)
| Event | Direction | Description |
|-------|-----------|-------------|
| join-chat | Client→Server | Join chat room |
| send-message | Client→Server | Send message |
| receive-message | Server→Client | New message notification |
| typing | Bidirectional | Typing indicator |

---

## Implementation Plan - Step by Step

### Phase 1: Project Setup (Foundation)
1. Initialize monorepo structure
2. Setup backend (Express + TypeScript)
3. Setup frontend (Vite + React + TypeScript)
4. Configure Firebase Admin SDK (backend)
5. Configure Firebase Client SDK (frontend)
6. Setup Tailwind + shadcn/ui
7. Create shared types package
8. Configure ESLint, Prettier
9. Create .env.example files

### Phase 2: Backend Core
1. Create Express server with middleware
2. Setup Firebase Firestore connection
3. Create database models/schemas
4. Implement JWT authentication utilities
5. Create auth middleware for protected routes
6. Setup error handling middleware

### Phase 3: Manager Authentication
1. Implement Twilio SMS service
2. Create `/api/auth/manager/send-code` endpoint
3. Create `/api/auth/manager/verify-code` endpoint
4. Generate and validate access codes
5. Issue JWT tokens on successful verification
6. Test with Postman/Insomnia

### Phase 4: Employee CRUD
1. Create employee routes
2. Implement CreateEmployee (with email invitation)
3. Implement GetEmployee
4. Implement UpdateEmployee
5. Implement DeleteEmployee
6. Implement ListEmployees
7. Setup Nodemailer for invitation emails

### Phase 5: Employee Authentication
1. Create employee setup page route
2. Implement email verification token system
3. Create `/api/auth/employee/setup` endpoint
4. Create `/api/auth/employee/send-code` endpoint
5. Create `/api/auth/employee/verify-code` endpoint

### Phase 6: Real-time Chat
1. Setup Socket.io on backend
2. Create chat room management
3. Implement message persistence to Firestore
4. Create chat events (join, send, receive)
5. Implement typing indicators
6. Add read receipts

### Phase 7: Frontend - Auth Pages
1. Create Login page (phone input)
2. Create OTP verification page
3. Implement local storage for auth tokens
4. Create auth context/provider
5. Setup protected route wrapper
6. Create employee login flow

### Phase 8: Frontend - Manager Dashboard
1. Create dashboard layout
2. Build employee list component
3. Create add employee form/modal
4. Create edit employee form
5. Implement delete confirmation
6. Add schedule management UI

### Phase 9: Frontend - Chat Feature
1. Create chat list sidebar
2. Build message thread component
3. Implement Socket.io client
4. Add real-time message updates
5. Implement typing indicator UI
6. Add message input component

### Phase 10: Frontend - Employee Dashboard
1. Create employee profile page
2. Build task list view (placeholder for future)
3. Implement profile editing
4. Create employee-side chat interface

### Phase 11: Polish & Documentation
1. Add loading states and error handling
2. Implement toast notifications
3. Add form validation (zod)
4. Create README.md
5. Add screenshots
6. Write API documentation

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Twilio SMS delivery issues | Medium | High | Implement retry logic, fallback message |
| Firebase quota limits | Low | Medium | Monitor usage, implement rate limiting |
| Socket.io connection drops | Medium | Medium | Implement reconnection logic |
| Email deliverability (Gmail) | Medium | High | Use App Password, consider SendGrid fallback |
| JWT token security | Low | High | Short expiry, refresh tokens, HTTPS only |

---

## Security Considerations

1. **Authentication:**
   - OTP expires after 5 minutes
   - Rate limit code requests (3 per 10 min)
   - JWT tokens with 24h expiry
   - Refresh token rotation

2. **Data Protection:**
   - Hash sensitive data (OTP codes)
   - HTTPS everywhere
   - Firestore security rules
   - Input validation (zod)

3. **API Security:**
   - CORS configuration
   - Helmet.js headers
   - Request rate limiting
   - SQL injection N/A (NoSQL)

---

## Success Criteria

- [ ] Manager can login via phone + SMS OTP
- [ ] Manager can CRUD employees
- [ ] Employee receives invitation email
- [ ] Employee can setup account via email link
- [ ] Employee can login via email + OTP
- [ ] Manager and employee can chat in real-time
- [ ] Messages persist across sessions
- [ ] Application runs locally with clear instructions

---

## Unresolved Questions

1. **Task Management:** Requirements mention tasks but no detailed CRUD endpoints - implement basic version or skip?
2. **Multiple Managers:** Single manager or multi-manager support needed?
3. **Deployment:** Local development only or need cloud deployment guide?

---

## Next Steps

1. Create detailed implementation plan with phase files
2. Bootstrap project structure
3. Begin Phase 1 implementation

**Ready to proceed with `/plan` to generate detailed implementation plan?**
