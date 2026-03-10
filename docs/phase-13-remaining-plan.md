# Phase 13: Server Profile & Customization — Remaining Tasks Implementation Plan

**Focus:** Tasks 13.10, 13.11 (remaining in roadmap)

**Status:** 9 of 11 tasks complete / 2 remaining  
**Estimated complexity:** Medium  
**New dependencies needed:** none

---

## Current State Summary

| Task | Schema | Server Action | UI |
|------|--------|---------------|-----|
| 13.5 Server banner | `servers.banner_url` ✅ exists | `updateServer` ✅ has `bannerUrl` | Overview tab upload + ChannelSidebar banner ✅ |
| 13.6 Server description | `servers.description` ✅ exists | `updateServer` ✅ has `description` | Overview tab description editor ✅ |
| 13.10 Channel topic/description | `channels.description` ✅ exists | `updateChannel` ✅ has `description` | Header topic display + create form ✅, dedicated edit modal still pending ❌ |
| 13.11 NSFW flag | `channels.nsfw` ✅ exists | `createChannel`/`updateChannel` ✅ | Create form + sidebar badge ✅, age-gate modal still pending ❌ |

---

## 1. Database Changes (Completed)

### 1.1 Channels: Added `nsfw` column

**Migration SQL:**
```sql
ALTER TABLE channels
ADD COLUMN IF NOT EXISTS nsfw boolean NOT NULL DEFAULT false;
```

**RLS:** No policy changes. Existing `channels` RLS (members can SELECT) applies. `nsfw` is a non-sensitive flag.

**Indexes:** None needed (boolean, low cardinality).

**Types:** Regenerate `src/types/database.ts` after migration. Add to `channels` Row/Insert/Update:
```ts
nsfw: boolean;
```

---

## 2. Server Actions

### 2.1 `src/features/server/actions.ts` (Completed)

**`updateServer`** — extend schema and logic:
- Add to `updateServerSchema`: `bannerUrl: z.string().url().nullable().optional()`
- In `updates` object: `if (parsed.data.bannerUrl !== undefined) updates.banner_url = parsed.data.bannerUrl`
- Reference: existing `iconUrl` handling (lines 172–193)

### 2.2 `src/features/server/actions.ts` — NEW (`getInvitePreview`, optional follow-up)

**`getInvitePreview`** — for join page:
- **Signature:** `getInvitePreview(inviteCode: string): Promise<{ data: { serverName, serverIconUrl, serverDescription, memberCount }; error?: undefined } | { data?: undefined; error: string }>`
- **Zod:** `z.string().min(1)`
- **Logic:**
  1. Fetch `server_invites` where `code = inviteCode`, single row
  2. If not found or expired or max_uses exceeded → `{ error: "Invalid or expired invite" }`
  3. Fetch `servers` where `id = invite.server_id`, select `name, icon_url, description`
  4. Count `server_members` where `server_id = invite.server_id`
  5. Return `{ data: { serverName, serverIconUrl, serverDescription, memberCount } }`
- **Auth:** Uses `createClient()` — works for logged-in users. Join page is under `(app)` layout so user is authenticated.
- **RLS:** Must allow SELECT on `server_invites` and `servers` for members. If join page is auth-gated, existing RLS should allow. Verify: `is_server_member` is for server-scoped; for invite lookup we need `server_invites` readable when code matches. Check existing RLS — likely `server_invites` allows SELECT for valid codes. If blocked, add policy: allow SELECT on `server_invites` for `auth.uid() IS NOT NULL` (or public for discovery — project rules say invite-only, so auth required).

### 2.3 `src/features/channel/actions.ts` (Completed for `nsfw`)

**`updateChannel`** — extend schema:
- Add to `updateChannelSchema`: `nsfw: z.boolean().optional()`
- In `updates`: `if (parsed.data.nsfw !== undefined) updates.nsfw = parsed.data.nsfw`

**`createChannel`** — extend schema:
- Add to `createChannelSchema`: `nsfw: z.boolean().optional()`
- In insert: `nsfw: parsed.data.nsfw ?? false`

---

## 3. UI Components

### 3.1 Server Banner (13.5) — Implemented

**`src/components/layout/ServerSettingsModal.tsx` — OverviewTab**

- Add props: `serverBannerUrl: string | null`, `serverDescription: string | null`
- **Banner upload block** (above icon upload):
  - Optional banner image: 16:9 or similar aspect, max 5 MB
  - Button to upload (presigned URL, prefix `"banners"`), or remove
  - Pattern: same as icon upload — `requestPresignedUrl({ prefix: "banners" })`, PUT, then `updateServer({ bannerUrl })`
  - Recommended size note: e.g. 960×540 or 1920×1080
- **Description textarea** (below server name):
  - Label: "Server Description"
  - Placeholder: "What's your server about?"
  - Max 500 chars (match schema)
  - Save with `updateServer({ description })`
  - Include in `isDirty` check

