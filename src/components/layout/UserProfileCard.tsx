"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Calendar, Shield } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchUserProfile } from "@/features/auth/actions";
import type { Tables } from "@/types/database";

interface UserProfileCardProps {
  userId: string;
  serverId?: string;
  children: React.ReactNode;
}

interface LoadedProfile {
  profile: Tables<"profiles">;
  serverRole?: string;
}

const ROLE_COLORS: Record<string, string> = {
  owner: "text-[#faa61a] bg-[#faa61a]/10",
  admin: "text-[#ed4245] bg-[#ed4245]/10",
  member: "text-[#3ba55c] bg-[#3ba55c]/10",
};

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export function UserProfileCard({ userId, serverId, children }: UserProfileCardProps): React.ReactNode {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleOpen(isOpen: boolean): Promise<void> {
    setOpen(isOpen);
    if (isOpen && !loaded) {
      setLoading(true);
      setError(null);
      const result = await fetchUserProfile(userId, serverId);
      setLoading(false);
      if (result.error || !result.data) {
        setError(result.error ?? "Failed to load profile.");
        return;
      }
      setLoaded(result.data);
    }
  }

  const initials = loaded?.profile.username?.slice(0, 2).toUpperCase() ?? "??";
  const memberSince = loaded
    ? new Date(loaded.profile.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const roleKey = loaded?.serverRole ?? "member";
  const roleColor = ROLE_COLORS[roleKey] ?? ROLE_COLORS.member;
  const roleLabel = ROLE_LABELS[roleKey] ?? roleKey;

  return (
    <Popover open={open} onOpenChange={(v) => void handleOpen(v)}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-72 border-none bg-[#111214] p-0 text-white shadow-2xl"
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-[#8e9297]" />
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center text-sm text-[#ed4245]">{error}</div>
        ) : loaded ? (
          <>
            {/* Banner */}
            <div
              className="h-14 rounded-t-md bg-cover bg-center"
              style={
                loaded.profile.banner_url
                  ? { backgroundImage: `url(${loaded.profile.banner_url})` }
                  : loaded.profile.accent_color
                    ? { background: loaded.profile.accent_color }
                    : { background: "linear-gradient(to right, #5865f2, #7289da)" }
              }
            />

            {/* Avatar */}
            <div className="relative px-4">
              <div className="absolute -top-8 left-4 h-16 w-16 overflow-hidden rounded-full border-4 border-[#111214] bg-[#5865f2]">
                {loaded.profile.avatar_url ? (
                  <Image
                    src={loaded.profile.avatar_url}
                    alt={loaded.profile.username}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-4 pb-4 pt-10">
              <p className="text-base font-bold text-white">{loaded.profile.username}</p>
              {loaded.profile.custom_status && (
                <p className="mt-0.5 text-sm text-[#8e9297]">{loaded.profile.custom_status}</p>
              )}

              {loaded.serverRole && (
                <div className="mt-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ${roleColor}`}
                  >
                    <Shield className="h-3 w-3" />
                    {roleLabel}
                  </span>
                </div>
              )}

              {loaded.profile.bio && (
                <>
                  <div className="my-3 h-px bg-[#1e1f22]" />
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#80848e]">
                      About Me
                    </p>
                    <p className="text-sm text-[#dcddde]">{loaded.profile.bio}</p>
                  </div>
                </>
              )}

              {memberSince && (
                <>
                  <div className="my-3 h-px bg-[#1e1f22]" />
                  <div className="flex items-center gap-2 text-xs text-[#80848e]">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Member since <span className="text-[#dcddde]">{memberSince}</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
