import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      {/* Avatar — always present, anchors the group */}
      <Avatar className="mt-0.5 h-10 w-10 shrink-0 cursor-pointer">
        <AvatarImage src={group.avatarUrl ?? undefined} alt={group.username} />
        <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white select-none">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {/* Header row: username + timestamp */}
        <div className="flex items-baseline gap-2 leading-none">
          <span
            className={`text-sm font-medium ${
              isOwn ? "text-[#5865f2]" : "text-white"
            }`}
          >
            {group.username}
          </span>
          <span className="text-xs text-[#72767d]">
            {formatMessageTime(group.timestamp)}
          </span>
        </div>

        {/* All messages in this group */}
        {group.messages.map((message, idx) => (
          <p
            key={message.id}
            className={`break-words text-sm leading-relaxed text-[#dcddde] ${
              idx > 0 ? "mt-0.5" : "mt-0.5"
            }`}
          >
            {message.content}
          </p>
        ))}
      </div>
    </div>
  );
}
