# GoonRoom — Project Roadmap

## Phase 1: Foundation (Current)
- [x] 1.1 Project scaffolding (Next.js, Tailwind, shadcn, deps)
- [x] 1.2 `.cursorrules` + `/docs` folder created
- [x] 1.3 Supabase project created (`enoszpjrvhvbjvzvumjs`, us-east-1)
- [x] 1.4 Database schema applied (profiles, channels, messages, media_attachments)
- [x] 1.5 RLS policies applied to all tables
- [x] 1.6 TypeScript types generated (`src/types/database.ts`)
- [x] 1.7 Supabase client helpers (`src/lib/supabase/client.ts`, `server.ts`)
- [x] 1.8 MinIO S3 client (`src/lib/s3.ts`)
- [x] 1.9 `.env.local` scaffold with placeholders

## Phase 2: Auth + App Shell
- [ ] 2.1 Supabase Auth — email/password login + register pages
- [ ] 2.2 Auth callback route (`/auth/callback`)
- [ ] 2.3 Middleware for session refresh (`src/middleware.ts`)
- [ ] 2.4 Root layout with Inter + Google Fonts
- [ ] 2.5 Authenticated app shell layout (`(app)/layout.tsx`)
- [ ] 2.6 Sidebar component — splits "Chat Channels" and "Media Forums"
- [ ] 2.7 Active channel highlighting, client-side navigation (no full reloads)
- [ ] 2.8 User avatar + username display in sidebar footer

## Phase 3: Real-Time Chat
- [ ] 3.1 Chat channel page (`(app)/channels/[channelId]/page.tsx`)
- [ ] 3.2 Message list component — infinite scroll upward, bottom-anchored
- [ ] 3.3 Supabase Realtime subscription for new messages
- [ ] 3.4 Message input bar (bottom) with send action (Server Action)
- [ ] 3.5 File attachment support inside chat (image/video via presigned URL)
- [ ] 3.6 Message delete (own messages only)
- [ ] 3.7 Optimistic UI updates on send

## Phase 4: Media Gallery (Bunkr Vibe)
- [ ] 4.1 Media forum page — full gallery grid layout
- [ ] 4.2 Top-bar controls: Sort (size / date / name), grid-size toggle
- [ ] 4.3 Media card component — thumbnail, duration overlay for video, uploader, size, date
- [ ] 4.4 Upload modal — drag & drop, client-side thumbnail generation, presigned PUT to MinIO
- [ ] 4.5 Theater mode modal — full-screen image/video viewer
- [ ] 4.6 Realtime feed for new uploads in media channels
- [ ] 4.7 Pagination / infinite scroll for media grid

## Phase 5: Polish + PWA + Deploy
- [ ] 5.1 PWA manifest + service worker
- [ ] 5.2 Framer Motion transitions (page, modal, card)
- [ ] 5.3 Mobile responsive audit
- [ ] 5.4 Vercel deployment + environment variable configuration
- [ ] 5.5 Custom domain setup
- [ ] 5.6 Error boundaries + offline fallback UI
