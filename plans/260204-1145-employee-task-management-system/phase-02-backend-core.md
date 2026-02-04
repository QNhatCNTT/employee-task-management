# Phase 02: Backend Core

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01: Project Setup](./phase-01-project-setup.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 4h |
| Implementation Status | pending |
| Review Status | pending |

Build Express server core with middleware, Firestore connection, JWT utilities, and error handling.

## Key Insights

- Firebase Admin SDK singleton pattern for connection
- JWT middleware extracts user from token, attaches to request
- Centralized error handling for consistent API responses
- Rate limiting prevents abuse

## Requirements

### Functional
- Express server with all middleware
- Firestore connection verified
- JWT token generation/validation
- Protected route middleware
- Centralized error handling

### Non-Functional
- Response time < 100ms for health check
- Proper HTTP status codes
- Consistent error response format

## Architecture

```
Request → CORS → Helmet → JSON Parser → Rate Limiter
                                            ↓
                              Auth Middleware (if protected)
                                            ↓
                                       Controller
                                            ↓
                                        Service
                                            ↓
                                       Firestore
                                            ↓
                              Error Handler → Response
```

### Data Flow
1. Request hits middleware stack
2. Auth middleware validates JWT (protected routes)
3. Controller handles request logic
4. Service interacts with Firestore
5. Error handler catches exceptions
6. Response sent with consistent format

## Related Code Files

### Files to Create
- `backend/src/config/firebase-admin-config.ts`
- `backend/src/middleware/auth-middleware.ts`
- `backend/src/middleware/error-handler-middleware.ts`
- `backend/src/middleware/rate-limiter-middleware.ts`
- `backend/src/utils/jwt-utils.ts`
- `backend/src/utils/response-utils.ts`
- `backend/src/types/express-types.d.ts`
- `backend/src/types/api-types.ts`

### Files to Modify
- `backend/src/index.ts`

## Implementation Steps

### 1. Create Custom Type Definitions

`backend/src/types/express-types.d.ts`:
```typescript
import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRole?: 'manager' | 'employee';
}
```

`backend/src/types/api-types.ts`:
```typescript
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserPayload {
  userId: string;
  role: 'manager' | 'employee';
  phoneNumber?: string;
  email?: string;
}
```

### 2. Create Firebase Admin Config

`backend/src/config/firebase-admin-config.ts`:
```typescript
import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let db: Firestore | null = null;

export const initializeFirebase = (): Firestore => {
  if (db) return db;

  const serviceAccount: ServiceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  };

  const app = initializeApp({ credential: cert(serviceAccount) });
  db = getFirestore(app);
  return db;
};

export const getDb = (): Firestore => {
  if (!db) throw new Error('Firebase not initialized');
  return db;
};
```

### 3. Create JWT Utilities

`backend/src/utils/jwt-utils.ts`:
```typescript
import jwt from 'jsonwebtoken';
import { UserPayload } from '../types/api-types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
const JWT_EXPIRY = '24h';

export const generateToken = (payload: UserPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};
```

### 4. Create Response Utilities

`backend/src/utils/response-utils.ts`:
```typescript
import { Response } from 'express';
import { ApiResponse } from '../types/api-types.js';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void => {
  const response: ApiResponse<T> = { success: true, data, message };
  res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  error: string,
  statusCode = 400
): void => {
  const response: ApiResponse = { success: false, error };
  res.status(statusCode).json(response);
};
```

### 5. Create Auth Middleware

`backend/src/middleware/auth-middleware.ts`:
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express-types.js';
import { verifyToken } from '../utils/jwt-utils.js';
import { sendError } from '../utils/response-utils.js';

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    sendError(res, 'No token provided', 401);
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
};

export const managerOnly = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.userRole !== 'manager') {
    sendError(res, 'Manager access required', 403);
    return;
  }
  next();
};
```

### 6. Create Error Handler Middleware

`backend/src/middleware/error-handler-middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response-utils.js';

export class AppError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
  }
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err.message);

  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  sendError(res, 'Internal server error', 500);
};
```

### 7. Create Rate Limiter Middleware

`backend/src/middleware/rate-limiter-middleware.ts`:
```typescript
import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, error: 'Too many requests' },
});

export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 requests per 10 min for OTP
  message: { success: false, error: 'Too many code requests' },
});
```

Install rate limiter:
```bash
npm install express-rate-limit
npm install -D @types/express-rate-limit
```

### 8. Update Main Entry Point

`backend/src/index.ts`:
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase-admin-config.js';
import { errorHandler } from './middleware/error-handler-middleware.js';
import { generalLimiter } from './middleware/rate-limiter-middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase
initializeFirebase();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL }));
app.use(express.json());
app.use(generalLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok' } });
});

// Routes will be added here

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
```

## Todo List

- [ ] Create custom TypeScript types
- [ ] Create Firebase Admin config with singleton
- [ ] Create JWT utilities (generate, verify)
- [ ] Create response utilities
- [ ] Create auth middleware
- [ ] Create manager-only middleware
- [ ] Create error handler middleware
- [ ] Create rate limiter middleware
- [ ] Update main entry point
- [ ] Test Firebase connection
- [ ] Test JWT generation/verification

## Success Criteria

- [ ] Firebase connects without errors
- [ ] JWT token generates with correct payload
- [ ] Auth middleware blocks invalid tokens
- [ ] Error handler returns consistent format
- [ ] Rate limiter blocks after threshold

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Firebase connection failure | Medium | High | Verify credentials, add retry |
| JWT secret leak | Low | Critical | Use env vars, never log |
| Rate limit too strict | Medium | Low | Adjust limits per route |

## Security Considerations

- JWT secret minimum 32 characters
- Rate limit auth routes stricter (5/10min)
- Never log tokens or passwords
- Validate all input data

## Next Steps

After completion:
1. Proceed to [Phase 03: Manager Authentication](./phase-03-manager-authentication.md)
2. Routes will use these middleware and utilities
