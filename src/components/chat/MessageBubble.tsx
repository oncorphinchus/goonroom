"use client";

import { Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, formatMessageTime } from "@/lib/utils";
import type { MessageGroup } from "@/types/chat";

interface MessageBubbleProps {
  group: MessageGroup;
  isOwn: boolean;
  onDeleteMessage: (messageId: string) => void;
}

export function MessageBubble({
  group,
  isOwn,
  onDeleteMessage,
}: MessageBubbleProps) {
  const initials = group.username.slice(0, 2).toUpperCase();

  return (
    <div className="group flex items-start gap-3 rounded px-2 py-0.5 hover:bg-[#2e3035] transition-colors">
      <Avatar className="mt-0.5 h-10 w-10 shrink-0 cursor-pointer">
        <AvatarImage src={group.avatarUrl ?? undefined} alt={group.username} />
        <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 leading-none">
          <span
            className={cn(
              "text-sm font-medium",
              isOwn ? "text-[#5865f2]" : "text-white"
            )}
          >
            {group.username}
          </span>
          <span className="text-xs text-[#72767d]">
            {formatMessageTime(group.timestamp)}
          </span>
        </div>

        {group.messages.map((message) => (
          <div key={message.id} className="group/msg relative flex items-start">
            <p
              className={cn(
                "mt-0.5 break-words text-sm leading-relaxed flex-1",
                message._pending ? "text-[#72767d] italic" : "text-[#dcddde]"
              )}
            >
              {message.content}
            </p>

            {isOwn && !message._pending && (
              <button
                type="button"
                onClick={() => onDeleteMessage(message.id)}
                className={cn(
                  "ml-1 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded",
                  "text-[#72767d] opacity-0 transition-opacity",
                  "hover:bg-[#ed4245]/20 hover:text-[#ed4245]",
                  "group-hover/msg:opacity-100"
                )}
                aria-label="Delete message"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
