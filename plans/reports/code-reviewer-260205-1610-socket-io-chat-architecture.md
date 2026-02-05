# Code Review: Socket.io Chat Architecture Improvements

**Date:** 2026-02-05
**Reviewer:** code-reviewer
**Plan:** `plans/260205-1538-socket-io-chat-architecture/`

---

## Scope

| Category | Files |
|---|---|
| Backend (new) | `socket/socket-events.ts`, `socket/handlers/chat-message-handler.ts`, `socket/handlers/presence-handler.ts` |
| Backend (modified) | `socket/socket-handler.ts`, `entities/message.entity.ts`, `services/chat-service.ts` |
| Frontend (new) | `hooks/use-presence.ts`, `hooks/use-message-queue.ts`, `components/chat/message-status-indicator.tsx`, `components/chat/connection-status-badge.tsx` |
| Frontend (modified) | `types/chat-types.ts`, `hooks/use-chat.ts`, `components/chat/message-bubble.tsx` |

- Lines analyzed: ~850
- Build status: Frontend -- clean (`tsc --noEmit` zero errors). Backend -- 3 pre-existing errors in unrelated files (`user-controller.ts`, `otp-service.ts`), zero errors in socket/chat code.

---

## Overall Assessment

The refactor delivers a solid architectural uplift: typed Socket.io events, modular handler separation, optimistic UI, offline queue, and presence tracking. The code is well-organized, readable, and stays within the 200-line file-size rule. The typed event contract (`ClientToServerEvents` / `ServerToClientEvents`) is the strongest element -- it binds client and server shapes at compile time for all reviewed files.

Three areas need attention before production: a security gap (no input validation or rate limiting on socket events), a correctness bug in the delivery-status flow, and a stale `connecting` state that is never reachable in `ConnectionStatusBadge`.

---

## Critical Issues

### C1 -- No input validation or rate-limiting on socket events

**Files:** `chat-message-handler.ts` lines 76-122, `presence-handler.ts`
**Severity:** Critical (Security)

The plan itself lists "Validate all event payloads with zod" and "Rate limit message sending" as security requirements. Neither is implemented. Socket events bypass all HTTP middleware (including `rate-limiter-middleware.ts`). A connected client can:

1. Spam `send-message` at unlimited rate, flooding Firestore writes.
2. Send arbitrarily long `content` strings with no length cap.
3. Emit `join-chat` for any `chatId` -- `validateChatAccess` only checks whether the userId appears in the `_`-delimited ID, but does not verify the two IDs actually correspond to a real manager-employee pair in the database.

**Recommended fix (sketch):**
```typescript
// chat-message-handler.ts -- inside 'send-message' handler, before DB call
const MAX_MSG_LENGTH = 2000;
if (content.length > MAX_MSG_LENGTH) {
  callback({ success: false, error: 'Message too long' });
  return;
}

// Simple per-socket rate limiter (or use a shared Map<socketId, lastSendTime>)
// Zod schema for payload shape validation before processing
```

---

## High Priority Findings

### H1 -- Delivery status set based on presence, not room membership

**File:** `chat-message-handler.ts` lines 103-117
**Impact:** Incorrect status displayed to user

`presenceStore.isOnline(recipientId)` tells you the recipient has *any* socket connected. It does NOT mean they are in the current chat room. A user who is online in a different chat will show "delivered" for messages they have not actually received in their current view. The status should be set to `delivered` only after the recipient's socket is confirmed in the room (via `io.sockets.adapter.rooms.get(chatId)`), or when the recipient actually receives the `receive-message` event and acks it.

**Recommended fix:**
```typescript
// Replace presence check with room membership check
const room = io.sockets.adapter.rooms?.get(chatId);
const recipientInRoom = room && [...room].some((sid) => {
  const s = io.sockets.sockets.get(sid);
  return s?.data?.userId === recipientId;
});

if (recipientInRoom) {
  await chatService.updateMessageStatus(messageId, 'delivered');
  // emit status update
}
```

### H2 -- `markAllAsRead` performs N sequential Firestore writes

**File:** `message.entity.ts` lines 71-92
**Impact:** Latency at scale

Each unread message triggers an individual `doc.ref.update()` inside a `for` loop. For a chat with many unread messages this serializes writes. Use a Firestore batch write:

```typescript
const batch = this.db.batch();
for (const doc of snapshot.docs) {
  batch.update(doc.ref, { read: true, status: 'read', readAt: now });
  messageIds.push(doc.id);
}
await batch.commit();
```

### H3 -- `useMessageQueue` effect re-runs on every queue mutation, risking duplicate sends

**File:** `use-message-queue.ts` lines 85-115
**Impact:** Potential duplicate messages in queue-flush path

The effect dependency array includes `queue` and `processingIds`. Each successful `dequeue` call mutates both, triggering the effect again immediately. Although `processingIds` guards against re-sending in-flight messages, the guard is checked against React state that may not yet reflect the latest `setProcessingIds` call (stale closure). A ref-based processing guard or a `useRef` for the queue snapshot would be safer:

```typescript
const processingRef = useRef<Set<string>>(new Set());
// use processingRef.current instead of processingIds state for the guard check
// setState only for external consumers if needed
```

### H4 -- Failed sends silently keep `sending` status forever

**File:** `use-chat.ts` lines 130-137
**Impact:** UX dead-end; user sees "sending" clock with no retry or error feedback

On ack failure the code sets status back to `sending` (same value it already has), making the failure invisible. There is no `failed` / `error` status, no retry button, and no removal from UI.

