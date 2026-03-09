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

## Upload Flow (MinIO Presigned URLs)

```
Client                  Next.js Server Action          MinIO
  |                            |                          |
  |-- POST /api/upload/presign-->|                         |
  |   { filename, mime_type }   |-- PutObjectCommand ----->|
  |                            |<-- presigned PUT URL ----|
  |<-- { upload_url, file_key }--|                         |
  |                             |                          |
  |-- PUT upload_url (file) -------------------------------->|
  |<-- 200 OK ------------------------------------------------|
  |                             |                          |
  |-- Server Action: insert media_attachments row          |
```

Key rules:
- The MinIO secret key **never** reaches the client.
- Thumbnails are generated client-side (canvas API) and uploaded separately as a second presigned PUT.
- `file_key` is stored for future URL migration (if MinIO domain changes).

---

## Realtime Architecture

Chat channels use Supabase Realtime postgres_changes subscriptions:
```
supabase
  .channel('messages:channel_id=eq.{id}')
  .on('postgres_changes', { event: 'INSERT', table: 'messages' }, handler)
  .subscribe()
```

Media channels subscribe similarly on `media_attachments` for live gallery updates.

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
    layout/               # Sidebar, AppShell
    chat/                 # MessageList, MessageInput, MessageBubble
    media/                # MediaGrid, MediaCard, UploadModal, TheaterModal
  features/
    chat/                 # Server actions: sendMessage, deleteMessage
    media/                # Server actions: getPresignedUrl, insertMedia, deleteMedia
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
