"use client";

import Image from "next/image";
import { Play, Image as ImageIcon, Film } from "lucide-react";
import { motion } from "framer-motion";
import { cn, formatBytes, formatDuration, formatRelativeTime, isVideo } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
  index?: number;
}

export function MediaCard({ item, onClick, index = 0 }: MediaCardProps): React.ReactNode {
  const video = isVideo(item.mime_type);
  const thumbnailSrc = item.thumbnail_url ?? item.file_url;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.5), ease: "easeOut" }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg",
        "bg-[#2b2d31] transition-shadow duration-200",
        "hover:ring-2 hover:ring-[#5865f2]/60 hover:shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5865f2]",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-[#1e1f22]">
        <Image
          src={thumbnailSrc}
          alt={item.file_name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {video && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
              <Play className="h-5 w-5 text-white" fill="white" />
            </div>
          </div>
        )}

        {video && item.duration_seconds != null && (
          <span className="absolute bottom-1.5 right-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {formatDuration(item.duration_seconds)}
          </span>
        )}

        {!video && (
          <div className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100">
            <ImageIcon className="h-3 w-3 text-white" />
          </div>
        )}
      </div>

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
    </motion.button>
  );
}
