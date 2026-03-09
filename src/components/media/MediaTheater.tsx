"use client";

import { useEffect, useCallback } from "react";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatBytes, formatRelativeTime } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

interface MediaTheaterProps {
  item: MediaItem;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

function isVideo(mimeType: string): boolean {
  return mimeType.startsWith("video/");
}

export function MediaTheater({
  item,
  onClose,
  onPrev,
  onNext,
}: MediaTheaterProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrev?.();
          break;
        case "ArrowRight":
          onNext?.();
          break;
      }
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  const video = isVideo(item.mime_type);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.file_name}
    >
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#2b2d31]/80 text-white transition-colors hover:bg-[#2b2d31]"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Prev / Next navigation arrows */}
      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#2b2d31]/80 text-white transition-colors hover:bg-[#2b2d31]"
          aria-label="Previous"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#2b2d31]/80 text-white transition-colors hover:bg-[#2b2d31]"
          aria-label="Next"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Main content */}
      <div className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4">
        {video ? (
          <video
            src={item.file_url}
            controls
            autoPlay
            className="max-h-[80vh] max-w-full rounded-lg"
          >
            <track kind="captions" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.file_url}
            alt={item.file_name}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />
        )}

        {/* Info bar */}
        <div className="flex items-center gap-4 rounded-lg bg-[#2b2d31]/80 px-4 py-2 backdrop-blur-sm">
          <span className="text-sm font-medium text-white">
            {item.file_name}
          </span>
          <span className="text-xs text-[#8e9297]">
            {formatBytes(item.file_size)}
          </span>
          <span className="text-xs text-[#72767d]">
            {formatRelativeTime(item.created_at)}
          </span>
          <span className="text-xs text-[#72767d]">
            by {item.profiles?.username ?? "Unknown"}
          </span>

          <a
            href={item.file_url}
            download={item.file_name}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "ml-2 flex h-8 w-8 items-center justify-center rounded",
              "text-[#8e9297] transition-colors hover:bg-[#40444b] hover:text-white"
            )}
            aria-label="Download"
          >
            <Download className="h-4 w-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
