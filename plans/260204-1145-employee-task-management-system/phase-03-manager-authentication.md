# Phase 03: Manager Authentication

## Context Links

- [Parent Plan](./plan.md)
- [Phase 02: Backend Core](./phase-02-backend-core.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 4h |
| Implementation Status | pending |
| Review Status | pending |

Implement manager authentication with phone number + SMS OTP via Twilio. Generate access codes, send SMS, validate and issue JWT tokens.

## Key Insights

- Twilio SDK for sending SMS messages
- OTP stored in Firestore with 5-min expiry
- Hash OTP before storing for security
- Rate limit code requests (5 per 10 min)
- Clear OTP after successful verification

## Requirements

### Functional
- Manager enters phone number to request OTP
- System generates 6-digit random code
- Code sent via Twilio SMS
- Manager enters code to verify
- JWT token issued on successful verification
- OTP cleared after use

### Non-Functional
- SMS delivery within 10 seconds
- OTP expires after 5 minutes
- Rate limit: 5 requests per 10 minutes

## Architecture

```
Manager → POST /send-code → Generate OTP → Save to Firestore → Send SMS (Twilio)
                                                                    ↓
Manager ← JWT Token ← POST /verify-code ← Validate OTP ← Manager enters code
```

### Data Flow
1. Manager submits phone number
2. Server generates 6-digit OTP
3. OTP saved to `users` collection with expiry
4. Twilio sends SMS with code
5. Manager submits code for verification
6. Server validates code and expiry
7. Server issues JWT token
8. OTP cleared from database

## Related Code Files

### Files to Create
- `backend/src/services/twilio-sms-service.ts`
- `backend/src/services/otp-service.ts`
- `backend/src/controllers/manager-auth-controller.ts`
- `backend/src/routes/manager-auth-routes.ts`

### Files to Modify
- `backend/src/index.ts` (add routes)
- `backend/package.json` (add twilio)

## Implementation Steps

### 1. Install Twilio SDK

```bash
cd backend
npm install twilio
npm install -D @types/twilio
```

### 2. Create Twilio SMS Service

`backend/src/services/twilio-sms-service.ts`:
```typescript
import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendSms = async (to: string, message: string): Promise<void> => {
  await client.messages.create({
    body: message,
    from: process.env.TWILIO_PHONE_NUMBER,
    to,
  });
};
```

### 3. Create OTP Service

`backend/src/services/otp-service.ts`:
```typescript
import crypto from 'crypto';
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

const OTP_EXPIRY_MINUTES = 5;

export const generateOtp = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOtp = (otp: string): string => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

export const saveOtp = async (
  phoneNumber: string,
  otp: string
): Promise<void> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);
  const expiry = Timestamp.fromDate(
    new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)
  );

  // Find or create user by phone
  const usersRef = db.collection('users');
  const snapshot = await usersRef
    .where('phoneNumber', '==', phoneNumber)
    .limit(1)
    .get();

  if (snapshot.empty) {
    // Create new manager user
    await usersRef.add({
      phoneNumber,
      role: 'manager',
      name: '',
      accessCode: hashedOtp,
      accessCodeExpiry: expiry,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  } else {
    // Update existing user
    await snapshot.docs[0].ref.update({
      accessCode: hashedOtp,
      accessCodeExpiry: expiry,
      updatedAt: Timestamp.now(),
    });
  }
};

export const verifyOtp = async (
  phoneNumber: string,
  otp: string
): Promise<{ valid: boolean; userId?: string }> => {
  const db = getDb();
  const hashedOtp = hashOtp(otp);

  const snapshot = await db
    .collection('users')
    .where('phoneNumber', '==', phoneNumber)
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
    return { valid: false }; // Expired
  }

  // Clear OTP after successful verification
  await doc.ref.update({
    accessCode: '',
    accessCodeExpiry: null,
    updatedAt: Timestamp.now(),
  });

  return { valid: true, userId: doc.id };
};
```

### 4. Create Manager Auth Controller

`backend/src/controllers/manager-auth-controller.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { generateOtp, saveOtp, verifyOtp } from '../services/otp-service.js';
import { sendSms } from '../services/twilio-sms-service.js';
import { generateToken } from '../utils/jwt-utils.js';
import { sendSuccess, sendError } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';

export const sendCode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      throw new AppError('Phone number required', 400);
    }

    const otp = generateOtp();
    await saveOtp(phoneNumber, otp);
    await sendSms(phoneNumber, `Your access code is: ${otp}`);

    sendSuccess(res, { codeSent: true }, 'Access code sent');
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
    const { phoneNumber, accessCode } = req.body;

    if (!phoneNumber || !accessCode) {
      throw new AppError('Phone number and access code required', 400);
    }

    const result = await verifyOtp(phoneNumber, accessCode);

    if (!result.valid || !result.userId) {
      throw new AppError('Invalid or expired access code', 401);
    }

    const token = generateToken({
      userId: result.userId,
      role: 'manager',
      phoneNumber,
    });

    sendSuccess(res, { token }, 'Authentication successful');
  } catch (error) {
    next(error);
  }
};
```

### 5. Create Manager Auth Routes

`backend/src/routes/manager-auth-routes.ts`:
```typescript
import { Router } from 'express';
import { sendCode, verifyCode } from '../controllers/manager-auth-controller.js';
import { authLimiter } from '../middleware/rate-limiter-middleware.js';

const router = Router();

router.post('/send-code', authLimiter, sendCode);
router.post('/verify-code', authLimiter, verifyCode);

export default router;
```

### 6. Update Main Entry Point

Add to `backend/src/index.ts`:
```typescript
import managerAuthRoutes from './routes/manager-auth-routes.js';

// After middleware setup
app.use('/api/auth/manager', managerAuthRoutes);
```

## Todo List

- [ ] Install Twilio SDK
- [ ] Create Twilio SMS service
- [ ] Create OTP service (generate, hash, save, verify)
- [ ] Create manager auth controller
- [ ] Create manager auth routes
- [ ] Add routes to main entry point
- [ ] Test send-code endpoint
- [ ] Test verify-code endpoint
- [ ] Verify SMS delivery
- [ ] Test OTP expiry

## Success Criteria

- [ ] POST `/api/auth/manager/send-code` sends SMS
- [ ] OTP stored hashed in Firestore
- [ ] OTP expires after 5 minutes
- [ ] POST `/api/auth/manager/verify-code` returns JWT
- [ ] OTP cleared after successful verification
- [ ] Rate limiter blocks excessive requests

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Twilio SMS delivery failure | Medium | High | Implement retry, log failures |
| OTP brute force | Low | High | Rate limiting, account lockout |
| Phone number validation | Medium | Medium | Validate format before sending |

## Security Considerations

- Hash OTP before storing
- OTP expires after 5 minutes
- Clear OTP after single use
- Rate limit requests (5/10min)
- Validate phone number format
- Log failed attempts (without exposing OTP)

## Next Steps

After completion:
1. Proceed to [Phase 04: Employee CRUD Management](./phase-04-employee-crud-management.md)
2. Test full authentication flow with real phone
