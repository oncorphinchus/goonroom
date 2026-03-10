# GoonRoom — Claude Code Memory

## Project Overview
Discord/Bunkr-style real-time chat + media gallery app.
Stack: Next.js (App Router), Tailwind, shadcn/ui, Supabase, MinIO S3, Framer Motion.
Self-hosted on Intel NUC via Docker + Cloudflare Tunnels.

## Current Phase Status
- Phases 1–12 complete
- Phase 13 in progress (13.10 channel edit modal + 13.11 NSFW age-gate still open)
- Active next after Phase 13: Phase 14 (Roles & Permissions)

## Key File Locations
- Server actions: `src/features/{server,channel,chat,media,auth}/actions.ts`
- Media queries: `src/features/media/queries.ts` (fetchMediaPage lives here, NOT in actions.ts)
- S3 dual-client: `src/lib/s3.ts`
- DB types: `src/types/database.ts`
- Chat types: `src/types/chat.ts`

## Quality Review Notes
See `memory/quality-review.md` for the current findings backlog and fix tracking.

## Architecture Notes
- Two Supabase clients: `src/lib/supabase/server.ts` (server) + `src/lib/supabase/client.ts` (browser)
- Two S3 clients in `src/lib/s3.ts`: internal (MINIO_ENDPOINT) + public (MINIO_PUBLIC_URL)
- RLS anchors: `is_server_member()` + `get_server_role()` DB functions
- Realtime: postgres_changes subscriptions, no polling
- Message grouping: same user within 5 min = grouped
- `message_reactions` has `channel_id` denormalized for Realtime filter efficiency

## Conventions
- Server actions return `{ error: string } | undefined` OR `{ error?: string }` (inconsistent — prefer `{ error?: string }`)
- `fetchMediaPage` throws on error (different from other actions — should be standardized)
- Optimistic updates: set state → call action → rollback on error
- Profile cache uses Map + inflight dedup in ChatArea
