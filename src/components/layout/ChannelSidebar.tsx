"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { GripVertical, Hash, MessageSquareText, ChevronDown, ChevronRight, LogOut, Settings, Plus, Copy, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { reorderChannels } from "@/features/channel/actions";
import { CreateChannelModal } from "./CreateChannelModal";
import { AvatarUploadModal } from "./AvatarUploadModal";
import { ServerSettingsModal } from "./ServerSettingsModal";
import type { Tables } from "@/types/database";

interface ChannelSidebarProps {
  serverId: string;
  serverName: string;
  serverIconUrl?: string | null;
  serverBannerUrl?: string | null;
  serverDescription?: string | null;
  channels: Tables<"channels">[];
  categories: Tables<"channel_categories">[];
  profile: Tables<"profiles">;
  userRole: string;
  serverNickname?: string | null;
}

interface ChannelItemProps {
  channel: Tables<"channels">;
  active: boolean;
  serverId: string;
  isDraggable?: boolean;
}

function SortableChannelItem({ channel, active, serverId }: ChannelItemProps): React.ReactNode {
  const router = useRouter();
  const Icon = channel.type === "TEXT" ? Hash : MessageSquareText;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: channel.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
        active ? "bg-[#404249] text-[#f2f3f5]" : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab text-[#4f545c] opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => router.push(`/servers/${serverId}/channels/${channel.id}`)}
        className="flex min-w-0 flex-1 items-center gap-2"
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-colors",
            active ? "text-[#f2f3f5]" : "text-[#6d6f78] group-hover:text-[#8e9297]",
          )}
        />
        <span className="truncate">{channel.name}</span>
        {channel.nsfw && (
          <span className="shrink-0 rounded bg-[#ed4245]/20 px-1 py-0.5 text-[10px] font-medium text-[#ed4245]">
            NSFW
          </span>
        )}
      </button>
    </div>
  );
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
        active ? "bg-[#404249] text-[#f2f3f5]" : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-[#f2f3f5]" : "text-[#6d6f78] group-hover:text-[#8e9297]")} />
      <span className="truncate">{channel.name}</span>
      {channel.nsfw && (
        <span className="shrink-0 rounded bg-[#ed4245]/20 px-1 py-0.5 text-[10px] font-medium text-[#ed4245]">
          NSFW
        </span>
      )}
    </button>
  );
}

interface ChannelGroupProps {
  label: string;
  channels: Tables<"channels">[];
  activeChannelId: string | null;
  serverId: string;
  defaultOpen?: boolean;
  isAdmin?: boolean;
  onReorderEnd?: (newOrder: Tables<"channels">[]) => void;
}