**Recommended fix:** Add a `'failed'` status to `MessageStatus` (both frontend type and backend type), set it on failed ack, render a distinct icon + retry affordance in `MessageStatusIndicator`.

---

## Medium Priority Improvements

### M1 -- Redundant event pair: `user-online`/`user-offline` AND `presence-update`

**Files:** `presence-handler.ts` lines 78-81 and 96-98; `socket-events.ts` lines 60-62; `use-presence.ts` lines 44-46
**Impact:** Doubled network traffic; dual handler maintenance burden

`user-online` + `user-offline` carry the same information as `presence-update { isOnline: true/false }`. The frontend listens to all three and applies the same state mutation. Pick one and remove the other. `presence-update` is the more general form; keep it, remove the two bespoke events.

### M2 -- `connection-status-badge.tsx` can never show `connecting`

**File:** `connection-status-badge.tsx` lines 20-21
**Impact:** Dead code; the yellow "Connecting..." state with pulse animation is defined but unreachable

`useSocket` exposes only `isConnected: boolean`. There is no intermediate `connecting` state surfaced from `socket-context.tsx`. Either:
- Add a `connectionStatus: ConnectionStatus` field to the context (listen to Socket.io `reconnect_attempt` event), or
- Remove the `connecting` config branch until that context change lands.

### M3 -- `as any` cast in pagination timestamp

**File:** `chat-message-handler.ts` line 158
```typescript
new Date(data.beforeTimestamp) as any
```
`getMessages` expects a Firestore `Timestamp`, but receives a JS `Date`. Use `Timestamp.fromDate(new Date(data.beforeTimestamp))` and remove the cast.

### M4 -- Non-null assertions on `socket.data` fields

**Files:** `chat-message-handler.ts` line 30-31; `presence-handler.ts` line 73
`socket.data.userId!` -- the `!` is fine given that `socketAuth` middleware runs first, but the coupling is implicit. A defensive null check with an early `next(new Error(...))` or a guard at the top of the connection handler would make this explicit and prevent silent bugs if middleware ordering changes.

### M5 -- `getUndeliveredMessages` in `chat-service.ts` is unused

**File:** `chat-service.ts` lines 89-110
Exported but never imported anywhere. If not needed by current scope, remove (YAGNI).

---

## Low Priority Suggestions

### L1 -- SVG paths in `message-status-indicator.tsx` duplicated for `delivered` and `read`

The two cases differ only in text color (`text-blue-400`). Extract into a single `DoubleCheck` sub-component parameterized by color, or collapse the two cases into one with a conditional class.

### L2 -- `tempId` generation duplicated

Both `use-chat.ts` line 110 and `use-message-queue.ts` line 45 generate `temp_${Date.now()}_${Math.random()...}`. Extract to a shared util (DRY).

### L3 -- Backend `MessageStatus` excludes `sending`; frontend includes it

`message.entity.ts`: `'sent' | 'delivered' | 'read'`
`socket-events.ts`: `'sending' | 'sent' | 'delivered' | 'read'`
`chat-types.ts`: `'sending' | 'sent' | 'delivered' | 'read'`

This is intentionally asymmetric (`sending` is client-local only), but it is not documented. Add a comment on the backend type clarifying the design intent so a future developer does not "fix" this by adding `sending`.

---

## Positive Observations

- Typed Socket.io generics (`Server<C2S, S2C, Inter, Data>`) used consistently across all handlers -- strong compile-time contract.
- `PresenceStore` correctly tracks multiple sockets per user (tab/device support) and only broadcasts offline when the last socket disconnects.
- Backward-compatible `read` boolean retained alongside new `status` field on `MessageDocument` -- existing Firestore data will continue to work.
- Offline queue persists to `localStorage` with a sensible size cap (`MAX_QUEUE_SIZE = 50`) and loads on hook init.
- `use-chat` duplicate-prevention logic (`tempId` matching on `receive-message`) correctly handles the optimistic-update merge.
- Clean modular split: orchestrator stays thin, handlers are self-contained, all under 170 lines.

---

## Recommended Actions (prioritized)

1. **[C1]** Add zod schema validation for `send-message` and `join-chat` payloads; add per-socket rate limit (e.g., 10 msg/sec); add `MAX_MSG_LENGTH` guard.
2. **[H1]** Replace `presenceStore.isOnline()` delivery check with actual room-membership check.
3. **[H2]** Convert `markAllAsRead` loop to a Firestore batch write.
4. **[H3]** Switch `processingIds` to a `useRef` to avoid stale-closure race in queue flush.
5. **[H4]** Add `'failed'` status, surface error state in UI, provide retry path.
6. **[M1]** Remove `user-online` / `user-offline` events; keep only `presence-update`.
7. **[M2]** Either wire `connecting` state from context or remove dead branch.
8. **[M3]** Replace `as any` with `Timestamp.fromDate(...)`.
9. **[M5]** Remove unused `getUndeliveredMessages` export.
10. **[L2]** Extract `tempId` generation to shared util.

---

## Unresolved Questions

1. Is the `chatId` format (`id1_id2` sorted) stable and documented as a contract? If either ID ever contains `_` the split logic in `chat-message-handler.ts:104` and `chat-service.ts:80,106` will break. Consider a separator that cannot appear in IDs, or an explicit lookup.
2. Is there a plan to add Firestore composite indexes for the `status + createdAt` query used by `getUndeliveredMessages`? Without an index this will fail at scale.
3. The plan mentions Redis adapter for scaling; the presence store is in-memory only. Is single-server deployment confirmed for the current phase?
