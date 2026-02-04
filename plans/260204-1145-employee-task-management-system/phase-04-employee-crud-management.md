# Phase 04: Employee CRUD Management

## Context Links

- [Parent Plan](./plan.md)
- [Phase 03: Manager Authentication](./phase-03-manager-authentication.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 4h |
| Implementation Status | pending |
| Review Status | pending |

Implement employee management CRUD operations for managers. Create, read, update, delete employees with email invitations via Nodemailer.

## Key Insights

- Manager-only routes (require manager role)
- Nodemailer with Gmail App Password for sending emails
- Setup token generated for employee account creation
- Employee linked to manager who created them
- Soft delete preferred (isActive flag)

## Requirements

### Functional
- Create employee with name, email, department
- Send invitation email with setup link
- Get single employee by ID
- List all employees for logged-in manager
- Update employee details and schedule
- Delete employee (soft delete)

### Non-Functional
- Email delivery within 30 seconds
- Paginated employee list (10 per page)
- Only manager's employees visible

## Architecture

```
Manager → POST /employees → Create Employee → Generate Setup Token
                                                      ↓
                                          Save to Firestore
                                                      ↓
                                          Send Email (Nodemailer)
                                                      ↓
Employee ← Email with setup link ← Gmail SMTP
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/employees | List manager's employees |
| GET | /api/employees/:id | Get single employee |
| POST | /api/employees | Create new employee |
| PUT | /api/employees/:id | Update employee |
| DELETE | /api/employees/:id | Delete employee |

## Related Code Files

### Files to Create
- `backend/src/services/email-service.ts`
- `backend/src/services/employee-service.ts`
- `backend/src/controllers/employee-controller.ts`
- `backend/src/routes/employee-routes.ts`

### Files to Modify
- `backend/src/index.ts` (add routes)
- `backend/package.json` (add nodemailer)

## Implementation Steps

### 1. Install Nodemailer

```bash
cd backend
npm install nodemailer
npm install -D @types/nodemailer
```

### 2. Create Email Service

`backend/src/services/email-service.ts`:
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Gmail App Password
  },
});

export const sendInvitationEmail = async (
  to: string,
  employeeName: string,
  setupToken: string
): Promise<void> => {
  const setupUrl = `${process.env.FRONTEND_URL}/setup?token=${setupToken}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: 'Welcome! Set up your account',
    html: `
      <h1>Welcome, ${employeeName}!</h1>
      <p>You have been added to the Employee Task Management System.</p>
      <p>Click the link below to set up your account:</p>
      <a href="${setupUrl}">${setupUrl}</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
};
```

### 3. Create Employee Service

`backend/src/services/employee-service.ts`:
```typescript
import crypto from 'crypto';
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

interface CreateEmployeeInput {
  name: string;
  email: string;
  department: string;
  role?: string;
  managerId: string;
}

interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  phone?: string;
  schedule?: {
    workDays: string[];
    startTime: string;
    endTime: string;
  };
}

export const generateSetupToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const createEmployee = async (input: CreateEmployeeInput) => {
  const db = getDb();
  const setupToken = generateSetupToken();

  // Create user record for employee
  const userRef = await db.collection('users').add({
    email: input.email,
    role: 'employee',
    name: input.name,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  // Create employee record
  const employeeRef = await db.collection('employees').add({
    userId: userRef.id,
    name: input.name,
    email: input.email,
    department: input.department,
    role: input.role || 'Employee',
    managerId: input.managerId,
    isActive: true,
    setupCompleted: false,
    setupToken,
    setupTokenExpiry: Timestamp.fromDate(
      new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    ),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  return { employeeId: employeeRef.id, setupToken };
};

export const getEmployeeById = async (employeeId: string, managerId: string) => {
  const db = getDb();
  const doc = await db.collection('employees').doc(employeeId).get();

  if (!doc.exists) return null;

  const data = doc.data();
  if (data?.managerId !== managerId) return null; // Security check

  return { id: doc.id, ...data };
};

export const listEmployees = async (managerId: string) => {
  const db = getDb();
  const snapshot = await db
    .collection('employees')
    .where('managerId', '==', managerId)
    .where('isActive', '==', true)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const updateEmployee = async (
  employeeId: string,
  managerId: string,
  updates: UpdateEmployeeInput
) => {
  const db = getDb();
  const docRef = db.collection('employees').doc(employeeId);
  const doc = await docRef.get();

  if (!doc.exists) return null;
  if (doc.data()?.managerId !== managerId) return null;

  await docRef.update({
    ...updates,
    updatedAt: Timestamp.now(),
  });

  return { id: employeeId, ...updates };
};

export const deleteEmployee = async (employeeId: string, managerId: string) => {
  const db = getDb();
  const docRef = db.collection('employees').doc(employeeId);
  const doc = await docRef.get();

  if (!doc.exists) return false;
  if (doc.data()?.managerId !== managerId) return false;

  // Soft delete
  await docRef.update({
    isActive: false,
    updatedAt: Timestamp.now(),
  });

  return true;
};
```

### 4. Create Employee Controller

`backend/src/controllers/employee-controller.ts`:
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/express-types.js';
import * as employeeService from '../services/employee-service.js';
import { sendInvitationEmail } from '../services/email-service.js';
import { sendSuccess, sendError } from '../utils/response-utils.js';
import { AppError } from '../middleware/error-handler-middleware.js';

export const createEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, department } = req.body;
    const managerId = req.userId!;

    if (!name || !email || !department) {
      throw new AppError('Name, email, and department required', 400);
    }

    const result = await employeeService.createEmployee({
      name,
      email,
      department,
      managerId,
    });

    await sendInvitationEmail(email, name, result.setupToken);

    sendSuccess(
      res,
      { employeeId: result.employeeId },
      'Employee created, invitation sent',
      201
    );
  } catch (error) {
    next(error);
  }
};