**`src/components/layout/ChannelSidebar.tsx`**

- Add prop: `serverBannerUrl?: string | null`
- **Banner display:** At top of sidebar, above server name header. If `serverBannerUrl`:
  - `<div className="relative h-20 w-full overflow-hidden">` with `next/image` or `img` (banner can be external URL from presign)
  - Use `next/image` with `fill`, `sizes`, `unoptimized` if URL is from MinIO
  - Gradient overlay at bottom for contrast with server name
- If no banner: no extra block (or optional placeholder)

**`src/app/(app)/servers/[serverId]/layout.tsx`**

- Pass `serverBannerUrl={currentServer.banner_url ?? null}` to `ChannelSidebar`
- `currentServer` already from `getMyServers()` — ensure `servers` select includes `banner_url` (default `*` should include it)

**`ServerSettingsModal` call site**

- In `ChannelSidebar`, `ServerSettingsModal` receives `serverName`, `serverIconUrl`. Add `serverBannerUrl`, `serverDescription`.
- Layout fetches `currentServer`; pass `serverBannerUrl` and `serverDescription` into `ChannelSidebar`, which passes them to `ServerSettingsModal`.

---

### 3.2 Server Description (13.6) — Implemented

**ServerSettingsModal — OverviewTab:** Covered above (description textarea).

**`src/app/(app)/join/[inviteCode]/page.tsx` — Invite preview**

- On mount, call `getInvitePreview(params.inviteCode)`
- If error: show error message, keep "Accept Invite" disabled or show "Invalid invite"
- If success: render preview card:
  - Server icon (or initials)
  - Server name
  - Server description (if present)
  - Member count: "X members"
  - "Accept Invite" button (existing `handleJoin`)
- Layout: centered card, Discord-style (dark bg, rounded)

---

### 3.3 Channel Description & Topic (13.10) — Partially Implemented

**Existing:** `channels.description` is already shown in ChatArea, MediaArea, ForumPostList headers. CreateChannelModal has description field.

**New: `src/components/layout/EditChannelModal.tsx`**

- **Props:** `open`, `onOpenChange`, `channel`, `serverId`, `isAdmin`, `onSaved`
- **Fields:** Channel name, description (topic), category (optional), NSFW toggle
- **Actions:** `updateChannel({ channelId, name, description, categoryId, nsfw })`
- **Pattern:** Same structure as CreateChannelModal — Dialog, form, zod via action
- **Open from:** Channel header in ChatArea, MediaArea, ForumPostList — add gear/pencil icon for admins that opens EditChannelModal

**ChatArea.tsx** — Add Edit button in header (admins only):
```tsx
{isAdmin && (
  <button onClick={() => setEditChannelOpen(true)} ...>
    <Pencil className="h-4 w-4" />
  </button>
)}
```
Render `<EditChannelModal channel={channel} ... onSaved={() => router.refresh()} />`

**MediaArea.tsx** — Same pattern. MediaArea doesn't receive `isAdmin`; add prop `isAdmin?: boolean` and pass from parent (channel page).

**ForumPostList.tsx** — Same. Add `isAdmin` prop, Edit button, EditChannelModal.

**Channel page** (`channels/[channelId]/page.tsx`): Pass `isAdmin` to ForumPostList. For ChatArea, already has `isAdmin`. For MediaArea — MediaArea is used inside ForumPostList (ForumMediaTab) or in a media-only view. Check: ForumPostList is the parent for forum channels; it contains ForumMediaTab. The forum channel page renders ForumPostList. So we need `isAdmin` in ForumPostList. ChatArea is used for TEXT channels. MediaArea — is it used standalone? Grep shows MediaArea in ForumMediaTab. So ForumPostList and ChatArea need Edit. ForumMediaTab is inside ForumPostList, so the header is in ForumPostList. Good.

---

### 3.4 NSFW Channel Flag (13.11) — Partially Implemented

**CreateChannelModal** — Add:
- Checkbox: "Mark as NSFW (18+)"
- State: `nsfw: boolean`
- Pass `nsfw` to `createChannel`

**EditChannelModal** — Add:
- Checkbox: "Mark as NSFW (18+)"
- Initial value from `channel.nsfw`
- Pass `nsfw` to `updateChannel`

**ChannelSidebar** — `ChannelItem` and `SortableChannelItem`:
- Add `nsfw?: boolean` to channel type (from `Tables<"channels">`)
- When `channel.nsfw`, render badge: `<span className="text-[10px] text-[#ed4245]">NSFW</span>` next to channel name
- Use `AlertTriangle` or similar icon for NSFW indicator

**Age-gate flow:**
- **Option A:** Intercept click in sidebar. If `channel.nsfw` and `!sessionStorage.getItem('nsfw-' + channel.id)`, show modal. On confirm, set `sessionStorage.setItem('nsfw-' + channel.id, '1')` and navigate.
- **Option B:** Navigate normally. Channel page checks: if `channel.nsfw` and no sessionStorage, render AgeGateModal instead of content. On confirm, set sessionStorage and `router.refresh()` or setState to show content.

