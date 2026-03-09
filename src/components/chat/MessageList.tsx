"use client";

import { useEffect, useRef } from "react";
import { Hash } from "lucide-react";
import { MessageBubble } from "./MessageBubble";
import type { MessageWithProfile, MessageGroup } from "@/types/chat";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

function groupMessages(messages: MessageWithProfile[]): MessageGroup[] {
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
      groups.push({
        key: message.id,
        userId: message.user_id,
        username: message.profiles?.username ?? "Unknown",
        avatarUrl: message.profiles?.avatar_url ?? null,
        timestamp: message.created_at,
        messages: [message],
      });
    }
  }

  return groups;
}

interface MessageListProps {
  messages: MessageWithProfile[];
  currentUserId: string;
  channelName: string;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageList({
  messages,
  currentUserId,
  channelName,
  onDeleteMessage,
}: MessageListProps) {
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

  const groups = groupMessages(messages);

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
        <h2 className="text-2xl font-bold text-white">Welcome to #{channelName}</h2>
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
          groups.map((group) => (
            <MessageBubble
              key={group.key}
              group={group}
              isOwn={group.userId === currentUserId}
              onDeleteMessage={onDeleteMessage}
            />
          ))
        )}
      </div>

      {/* Sentinel for auto-scroll */}
      <div ref={bottomRef} className="h-2 shrink-0" />
    </div>
  );
}