function ChannelGroup({ label, channels: initialChannels, activeChannelId, serverId, defaultOpen = true, isAdmin, onReorderEnd }: ChannelGroupProps): React.ReactNode {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [localChannels, setLocalChannels] = useState(initialChannels);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Keep in sync if parent channels change (e.g. after a server action)
  useEffect(() => {
    setLocalChannels(initialChannels);
  }, [initialChannels]);

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localChannels.findIndex((c) => c.id === active.id);
    const newIndex = localChannels.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(localChannels, oldIndex, newIndex);
    setLocalChannels(reordered);
    onReorderEnd?.(reordered);
  }

  if (localChannels.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="mb-1 flex w-full items-center gap-1 px-1 text-xs font-semibold uppercase tracking-wide text-[#80848e] transition-colors hover:text-[#dcddde]"
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" />
        )}
        {label}
      </button>
      {isOpen && (
        isAdmin ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={localChannels.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-0.5">
                {localChannels.map((channel) => (
                  <SortableChannelItem
                    key={channel.id}
                    channel={channel}
                    active={channel.id === activeChannelId}
                    serverId={serverId}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-0.5">
            {localChannels.map((channel) => (
              <ChannelItem
                key={channel.id}
                channel={channel}
                active={channel.id === activeChannelId}
                serverId={serverId}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export function ChannelSidebar({
  serverId,
  serverName,
  serverIconUrl,
  serverBannerUrl,
  serverDescription,
  channels,
  categories,
  profile,
  userRole,
  serverNickname,
}: ChannelSidebarProps): React.ReactNode {
  const pathname = usePathname();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [createChannelOpen, setCreateChannelOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);

  const channelIdMatch = pathname.match(/\/channels\/([^/]+)/);
  const activeChannelId = channelIdMatch?.[1] ?? null;

  const isAdmin = userRole === "owner" || userRole === "admin";
  const isOwner = userRole === "owner";

  const displayName = serverNickname ?? profile.username ?? "Unknown";
  const initials = displayName.slice(0, 2).toUpperCase();

  // Build category-based groups
  const categorizedGroups = categories.map((cat) => ({
    id: cat.id,
    label: cat.name,
    channels: channels
      .filter((c) => c.category_id === cat.id)
      .sort((a, b) => a.position - b.position),
  }));

  // Uncategorized channels grouped by type (for backward compat)
  const uncategorizedChannels = channels.filter((c) => !c.category_id);
  const uncategorizedText = uncategorizedChannels
    .filter((c) => c.type === "TEXT")
    .sort((a, b) => a.position - b.position);
  const uncategorizedForum = uncategorizedChannels
    .filter((c) => c.type === "FORUM")
    .sort((a, b) => a.position - b.position);

  async function handleReorderEnd(reordered: Tables<"channels">[]): Promise<void> {
    const order = reordered.map((c, i) => ({ id: c.id, position: i, categoryId: c.category_id }));
    const result = await reorderChannels({ order });
    if (result.error) {
      toast.error(result.error);
    }
  }

  async function handleCreateInvite(): Promise<void> {
    const result = await createInvite({ serverId });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    if (result.data) {
      setInviteCode(result.data);
      try {
        await navigator.clipboard.writeText(`${window.location.origin}/join/${result.data}`);
        toast.success("Invite link copied");
      } catch {
        toast.success("Invite created");
      }
    }
  }

  return (
    <aside className="flex w-60 min-w-[240px] flex-col bg-[#2b2d31]">
      {serverBannerUrl && (
        <div className="relative h-20 w-full shrink-0 overflow-hidden">
          <Image
            src={serverBannerUrl}
            alt="Server banner"
            fill
            className="object-cover"
            sizes="240px"
            unoptimized
          />
        </div>
      )}
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
        {/* Category-based groups */}
        {categorizedGroups.map((group) => (
          <ChannelGroup
            key={group.id}
            label={group.label}
            channels={group.channels}
            activeChannelId={activeChannelId}
            serverId={serverId}
            isAdmin={isAdmin}
            onReorderEnd={(reordered) => void handleReorderEnd(reordered)}
          />
        ))}

        {/* Uncategorized: text channels */}
        {uncategorizedText.length > 0 && (
          <ChannelGroup
            label="Text Channels"
            channels={uncategorizedText}
            activeChannelId={activeChannelId}
            serverId={serverId}
            isAdmin={isAdmin}
            onReorderEnd={(reordered) => void handleReorderEnd(reordered)}
          />
        )}

        {/* Uncategorized: forums */}
        {uncategorizedForum.length > 0 && (
          <ChannelGroup
            label="Forums"
            channels={uncategorizedForum}
            activeChannelId={activeChannelId}
            serverId={serverId}
            isAdmin={isAdmin}
            onReorderEnd={(reordered) => void handleReorderEnd(reordered)}
          />
        )}

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
            {displayName}
          </p>
          {serverNickname && (
            <p className="truncate text-xs text-[#8e9297]">{profile.username}</p>
          )}
          {profile.custom_status && (
            <p className="truncate text-xs text-[#8e9297]">{profile.custom_status}</p>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => router.push("/settings")}
                  className="flex h-8 w-8 items-center justify-center rounded text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-white"
                >
                  <UserCog className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="border-none bg-[#18191c] text-white">
                User Settings
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
        serverIconUrl={serverIconUrl ?? null}
        serverBannerUrl={serverBannerUrl ?? null}
        serverDescription={serverDescription ?? null}
        isOwner={isOwner}
        isAdmin={isAdmin}
        channels={channels}
        categories={categories}
      />
    </aside>
  );
}