export const getEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const employee = await employeeService.getEmployeeById(id, managerId);

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, employee);
  } catch (error) {
    next(error);
  }
};

export const listEmployees = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const managerId = req.userId!;
    const employees = await employeeService.listEmployees(managerId);

    sendSuccess(res, employees);
  } catch (error) {
    next(error);
  }
};

export const updateEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;
    const updates = req.body;

    const employee = await employeeService.updateEmployee(id, managerId, updates);

    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, employee, 'Employee updated');
  } catch (error) {
    next(error);
  }
};

export const deleteEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const managerId = req.userId!;

    const deleted = await employeeService.deleteEmployee(id, managerId);

    if (!deleted) {
      throw new AppError('Employee not found', 404);
    }

    sendSuccess(res, null, 'Employee deleted');
  } catch (error) {
    next(error);
  }
};
```

### 5. Create Employee Routes

`backend/src/routes/employee-routes.ts`:
```typescript
import { Router } from 'express';
import { authMiddleware, managerOnly } from '../middleware/auth-middleware.js';
import * as employeeController from '../controllers/employee-controller.js';

const router = Router();

// All routes require manager authentication
router.use(authMiddleware, managerOnly);

router.get('/', employeeController.listEmployees);
router.get('/:id', employeeController.getEmployee);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

export default router;
```

### 6. Update Main Entry Point

Add to `backend/src/index.ts`:
```typescript
import employeeRoutes from './routes/employee-routes.js';

app.use('/api/employees', employeeRoutes);
```

## Todo List

- [ ] Install Nodemailer
- [ ] Create email service with Gmail
- [ ] Create employee service (CRUD operations)
- [ ] Create employee controller
- [ ] Create employee routes
- [ ] Add routes to main entry point
- [ ] Test create employee endpoint
- [ ] Verify invitation email sent
- [ ] Test get single employee
- [ ] Test list employees
- [ ] Test update employee
- [ ] Test delete employee

## Success Criteria

- [ ] POST `/api/employees` creates employee and sends email
- [ ] GET `/api/employees` returns manager's employees only
- [ ] GET `/api/employees/:id` returns single employee
- [ ] PUT `/api/employees/:id` updates employee
- [ ] DELETE `/api/employees/:id` soft deletes employee
- [ ] Invitation email received with setup link
- [ ] Only manager can access their own employees

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Gmail email delivery issues | Medium | High | Use App Password, check spam |
| Setup token expiry handling | Low | Medium | Check expiry on setup |
| Manager accessing other's employees | Low | High | Verify managerId on all ops |

## Security Considerations

- Manager can only access their employees
- Setup token expires in 24 hours
- Soft delete preserves data integrity
- Validate email format before sending
- Input validation on all fields

## Next Steps

After completion:
1. Proceed to [Phase 05: Employee Authentication](./phase-05-employee-authentication.md)
2. Test full employee creation flow
