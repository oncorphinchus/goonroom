# GoonRoom — Project Roadmap

---

## COMPLETED PHASES (1–10)

<details>
<summary>Phase 1: Foundation ✅</summary>

- [x] 1.1 Project scaffolding (Next.js, Tailwind, shadcn, deps)
- [x] 1.2 `.cursorrules` + `/docs` folder created
- [x] 1.3 Supabase project created (`enoszpjrvhvbjvzvumjs`, us-east-1)
- [x] 1.4 Database schema applied (profiles, channels, messages, media_attachments)
- [x] 1.5 RLS policies applied to all tables
- [x] 1.6 TypeScript types generated (`src/types/database.ts`)
- [x] 1.7 Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`)
- [x] 1.8 MinIO S3 client (`src/lib/s3.ts`) — lazy singleton, env validation
- [x] 1.9 `.env.local` scaffold with placeholders
</details>

<details>
<summary>Phase 2: Auth + App Shell ✅</summary>

- [x] 2.1 Supabase Auth — email/password login + register pages (react-hook-form + zod)
- [x] 2.2 Auth callback route (`/auth/callback`)
- [x] 2.3 Middleware for session refresh (`src/middleware.ts`) + route guards
- [x] 2.4 Root layout with Inter + Playfair Display from Google Fonts
- [x] 2.5 Authenticated app shell layout (`(app)/layout.tsx`) — server component, explicit user check
- [x] 2.6 ChannelSidebar — splits "Text Channels" and "Media Forums", server-fetched channels
- [x] 2.7 Active channel highlighting via usePathname, client-side navigation
- [x] 2.8 User avatar + username in sidebar footer with Mute/Deafen/SignOut icons
- [x] 2.9 NavBar — thin Discord-style icon bar with animated active pill indicator
- [x] 2.10 globals.css — full Discord dark theme, shadcn CSS variables, Firefox scrollbar support
</details>

<details>
<summary>Phase 3: Real-Time Chat ✅</summary>

- [x] 3.1 Chat channel page — Server Component, fetches channel + initial 50 messages
- [x] 3.2 MessageList — channel intro header, grouped messages (same user within 5 min), auto-scroll
- [x] 3.3 Supabase Realtime postgres_changes subscription (INSERT, filtered by channel_id)
- [x] 3.4 MessageInput — auto-resizing textarea, Enter to send, Shift+Enter for newline
- [x] 3.5 sendMessage Server Action — zod validation, auth check, Supabase insert
- [x] 3.6 Memory management — subscription.unsubscribe() in useEffect cleanup; key={channelId} full remount
- [x] 3.7 Profile cache + deduplicated fetch — inflightProfileFetches Map prevents N+1 queries
- [x] 3.8 Added messages + media_attachments to supabase_realtime publication
- [x] 3.9 Loading skeleton for channel page (loading.tsx)
- [x] 3.10 Optimistic UI — pending messages render in grey/italic, reconciled on Realtime INSERT
- [x] 3.11 File attachment support inside chat (completed via forum thread inline media)
- [x] 3.12 Message delete (own messages only) — optimistic remove, Realtime DELETE listener, hover trash icon
</details>

<details>
<summary>Phase 4: Media Gallery (Bunkr Vibe) ✅</summary>

- [x] 4.1 Media forum page — full gallery grid layout with IntersectionObserver infinite scroll
- [x] 4.2 MediaToolbar — sort by date/size/name (ascending/descending toggle), grid-size picker (sm/md/lg)
- [x] 4.3 MediaCard — thumbnail, video play/duration overlay, uploader name, file size, relative date
- [x] 4.4 Upload modal — drag & drop, client-side thumbnail generation, presigned PUT to MinIO
- [x] 4.5 MediaTheater — full-screen overlay with keyboard nav (Esc/←/→), download button, info bar
- [x] 4.6 Realtime feed for new uploads in media channels (completed via forum media subscriptions)
- [x] 4.7 Pagination — server action `fetchMediaPage` with range-based pagination (40 per page)
</details>

<details>
<summary>Phase 5: Infrastructure & Containerization ✅</summary>

- [x] 5.1 Update `next.config.ts` for standalone output (`output: 'standalone'`)
- [x] 5.2 Create production `Dockerfile` (multi-stage, Node 20 Alpine, standalone)
- [x] 5.3 Create `docker-compose.yml` (Next.js + MinIO on shared `goonroom-net` bridge)
- [x] 5.4 Update `.env` structure for dual-network S3 endpoints
- [x] 5.5 Verify Docker build and local container startup
</details>

<details>
<summary>Phase 6: Polish + PWA + Deploy ✅ (partial)</summary>

- [x] 6.1 PWA manifest + service worker + offline page + SW registrar
- [x] 6.2 Framer Motion transitions
- [x] 6.3 Mobile responsive audit — NavBar/ChannelSidebar hidden on mobile, MobileShell with Sheet drawer
- [x] 6.4 Docker production deployment + Cloudflare Tunnel
- [ ] 6.5 Custom domain setup
- [x] 6.6 Error boundaries + offline fallback UI
</details>

<details>
<summary>Phase 7: Schema Evolution ✅</summary>

- [x] 7.1 Create `servers`, `server_members`, `server_invites`, `forum_posts` tables
- [x] 7.2 Alter `channels`, `messages`, `media_attachments` for multi-server
- [x] 7.3 Data migration — default server, member assignment
- [x] 7.4 Indexes
- [x] 7.5 RLS overhaul — `is_server_member()` + `get_server_role()` helper functions
- [x] 7.6 Regenerate TypeScript types, create domain type files
</details>

<details>
<summary>Phase 8: Server Infrastructure + Routing ✅</summary>

- [x] 8.1 Server actions — createServer, joinServer, getMyServers, createInvite, getServerMembers
- [x] 8.2 Channel actions — createChannel, deleteChannel
- [x] 8.3 Routing restructure — servers/[serverId]/channels/[channelId]/ with posts/[postId]/
- [x] 8.4 NavBar overhaul — dynamic server icon list, active pill indicator, create server button
- [x] 8.5 ChannelSidebar update — server-scoped, TEXT/FORUM grouping, invite button, admin controls
- [x] 8.6 Update sendMessage — optional postId, forum thread validation, locked post check
</details>

<details>
<summary>Phase 9: Forum System ✅</summary>

- [x] 9.1 Forum post actions — createForumPost, fetchForumPosts, lockPost, pinPost, deletePost
- [x] 9.2 Update media actions — insertMediaItem and fetchMediaPage support postId
- [x] 9.3 ForumPostList — post cards, infinite scroll, "New Post" button, forum-wide media tab
- [x] 9.4 ThreadView — tab bar (Chat/Media), thread header with lock/pin status
- [x] 9.5 ThreadChat — reuses ChatArea pattern scoped to post_id, locked post UI
- [x] 9.6 ForumMediaTab — per-thread and forum-wide gallery views, upload support
- [x] 9.7 CreatePostModal — title + optional initial message
</details>

<details>
<summary>Phase 10: Realtime + Polish ✅</summary>

- [x] 10.1 Database triggers — trg_messages_forum_stats, trg_media_forum_activity
- [x] 10.2 Realtime subscriptions — thread messages, forum posts
- [x] 10.3 Edge cases — locked posts block sendMessage, CASCADE DELETE, orphaned media preserved
- [x] 10.4 Documentation updates
</details>

---

## NEW FEATURES ROADMAP — Discord Feature Parity

Below are grouped phases covering every major Discord feature not yet in GoonRoom. Each task is atomic and implementable independently within its phase.

---

### Phase 11: Message Enhancements

- [x] 11.1 **Edit message** — `editMessage` server action, `edited_at` column on `messages`, inline edit UI (click edit icon → textarea replaces content, Enter to save, Esc to cancel), "(edited)" label next to timestamp
- [x] 11.2 **Message edit Realtime** — subscribe to UPDATE events on `messages`, update in-place in MessageList
- [x] 11.3 **Reply to message** — `reply_to_id` column on `messages` (FK → messages, nullable), reply preview bar above MessageInput showing quoted content, click reply preview to scroll to original
- [x] 11.4 **Reply UI in MessageBubble** — compact quoted block above the reply content showing original author + truncated text, click to scroll to parent
- [x] 11.5 **Pin message — server actions** — `pinMessage` / `unpinMessage` server actions (admin/owner), `pinned` boolean on `messages` (schema + RLS done)
- [x] 11.6 **Pin message UI** — pin icon on hover menu, gold pin indicator on pinned messages, "Pinned Messages" button in channel header with count badge, PinnedMessagesPanel drawer in ChatArea + ThreadChat
- [x] 11.7 **Message reactions** — `message_reactions` table (`message_id`, `user_id`, `emoji`, unique constraint), `addReaction` / `removeReaction` server actions, reaction bar below messages
- [x] 11.8 **Reaction picker UI** — emoji picker popover (compact grid of common emoji + search), click-to-toggle, reaction count badges with user list tooltip
- [x] 11.9 **Reaction Realtime** — subscribe to INSERT/DELETE on `message_reactions`, live update reaction counts
- [x] 11.10 **Message link previews** — detect URLs in message content, fetch OpenGraph metadata server-side, render preview card (title, description, image, site name) below the message
- [x] 11.11 **Markdown / rich text in messages** — parse message content for **bold**, *italic*, ~~strikethrough~~, `inline code`, ```code blocks```, > blockquotes, [links], render with proper styling
- [x] 11.12 **Message timestamps** — hover to show full date/time tooltip, "Today at HH:MM" / "Yesterday at HH:MM" date separators between message groups

---

### Phase 12: User Profile & Account Management

- [x] 12.1 **User settings page** — `/settings` route (or modal) with sidebar tabs: My Account, Profile, Appearance, Privacy
- [x] 12.2 **Change username** — `updateUsername` server action, username uniqueness check, zod validation (3–32 chars, alphanumeric + underscores), update `profiles.username`
- [ ] 12.3 **Change email** — `updateEmail` server action, Supabase `updateUser({ email })`, email confirmation flow, show pending email in settings
- [x] 12.4 **Change password** — `updatePassword` server action, Supabase `updateUser({ password })`, require current password confirmation, minimum 8 chars
- [x] 12.5 **User bio / "About Me"** — `bio` column on `profiles` (text, max 190 chars), editable in settings, displayed on profile card/popover
- [ ] 12.6 **Custom status** — `custom_status` column on `profiles` (text, max 128 chars), emoji + text, shown next to username in sidebar and message bubbles
- [ ] 12.7 **Profile banner image** — `banner_url` column on `profiles`, upload via presigned URL (like avatar), displayed on profile card header
- [x] 12.8 **User profile card / popover** — click username anywhere to open popover: avatar, banner, username, bio, custom status, roles in current server, member since date, "Message" button (future DM)
- [x] 12.9 **Account info display** — settings page shows: email, username, user ID, account creation date, linked auth providers
- [x] 12.10 **Delete account** — `deleteAccount` server action, confirmation modal ("type DELETE to confirm"), delete from `auth.users` (cascade clears profile, memberships), sign out, redirect to login
- [ ] 12.11 **Avatar crop/resize** — before upload, show crop UI (circular mask), resize to 256×256 max, preview before confirming
- [ ] 12.12 **Profile accent color** — `accent_color` column on `profiles` (hex string), color picker in settings, used as profile card accent bar

---

### Phase 13: Server Profile & Customization

- [x] 13.1 **Server-specific profile** — `server_profiles` table (`server_id`, `user_id`, `nickname`, `server_avatar_url`), optional per-server identity override
- [x] 13.2 **Set server nickname** — edit in server member dropdown or member list right-click, displayed in place of global username within that server
- [x] 13.3 **Server avatar per user** — upload per-server avatar, stored via presigned URL, shown in messages within that server
- [x] 13.4 **Server icon upload** — update `servers.icon_url` via presigned upload + `updateServer` action, crop/resize before upload, displayed in NavBar + server header
- [ ] 13.5 **Server banner** — `banner_url` column on `servers`, displayed at top of channel sidebar, configurable by owner/admin
- [ ] 13.6 **Server description** — `description` column on `servers`, shown in server settings and invite preview
- [x] 13.7 **Server settings overhaul** — tabbed settings page/modal: Overview, Roles, Channels, Invites, Members, Danger Zone
- [x] 13.8 **Channel categories** — `channel_categories` table (`id`, `server_id`, `name`, `position`), `category_id` FK on `channels`, collapsible groups in sidebar
- [x] 13.9 **Channel reordering** — drag-and-drop to reorder channels within categories, update `position` via server action
- [ ] 13.10 **Channel description & topic** — editable topic shown below channel name in header bar, "Edit Channel" modal for name/description/topic
- [ ] 13.11 **NSFW channel flag** — `nsfw` boolean on `channels`, age-gate modal before entering, NSFW badge in sidebar

---

### Phase 14: Role & Permission System

- [ ] 14.1 **Roles table** — `server_roles` table (`id`, `server_id`, `name`, `color`, `position`, `permissions` BIGINT bitmask, `is_default`)
- [ ] 14.2 **Permission flags** — define bitmask constants: MANAGE_SERVER, MANAGE_CHANNELS, MANAGE_ROLES, MANAGE_MESSAGES, KICK_MEMBERS, BAN_MEMBERS, SEND_MESSAGES, ATTACH_FILES, ADD_REACTIONS, MENTION_EVERYONE, VIEW_CHANNEL, MANAGE_NICKNAMES, ADMINISTRATOR
- [ ] 14.3 **Role assignment** — `user_roles` junction table (`server_id`, `user_id`, `role_id`), assign/remove roles via member context menu or member list
- [ ] 14.4 **Role management UI** — server settings → Roles tab: create/edit/delete roles, drag to reorder priority, color picker, toggle permission checkboxes
- [ ] 14.5 **Channel permission overrides** — `channel_permission_overrides` table (`channel_id`, `role_id`, `allow` BIGINT, `deny` BIGINT), per-channel role overrides
- [ ] 14.6 **Permission-gated UI** — hide/disable buttons and actions the user lacks permission for (create channel, delete messages, pin, etc.)
- [ ] 14.7 **Role colors in chat** — display username in the user's highest role color in messages and member list
- [ ] 14.8 **@everyone role** — default role assigned to all members, configurable permissions, cannot be deleted
- [ ] 14.9 **Role hierarchy enforcement** — users can only manage roles below their highest role, owner bypasses all

---

### Phase 15: Member Management

- [ ] 15.1 **Member list panel** — right sidebar (toggleable), grouped by role, shows online/offline status, avatar, username/nickname, custom status
- [ ] 15.2 **Kick member** — `kickMember` server action, remove from `server_members`, requires KICK_MEMBERS permission, cannot kick higher roles
- [ ] 15.3 **Ban member** — `server_bans` table (`server_id`, `user_id`, `banned_by`, `reason`, `created_at`), `banMember` / `unbanMember` actions, banned users cannot rejoin
- [ ] 15.4 **Ban list UI** — server settings → Bans tab, list banned users with reason, unban button
- [ ] 15.5 **Member context menu** — right-click or "..." on member: Profile, Message, Change Nickname, Manage Roles, Kick, Ban
- [ ] 15.6 **Server owner transfer** — `transferOwnership` server action, transfer to another member, confirmation dialog
- [ ] 15.7 **Invite management page** — server settings → Invites tab, list active invites with creator, uses, expiry, revoke button
- [ ] 15.8 **Prune inactive members** — bulk remove members who haven't been active in X days, preview before confirming

---

### Phase 16: Direct Messages & Group DMs

- [ ] 16.1 **DM channels** — `dm_channels` table (`id`, `type`: 'DM' | 'GROUP_DM', `name` nullable, `icon_url` nullable, `owner_id` nullable, `created_at`)
- [ ] 16.2 **DM participants** — `dm_participants` table (`dm_channel_id`, `user_id`, `joined_at`)
- [ ] 16.3 **DM messages** — reuse `messages` table with `dm_channel_id` FK (nullable), or separate `dm_messages` table
- [ ] 16.4 **Open DM** — click "Message" on user profile card, find-or-create DM channel, navigate to DM view
- [ ] 16.5 **DM list in sidebar** — Home view shows list of recent DMs, sorted by last message, unread indicator
- [ ] 16.6 **Group DM creation** — select multiple users (up to 10), name the group, custom icon
- [ ] 16.7 **DM Realtime** — subscribe to new DM messages, update DM list ordering, unread dot
- [ ] 16.8 **Block user** — `blocked_users` table (`user_id`, `blocked_id`), hide messages from blocked users, prevent DMs from them
- [ ] 16.9 **DM notifications** — badge count on Home icon in NavBar, per-DM unread count
- [ ] 16.10 **Close/leave DM** — remove from DM list without deleting messages, rejoin by messaging again

---

### Phase 17: Notifications & Mentions

- [ ] 17.1 **@mentions in messages** — parse `@username` in message content, highlight in blue, link to user profile
- [ ] 17.2 **@everyone / @here mentions** — special mentions that ping all server members (or online members), permission-gated
- [ ] 17.3 **@role mentions** — mention a role to ping all members with that role, render with role color
- [ ] 17.4 **Notification center** — inbox/bell icon in header, list of recent mentions and DMs across all servers
- [ ] 17.5 **Unread channel indicators** — bold channel name + white dot for unread, channel sidebar badge for mention count
- [ ] 17.6 **Mark as read** — right-click channel → "Mark as Read", auto-mark on channel visit after scrolling to bottom
- [ ] 17.7 **Notification settings per channel** — All Messages, Only @mentions, Muted (suppress all), per-channel overrides
- [ ] 17.8 **Notification settings per server** — server-level mute, suppress @everyone, override defaults
- [ ] 17.9 **Push notifications (PWA)** — Web Push API integration, service worker handles push events, opt-in per device
- [ ] 17.10 **Desktop notification popups** — Notification API for foreground alerts, click to navigate to message
- [x] 17.11 **Toast notifications** — in-app toast system (sonner) for actions: "Message sent", "Invite copied", "Upload complete", errors

---

### Phase 18: Presence & Typing Indicators

- [ ] 18.1 **Online presence** — Supabase Presence (Realtime channels), track user online/idle/dnd/invisible status per server
- [ ] 18.2 **Presence indicator dots** — green (online), yellow crescent (idle), red minus (DND), grey (offline/invisible), shown on avatars everywhere
- [ ] 18.3 **Set presence status** — user menu → Online / Idle / Do Not Disturb / Invisible, persists until changed
- [ ] 18.4 **Auto-idle detection** — switch to Idle after 5 min inactivity (no mouse/keyboard), back to Online on activity
- [ ] 18.5 **Typing indicators** — Supabase Presence channel per text channel, broadcast typing state, show "User is typing..." below message list with animated dots
- [ ] 18.6 **Multiple typers** — "User1, User2 are typing..." or "Several people are typing..." for 3+

---

### Phase 19: Search & Discovery

- [ ] 19.1 **Global message search** — search input in header, full-text search across messages in current server, results with context (channel, date, author)
- [ ] 19.2 **Search filters** — filter by: author (`from:username`), channel (`in:channel`), date range (`before:` / `after:`), has attachment (`has:file` / `has:image` / `has:video`)
- [ ] 19.3 **Search results UI** — paginated results panel, click result to jump to message in context (scroll-to with highlight)
- [ ] 19.4 **Server discovery** — public server directory (optional), server listing page with name, icon, description, member count, join button
- [ ] 19.5 **Channel search** — quick-search/filter channels in sidebar for servers with many channels (Ctrl+K)
- [ ] 19.6 **Message jump-to-date** — calendar picker to jump to messages from a specific date

---

### Phase 20: Voice & Video (Future)

- [ ] 20.1 **Voice channel type** — `VOICE` channel type, distinct UI in sidebar (speaker icon, connected users listed below)
- [ ] 20.2 **WebRTC signaling** — signaling server (Supabase Realtime or dedicated), SDP offer/answer exchange
- [ ] 20.3 **Voice connection** — join/leave voice channel, connect/disconnect WebRTC peer connections
- [ ] 20.4 **Voice UI** — connected users grid with avatars, speaking indicator (green ring), mute/deafen buttons
- [ ] 20.5 **Screen share** — `getDisplayMedia()` API, broadcast screen as video track, viewer UI
- [ ] 20.6 **Video chat** — camera toggle, video tiles grid, PiP mode
- [ ] 20.7 **Voice activity detection** — auto-detect speaking, speaking indicator ring on avatar
- [ ] 20.8 **Push-to-talk** — keybind to transmit, visual indicator when transmitting
- [ ] 20.9 **Voice channel limit** — `user_limit` column on voice channels, enforce max concurrent connections
- [ ] 20.10 **Stage channels** — speaker/audience model, raise hand to speak, moderator controls

---

### Phase 21: Emoji & Stickers

- [ ] 21.1 **Emoji picker** — comprehensive emoji picker component (categories, search, skin tone selector, frequently used)
- [ ] 21.2 **Custom server emoji** — `server_emojis` table (`id`, `server_id`, `name`, `image_url`, `uploaded_by`), upload/manage in server settings
- [ ] 21.3 **Emoji in messages** — render custom emoji as inline images, autocomplete `:emoji_name:` in MessageInput
- [ ] 21.4 **Emoji autocomplete** — type `:` to open inline autocomplete dropdown, filter by name, select to insert
- [ ] 21.5 **Sticker system** — `stickers` table, sticker packs, send stickers as standalone messages (large display)
- [ ] 21.6 **Unicode emoji rendering** — render emoji natively or via Twemoji for cross-platform consistency

---

### Phase 22: File Management & Attachments

- [ ] 22.1 **File attachments in chat** — attach any file type (not just images/video), file card with icon/name/size/download, stored via presigned URL
- [ ] 22.2 **Image embeds in chat** — inline image preview below message (expandable), lightbox on click
- [ ] 22.3 **Video embeds in chat** — inline video player below message, poster frame, play button
- [ ] 22.4 **File size limits** — configurable per-server max file size (free: 25MB, boosted: 100MB etc.), enforce client + server-side
- [ ] 22.5 **Image paste from clipboard** — Ctrl+V image paste in MessageInput, auto-upload
- [ ] 22.6 **Drag & drop files into chat** — drag files onto chat area, overlay indicator, auto-upload
- [ ] 22.7 **Download history** — user can view their uploaded files across all servers
- [ ] 22.8 **File preview** — preview common file types inline: PDF, code, text, audio waveform
- [ ] 22.9 **Spoiler attachments** — mark file as spoiler, blur preview until clicked

---

### Phase 23: Thread System (Discord-style)

- [ ] 23.1 **Message threads** — create thread from any message in a TEXT channel, opens thread panel on right side
- [ ] 23.2 **Thread panel UI** — side panel showing thread messages, thread name (first message or custom), reply count badge on parent message
- [ ] 23.3 **Thread list** — "Threads" button in channel header, list active/archived threads
- [ ] 23.4 **Auto-archive** — threads auto-archive after inactivity (1h, 24h, 3d, 7d), configurable
- [ ] 23.5 **Thread notifications** — notify thread participants on new replies, "Following" toggle
- [ ] 23.6 **Thread in forum** — already exists (Phase 9), but align naming/UI with Discord's thread paradigm

---

### Phase 24: Server Boost & Perks (Gamification)

- [ ] 24.1 **Server boost system** — `server_boosts` table (`id`, `server_id`, `user_id`, `started_at`, `expires_at`), track boost level (Level 1/2/3 based on boost count)
- [ ] 24.2 **Boost perks** — Level 1: custom emoji slots +50, better audio; Level 2: server banner, higher upload limit; Level 3: vanity invite URL, animated icon
- [ ] 24.3 **Boost UI** — boost button in server header, boost count indicator, boost leaderboard
- [ ] 24.4 **Vanity invite URL** — `vanity_code` column on `servers`, configurable by Level 3 servers, `/join/vanity-code`

---

### Phase 25: Audit Log & Moderation Tools

- [ ] 25.1 **Audit log** — `audit_log` table (`id`, `server_id`, `user_id`, `action`, `target_type`, `target_id`, `changes` JSONB, `created_at`), log all admin actions
- [ ] 25.2 **Audit log UI** — server settings → Audit Log tab, filterable by action type, user, date range
- [ ] 25.3 **Slow mode** — `slowmode_seconds` column on `channels`, enforce cooldown between messages per user, countdown timer in MessageInput
- [ ] 25.4 **Auto-moderation** — `automod_rules` table, keyword filters, spam detection, regex patterns, configurable actions (delete, warn, timeout)
- [ ] 25.5 **Timeout member** — `timed_out_until` column on `server_members`, prevent sending messages/reactions until timeout expires
- [ ] 25.6 **Report message** — report button on messages, `reports` table, report queue for admins
- [ ] 25.7 **Message purge** — bulk delete messages by user, date range, or count (admin), "Purge last N messages" action

---

### Phase 26: Appearance & Accessibility

- [ ] 26.1 **Theme system** — Light / Dark / AMOLED / System theme picker, CSS variable switching, persist in localStorage
- [ ] 26.2 **Custom CSS** — advanced setting for power users to inject custom CSS (per-client only)
- [ ] 26.3 **Font size adjustment** — small / medium / large font size settings, applied globally
- [ ] 26.4 **Compact message mode** — toggle between Cozy (avatars, grouped) and Compact (no avatars, every line has timestamp) display modes
- [ ] 26.5 **Reduced motion** — respect `prefers-reduced-motion`, disable Framer Motion animations when set
- [ ] 26.6 **High contrast mode** — increased contrast ratios for all text/background combinations
- [ ] 26.7 **Chat density** — adjustable message padding (Compact / Cozy / Comfy)
- [ ] 26.8 **Sidebar width** — resizable sidebar via drag handle
- [ ] 26.9 **Keybinds** — keyboard shortcuts panel: Ctrl+K (search), Ctrl+Shift+M (mute), Ctrl+Shift+D (deafen), Escape (close modals), arrow keys (navigate channels)

---

### Phase 27: Webhooks & Integrations

- [ ] 27.1 **Webhooks** — `webhooks` table (`id`, `channel_id`, `name`, `avatar_url`, `token`, `created_by`), POST endpoint to send messages as webhook
- [ ] 27.2 **Webhook management UI** — server settings → Integrations tab, create/edit/delete webhooks, copy webhook URL
- [ ] 27.3 **Bot support** — bot user type in `profiles`, bot-specific permissions, "BOT" badge next to username
- [ ] 27.4 **Embed messages** — structured embed format (title, description, color, fields, thumbnail, footer), used by webhooks and bots

---

### Phase 28: Invite System Enhancements

- [ ] 28.1 **Invite preview page** — `/invite/[code]` shows server name, icon, member count, description before joining (unauthenticated users see login prompt)
- [ ] 28.2 **Permanent invites** — invites with no expiry, default invite for server
- [ ] 28.3 **Invite tracking** — who joined via which invite, invite analytics in server settings
- [ ] 28.4 **Vanity URL** — custom invite slug (`/join/my-server`), configurable by server owner
- [ ] 28.5 **Invite splash image** — `invite_splash_url` on servers, background image on invite preview page

---

### Phase 29: Activity & Engagement

- [ ] 29.1 **User activity status** — "Playing Game", "Listening to Spotify", "Streaming", custom activity text, shown on profile and member list
- [ ] 29.2 **Server insights** — admin dashboard: message count over time, active members, join/leave trends, popular channels
- [ ] 29.3 **Welcome screen** — configurable welcome page for new members: server description, recommended channels, rules
- [ ] 29.4 **Welcome message** — auto-send message in designated channel when new member joins: "{user} has joined the server! 👋"
- [ ] 29.5 **Rules / verification gate** — new members must accept server rules before accessing channels, `rules_channel_id` on servers
- [ ] 29.6 **Onboarding flow** — multi-step onboarding: pick interests/roles, customize profile, guided tour of channels

---

### Phase 30: Miscellaneous Discord Features

- [ ] 30.1 **Scheduled events** — `server_events` table (`id`, `server_id`, `name`, `description`, `start_time`, `end_time`, `channel_id`, `created_by`), event banner in server header
- [ ] 30.2 **Event RSVP** — interested/attending buttons, attendee list
- [ ] 30.3 **Polls in messages** — create inline polls with multiple options, live vote count, optional anonymous voting
- [ ] 30.4 **Slash commands** — `/` prefix commands in MessageInput: `/giphy`, `/poll`, `/remind`, extensible command system
- [ ] 30.5 **User notes** — private per-user notes visible only to you, stored locally or in DB
- [ ] 30.6 **Message bookmarks** — save/bookmark messages to a personal list, accessible from user menu
- [ ] 30.7 **Channel slow mode** — 5s / 10s / 15s / 30s / 1m / 2m / 5m / 10m cooldown between messages
- [ ] 30.8 **Streamer mode** — hide personal info, invite links, email in UI, purple accent
- [ ] 30.9 **Developer mode** — show "Copy ID" on right-click for all entities (user, message, channel, server, role)
- [ ] 30.10 **System messages** — auto-generated messages for: member join, member leave, channel created, server name change, pin added
- [ ] 30.11 **Confetti & celebrations** — animated confetti on special messages (birthdays, boosts), toggle in settings

---

### Phase 31: Mobile & PWA Enhancements

- [ ] 31.1 **Swipe gestures** — swipe right for server/channel list, swipe left for member list (mobile)
- [ ] 31.2 **Pull-to-refresh** — pull down to refresh message list, media gallery
- [ ] 31.3 **Long-press context menus** — long-press on messages, users, channels for context menu (mobile equivalent of right-click)
- [ ] 31.4 **Image viewer gestures** — pinch-to-zoom, swipe to dismiss in MediaTheater (mobile)
- [ ] 31.5 **Offline message queue** — compose messages while offline, auto-send when connection restores
- [ ] 31.6 **App badge count** — PWA badge API showing unread count on app icon
- [ ] 31.7 **Share target** — PWA share target API to receive shared content from other apps
- [ ] 31.8 **Haptic feedback** — vibration on send, react, join actions (mobile)

---

### Phase 32: Performance & Scaling

- [ ] 32.1 **Virtual scrolling** — replace IntersectionObserver infinite scroll with virtualized list (react-window or tanstack-virtual) for channels with 1000+ messages
- [ ] 32.2 **Message pagination** — load older messages on scroll-up (bidirectional infinite scroll), "Jump to Present" button
- [ ] 32.3 **Image lazy loading** — progressive image loading, blur-up placeholders, native `loading="lazy"`
- [ ] 32.4 **Bundle optimization** — dynamic imports for heavy components (MediaTheater, emoji picker), reduce initial JS payload
- [ ] 32.5 **Service worker caching** — intelligent cache strategies: static assets (cache-first), API responses (stale-while-revalidate), images (cache-first with expiry)
- [ ] 32.6 **Database indexing audit** — review and add indexes for new tables (reactions, DMs, audit log, etc.)
- [ ] 32.7 **Connection pooling** — PgBouncer or Supabase connection pooling for high concurrency
- [ ] 32.8 **CDN for media** — serve media through Cloudflare CDN with caching rules, reduce MinIO direct load
- [ ] 32.9 **Rate limiting** — rate limit API routes and server actions (messages: 5/5s, reactions: 10/10s, uploads: 3/60s)

---

### Phase 33: Security & Privacy

- [ ] 33.1 **Two-factor authentication (2FA)** — TOTP-based 2FA setup (QR code), backup codes, require on login
- [ ] 33.2 **Session management** — view active sessions (device, IP, last active), revoke individual sessions
- [ ] 33.3 **Privacy settings** — who can DM me (everyone / server members / friends only), who can see my status
- [ ] 33.4 **Data export** — GDPR-compliant data export: all messages, uploads, profile data as ZIP download
- [ ] 33.5 **Content scanning** — optional NSFW image detection for uploaded media (on-device or server-side ML)
- [ ] 33.6 **IP logging** — log login IPs for security audit, notify on login from new location
- [ ] 33.7 **Account recovery** — backup email, recovery codes, admin-assisted recovery flow

---

## PRIORITY MATRIX

| Priority | Phases | Rationale |
|----------|--------|-----------|
| **P0 — Do First** | 11 (Message Enhancements), 12 (User Profile), 17.11 (Toast) | Core UX gaps that affect every session |
| **P1 — High** | 13 (Server Customization), 14 (Roles), 15 (Members), 18 (Presence/Typing) | Social + moderation essentials |
| **P2 — Medium** | 16 (DMs), 17 (Notifications), 19 (Search), 21 (Emoji), 22 (Files) | Major feature categories |
| **P3 — Later** | 20 (Voice), 23 (Threads), 25 (Audit Log), 26 (Appearance) | Complex or nice-to-have |
| **P4 — Future** | 24 (Boost), 27 (Webhooks), 28 (Invites), 29 (Activity), 30 (Misc) | Polish and engagement |
| **P5 — Ongoing** | 31 (Mobile), 32 (Performance), 33 (Security) | Continuous improvement |
