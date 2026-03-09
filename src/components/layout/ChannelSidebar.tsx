"use client";

import { usePathname, useRouter } from "next/navigation";
import { Hash, Images, ChevronDown, LogOut, Mic, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/features/auth/actions";
import type { Tables } from "@/types/database";

interface ChannelSidebarProps {
  channels: Tables<"channels">[];
  profile: Tables<"profiles"> | null;
}

interface ChannelItemProps {
  channel: Tables<"channels">;
  active: boolean;
}

function ChannelItem({ channel, active }: ChannelItemProps) {
  const router = useRouter();
  const Icon = channel.type === "CHAT" ? Hash : Images;

  return (
    <button
      type="button"
      onClick={() => router.push(`/channels/${channel.id}`)}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-[#404249] text-[#f2f3f5]"
          : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-[#f2f3f5]" : "text-[#6d6f78] group-hover:text-[#8e9297]"
        )}
      />
      <span className="truncate">{channel.name}</span>
    </button>
  );
}

interface ChannelGroupProps {
  label: string;
  channels: Tables<"channels">[];
  activeChannelId: string | null;
}

function ChannelGroup({ label, channels, activeChannelId }: ChannelGroupProps) {
  if (channels.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        className="mb-1 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wide text-[#80848e] hover:text-[#dcddde] transition-colors"
      >
        <ChevronDown className="h-3 w-3" />
        {label}
      </button>
      <div className="space-y-0.5">
        {channels.map((channel) => (
          <ChannelItem
            key={channel.id}
            channel={channel}
            active={channel.id === activeChannelId}
          />
        ))}
      </div>
    </div>
  );
}

export function ChannelSidebar({ channels, profile }: ChannelSidebarProps) {
  const pathname = usePathname();

  const channelIdMatch = pathname.match(/\/channels\/([^/]+)/);
  const activeChannelId = channelIdMatch?.[1] ?? null;

  const chatChannels = channels
    .filter((c) => c.type === "CHAT")
    .sort((a, b) => a.position - b.position);

  const mediaChannels = channels
    .filter((c) => c.type === "MEDIA")
    .sort((a, b) => a.position - b.position);

  const initials = profile?.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  return (
    <aside className="flex w-60 min-w-[240px] flex-col bg-[#2b2d31]">
      {/* Server header */}
      <div className="flex h-12 items-center border-b border-[#1e1f22] px-4 shadow-sm">
        <h2 className="flex-1 truncate text-sm font-semibold text-white">
          GoonRoom
        </h2>
      </div>

      {/* Channel list */}
      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ChannelGroup
          label="Text Channels"
          channels={chatChannels}
          activeChannelId={activeChannelId}
        />
        <ChannelGroup
          label="Media Forums"
          channels={mediaChannels}
          activeChannelId={activeChannelId}
        />
      </div>

      {/* User footer */}
      <div className="flex h-[52px] shrink-0 items-center gap-2 bg-[#232428] px-2">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-[#5865f2] text-white text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white leading-none">
            {profile?.username ?? "Unknown"}
          </p>
          <p className="text-xs text-[#8e9297] mt-0.5">Online</p>
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] hover:bg-[#35373c] hover:text-white transition-colors"
                >
                  <Mic className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#18191c] text-white border-none">
                Mute
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] hover:bg-[#35373c] hover:text-white transition-colors"
                >
                  <Headphones className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#18191c] text-white border-none">
                Deafen
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] hover:bg-[#ed4245]/20 hover:text-[#ed4245] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#18191c] text-white border-none">
                Sign out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </aside>
  );
}
