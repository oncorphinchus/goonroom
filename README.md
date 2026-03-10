# GoonRoom

GoonRoom is a Next.js App Router app with Supabase auth/realtime chat and a media gallery experience inspired by Discord + Bunkr workflows.

## Current Status

- Auth flow is implemented (`/login`, `/register`, `/auth/callback`) with server actions and zod-validated forms.
- Authenticated app shell is implemented with a left server nav, channel sidebar, and profile footer controls.
- Chat channels are implemented with server-fetched history (50 messages), optimistic send, and Supabase Realtime inserts.
- Media channels are implemented as a browsable gallery with sorting, grid size controls, theater overlay, and infinite scroll pagination.
- Upload/create-media flow is not yet wired into UI (roadmap Phase 4.4 remains open).

## Tech Stack

- Next.js (App Router), React 19, TypeScript
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres, Auth, Realtime)
- MinIO S3-compatible storage helpers via AWS SDK v3
- Zod + react-hook-form for validation/forms

## Environment Variables

Set these in `.env.local` before running:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `MINIO_ENDPOINT`
- `MINIO_REGION`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `MINIO_BUCKET`
- `MINIO_PUBLIC_URL`

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Project Docs

- Roadmap: `docs/roadmap.md`
- Architecture notes: `docs/architecture.md`
