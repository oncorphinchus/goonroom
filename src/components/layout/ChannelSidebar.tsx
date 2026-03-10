"use client";

import { usePathname, useRouter } from "next/navigation";
import { Hash, MessageSquareText, ChevronDown, LogOut, Settings, Plus, Copy } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { signOut } from "@/features/auth/actions";
import { createInvite } from "@/features/server/actions";
import { CreateChannelModal } from "./CreateChannelModal";
import { AvatarUploadModal } from "./AvatarUploadModal";
import { ServerSettingsModal } from "./ServerSettingsModal";
import type { Tables } from "@/types/database";

interface ChannelSidebarProps {
  serverId: string;
  serverName: string;
  channels: Tables<"channels">[];
  profile: Tables<"profiles">;
  userRole: string;
}

interface ChannelItemProps {
  channel: Tables<"channels">;
  active: boolean;
  serverId: string;
}

function ChannelItem({ channel, active, serverId }: ChannelItemProps): React.ReactNode {
  const router = useRouter();
  const Icon = channel.type === "TEXT" ? Hash : MessageSquareText;

  return (
    <button
      type="button"
      onClick={() => router.push(`/servers/${serverId}/channels/${channel.id}`)}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active
          ? "bg-[#404249] text-[#f2f3f5]"
          : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          active ? "text-[#f2f3f5]" : "text-[#6d6f78] group-hover:text-[#8e9297]",
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
  serverId: string;
}

function ChannelGroup({ label, channels, activeChannelId, serverId }: ChannelGroupProps): React.ReactNode {
  if (channels.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        className="mb-1 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wide text-[#80848e] transition-colors hover:text-[#dcddde]"
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
            serverId={serverId}
          />
        ))}
      </div>
    </div>
  );
}

export function ChannelSidebar({
  serverId,
  serverName,
  channels,
  profile,
  userRole,
}: ChannelSidebarProps): React.ReactNode {
  const pathname = usePathname();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const channelIdMatch = pathname.match(/\/channels\/([^/]+)/);
  const activeChannelId = channelIdMatch?.[1] ?? null;

  const textChannels = channels
    .filter((c) => c.type === "TEXT")
    .sort((a, b) => a.position - b.position);

  const forumChannels = channels
    .filter((c) => c.type === "FORUM")
    .sort((a, b) => a.position - b.position);

  const isAdmin = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const initials = profile.username
    ? profile.username.slice(0, 2).toUpperCase()
    : "??";

  async function handleCreateInvite(): Promise<void> {
    const result = await createInvite({ serverId });
    if (result.error) {
      console.error("Failed to create invite:", result.error);
      return;
    }
    if (result.data) {
      setInviteCode(result.data);
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/join/${result.data}`);
      } catch {
        // Clipboard API may not be available
      }
    }
  }

  return (
    <aside className="flex w-60 min-w-[240px] flex-col bg-[#2b2d31]">
      <div className="flex h-12 items-center justify-between border-b border-[#1e1f22] px-4 shadow-sm">
        <h2 className="flex-1 truncate text-sm font-semibold text-white">
          {serverName}
        </h2>
        <div className="flex items-center gap-1">
          {isAdmin && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="flex h-6 w-6 items-center justify-center rounded text-[#8e9297] transition-colors hover:text-white"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="border-none bg-[#18191c] text-white">
                  Server Settings
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {isAdmin && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={handleCreateInvite}
                    className="flex h-6 w-6 items-center justify-center rounded text-[#8e9297] transition-colors hover:text-white"
                  >
                    {inviteCode ? <Copy className="h-3.5 w-3.5 text-[#3ba55c]" /> : <Plus className="h-3.5 w-3.5" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="border-none bg-[#18191c] text-white">
                  {inviteCode ? "Invite copied!" : "Create Invite"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-3">
        <ChannelGroup
          label="Text Channels"
          channels={textChannels}
          activeChannelId={activeChannelId}
          serverId={serverId}
        />
        <ChannelGroup
          label="Forums"
          channels={forumChannels}
          activeChannelId={activeChannelId}
          serverId={serverId}
        />

        {channels.length === 0 && (
          <p className="px-2 text-xs text-[#6d6f78]">No channels yet.</p>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setCreateChannelOpen(true)}
            className="mt-2 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-[#dcddde]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Channel
          </button>
        )}
      </div>

      <div className="flex h-[52px] shrink-0 items-center gap-2 bg-[#232428] px-2">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setAvatarOpen(true)}
                className="shrink-0 rounded-full transition-opacity hover:opacity-80"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl ?? undefined} />
                  <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="border-none bg-[#18191c] text-white">
              Change avatar
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-none text-white">
            {profile.username ?? "Unknown"}
          </p>
          <p className="mt-0.5 text-xs text-[#8e9297]">Online</p>
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] transition-colors hover:bg-[#ed4245]/20 hover:text-[#ed4245]"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </TooltipTrigger>
              <TooltipContent side="top" className="border-none bg-[#18191c] text-white">
                Sign out
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <CreateChannelModal
        open={createChannelOpen}
        onOpenChange={setCreateChannelOpen}
        serverId={serverId}
      />

      <AvatarUploadModal
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        currentAvatarUrl={avatarUrl}
        onAvatarUpdated={(url) => setAvatarUrl(url)}
      />

      <ServerSettingsModal
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        serverId={serverId}
        serverName={serverName}
        isOwner={isOwner}
      />
    </aside>
  );
}
