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
- [ ] 3.11 File attachment support inside chat (deferred to Phase 4)
- [ ] 3.12 Message delete (own messages only)

## Phase 4: Media Gallery (Bunkr Vibe)
- [x] 4.1 Media forum page — full gallery grid layout with IntersectionObserver infinite scroll
- [x] 4.2 MediaToolbar — sort by date/size/name (ascending/descending toggle), grid-size picker (sm/md/lg)
- [x] 4.3 MediaCard — thumbnail, video play/duration overlay, uploader name, file size, relative date
- [ ] 4.4 Upload modal — drag & drop, client-side thumbnail generation, presigned PUT to MinIO
- [x] 4.5 MediaTheater — full-screen overlay with keyboard nav (Esc/←/→), download button, info bar
- [ ] 4.6 Realtime feed for new uploads in media channels
- [x] 4.7 Pagination — server action `fetchMediaPage` with range-based pagination (40 per page)

## Phase 5: Polish + PWA + Deploy
- [ ] 5.1 PWA manifest + service worker
- [ ] 5.2 Framer Motion transitions (page, modal, card)
- [ ] 5.3 Mobile responsive audit
- [ ] 5.4 Vercel deployment + environment variable configuration
- [ ] 5.5 Custom domain setup
- [ ] 5.6 Error boundaries + offline fallback UI
