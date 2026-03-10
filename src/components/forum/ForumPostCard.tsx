"use client";

import Link from "next/link";
import { MessageSquare, Pin, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatRelativeTime } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ForumPostWithProfile } from "@/types/forum";

interface ForumPostCardProps {
  post: ForumPostWithProfile;
  serverId: string;
  channelId: string;
  index?: number;
}

export function ForumPostCard({
  post,
  serverId,
  channelId,
  index = 0,
}: ForumPostCardProps): React.ReactNode {
  const initials = post.profiles?.username
    ? post.profiles.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
      whileTap={{ scale: 0.985 }}
    >
      <Link
        href={`/servers/${serverId}/channels/${channelId}/posts/${post.id}`}
        className={cn(
          "group flex flex-col gap-3 rounded-lg bg-[#2b2d31] p-4 transition-colors",
          "hover:bg-[#35373c]",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={post.profiles?.avatar_url ?? undefined} />
              <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {post.pinned && (
                  <Pin className="h-3.5 w-3.5 shrink-0 text-[#faa61a]" />
                )}
                {post.locked && (
                  <Lock className="h-3.5 w-3.5 shrink-0 text-[#ed4245]" />
                )}
                <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#00aff4]">
                  {post.title}
                </h3>
              </div>
              <p className="mt-0.5 text-xs text-[#8e9297]">
                {post.profiles?.username ?? "Unknown"} &middot;{" "}
                {formatRelativeTime(post.created_at)}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1 text-xs text-[#8e9297]">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{post.reply_count}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-[#6d6f78]">
          <span>Last activity {formatRelativeTime(post.last_activity_at)}</span>
        </div>
      </Link>
    </motion.div>
  );
}
