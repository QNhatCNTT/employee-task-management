# Phase 05: Employee Authentication

## Context Links

- [Parent Plan](./plan.md)
- [Phase 04: Employee CRUD Management](./phase-04-employee-crud-management.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 3h |
| Implementation Status | pending |
| Review Status | pending |

Implement employee authentication with setup flow (via email link) and login via email + OTP.

## Key Insights

- Setup token validates employee invitation link
- Employee completes profile via setup page
- Login uses email OTP (same pattern as manager SMS)
- Reuse OTP service with email instead of SMS
- Token marked as used after setup complete

## Requirements

### Functional
- Employee clicks setup link from invitation email
- Setup page validates token and shows form
- Employee submits name/profile info
- Account marked as setup complete
- Employee can login via email + OTP
- OTP sent to employee email
- JWT issued on successful verification

### Non-Functional
- Setup token expires in 24 hours
- OTP expires in 5 minutes
- Rate limit login attempts

## Architecture

```
Employee → GET /setup?token=xxx → Validate Token → Show Setup Form
                                                          ↓
Employee → POST /setup → Complete Profile → Mark setupCompleted
                                                          ↓
Employee → POST /send-code → Generate OTP → Send Email
                                                          ↓
Employee → POST /verify-code → Validate OTP → JWT Token
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/auth/employee/validate-token | Validate setup token |
| POST | /api/auth/employee/setup | Complete account setup |
| POST | /api/auth/employee/send-code | Send email OTP |
| POST | /api/auth/employee/verify-code | Verify OTP, return JWT |

## Related Code Files

### Files to Create
- `backend/src/controllers/employee-auth-controller.ts`
- `backend/src/routes/employee-auth-routes.ts`

### Files to Modify
- `backend/src/services/email-service.ts` (add OTP email)
- `backend/src/services/otp-service.ts` (add email support)
- `backend/src/index.ts` (add routes)

## Implementation Steps

### 1. Update Email Service

Add to `backend/src/services/email-service.ts`:
```typescript
export const sendOtpEmail = async (
  to: string,
  otp: string
): Promise<void> => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Your Login Code',
    html: `
      <h1>Your Login Code</h1>
      <p>Your access code is: <strong>${otp}</strong></p>
      <p>This code expires in 5 minutes.</p>
    `,
  });
};
```

### 2. Update OTP Service

Add to `backend/src/services/otp-service.ts`:
```typescript
export const saveOtpByEmail = async (
  email: string,
  otp: string
): Promise<void> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);
  const expiry = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error('User not found');
  }

  await snapshot.docs[0].ref.update({
    accessCode: hashedOtp,
    accessCodeExpiry: expiry,
    updatedAt: Timestamp.now(),
  });
};

export const verifyOtpByEmail = async (
  email: string,
  otp: string
): Promise<{ valid: boolean; userId?: string }> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);

  const snapshot = await db
    .collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { valid: false };
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  if (data.accessCode !== hashedOtp) {
    return { valid: false };
  }

  if (data.accessCodeExpiry.toDate() < new Date()) {
    return { valid: false };
  }

  await doc.ref.update({
    accessCode: '',
    accessCodeExpiry: null,
    updatedAt: Timestamp.now(),
  });

  return { valid: true, userId: doc.id };
};
```

### 3. Create Employee Auth Controller

`backend/src/controllers/employee-auth-controller.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { getDb } from '../config/firebase-admin-config.js';
import { generateOtp, saveOtpByEmail, verifyOtpByEmail } from '../services/otp-service.js';
import { sendOtpEmail } from '../services/email-service.js';
import { generateToken } from '../utils/jwt-utils.js';
import { sendSuccess, sendError } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';
import { Timestamp } from 'firebase-admin/firestore';

export const validateSetupToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token) {
      throw new AppError('Token required', 400);
    }

    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('setupToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Invalid token', 400);
    }

    const employee = snapshot.docs[0].data();

    if (employee.setupCompleted) {
      throw new AppError('Account already set up', 400);
    }

    if (employee.setupTokenExpiry.toDate() < new Date()) {
      throw new AppError('Token expired', 400);
    }

    sendSuccess(res, {
      name: employee.name,
      email: employee.email,
    });
  } catch (error) {
    next(error);
  }
};

