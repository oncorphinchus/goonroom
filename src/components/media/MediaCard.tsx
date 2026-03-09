"use client";

import { Play, Image as ImageIcon, Film } from "lucide-react";
import { cn, formatBytes, formatDuration, formatRelativeTime } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function MediaCard({ item, onClick }: MediaCardProps) {
  const video = isVideo(item.mime_type);
  const thumbnailSrc = item.thumbnail_url ?? item.file_url;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg",
        "bg-[#2b2d31] transition-all duration-200",
        "hover:ring-2 hover:ring-[#5865f2]/60 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]",
        "active:scale-[0.98]"
      )}
    >
      {/* Thumbnail area */}
      <div className="relative aspect-square w-full overflow-hidden bg-[#1e1f22]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc}
          alt={item.file_name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Video play overlay */}
        {video && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <Play className="h-5 w-5 text-white" fill="white" />
            </div>
          </div>
        )}

        {/* Duration badge (video only) */}
        {video && item.duration_seconds != null && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatDuration(item.duration_seconds)}
          </span>
        )}

        {/* Type icon (images) */}
        {!video && (
          <div className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ImageIcon className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="flex flex-col gap-0.5 px-2.5 py-2">
        <div className="flex items-center gap-1.5">
          {video ? (
            <Film className="h-3 w-3 shrink-0 text-[#72767d]" />
          ) : (
            <ImageIcon className="h-3 w-3 shrink-0 text-[#72767d]" />
          )}
          <span className="truncate text-xs font-medium text-[#dcddde]">
            {item.file_name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#72767d]">
            {item.profiles?.username ?? "Unknown"}
          </span>
          <span className="text-[10px] text-[#72767d]">
            {formatBytes(item.file_size)}
          </span>
        </div>
        <span className="text-[10px] text-[#4f545c]">
          {formatRelativeTime(item.created_at)}
        </span>
      </div>
    </button>
  );
}
