"use client";

import { useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, formatBytes, formatRelativeTime, isVideo } from "@/lib/utils";
import type { MediaItem } from "@/types/media";

interface MediaTheaterProps {
  item: MediaItem;
  onClose: () => void;
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
}

export function MediaTheater({
  item,
  onClose,
  onPrev,
  onNext,
}: MediaTheaterProps): React.ReactNode {
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={item.file_name}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[#2b2d31]/80 text-white transition-colors hover:bg-[#2b2d31]"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

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

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4"
        >
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
            <div className="relative h-[80vh] w-[90vw] max-w-[90vw]">
              <Image
                src={item.file_url}
                alt={item.file_name}
                fill
                sizes="90vw"
                className="rounded-lg object-contain"
                priority
              />
            </div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.2 }}
            className="flex items-center gap-4 rounded-lg bg-[#2b2d31]/80 px-4 py-2 backdrop-blur-sm"
          >
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
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
