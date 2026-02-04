---
title: "Employee Task Management System"
description: "Full-stack app with manager/employee auth, CRUD, real-time chat"
status: pending
priority: P1
effort: 40h
branch: main
tags: [react, express, firebase, socket.io, twilio]
created: 2026-02-04
---

# Employee Task Management System - Implementation Plan

## Overview

Real-time employee task management tool with:
- Manager auth via phone + SMS OTP (Twilio)
- Employee auth via email verification (Nodemailer)
- Employee CRUD management
- Real-time chat (Socket.io)

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

## Phase Overview

| Phase | Name | Status | Effort | File |
|-------|------|--------|--------|------|
| 01 | Project Setup | pending | 3h | [phase-01](./phase-01-project-setup.md) |
| 02 | Backend Core | pending | 4h | [phase-02](./phase-02-backend-core.md) |
| 03 | Manager Authentication | pending | 4h | [phase-03](./phase-03-manager-authentication.md) |
| 04 | Employee CRUD Management | pending | 4h | [phase-04](./phase-04-employee-crud-management.md) |
| 05 | Employee Authentication | pending | 3h | [phase-05](./phase-05-employee-authentication.md) |
| 06 | Real-time Chat (Socket.io) | pending | 5h | [phase-06](./phase-06-realtime-chat-socketio.md) |
| 07 | Frontend Auth Pages | pending | 4h | [phase-07](./phase-07-frontend-auth-pages.md) |
| 08 | Manager Dashboard UI | pending | 5h | [phase-08](./phase-08-manager-dashboard-ui.md) |
| 09 | Chat Feature UI | pending | 4h | [phase-09](./phase-09-chat-feature-ui.md) |
| 10 | Employee Dashboard UI | pending | 3h | [phase-10](./phase-10-employee-dashboard-ui.md) |
| 11 | Polish & Documentation | pending | 2h | [phase-11](./phase-11-polish-and-documentation.md) |

## Key Dependencies

- Firebase project with Firestore enabled
- Twilio account for SMS
- Gmail account with App Password for Nodemailer
- Node.js 18+ LTS

## Critical Path

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
                                              ↓
Phase 11 ← Phase 10 ← Phase 9 ← Phase 8 ← Phase 7
```

## Success Criteria

- [ ] Manager login via phone + SMS OTP
- [ ] Manager CRUD employees
- [ ] Employee receives invitation email
- [ ] Employee setup account via email link
- [ ] Employee login via email + OTP
- [ ] Real-time chat between manager/employee
- [ ] Messages persist across sessions
- [ ] Clear README with run instructions

## Related Reports

- [Brainstorm Report](../reports/brainstorm-260204-1145-employee-task-management-system.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)
- [Frontend Research](./research/researcher-02-vite-react-frontend.md)

---

## Validation Log

### Session 1 — 2026-02-04
**Trigger:** Initial plan creation validation
**Questions asked:** 6

#### Questions & Answers

1. **[Scope]** The plan assumes any phone number can register as a manager. Should manager registration be restricted?
   - Options: Open registration (Recommended) | Whitelist only | Admin approval
   - **Answer:** Open registration (Recommended)
   - **Rationale:** Simplest approach for MVP/demo. No need to maintain whitelist or approval workflow.

2. **[Architecture]** The plan uses soft delete (isActive=false) for employees. What about related data (messages, tasks)?
   - Options: Keep all data (Recommended) | Anonymize messages | Hard delete cascade
   - **Answer:** Keep all data (Recommended)
   - **Rationale:** Preserves chat history for manager reference. Soft delete is reversible.

3. **[Security]** JWT tokens are set to 24h expiry. Is this appropriate for your security needs?
   - Options: 24 hours (Recommended) | 1 hour + refresh token | 7 days
   - **Answer:** 24 hours (Recommended)
   - **Rationale:** Good UX/security balance. Avoids refresh token complexity for MVP.

4. **[Scope]** The requirements mention task management but the plan focuses on chat. Should tasks be included in MVP?
   - Options: Basic tasks (Recommended) | Chat only for MVP | Full task management
   - **Answer:** Basic tasks (Recommended)
   - **Rationale:** Requirements explicitly mention task assignment. Basic CRUD is sufficient.

5. **[Development]** For development/testing, how should we handle SMS without real Twilio costs?
   - Options: Console log + real Twilio (Recommended) | Twilio test credentials | Always real SMS
   - **Answer:** Console log + real Twilio (Recommended)
   - **Rationale:** Log OTP in dev mode for easy testing. Real SMS only in production.

6. **[Prerequisites]** Do you have Firebase project credentials ready, or need setup guidance?
   - Options: Already have credentials | Need setup guidance
   - **Answer:** Already have credentials
   - **Rationale:** User has Firebase setup. No additional setup docs needed in Phase 1.

#### Confirmed Decisions
- **Manager registration:** Open — any phone can register as manager
- **Data deletion:** Soft delete only — preserve messages and tasks
- **JWT expiry:** 24 hours — no refresh token for MVP
- **Task feature:** Include basic tasks — CRUD with status tracking
- **SMS dev mode:** Console log OTP — real Twilio in production only
- **Firebase:** Ready — user has credentials configured

#### Action Items
- [ ] Add basic task CRUD endpoints to Phase 4 or create Phase 4.5
- [ ] Add dev mode OTP logging in Twilio service (Phase 3)
- [ ] Add task UI components to manager/employee dashboards

#### Impact on Phases
- **Phase 3:** Add conditional SMS sending (console log in dev, Twilio in prod)
- **Phase 4:** Consider adding basic task creation when creating employee
- **Phase 8:** Add task management UI to manager dashboard
- **Phase 10:** Add task list and "mark done" to employee dashboard
