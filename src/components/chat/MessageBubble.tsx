import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatMessageTime } from "@/lib/utils";
import type { MessageGroup } from "@/types/chat";

interface MessageBubbleProps {
  group: MessageGroup;
  isOwn: boolean;
}

export function MessageBubble({ group, isOwn }: MessageBubbleProps) {
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
          <p
            key={message.id}
            className={cn(
              "mt-0.5 break-words text-sm leading-relaxed",
              message._pending
                ? "text-[#72767d] italic"
                : "text-[#dcddde]"
            )}
          >
            {message.content}
          </p>
        ))}
      </div>
    </div>
  );
}
