# Phase 06: Real-time Chat (Socket.io)

## Context Links

- [Parent Plan](./plan.md)
- [Phase 05: Employee Authentication](./phase-05-employee-authentication.md)
- [Backend Research](./research/researcher-01-firebase-express-backend.md)

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-04 |
| Priority | P1 - Critical |
| Effort | 5h |
| Implementation Status | pending |
| Review Status | pending |

Implement real-time chat between managers and employees using Socket.io with message persistence in Firestore.

## Key Insights

- Socket.io provides WebSocket with fallback
- Authenticate socket connections with JWT
- Use rooms for manager-employee chat pairs
- Persist messages to Firestore for history
- Typing indicators via socket events
- Read receipts update message status

## Requirements

### Functional
- Manager can chat with any employee they created
- Employee can chat with their manager
- Messages appear instantly (real-time)
- Message history persists across sessions
- Typing indicator shows when user is typing
- Messages marked as read

### Non-Functional
- Message delivery < 100ms
- Support 100 concurrent connections
- Message history paginated (50 per load)

## Architecture

```
Client A → Socket.io → Server → Firestore (persist)
                         ↓
                    Socket.io
                         ↓
                    Client B (real-time)
```

### Chat Room Structure
- Chat room ID: `{managerId}_{employeeId}` (sorted)
- Participants: manager and employee only
- Messages stored in `messages` collection

### Socket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| authenticate | Client → Server | Send JWT for auth |
| join-chat | Client → Server | Join chat room |
| leave-chat | Client → Server | Leave chat room |
| send-message | Client → Server | Send new message |
| receive-message | Server → Client | New message received |
| typing | Client → Server | User typing |
| stop-typing | Client → Server | User stopped typing |
| user-typing | Server → Client | Show typing indicator |
| message-read | Client → Server | Mark message as read |

## Related Code Files

### Files to Create
- `backend/src/services/chat-service.ts`
- `backend/src/socket/socket-handler.ts`
- `backend/src/socket/socket-auth.ts`

### Files to Modify
- `backend/src/index.ts` (add Socket.io)
- `backend/package.json` (add socket.io)

## Implementation Steps

### 1. Install Socket.io

```bash
cd backend
npm install socket.io
npm install -D @types/socket.io
```

### 2. Create Socket Auth

`backend/src/socket/socket-auth.ts`:
```typescript
import { Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt-utils.js';
import { UserPayload } from '../types/api-types.js';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'manager' | 'employee';
  userEmail?: string;
  userPhone?: string;
}

export const socketAuth = (
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): void => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error('Authentication required'));
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.userRole = decoded.role;
    socket.userEmail = decoded.email;
    socket.userPhone = decoded.phoneNumber;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
};
```

### 3. Create Chat Service

`backend/src/services/chat-service.ts`:
```typescript
import { getDb } from '../config/firebase-admin-config.js';
import { Timestamp } from 'firebase-admin/firestore';

interface Message {
  id?: string;
  chatId: string;
  senderId: string;
  senderRole: 'manager' | 'employee';
  content: string;
  read: boolean;
  createdAt: Timestamp;
}

export const getChatId = (managerId: string, employeeId: string): string => {
  return [managerId, employeeId].sort().join('_');
};

export const saveMessage = async (
  chatId: string,
  senderId: string,
  senderRole: 'manager' | 'employee',
  content: string
): Promise<Message> => {
  const db = getDb();

  const message: Omit<Message, 'id'> = {
    chatId,
    senderId,
    senderRole,
    content,
    read: false,
    createdAt: Timestamp.now(),
  };

  const docRef = await db.collection('messages').add(message);

  return { id: docRef.id, ...message };
};

export const getMessages = async (
  chatId: string,
  limit = 50,
  beforeTimestamp?: Timestamp
): Promise<Message[]> => {
  const db = getDb();

  let query = db
    .collection('messages')
    .where('chatId', '==', chatId)
    .orderBy('createdAt', 'desc')
    .limit(limit);

  if (beforeTimestamp) {
    query = query.where('createdAt', '<', beforeTimestamp);
  }

  const snapshot = await query.get();

  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() } as Message))
    .reverse();
};

export const markAsRead = async (
  chatId: string,
  readerId: string
): Promise<void> => {
  const db = getDb();

  const snapshot = await db
    .collection('messages')
    .where('chatId', '==', chatId)
    .where('read', '==', false)
    .where('senderId', '!=', readerId)
    .get();

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

export const validateChatAccess = async (
  userId: string,
  userRole: 'manager' | 'employee',
  chatId: string
): Promise<boolean> => {
  const db = getDb();
  const [id1, id2] = chatId.split('_');

  if (userRole === 'manager') {
    // Manager must own the employee
    const employee = await db.collection('employees').doc(id2 === userId ? id1 : id2).get();
    return employee.exists && employee.data()?.managerId === userId;
  } else {
    // Employee must be linked to manager
    const snapshot = await db
      .collection('employees')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return false;
    const employee = snapshot.docs[0].data();
    return chatId.includes(employee.managerId);
  }
};
```