export const completeSetup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { token, name } = req.body;

    if (!token) {
      throw new AppError('Token required', 400);
    }

    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('setupToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Invalid token', 400);
    }

    const employeeDoc = snapshot.docs[0];
    const employee = employeeDoc.data();

    if (employee.setupCompleted) {
      throw new AppError('Account already set up', 400);
    }

    // Update employee
    await employeeDoc.ref.update({
      name: name || employee.name,
      setupCompleted: true,
      setupToken: null,
      setupTokenExpiry: null,
      updatedAt: Timestamp.now(),
    });

    // Update linked user
    await db.collection('users').doc(employee.userId).update({
      name: name || employee.name,
      updatedAt: Timestamp.now(),
    });

    sendSuccess(res, { success: true }, 'Account setup complete');
  } catch (error) {
    next(error);
  }
};

export const sendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email required', 400);
    }

    // Verify employee exists and setup complete
    const db = getDb();
    const snapshot = await db
      .collection('employees')
      .where('email', '==', email)
      .where('setupCompleted', '==', true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new AppError('Account not found or setup incomplete', 400);
    }

    const otp = generateOtp();
    await saveOtpByEmail(email, otp);
    await sendOtpEmail(email, otp);

    sendSuccess(res, { codeSent: true }, 'Access code sent to email');
  } catch (error) {
    next(error);
  }
};

export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, accessCode } = req.body;

    if (!email || !accessCode) {
      throw new AppError('Email and access code required', 400);
    }

    const result = await verifyOtpByEmail(email, accessCode);

    if (!result.valid || !result.userId) {
      throw new AppError('Invalid or expired access code', 401);
    }

    const token = generateToken({
      userId: result.userId,
      role: 'employee',
      email,
    });

    sendSuccess(res, { token }, 'Authentication successful');
  } catch (error) {
    next(error);
  }
};
```

### 4. Create Employee Auth Routes

`backend/src/routes/employee-auth-routes.ts`:
```typescript
import { Router } from 'express';
import * as employeeAuthController from '../controllers/employee-auth-controller.js';
import { authLimiter } from '../middleware/rate-limiter-middleware.js';

const router = Router();

router.get('/validate-token', employeeAuthController.validateSetupToken);
router.post('/setup', employeeAuthController.completeSetup);
router.post('/send-code', authLimiter, employeeAuthController.sendCode);
router.post('/verify-code', authLimiter, employeeAuthController.verifyCode);

export default router;
```

### 5. Update Main Entry Point

Add to `backend/src/index.ts`:
```typescript
import employeeAuthRoutes from './routes/employee-auth-routes.js';

app.use('/api/auth/employee', employeeAuthRoutes);
```

## Todo List

- [ ] Update email service with OTP email
- [ ] Update OTP service with email methods
- [ ] Create employee auth controller
- [ ] Create employee auth routes
- [ ] Add routes to main entry point
- [ ] Test validate-token endpoint
- [ ] Test setup endpoint
- [ ] Test send-code endpoint
- [ ] Test verify-code endpoint
- [ ] Verify full flow from invite to login

## Success Criteria

- [ ] GET `/validate-token` returns employee info for valid token
- [ ] POST `/setup` completes account setup
- [ ] POST `/send-code` sends OTP email
- [ ] POST `/verify-code` returns JWT for valid code
- [ ] Setup token cannot be reused
- [ ] OTP expires after 5 minutes

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Email delivery delays | Medium | Medium | Show user to check spam |
| Token reuse attack | Low | High | Invalidate token after setup |
| Enumeration attack | Medium | Medium | Generic error messages |

## Security Considerations

- Invalidate setup token after use
- Hash OTP before storage
- Generic error messages (no user enumeration)
- Rate limit auth endpoints
- Validate email exists before sending OTP

## Next Steps

After completion:
1. Proceed to [Phase 06: Real-time Chat](./phase-06-realtime-chat-socketio.md)
2. Test complete employee journey (invite → setup → login)
