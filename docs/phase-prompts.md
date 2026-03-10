# GoonRoom — Phase Implementation Prompts

Copy-paste these into a new Cursor Agent chat to implement each phase.
Start a **new chat** for each phase. Complete and commit one before starting the next.

---

## TEMPLATE (adapt for any phase)

```
Read docs/roadmap.md and identify Phase [N]. Implement every task in that phase.

For each task:
1. If it needs a schema change, use the supabase MCP tool (apply_migration) to alter the DB, then regenerate types in src/types/database.ts
2. Create/update server actions in src/features/
3. Build/update UI components in src/components/
4. Wire up Realtime subscriptions if needed
5. Test with Puppeteer before moving on

After ALL tasks are done:
- Mark each task [x] in docs/roadmap.md
- Offer a git commit
```

---

## Phase 11: Message Enhancements

```
Read docs/roadmap.md and implement Phase 11: Message Enhancements.

Work through tasks 11.1 → 11.12 in order. Here's the priority subset to focus on first — these are the highest impact:

### MUST DO (this session):
- 11.1 + 11.2: Edit message (edited_at column, editMessage action, inline edit UI, realtime UPDATE)
- 11.3 + 11.4: Reply to message (reply_to_id column, reply preview in input, quoted block in bubble)
- 11.7 + 11.8 + 11.9: Reactions (message_reactions table, add/remove actions, emoji picker, realtime)
- 11.11: Markdown rendering in messages (bold, italic, strikethrough, code, blockquote)
- 11.12: Date separators between message groups

### NICE TO HAVE (if time):
- 11.5 + 11.6: Pin messages
- 11.10: Link previews

For schema changes use the supabase MCP (apply_migration). After altering tables, update src/types/database.ts.
For new server actions, follow the existing pattern in src/features/chat/actions.ts (zod validation, auth check, return { error } on failure).
For UI changes, follow existing patterns in src/components/chat/ (MessageBubble, MessageInput, MessageList).
Realtime subscriptions should follow the pattern in ChatArea.tsx (subscribe to postgres_changes, cleanup in useEffect).

After ALL tasks are done, mark them [x] in docs/roadmap.md and offer a commit.
```

---

## Phase 12: User Profile & Account Management

```
Read docs/roadmap.md and implement Phase 12: User Profile & Account Management.

### MUST DO:
- 12.1: User settings page — create app/(app)/settings/page.tsx with tabbed layout (My Account, Profile)
- 12.2: Change username — updateUsername action, uniqueness check, form in settings
- 12.4: Change password — updatePassword action, current password confirmation
- 12.5: User bio — add bio column to profiles, editable textarea in settings, show on profile
- 12.8: User profile card popover — click any username to see avatar, bio, roles, member since
- 12.9: Account info display — show email, username, ID, created date in settings
- 12.10: Delete account — deleteAccount action, "type DELETE to confirm" modal

### NICE TO HAVE:
- 12.3: Change email
- 12.6: Custom status
- 12.7: Profile banner
- 12.11: Avatar crop
- 12.12: Accent color

For schema changes (bio column etc.) use supabase MCP apply_migration.
Settings page should use the Discord dark theme from globals.css.
Profile card should be a Radix Popover, not a full page.

After ALL tasks are done, mark them [x] in docs/roadmap.md and offer a commit.
```

---

## Phase 13: Server Profile & Customization

```
Read docs/roadmap.md and implement Phase 13: Server Profile & Customization.

### MUST DO:
- 13.1 + 13.2 + 13.3: Server-specific profiles (server_profiles table, nickname, server avatar)
- 13.4: Server icon upload (update createServer + ServerSettingsModal to handle icon upload via presigned URL)
- 13.7: Server settings overhaul (tabbed: Overview, Roles, Channels, Invites, Members)
- 13.8 + 13.9: Channel categories (channel_categories table, category_id on channels, collapsible sidebar groups, drag-and-drop reorder)
- 13.10: Channel topic (editable topic in channel header)

### NICE TO HAVE:
- 13.5: Server banner
- 13.6: Server description
- 13.11: NSFW flag

Schema changes via supabase MCP. Display nicknames by checking server_profiles first, falling back to profiles.username.

After ALL tasks are done, mark them [x] in docs/roadmap.md and offer a commit.
```

---

## Phase 14: Role & Permission System

```
Read docs/roadmap.md and implement Phase 14: Role & Permission System.

This is a foundational phase — take extra care with the schema.

### MUST DO:
- 14.1: server_roles table (id, server_id, name, color, position, permissions BIGINT, is_default)
- 14.2: Permission bitmask constants in src/lib/permissions.ts
- 14.3: user_roles junction table, assign/remove actions
- 14.4: Role management UI in server settings
- 14.6: Permission-gated UI across all existing components
- 14.7: Role colors in chat (username colored by highest role)
- 14.8: @everyone default role
- 14.9: Role hierarchy enforcement

### Schema:
- server_roles: id uuid PK, server_id FK servers, name text, color text, position int, permissions bigint default 0, is_default bool default false
- user_roles: server_id, user_id, role_id (composite PK)
- Migrate existing server_members.role values to the new system
- Update RLS to check permissions via roles instead of raw role text

After ALL tasks are done, mark them [x] in docs/roadmap.md and offer a commit.
```

---

## Phase 17.11: Toast Notifications (Quick Win)

```
Read docs/roadmap.md task 17.11. This is a quick standalone task.

Install sonner (npm install sonner). Add the Toaster to the root layout.
Then add toast notifications to all existing actions that currently have no user feedback:
- "Invite link copied" when copying invite
- "Channel created" / "Channel deleted"
- "Server created" / "Server updated" / "Server deleted"
- "Message deleted"
- "Avatar updated"
- "Post created" / "Post locked" / "Post pinned" / "Post deleted"
- Error toasts for all failed actions

Mark 17.11 [x] in docs/roadmap.md and offer a commit.
```

---

## Phase 18: Presence & Typing Indicators

```
Read docs/roadmap.md and implement Phase 18: Presence & Typing Indicators.

### MUST DO:
- 18.1: Online presence via Supabase Presence (Realtime channels). Track status per server. Store presence_status on profiles (online/idle/dnd/invisible).
- 18.2: Green/yellow/red/grey dots on avatars everywhere (MessageBubble, ChannelSidebar, member list)
- 18.3: Status picker in user menu (ChannelSidebar footer)
- 18.4: Auto-idle after 5 min inactivity (document event listeners)
- 18.5 + 18.6: Typing indicators — broadcast typing via Presence channel, show "User is typing..." with animated dots below MessageList

Use Supabase Realtime Presence (channel.track()) not database polling.
Typing state should debounce (send typing=true on keypress, auto-clear after 3s of no typing).

After ALL tasks are done, mark them [x] in docs/roadmap.md and offer a commit.
```

---

## Recommended Order

1. **17.11** — Toast notifications (30 min, instant quality-of-life improvement)
2. **11** — Message enhancements (largest UX gap)
3. **12** — User profile & account
4. **18** — Presence & typing
5. **13** — Server customization
6. **14** — Roles & permissions
7. **15** — Member management
8. Continue with 16+ in roadmap order