### 4. Create Socket Handler

`backend/src/socket/socket-handler.ts`:
```typescript
import { Server as SocketIOServer } from 'socket.io';
import { AuthenticatedSocket, socketAuth } from './socket-auth.js';
import * as chatService from '../services/chat-service.js';

export const setupSocketHandlers = (io: SocketIOServer): void => {
  io.use(socketAuth);

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join chat room
    socket.on('join-chat', async (data: { chatId: string }) => {
      const { chatId } = data;

      // Validate access
      const hasAccess = await chatService.validateChatAccess(
        socket.userId!,
        socket.userRole!,
        chatId
      );

      if (!hasAccess) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      socket.join(chatId);

      // Load message history
      const messages = await chatService.getMessages(chatId);
      socket.emit('message-history', messages);

      // Mark messages as read
      await chatService.markAsRead(chatId, socket.userId!);
    });

    // Leave chat room
    socket.on('leave-chat', (data: { chatId: string }) => {
      socket.leave(data.chatId);
    });

    // Send message
    socket.on('send-message', async (data: { chatId: string; content: string }) => {
      const { chatId, content } = data;

      if (!content.trim()) return;

      const message = await chatService.saveMessage(
        chatId,
        socket.userId!,
        socket.userRole!,
        content.trim()
      );

      // Broadcast to room (including sender)
      io.to(chatId).emit('receive-message', message);
    });

    // Typing indicators
    socket.on('typing', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-typing', {
        userId: socket.userId,
        userRole: socket.userRole,
      });
    });

    socket.on('stop-typing', (data: { chatId: string }) => {
      socket.to(data.chatId).emit('user-stop-typing', {
        userId: socket.userId,
      });
    });

    // Mark as read
    socket.on('message-read', async (data: { chatId: string }) => {
      await chatService.markAsRead(data.chatId, socket.userId!);
      socket.to(data.chatId).emit('messages-read', {
        chatId: data.chatId,
        readerId: socket.userId,
      });
    });

    // Load more messages
    socket.on('load-more', async (data: { chatId: string; beforeTimestamp: string }) => {
      const messages = await chatService.getMessages(
        data.chatId,
        50,
        new Date(data.beforeTimestamp) as any
      );
      socket.emit('more-messages', messages);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });
};
```

### 5. Update Main Entry Point

Update `backend/src/index.ts`:
```typescript
import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { initializeFirebase } from './config/firebase-admin-config.js';
import { errorHandler } from './middleware/error-handler-middleware.js';
import { generalLimiter } from './middleware/rate-limiter-middleware.js';
import managerAuthRoutes from './routes/manager-auth-routes.js';
import employeeAuthRoutes from './routes/employee-auth-routes.js';
import employeeRoutes from './routes/employee-routes.js';
import { setupSocketHandlers } from './socket/socket-handler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

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

// Routes
app.use('/api/auth/manager', managerAuthRoutes);
app.use('/api/auth/employee', employeeAuthRoutes);
app.use('/api/employees', employeeRoutes);

// Socket.io handlers
setupSocketHandlers(io);

// Error handler
app.use(errorHandler);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, io };
```

## Todo List

- [ ] Install Socket.io
- [ ] Create socket authentication
- [ ] Create chat service
- [ ] Create socket handler
- [ ] Update main entry with Socket.io
- [ ] Test socket connection with auth
- [ ] Test join-chat event
- [ ] Test send-message event
- [ ] Test typing indicators
- [ ] Test message persistence
- [ ] Test message history loading
- [ ] Test read receipts

## Success Criteria

- [ ] Socket connects with valid JWT
- [ ] Socket rejects invalid/missing JWT
- [ ] User can join authorized chat rooms only
- [ ] Messages delivered in real-time
- [ ] Messages persisted to Firestore
- [ ] Message history loads on join
- [ ] Typing indicator works
- [ ] Read receipts update

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Socket connection drops | Medium | Medium | Auto-reconnect on client |
| Message ordering issues | Low | Medium | Use Firestore timestamp |
| Unauthorized room access | Low | High | Validate access on join |

## Security Considerations

- Authenticate all socket connections
- Validate room access before join
- Sanitize message content
- Rate limit message sending
- Validate chatId format

## Next Steps

After completion:
1. Proceed to [Phase 07: Frontend Auth Pages](./phase-07-frontend-auth-pages.md)
2. Backend complete - ready for frontend integration
