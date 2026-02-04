# Firebase + Express.js + TypeScript Backend Setup Research

**Date:** 2026-02-04 | **Author:** Researcher | **Status:** Complete

## 1. Firebase Admin SDK Setup with Express.js TypeScript

**Prerequisites:**
- Node.js 18+ (18 LTS or 20+ recommended for 2026)
- TypeScript 5.x
- Firebase Admin SDK latest version

**Installation:**
```bash
npm install firebase-admin express
npm install -D typescript @types/express @types/node
```

**Initialization Pattern:**
```typescript
// Use Google Application Default Credentials (preferred for 2026)
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = initializeApp();
export const db = getFirestore(app);
export const adminAuth = getAuth(app);
```

**Express Middleware Integration:**
- Wrap Firebase initialization in Express middleware layer
- Initialize admin SDK once globally (singleton pattern)
- Use async/await for Firestore operations
- Implement proper error handling (try-catch blocks)

---

## 2. Firestore Data Modeling for Auth + Chat

**Collection Structure (Recommended):**
```
users/
├── {userId}/
│   ├── profile: { email, displayName, photoURL, createdAt }
│   ├── settings: { theme, notifications, lastSeen }
│   └── presence: { status, lastActivity, socketId }

conversations/
├── {conversationId}/
│   ├── metadata: { createdAt, lastMessageAt, participants, title }
│   ├── messages/
│   │   └── {messageId}: { content, senderId, timestamp, read }

contacts/
├── {userId}/
│   └── {contactId}: { addedAt, status, nickname }
```

**Key Principles:**
- Avoid nested subcollections for high-volume data (messages scale poorly)
- Use document references instead of redundant data
- Store user presence separately (hot updates)
- Implement soft deletes with `deletedAt` timestamp
- Index frequently queried fields (userId, createdAt, conversationId)

---

## 3. JWT Authentication with Firebase

**Hybrid Approach (2026 Best Practice):**
- Firebase ID tokens for client authentication (auto-refreshed)
- Custom JWT tokens from backend for Express endpoints
- Use `admin.auth().createCustomToken(uid)` for advanced scenarios

**Express Auth Middleware:**
```typescript
import { getAuth } from 'firebase-admin/auth';

export const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.uid = decodedToken.uid;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

**Pattern:** Verify Firebase ID tokens server-side, attach user context to request object.

---

## 4. Socket.io + Express + Firebase Integration

**Setup:**
```typescript
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

const app = express();
const httpServer = http.createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.use((socket, next) => {
  // Verify Firebase token before connection
  verifySocketToken(socket.handshake.auth.token)
    .then(() => next())
    .catch(err => next(err));
});
```

**Best Practices:**
- Authenticate socket connections via Firebase tokens
- Store active socket IDs in Firestore `users/{uid}/presence`
- Use socket rooms for conversation groups
- Implement presence tracking (online/offline status)
- Sync socket events with Firestore using batch writes

**Real-time Chat Flow:**
1. Client emits message via socket
2. Server validates, writes to Firestore
3. Firestore triggers batch listeners
4. Socket.io broadcasts to conversation participants

---

## 5. Security Best Practices (2026)

**Firestore Security Rules Template:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /conversations/{convId} {
      allow read: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
    }
    match /conversations/{convId}/messages/{msgId} {
      allow read: if parent_exists && request.auth.uid in parent.data.participants;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

**Rate Limiting:**
- Implement token bucket (express-rate-limit middleware)
- Firestore write limits: 1 write per second per document
- Socket message throttling: Rate limit emits per socket
- Use Cloud Tasks for distributed rate limiting

**Additional Security:**
- Enable Application Default Credentials (no key files in repo)
- Use environment variables for sensitive config
- Implement CORS properly (whitelist origins)
- Enable Firestore audit logging
- Rotate service account keys monthly
- Use network security (VPC if on GCP)
- Implement input validation on all Express routes

---

## Key Insights for 2026

1. **Node 20+ is stable:** Use native ESM modules, top-level await
2. **Firebase SDK v9+ modularity:** Import only needed components
3. **Real-time architecture shift:** WebSocket > REST for chat systems
4. **Firestore costs:** Plan collection structure to minimize reads
5. **TypeScript strictness:** Enable `strict: true` in tsconfig.json

---

## Unresolved Questions

- Socket.io persistence strategy (Redis vs in-memory for scaling)?
- Optimal Firestore shard key for high-throughput message streams?
- GDPR compliance approach for Firestore user deletion cascade?
