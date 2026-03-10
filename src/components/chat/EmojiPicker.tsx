"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EMOJI_DATA = [
  { category: "Smileys", emojis: ["😀","😂","🥹","😊","😍","🥰","😎","🤔","😏","😢","😭","😤","🥳","😴","🤯","🫡","😈","💀","🤡","👻"] },
  { category: "Gestures", emojis: ["👍","👎","👏","🙌","🤝","✌️","🤞","💪","🫶","👋","🙏","☝️","👀","🫠"] },
  { category: "Hearts", emojis: ["❤️","🧡","💛","💚","💙","💜","🖤","🤍","💔","❤️‍🔥","💕","💖","💗"] },
  { category: "Objects", emojis: ["🔥","⭐","✨","💯","🎉","🎊","🏆","💎","🚀","💡","⚡","🌈","🎵","🎮","📌","🗑️"] },
  { category: "Symbols", emojis: ["✅","❌","⚠️","❓","❗","💤","♻️","🔔","📣","🏳️"] },
];

export function EmojiPicker({ onSelect }: EmojiPickerProps): React.ReactNode {
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return EMOJI_DATA;
    return EMOJI_DATA.map((cat) => ({
      ...cat,
      emojis: cat.emojis.filter((emoji) => emoji.includes(search.trim())),
    })).filter((cat) => cat.emojis.length > 0);
  }, [search]);

  return (
    <div className="flex w-72 flex-col gap-2 rounded-lg border border-[#1e1f22] bg-[#2b2d31] p-2 shadow-xl">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search emoji..."
        className="w-full rounded bg-[#1e1f22] px-2 py-1.5 text-xs text-[#dcddde] placeholder-[#72767d] outline-none"
        autoFocus
      />
      <div className="max-h-52 overflow-y-auto">
        {filteredCategories.map((cat) => (
          <div key={cat.category}>
            <p className="mb-1 mt-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-[#72767d] first:mt-0">
              {cat.category}
            </p>
            <div className="grid grid-cols-8 gap-0.5">
              {cat.emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded text-lg",
                    "transition-colors hover:bg-[#404249]",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
