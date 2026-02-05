# Phase 1: Backend Event Architecture

## Context
- Parent: [plan.md](./plan.md)
- Current: `backend/src/socket/socket-handler.ts` (97 lines)

## Overview
- **Priority**: High
- **Status**: implemented -- review findings pending fix
- **Effort**: 2h

Refactor backend socket handlers with typed events, namespaces, and proper error handling.

## Key Insights
- Current implementation mixes all events in single handler
- No typed event payloads
- Error handling is minimal
- Missing message acknowledgments

## Requirements

**Functional:**
- Typed event system with interfaces
- Message acknowledgment (callback-based)
- Presence tracking (online/offline)
- Error events with codes

**Non-Functional:**
- Modular event handlers
- Type-safe payloads
- Logging for debugging

## Architecture

```
socket/
├── socket-auth.ts (keep)
├── socket-handler.ts (refactor - orchestrator)
├── socket-events.ts (NEW - event type definitions)
├── handlers/
│   ├── chat-handler.ts (NEW - chat events)
│   └── presence-handler.ts (NEW - online status)
```

## Related Code Files

**Modify:**
- `backend/src/socket/socket-handler.ts`

**Create:**
- `backend/src/socket/socket-events.ts`
- `backend/src/socket/handlers/chat-message-handler.ts`
- `backend/src/socket/handlers/presence-handler.ts`

## Implementation Steps

1. Create `socket-events.ts` with typed interfaces:
   - `ClientToServerEvents` (client emits)
   - `ServerToClientEvents` (server emits)
   - `SocketData` (per-socket data)

2. Create `handlers/chat-message-handler.ts`:
   - Extract chat logic from socket-handler
   - Add message acknowledgment callbacks
   - Implement delivery confirmation

3. Create `handlers/presence-handler.ts`:
   - Track user online status in memory Map
   - Emit presence changes to relevant rooms
   - Handle disconnect cleanup

4. Refactor `socket-handler.ts`:
   - Use typed Server<> generic
   - Register modular handlers
   - Add global error middleware

## Todo List

- [x] Create socket-events.ts with typed interfaces
- [x] Create chat-message-handler.ts
- [x] Create presence-handler.ts
- [x] Refactor socket-handler.ts as orchestrator
- [x] Add acknowledgment to send-message
- [ ] Test all events work correctly
- [ ] **[C1] Add zod validation for `send-message` and `join-chat` payloads**
- [ ] **[C1] Add per-socket rate limiting on `send-message`**
- [ ] **[M1] Remove redundant `user-online`/`user-offline` events; keep only `presence-update`**
- [ ] **[M4] Replace `!` non-null assertions with explicit guards on `socket.data`**

## Success Criteria

- All socket events are typed
- Message send returns acknowledgment
- Presence tracked on connect/disconnect
- Code split into <100 line modules

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breaking existing clients | High | Keep event names same |
| Memory leak in presence | Medium | Cleanup on disconnect |

## Security Considerations

- Validate all event payloads with zod
- Rate limit message sending
- Sanitize message content
