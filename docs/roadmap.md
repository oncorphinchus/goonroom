# GoonRoom — Project Roadmap

## Phase 1: Foundation ✅
- [x] 1.1 Project scaffolding (Next.js, Tailwind, shadcn, deps)
- [x] 1.2 `.cursorrules` + `/docs` folder created
- [x] 1.3 Supabase project created (`enoszpjrvhvbjvzvumjs`, us-east-1)
- [x] 1.4 Database schema applied (profiles, channels, messages, media_attachments)
- [x] 1.5 RLS policies applied to all tables
- [x] 1.6 TypeScript types generated (`src/types/database.ts`)
- [x] 1.7 Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`)
- [x] 1.8 MinIO S3 client (`src/lib/s3.ts`) — lazy singleton, env validation
- [x] 1.9 `.env.local` scaffold with placeholders

## Phase 2: Auth + App Shell ✅
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

## Phase 3: Real-Time Chat ✅
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

## Phase 4: Media Gallery (Bunkr Vibe) ✅
- [x] 4.1 Media forum page — full gallery grid layout with IntersectionObserver infinite scroll
- [x] 4.2 MediaToolbar — sort by date/size/name (ascending/descending toggle), grid-size picker (sm/md/lg)
- [x] 4.3 MediaCard — thumbnail, video play/duration overlay, uploader name, file size, relative date
- [x] 4.4 Upload modal — drag & drop, client-side thumbnail generation, presigned PUT to MinIO
- [x] 4.5 MediaTheater — full-screen overlay with keyboard nav (Esc/←/→), download button, info bar
- [x] 4.6 Realtime feed for new uploads in media channels (completed via forum media subscriptions)
- [x] 4.7 Pagination — server action `fetchMediaPage` with range-based pagination (40 per page)

## Phase 5: Infrastructure & Containerization ✅
- [x] 5.1 Update `next.config.ts` for standalone output (`output: 'standalone'`)
- [x] 5.2 Create production `Dockerfile` (multi-stage, Node 20 Alpine, standalone)
- [x] 5.3 Create `docker-compose.yml` (Next.js + MinIO on shared `goonroom-net` bridge)
- [x] 5.4 Update `.env` structure for dual-network S3 endpoints (`MINIO_ENDPOINT` → internal Docker, `MINIO_PUBLIC_URL` → Cloudflare Tunnel)
- [x] 5.5 Verify Docker build and local container startup — build succeeds (304 MB image), both nextjs + minio containers start and serve traffic, login flow verified via Puppeteer

## Phase 6: Polish + PWA + Deploy
- [x] 6.1 PWA manifest (`public/manifest.json`) + service worker (`public/sw.js`) + offline page + SW registrar component
- [x] 6.2 Framer Motion transitions — MediaTheater (fade/scale overlay, animated content switch), MediaCard (staggered scale entrance, whileTap), ForumPostCard (staggered slide-up, whileTap), NavBar server icons (staggered slide + animated active pill via layoutId)
- [x] 6.3 Mobile responsive audit — NavBar/ChannelSidebar hidden on mobile, MobileShell with shadcn Sheet drawer, hamburger menu trigger, full-width single-pane layout on small screens
- [x] 6.4 Docker production deployment + Cloudflare Tunnel — `cloudflared` service added to compose, `CLOUDFLARE_TUNNEL_TOKEN` env var, build args for NEXT_PUBLIC_* vars, MinIO image updated to `latest`, architecture docs updated with service table + tunnel hostname mappings
- [ ] 6.5 Custom domain setup
- [x] 6.6 Error boundaries + offline fallback UI — global `error.tsx` (retry button), root `not-found.tsx` (ghost icon + "Go Home"), `loading.tsx` skeletons for server + channel routes, `/offline` page with WifiOff icon

## Phase 7: Schema Evolution ✅
- [x] 7.1 Create `servers`, `server_members`, `server_invites`, `forum_posts` tables
- [x] 7.2 Alter `channels` (add `server_id`, type CHECK → TEXT/FORUM), `messages` (add `post_id`), `media_attachments` (add `post_id`)
- [x] 7.3 Data migration — default server, member assignment, CHAT→TEXT rename, MEDIA channel deletion
- [x] 7.4 Indexes — server members, forum posts, post-scoped messages/media
- [x] 7.5 RLS overhaul — `is_server_member()` + `get_server_role()` helper functions, server-scoped policies on all tables
- [x] 7.6 Regenerate TypeScript types (`src/types/database.ts`), create `server.ts` and `forum.ts` type files

## Phase 8: Server Infrastructure + Routing ✅
- [x] 8.1 Server actions — `createServer`, `joinServer`, `getMyServers`, `createInvite`, `getServerMembers`
- [x] 8.2 Channel actions — `createChannel`, `deleteChannel`
- [x] 8.3 Routing restructure — `servers/[serverId]/channels/[channelId]/` with `posts/[postId]/`
- [x] 8.4 NavBar overhaul — dynamic server icon list, active pill indicator, create server button
- [x] 8.5 ChannelSidebar update — server-scoped, TEXT/FORUM grouping, invite button, admin controls
- [x] 8.6 Update `sendMessage` — optional `postId`, forum thread validation, locked post check

## Phase 9: Forum System ✅
- [x] 9.1 Forum post actions — `createForumPost`, `fetchForumPosts`, `lockPost`, `pinPost`, `deletePost`
- [x] 9.2 Update media actions — `insertMediaItem` and `fetchMediaPage` support `postId`
- [x] 9.3 ForumPostList — post cards, infinite scroll, "New Post" button, forum-wide media tab
- [x] 9.4 ThreadView — tab bar (Chat/Media), thread header with lock/pin status
- [x] 9.5 ThreadChat — reuses ChatArea pattern scoped to `post_id`, locked post UI
- [x] 9.6 ForumMediaTab — per-thread and forum-wide gallery views, upload support
- [x] 9.7 CreatePostModal — title + optional initial message

## Phase 10: Realtime + Polish ✅
- [x] 10.1 Database triggers — `trg_messages_forum_stats` (reply_count, last_activity_at), `trg_media_forum_activity`
- [x] 10.2 Realtime subscriptions — thread messages (post_id filter), forum posts (channel_id filter)
- [x] 10.3 Edge cases — locked posts block sendMessage, CASCADE DELETE on posts, orphaned media preserved
- [x] 10.4 Documentation updates — `docs/architecture.md`, `docs/roadmap.md`, `.cursorrules`
