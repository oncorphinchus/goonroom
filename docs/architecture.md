# GoonRoom — Architecture

## Overview
GoonRoom is a self-hosted Discord/Bunkr hybrid: real-time text chat in "Chat Channels" and a media-first gallery browser in "Media Forums". All media is stored on a self-hosted MinIO S3-compatible server.

---

## Tech Stack

| Layer         | Technology                                         |
|---------------|---------------------------------------------------|
| Frontend      | Next.js (App Router), React 19, TypeScript        |
| Styling       | Tailwind CSS v4, shadcn/ui, Lucide Icons           |
| Animation     | Framer Motion                                      |
| Database/Auth | Supabase (PostgreSQL), RLS enabled on all tables  |
| Realtime      | Supabase Realtime (WebSocket subscriptions)        |
| Storage       | Self-hosted MinIO (S3-compatible)                  |
| S3 SDK        | @aws-sdk/client-s3, @aws-sdk/s3-request-presigner |
| Deployment    | Vercel (Next.js), Cloudflare Tunnels (MinIO)       |
| Validation    | Zod                                                |

---

## Supabase Project
- **Project ID:** `enoszpjrvhvbjvzvumjs`
- **Region:** us-east-1
- **URL:** `https://enoszpjrvhvbjvzvumjs.supabase.co`

---

## Database Schema

### `profiles`
Extends `auth.users`. Auto-created via trigger on signup.
| Column       | Type        | Notes                    |
|-------------|-------------|--------------------------|
| id          | uuid (PK)   | References auth.users    |
| username    | text        | Unique                   |
| avatar_url  | text        | Nullable                 |
| created_at  | timestamptz |                          |

### `channels`
| Column      | Type        | Notes                      |
|-------------|-------------|----------------------------|
| id          | uuid (PK)   |                            |
| name        | text        |                            |
| type        | text        | CHECK: 'CHAT' or 'MEDIA'   |
| description | text        | Nullable                   |
| position    | integer     | For sidebar ordering        |
| created_at  | timestamptz |                            |

### `messages`
| Column      | Type        | Notes                                 |
|-------------|-------------|---------------------------------------|
| id          | uuid (PK)   |                                       |
| channel_id  | uuid        | FK → channels, CASCADE DELETE         |
| user_id     | uuid        | FK → profiles, SET NULL on delete     |
| content     | text        |                                       |
| created_at  | timestamptz | Index: (channel_id, created_at DESC)  |

### `media_attachments`
| Column           | Type        | Notes                                       |
|------------------|-------------|---------------------------------------------|
| id               | uuid (PK)   |                                             |
| channel_id       | uuid        | FK → channels, CASCADE DELETE               |
| message_id       | uuid        | FK → messages, CASCADE DELETE (nullable)    |
| user_id          | uuid        | FK → profiles, SET NULL on delete           |
| file_url         | text        | Full MinIO URL                              |
| file_key         | text        | Raw S3 object key (for future URL migration)|
| thumbnail_url    | text        | Nullable; client-generated                  |
| file_name        | text        |                                             |
| file_size        | bigint      | In bytes                                    |
| mime_type        | text        |                                             |
| duration_seconds | integer     | Nullable; video only                        |
| created_at       | timestamptz | Indexes: by date, size, name                |

---

## Media Loading Flow (Current)

```
Server Component              Client Grid                 Server Action
  |                              |                             |
  |-- select media_attachments -->|                            |
  |   (first page, 40 rows)       |                            |
  |<-- initialItems + total ------|                            |
  |                               |                            |
  |                               |-- IntersectionObserver --> |
  |                               |   fetchMediaPage()         |
  |                               |<-- next page + hasMore ----|
  |                               |                            |
  |                               |-- optional theater open -->|
```

Current notes:
- Media browsing is implemented (sort, grid-size toggle, infinite scroll, theater).
- Upload UI + persistence flow is not implemented yet (roadmap item 4.4).
- `src/lib/s3.ts` already provides presigned upload helpers for future upload integration.

---

## Realtime Architecture

Chat channels use Supabase Realtime postgres_changes subscriptions:
```
supabase
  .channel('messages:channel_id=eq.{id}')
  .on('postgres_changes', { event: 'INSERT', table: 'messages' }, handler)
  .subscribe()
```

Media gallery currently does **not** subscribe to realtime updates yet.
Live media inserts remain a roadmap item (`docs/roadmap.md` 4.6).

---

## File Structure
```
src/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (app)/
      layout.tsx          # Sidebar + main content shell
      channels/[channelId]/
        page.tsx          # Renders ChatView or MediaView based on channel.type
  components/
    ui/                   # shadcn primitives
    layout/               # Sidebar, NavBar
    chat/                 # ChatArea, MessageList, MessageInput, MessageBubble
    media/                # MediaArea, MediaToolbar, MediaGrid, MediaCard, MediaTheater
  features/
    chat/                 # Server action: sendMessage
    media/                # Server query action: fetchMediaPage
    auth/                 # signIn, signUp, signOut server actions
  lib/
    supabase/
      client.ts           # Browser Supabase client
      server.ts           # Server Supabase client (cookies)
    s3.ts                 # MinIO S3 client + presign helpers
    utils.ts              # cn(), formatBytes, formatDuration
  types/
    database.ts           # Auto-generated Supabase types
  middleware.ts           # Session refresh for all routes
```
