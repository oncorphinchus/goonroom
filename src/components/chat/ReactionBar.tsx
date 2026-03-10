"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmojiPicker } from "./EmojiPicker";
import type { ReactionGroup } from "@/types/chat";

interface ReactionBarProps {
  reactions: ReactionGroup[];
  currentUserId: string;
  onToggle: (emoji: string) => void;
  onPickNew: (emoji: string) => void;
}

export function ReactionBar({
  reactions,
  currentUserId,
  onToggle,
  onPickNew,
}: ReactionBarProps): React.ReactNode {
  const [pickerOpen, setPickerOpen] = useState(false);

  if (reactions.length === 0 && !pickerOpen) return null;

  return (
    <div className="mt-1 flex flex-wrap items-center gap-1">
      {reactions.map((r) => {
        const isMine = r.userIds.includes(currentUserId);
        return (
          <button
            key={r.emoji}
            type="button"
            onClick={() => onToggle(r.emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
              isMine
                ? "border border-[#5865f2]/60 bg-[#5865f2]/20 text-[#dee0fc]"
                : "border border-[#3f4147] bg-[#2b2d31] text-[#b5bac1] hover:border-[#5865f2]/40",
            )}
          >
            <span className="text-sm leading-none">{r.emoji}</span>
            <span>{r.count}</span>
          </button>
        );
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((prev) => !prev)}
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full",
            "border border-[#3f4147] bg-[#2b2d31] text-[#72767d]",
            "transition-colors hover:border-[#5865f2]/40 hover:text-[#b5bac1]",
          )}
        >
          <Plus className="h-3 w-3" />
        </button>

        {pickerOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setPickerOpen(false)}
            />
            <div className="absolute bottom-8 left-0 z-50">
              <EmojiPicker
                onSelect={(emoji) => {
                  onPickNew(emoji);
                  setPickerOpen(false);
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
