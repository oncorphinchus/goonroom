"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare, Images, Pin, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThreadChat } from "./ThreadChat";
import { ForumMediaTab } from "./ForumMediaTab";
import type { Tables } from "@/types/database";
import type { ForumPostWithProfile } from "@/types/forum";
import type { MessageWithProfile } from "@/types/chat";
import type { MediaItem } from "@/types/media";

interface ThreadViewProps {
  channel: Tables<"channels">;
  post: ForumPostWithProfile;
  serverId: string;
  initialMessages: MessageWithProfile[];
  initialMedia: MediaItem[];
  initialMediaTotal: number;
  currentUserId: string;
  isAdmin?: boolean;
}

type ThreadTab = "chat" | "media";

export function ThreadView({
  channel,
  post,
  serverId,
  initialMessages,
  initialMedia,
  initialMediaTotal,
  currentUserId,
  isAdmin = false,
}: ThreadViewProps): React.ReactNode {
  const router = useRouter();
  const [tab, setTab] = useState<ThreadTab>("chat");

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
        <button
          type="button"
          onClick={() =>
            router.push(`/servers/${serverId}/channels/${channel.id}`)
          }
          className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          {post.pinned && (
            <Pin className="h-3.5 w-3.5 shrink-0 text-[#faa61a]" />
          )}
          {post.locked && (
            <Lock className="h-3.5 w-3.5 shrink-0 text-[#ed4245]" />
          )}
          <span className="truncate font-semibold text-white">
            {post.title}
          </span>
        </div>
      </header>

      <div className="flex shrink-0 gap-1 border-b border-[#1e1f22] bg-[#2b2d31] px-4 py-1">
        <button
          type="button"
          onClick={() => setTab("chat")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "chat"
              ? "bg-[#404249] text-white"
              : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
          )}
        >
          <MessageSquare className="mr-1.5 inline h-3.5 w-3.5" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setTab("media")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "media"
              ? "bg-[#404249] text-white"
              : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
          )}
        >
          <Images className="mr-1.5 inline h-3.5 w-3.5" />
          Media
        </button>
      </div>

      {tab === "chat" ? (
        <ThreadChat
          channel={channel}
          post={post}
          initialMessages={initialMessages}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
          serverId={serverId}
        />
      ) : (
        <ForumMediaTab
          channel={channel}
          postId={post.id}
          initialItems={initialMedia}
          initialTotal={initialMediaTotal}
        />
      )}
    </div>
  );
}