**Recommendation:** Option B — simpler, works for direct URL access. Create `src/components/layout/NSFWAgeGateModal.tsx`:
- Props: `open`, `channelName`, `onConfirm`, `onDecline`
- Content: "This channel is marked as NSFW (18+). Do you want to continue?"
- Buttons: "I'm 18 or older" (onConfirm), "Go Back" (onDecline → router.back())
- On confirm: `sessionStorage.setItem('nsfw-' + channelId, '1')`, call `onConfirm`

**Channel page** (`channels/[channelId]/page.tsx`):
- After fetching channel, if `channel.nsfw`:
  - Check `typeof window !== 'undefined' && sessionStorage.getItem('nsfw-' + channel.id)`
  - If not confirmed: render a client wrapper that shows NSFWAgeGateModal. On confirm, set sessionStorage and re-render children (or use client state to flip from gate to content).
- This requires a client component for the gate check. Create `ChannelPageGate` or similar: wraps children, checks nsfw + sessionStorage, shows modal or children.

**Simpler approach:** `ChannelPageContent` client component:
- Receives `channel`, `children` (the actual channel content)
- If `channel.nsfw` and no sessionStorage key: render AgeGateModal. On confirm: setItem, setState `confirmed=true`, render children.
- If not nsfw or confirmed: render children.
- Channel page structure: `<ChannelPageContent channel={channel}>...actual content...</ChannelPageContent>`

---

## 4. Remaining Implementation Order

1. **Edit Channel modal UI** — Add a dedicated modal for `name` + `description/topic` editing and wire it from channel headers for admins.
2. **NSFW age-gate** — Add a client gate/modal before rendering NSFW channel content (including direct URL navigation).
3. **Optional invite preview follow-up** — Implement `getInvitePreview` + join preview card if Phase 28 invite-preview work is being pulled earlier.

---

## 5. Verification Checklist

- [x] Schema migration applied; `channels.nsfw` exists; types regenerated
- [x] `updateServer` accepts `bannerUrl`; OverviewTab can upload banner
- [x] `updateServer` accepts `description`; OverviewTab has description textarea
- [x] Server banner displays at top of ChannelSidebar when set
- [ ] Join page shows invite preview (server name, icon, description, member count)
- [ ] EditChannelModal opens from channel header (ChatArea, MediaArea, ForumPostList) for admins
- [ ] EditChannelModal saves name, description, category, NSFW
- [x] CreateChannelModal includes NSFW checkbox
- [x] NSFW channels show badge in sidebar
- [ ] Clicking NSFW channel shows age-gate modal; on confirm, content loads
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] Roadmap tasks 13.10 and 13.11 marked [x] only after remaining UI is implemented

---

## 6. File Path Reference

| File | Changes |
|------|---------|
| `src/types/database.ts` | Regenerate after migration (nsfw on channels) |
| `src/features/server/actions.ts` | updateServer + bannerUrl; getInvitePreview |
| `src/features/channel/actions.ts` | createChannel + nsfw; updateChannel + nsfw |
| `src/components/layout/ServerSettingsModal.tsx` | OverviewTab: banner upload, description |
| `src/components/layout/ChannelSidebar.tsx` | serverBannerUrl prop, banner block; NSFW badge on channels |
| `src/components/layout/EditChannelModal.tsx` | **NEW** — edit channel name, description, nsfw |
| `src/components/layout/NSFWAgeGateModal.tsx` | **NEW** — age confirmation |
| `src/components/layout/CreateChannelModal.tsx` | NSFW checkbox |
| `src/components/chat/ChatArea.tsx` | Edit button, EditChannelModal |
| `src/components/media/MediaArea.tsx` | Edit button, EditChannelModal; isAdmin prop |
| `src/components/forum/ForumPostList.tsx` | Edit button, EditChannelModal; isAdmin prop |
| `src/app/(app)/servers/[serverId]/layout.tsx` | Pass serverBannerUrl, serverDescription to sidebar |
| `src/app/(app)/join/[inviteCode]/page.tsx` | getInvitePreview, preview UI |
| `src/app/(app)/servers/[serverId]/channels/[channelId]/page.tsx` | ChannelPageContent wrapper for NSFW gate; isAdmin to ForumPostList |

---

## 7. Architectural Compliance

- **DOCKER NETWORK LAW:** Banner upload uses `requestPresignedUrl` with prefix `"banners"` — same pattern as avatars. S3 uses MINIO_ENDPOINT server-side; presigned URLs use MINIO_PUBLIC_URL.
- **APP ROUTER BOUNDARY LAW:** Server Components for data fetch; Client Components for modals, gate, interactive UI.
- **MEDIA & PERFORMANCE LAW:** No new denormalization.
- **UI/UX LAW:** Discord dark theme; shadcn components; `cn()` for classes; mobile-first.

---

Plan complete. Ready for implementation.
