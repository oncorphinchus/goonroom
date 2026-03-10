"use client";

import { useEffect, useRef } from "react";
import { Hash } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { MessageWithProfile, MessageGroup } from "@/types/chat";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

type ServerProfileSnippet = { nickname: string | null; serverAvatarUrl: string | null };

function groupMessages(
  messages: MessageWithProfile[],
  serverProfiles?: Record<string, ServerProfileSnippet>,
): MessageGroup[] {
  const groups: MessageGroup[] = [];

  for (const message of messages) {
    const last = groups[groups.length - 1];
    const lastMessage = last?.messages[last.messages.length - 1];

    const isSameUser = last?.userId === message.user_id;
    const isWithinWindow =
      lastMessage &&
      new Date(message.created_at).getTime() -
        new Date(lastMessage.created_at).getTime() <
        FIVE_MINUTES_MS;

    if (last && isSameUser && isWithinWindow) {
      last.messages.push(message);
    } else {
      const sp = serverProfiles?.[message.user_id];
      groups.push({
        key: message.id,
        userId: message.user_id,
        username: sp?.nickname ?? message.profiles?.username ?? "Unknown",
        avatarUrl: sp?.serverAvatarUrl ?? message.profiles?.avatar_url ?? null,
        timestamp: message.created_at,
        messages: [message],
      });
    }
  }

  return groups;
}

function formatDateSeparator(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgStart = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (msgStart.getTime() === todayStart.getTime()) {
    return "Today";
  }

  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  if (msgStart.getTime() === yesterdayStart.getTime()) {
    return "Yesterday";
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getDateKey(dateString: string): string {
  const d = new Date(dateString);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

interface MessageListProps {
  messages: MessageWithProfile[];
  currentUserId: string;
  channelName: string;
  isAdmin?: boolean;
  serverId?: string;
  serverProfiles?: Record<string, ServerProfileSnippet>;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, content: string) => void;
  onReplyToMessage: (message: MessageWithProfile) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
  onRemoveReaction: (messageId: string, emoji: string) => void;
  onPinMessage?: (messageId: string, currentlyPinned: boolean) => void;
  onScrollToMessageRef?: (fn: (messageId: string) => void) => void;
}

export function MessageList({
  messages,
  currentUserId,
  channelName,
  isAdmin = false,
  serverId,
  serverProfiles,
  onDeleteMessage,
  onEditMessage,
  onReplyToMessage,
  onAddReaction,
  onRemoveReaction,
  onPinMessage,
  onScrollToMessageRef,
}: MessageListProps): React.ReactNode {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!bottomRef.current) return;

    const el = containerRef.current;
    const isNearBottom = el
      ? el.scrollHeight - el.scrollTop - el.clientHeight < 120
      : true;

    if (isFirstRender.current || isNearBottom) {
      bottomRef.current.scrollIntoView({
        behavior: isFirstRender.current ? "instant" : "smooth",
      });
    }
    isFirstRender.current = false;
  }, [messages]);

  const scrollToMessage = (messageId: string): void => {
    const el = document.getElementById(`msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("bg-[#5865f2]/10");
      setTimeout(() => el.classList.remove("bg-[#5865f2]/10"), 2000);
    }
  };

  useEffect(() => {
    onScrollToMessageRef?.(scrollToMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onScrollToMessageRef]);

  const groups = groupMessages(messages, serverProfiles);

  let lastDateKey = "";

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col overflow-y-auto"
      aria-label="Message list"
    >
      {/* Channel intro header */}
      <div className="flex flex-col items-start px-4 pb-4 pt-8">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[#3f4147]">
          <Hash className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white">
          Welcome to #{channelName}
        </h2>
        <p className="mt-1 text-sm text-[#8e9297]">
          This is the beginning of the #{channelName} channel.
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 mb-4 border-t border-[#3f4147]" />

      {/* Message groups */}
      <div className="flex flex-col gap-0.5 px-2 pb-2">
        {groups.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-[#8e9297]">
            No messages yet. Say hello!
          </p>
        ) : (
          groups.map((group) => {
            const dateKey = getDateKey(group.timestamp);
            const showSeparator = dateKey !== lastDateKey;
            lastDateKey = dateKey;

            return (
              <div key={group.key}>
                {showSeparator && (
                  <div className="my-2 flex items-center gap-2 px-2">
                    <div className="flex-1 border-t border-[#3f4147]" />
                    <span className="text-xs font-semibold text-[#8e9297]">
                      {formatDateSeparator(group.timestamp)}
                    </span>
                    <div className="flex-1 border-t border-[#3f4147]" />
                  </div>
                )}
                <MessageBubble
                  group={group}
                  isOwn={group.userId === currentUserId}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  serverId={serverId}
                  onDeleteMessage={onDeleteMessage}
                  onEditMessage={onEditMessage}
                  onReplyToMessage={onReplyToMessage}
                  onAddReaction={onAddReaction}
                  onRemoveReaction={onRemoveReaction}
                  onPinMessage={onPinMessage}
                  onScrollToMessage={scrollToMessage}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Sentinel for auto-scroll */}
      <div ref={bottomRef} className="h-2 shrink-0" />
    </div>
  );
}
