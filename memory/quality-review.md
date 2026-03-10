# Quality Review — 2026-03-10

## Status

This review file is a running backlog of findings. Items below should be treated as open unless explicitly marked fixed in-place.

## CRITICAL / SECURITY

### 1. `reorderChannels` cross-server authorization bypass
**File:** [src/features/channel/actions.ts:122-130](../src/features/channel/actions.ts)
Authorization only checks `server_id` from `order[0]`. A malicious admin of Server A could
submit channel IDs from Server B alongside a channel from Server A, and reorder all of them.
**Fix:** Verify ALL channel IDs belong to the same server before executing updates.

### 2. `deleteMessage` blocks admin deletion
**File:** [src/features/chat/actions.ts:205-207](../src/features/chat/actions.ts)
Only the message author can delete. Architecture doc states "DELETE requires authorship or admin role."
Admins currently cannot remove offensive messages from their servers.
**Fix:** Also allow delete when `get_server_role()` returns `owner` or `admin`.

## HIGH / CORRECTNESS BUGS

### 3. `createServer` missing cleanup on `inviteErr`
**File:** [src/features/server/actions.ts:51-55](../src/features/server/actions.ts)
If `server_invites` insert fails, the server, member row, and general channel are left orphaned in the DB.
**Fix:** Add cleanup of channel + member + server on `inviteErr`.

### 4. `createMessageWithMedia` inserts empty-content messages
**File:** [src/features/chat/actions.ts:153](../src/features/chat/actions.ts)
`content: ""` bypasses the message min-length validation used by `sendMessage`. Creates
zero-content rows that display oddly if media hasn't attached yet.
**Fix:** Use a sentinel like `"\u200b"` or make content nullable; or attach media atomically.

### 5. `removeOptimisticMessage` matches by content (not ID)
**File:** [src/components/chat/ChatArea.tsx:122-128](../src/components/chat/ChatArea.tsx)
If a user sends the same text twice quickly, the wrong pending message may be removed.
**Fix:** Assign a stable `tempId` to each optimistic message and match by that.

### 6. `pinnedCount` counts only from 50-message window
**File:** [src/components/chat/ChatArea.tsx:495-497](../src/components/chat/ChatArea.tsx)
Channels with >50 messages show an inaccurate pinned count in the header badge.
**Fix:** Fetch actual pinned count from DB separately, or track via Realtime UPDATE events.

## MEDIUM / ARCHITECTURE

### 7. Sequential DB writes in `reorderChannels` and `reorderCategories`
**Files:** [src/features/channel/actions.ts:132-136](../src/features/channel/actions.ts), [src/features/server/actions.ts:340-344](../src/features/server/actions.ts)
N sequential `await supabase.update()` calls — O(N) roundtrips.
**Fix:** Use `Promise.all()` for parallel updates or use a single upsert batch.

### 8. `ChannelGroup` calls `setLocalChannels` during render
**File:** [src/components/layout/ChannelSidebar.tsx:156-158](../src/components/layout/ChannelSidebar.tsx)
Setting state during render is a React anti-pattern and causes double-renders.
**Fix:** Replace the render-time `setLocalChannels` with `useEffect(() => setLocalChannels(initialChannels), [initialChannels])`.

### 9. `getMyServers` makes two separate queries
**File:** [src/features/server/actions.ts:118-132](../src/features/server/actions.ts)
Fetches memberships then servers in two round-trips. Could use a Supabase join:
`.from("server_members").select("servers(*)")`.

### 10. `Record<string, unknown>` bypasses type safety in updates
**Files:** [src/features/server/actions.ts:192](../src/features/server/actions.ts), [src/features/channel/actions.ts:83](../src/features/channel/actions.ts)
Dynamic update objects lose TypeScript's column name checking. A typo in a key silently no-ops.
**Fix:** Use typed `TablesUpdate<"servers">` / `TablesUpdate<"channels">` partial objects.

### 11. `fetchMediaPage` throws instead of returning `{ error }`
**File:** [src/features/media/queries.ts:47](../src/features/media/queries.ts)
All other server actions return `{ error: string }` on failure. `fetchMediaPage` throws, forcing
callers to wrap in try/catch. Inconsistent contract.

## LOW / CODE QUALITY

### 12. Hardcoded hex colors throughout JSX (violates `.cursorrules` Rule 4)
Multiple components use raw hex strings (`#313338`, `#1e1f22`, `#8e9297`, etc.) directly in
className strings instead of Tailwind tokens or CSS variables. Affects:
`ChatArea`, `MessageBubble`, `MessageList`, `ChannelSidebar`, `ServerSettingsModal`, etc.

### 13. `scrollToMessage` redefined every render + eslint-disable
**File:** [src/components/chat/MessageList.tsx:131-143](../src/components/chat/MessageList.tsx)
Not memoized; eslint-disable comment hides the stale-closure warning.
**Fix:** Wrap with `useCallback`.

### 14. Inconsistent server action return types
Some return `{ error: string } | undefined`, others return `{ error?: string }`.
Callers must use `result?.error` vs `result.error` inconsistently. Standardize on `{ error?: string }`.

### 15. IIFE in JSX for link preview
**File:** [src/components/chat/MessageBubble.tsx:369-372](../src/components/chat/MessageBubble.tsx)
`{!message._pending && (() => { ... })()}` is unusual. Extract to a small helper or inline expression.
