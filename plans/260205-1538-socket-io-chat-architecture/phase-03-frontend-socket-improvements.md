# Phase 3: Frontend Socket Improvements

## Context
- Parent: [plan.md](./plan.md)
- Depends on: [Phase 2](./phase-02-message-delivery-system.md)

## Overview
- **Priority**: High
- **Status**: implemented -- review findings pending fix
- **Effort**: 2h

Enhance frontend socket handling with optimistic updates, message queue, and status UI.

## Key Insights
- Current: Basic socket context, no message queue
- Need: Optimistic UI, offline queue, status indicators
- Hook-based API for components

## Requirements

**Functional:**
- Optimistic message sending (show immediately)
- Message queue for offline scenarios
- Display delivery/read status icons
- Show online/offline presence
- Connection status indicator

**Non-Functional:**
- Smooth UX during reconnection
- No duplicate messages

## Architecture

```
contexts/
├── socket-context.tsx (refactor - connection only)
hooks/
├── use-chat.ts (refactor - add status handling)
├── use-presence.ts (NEW - online status)
├── use-message-queue.ts (NEW - offline queue)
components/chat/
├── message-status-indicator.tsx (NEW)
├── connection-status-badge.tsx (NEW)
```

## Related Code Files

**Modify:**
- `frontend/src/contexts/socket-context.tsx`
- `frontend/src/hooks/use-chat.ts`
- `frontend/src/components/chat/message-bubble.tsx`

**Create:**
- `frontend/src/hooks/use-presence.ts`
- `frontend/src/hooks/use-message-queue.ts`
- `frontend/src/components/chat/message-status-indicator.tsx`
- `frontend/src/components/chat/connection-status-badge.tsx`

## Implementation Steps

1. Create `use-message-queue.ts`:
   - Store pending messages in localStorage
   - Retry on reconnection
   - Clear on successful ack

2. Create `use-presence.ts`:
   - Listen to presence events
   - Track online users Map
   - Expose `isOnline(userId)` function

3. Update `use-chat.ts`:
   - Add optimistic message insert
   - Handle message-status-update events
   - Update message status in state

4. Create `message-status-indicator.tsx`:
   - Single check: sent
   - Double check: delivered
   - Blue double check: read
   - Clock icon: sending

5. Create `connection-status-badge.tsx`:
   - Green dot: connected
   - Yellow dot: reconnecting
   - Red dot: disconnected

6. Update `message-bubble.tsx`:
   - Show status indicator for own messages
   - Add timestamp + status layout

## Todo List

- [x] Create use-message-queue hook
- [x] Create use-presence hook
- [x] Update use-chat for status
- [x] Create message-status-indicator component
- [x] Create connection-status-badge component
- [x] Update message-bubble with status
- [ ] Test offline/online scenarios
- [ ] **[H3] Switch `processingIds` from state to `useRef` -- stale closure risk in queue flush**
- [ ] **[H4] Add `'failed'` status; surface error in `MessageStatusIndicator`; add retry path**
- [ ] **[M2] Wire `connecting` state from socket-context, or remove dead branch in badge**
- [ ] **[L1] Collapse duplicated SVG in `MessageStatusIndicator` (delivered vs read differ only in color)**
- [ ] **[L2] Extract shared `generateTempId()` util -- currently duplicated in use-chat + use-message-queue**

## Success Criteria

- Messages show instantly (optimistic)
- Status icons update in real-time
- Offline messages sent on reconnect
- Connection status visible to user

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Duplicate messages | High | Track by tempId |
| localStorage full | Low | Limit queue size |

## Security Considerations

- Don't store sensitive data in localStorage
- Validate message content before display
