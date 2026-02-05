# Phase 2: Message Delivery System

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 1](./phase-01-backend-event-architecture.md)

## Overview
- **Priority**: High
- **Status**: implemented -- review findings pending fix
- **Effort**: 2h

Implement message delivery status tracking (sent → delivered → read).

## Key Insights
- Current: Messages saved but no delivery confirmation
- Need: Track per-message status in Firestore
- Frontend needs optimistic updates with status sync

## Requirements

**Functional:**
- Message status: `sending` → `sent` → `delivered` → `read`
- Server acknowledges receipt (sent)
- Recipient online = delivered instantly
- Read when chat opened

**Non-Functional:**
- Status updates in <100ms
- Handle offline recipients

## Architecture

```
Message Flow:
1. Client sends → status: "sending" (local)
2. Server saves → ack callback → status: "sent"
3. Server emits to recipient room
4. If recipient online → emit "delivered" → status: "delivered"
5. Recipient opens chat → emit "read" → status: "read"
```

## Related Code Files

**Modify:**
- `backend/src/entities/message.entity.ts` - add status field
- `backend/src/services/chat-service.ts` - status updates
- `backend/src/socket/handlers/chat-message-handler.ts`

## Implementation Steps

1. Update message entity:
   ```typescript
   status: 'sent' | 'delivered' | 'read'
   deliveredAt?: Timestamp
   readAt?: Timestamp
   ```

2. Modify `saveMessage()`:
   - Set initial status: 'sent'
   - Return message with ID for ack

3. Add delivery tracking in chat handler:
   - Check if recipient socket connected
   - If yes: update to 'delivered', emit status
   - If no: stays 'sent' until they connect

4. Update `markAsRead()`:
   - Batch update all unread to 'read'
   - Emit 'messages-read' with message IDs

5. Add 'message-status-update' event:
   - Emit to sender when status changes

## Todo List

- [x] Add status field to MessageDocument
- [x] Update saveMessage to set initial status
- [x] Track delivery on recipient connection
- [x] Implement message-status-update event
- [x] Update markAsRead for read status
- [ ] Test full delivery flow
- [ ] **[H1] Fix delivery check: use room membership instead of `presenceStore.isOnline()`**
- [ ] **[H2] Convert `markAllAsRead` sequential loop to Firestore batch write**
- [ ] **[M3] Replace `as any` cast in load-more with `Timestamp.fromDate()`**
- [ ] **[M5] Remove unused `getUndeliveredMessages` export from chat-service**
- [ ] **[L3] Add comment on backend `MessageStatus` clarifying `sending` is client-only**

## Success Criteria

- Messages show correct status in UI
- Status updates emit in real-time
- Read receipts batch update correctly

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Status sync lag | Medium | Use optimistic updates |
| Firestore writes | Low | Batch status updates |
