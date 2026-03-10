"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Pencil, Reply, Smile, Trash2, Pin, Film } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMessageTime } from "@/lib/utils";
import { MessageMarkdown } from "./MessageMarkdown";
import { ReactionBar } from "./ReactionBar";
import { EmojiPicker } from "./EmojiPicker";
import { LinkPreview } from "./LinkPreview";
import { UserProfileCard } from "@/components/layout/UserProfileCard";
import type { MessageGroup, MessageWithProfile } from "@/types/chat";

const URL_REGEX = /https?:\/\/[^\s<>"]+/;
function extractFirstUrl(content: string): string | null {
  return content.match(URL_REGEX)?.[0] ?? null;
}

interface MessageBubbleProps {
  group: MessageGroup;
  isOwn: boolean;
  currentUserId: string;
  isAdmin?: boolean;
  serverId?: string;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onReplyToMessage: (message: MessageWithProfile) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  onPinMessage?: (messageId: string, currentlyPinned: boolean) => void;
  onScrollToMessage?: (messageId: string) => void;
}

function ActionToolbar({
  isOwn,
  isAdmin,
  isPinned,
  onEdit,
  onReply,
  onDelete,
  onReact,
  onPin,
}: {
  isOwn: boolean;
  isAdmin: boolean;
  isPinned: boolean;
  onEdit: () => void;
  onReply: () => void;
  onDelete: () => void;
  onReact: () => void;
  onPin: () => void;
}): React.ReactNode {
  return (
    <div
      className={cn(
        "absolute -top-3 right-2 z-10 flex items-center gap-0.5 rounded border border-[#1e1f22] bg-[#2b2d31] p-0.5 shadow-md",
        "opacity-0 transition-opacity group-hover/msg:opacity-100",
      )}
    >
      {isOwn && (
        <button
          type="button"
          onClick={onEdit}
          className="flex h-6 w-6 items-center justify-center rounded text-[#b5bac1] transition-colors hover:bg-[#404249] hover:text-white"
          aria-label="Edit message"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        type="button"
        onClick={onReply}
        className="flex h-6 w-6 items-center justify-center rounded text-[#b5bac1] transition-colors hover:bg-[#404249] hover:text-white"
        aria-label="Reply"
      >
        <Reply className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onReact}
        className="flex h-6 w-6 items-center justify-center rounded text-[#b5bac1] transition-colors hover:bg-[#404249] hover:text-white"
        aria-label="Add reaction"
      >
        <Smile className="h-3.5 w-3.5" />
      </button>
      {isAdmin && (
        <button
          type="button"
          onClick={onPin}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-[#404249]",
            isPinned ? "text-[#faa61a] hover:text-[#faa61a]" : "text-[#b5bac1] hover:text-white",
          )}
          aria-label={isPinned ? "Unpin message" : "Pin message"}
        >
          <Pin className="h-3.5 w-3.5" />
        </button>
      )}
      {isOwn && (
        <button
          type="button"
          onClick={onDelete}
          className="flex h-6 w-6 items-center justify-center rounded text-[#b5bac1] transition-colors hover:bg-[#ed4245]/20 hover:text-[#ed4245]"
          aria-label="Delete message"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function MessageBubble({
  group,
  isOwn,
  currentUserId,
  isAdmin = false,
  serverId,
  onDeleteMessage,
  onEditMessage,
  onReplyToMessage,
  onAddReaction,
  onRemoveReaction,
  onPinMessage,
  onScrollToMessage,
}: MessageBubbleProps): React.ReactNode {
  const initials = group.username.slice(0, 2).toUpperCase();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  function startEdit(message: MessageWithProfile): void {
    setEditingId(message.id);
    setEditContent(message.content);
    setTimeout(() => editRef.current?.focus(), 0);
  }

  function cancelEdit(): void {
    setEditingId(null);
    setEditContent("");
  }

  function saveEdit(messageId: string): void {
    const trimmed = editContent.trim();
    if (!trimmed) {
      toast.error("Message cannot be empty");
      return;
    }
    onEditMessage(messageId, trimmed);
    setEditingId(null);
    setEditContent("");
  }

  function handleReactionToggle(messageId: string, emoji: string): void {
    const msg = group.messages.find((m) => m.id === messageId);
    const existing = msg?._reactions?.find((r) => r.emoji === emoji);
    if (existing?.userIds.includes(currentUserId)) {
      onRemoveReaction(messageId, emoji);
    } else {
      onAddReaction(messageId, emoji);
    }
  }

  return (
    <div className="group flex items-start gap-3 rounded px-2 py-0.5 transition-colors hover:bg-[#2e3035]">
      <UserProfileCard userId={group.userId} serverId={serverId}>
        <Avatar className="mt-0.5 h-10 w-10 shrink-0 cursor-pointer">
          <AvatarImage src={group.avatarUrl ?? undefined} alt={group.username} />
          <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white select-none">
            {initials}
          </AvatarFallback>
        </Avatar>
      </UserProfileCard>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 leading-none">
          <UserProfileCard userId={group.userId} serverId={serverId}>
            <button
              type="button"
              className={cn(
                "text-sm font-medium transition-opacity hover:opacity-80",
                isOwn ? "text-[#5865f2]" : "text-white",
              )}
            >
              {group.username}
            </button>
          </UserProfileCard>
          <span className="text-xs text-[#72767d]">
            {formatMessageTime(group.timestamp)}
          </span>
        </div>
        {group.customStatus && (
          <p className="mt-0.5 text-xs text-[#72767d]">{group.customStatus}</p>
        )}

        {group.messages.map((message) => (
          <div
            key={message.id}
            id={`msg-${message.id}`}
            className="group/msg relative"
          >
            {/* Reply quote block */}
            {message._replyTo && (
              <button
                type="button"
                onClick={() =>
                  onScrollToMessage?.(message._replyTo!.id)
                }
                className="mb-0.5 flex items-center gap-1.5 rounded bg-[#2b2d31] px-2 py-1 text-xs transition-colors hover:bg-[#35373c]"
              >
                <Reply className="h-3 w-3 shrink-0 text-[#72767d]" />
                <span className="font-medium text-[#b5bac1]">
                  {message._replyTo.username}
                </span>
                <span className="truncate text-[#72767d]">
                  {message._replyTo.content.slice(0, 100)}
                </span>
              </button>
            )}

            {/* Action toolbar */}
            {!message._pending && (
              <ActionToolbar
                isOwn={isOwn}
                isAdmin={isAdmin}
                isPinned={message.pinned}
                onEdit={() => startEdit(message)}
                onReply={() => onReplyToMessage(message)}
                onDelete={() => onDeleteMessage(message.id)}
                onReact={() =>
                  setEmojiPickerMsgId(
                    emojiPickerMsgId === message.id ? null : message.id,
                  )
                }
                onPin={() => onPinMessage?.(message.id, message.pinned)}
              />
            )}

            {/* Inline emoji picker */}
            {emojiPickerMsgId === message.id && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setEmojiPickerMsgId(null)}
                />
                <div className="absolute right-0 top-6 z-50">
                  <EmojiPicker
                    onSelect={(emoji) => {
                      onAddReaction(message.id, emoji);
                      setEmojiPickerMsgId(null);
                    }}
                  />
                </div>
              </>
            )}

            {/* Message content or edit textarea */}
            {editingId === message.id ? (
              <div className="mt-0.5">
                <textarea
                  ref={editRef}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      saveEdit(message.id);
                    }
                    if (e.key === "Escape") {
                      cancelEdit();
                    }
                  }}
                  className="w-full resize-none rounded bg-[#40444b] px-2 py-1.5 text-sm text-[#dcddde] outline-none"
                  rows={Math.min(
                    editContent.split("\n").length + 1,
                    8,
                  )}
                />
                <p className="mt-0.5 text-xs text-[#72767d]">
                  Esc to{" "}
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="text-[#00aff4] hover:underline"
                  >
                    cancel
                  </button>
                  {" "}&middot; Enter to{" "}
                  <button
                    type="button"
                    onClick={() => saveEdit(message.id)}
                    className="text-[#00aff4] hover:underline"
                  >
                    save
                  </button>
                </p>
              </div>
            ) : (
              <div className="mt-0.5 flex items-baseline gap-1">
                <div
                  className={cn(
                    "min-w-0 flex-1 break-words text-sm leading-relaxed",
                    message._pending
                      ? "italic text-[#72767d]"
                      : "text-[#dcddde]",
                  )}
                >
                  {message._pending ? (
                    <span>{message.content}</span>
                  ) : (
                    <MessageMarkdown content={message.content} />
                  )}
                </div>
                {message.edited_at && (
                  <span
                    className="shrink-0 text-[10px] text-[#72767d]"
                    title={new Date(message.edited_at).toLocaleString()}
                  >
                    (edited)
                  </span>
                )}
              </div>
            )}

            {/* Media attachments */}
            {message._media && message._media.length > 0 && !message._pending && (
              <div className="mt-1 flex flex-wrap gap-1">
                {message._media.map((item) =>
                  item.mime_type.startsWith("image/") ? (
                    <a
                      key={item.id}
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative block max-h-64 max-w-xs overflow-hidden rounded-md"
                    >
                      <Image
                        src={item.thumbnail_url ?? item.file_url}
                        alt={item.file_name}
                        width={320}
                        height={240}
                        className="max-h-64 w-auto rounded-md object-cover"
                        unoptimized
                      />
                    </a>
                  ) : (
                    <a
                      key={item.id}
                      href={item.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-md bg-[#2b2d31] px-3 py-2 text-sm text-[#dcddde] transition-colors hover:bg-[#35373c]"
                    >
                      <Film className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.file_name}</span>
                      {item.duration_seconds != null && (
                        <span className="text-xs text-[#72767d]">
                          {Math.floor(item.duration_seconds / 60)}:
                          {String(item.duration_seconds % 60).padStart(2, "0")}
                        </span>
                      )}
                    </a>
                  ),
                )}
              </div>
            )}

            {/* Link preview */}
            {!message._pending && extractFirstUrl(message.content) && (
              <LinkPreview url={extractFirstUrl(message.content)!} />
            )}

            {/* Pinned indicator */}
            {message.pinned && !message._pending && (
              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#faa61a]">
                <Pin className="h-2.5 w-2.5" />
                <span>Pinned</span>
              </div>
            )}

            {/* Reactions */}
            {message._reactions && message._reactions.length > 0 && (
              <ReactionBar
                reactions={message._reactions}
                currentUserId={currentUserId}
                onToggle={(emoji) =>
                  handleReactionToggle(message.id, emoji)
                }
                onPickNew={(emoji) => onAddReaction(message.id, emoji)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
