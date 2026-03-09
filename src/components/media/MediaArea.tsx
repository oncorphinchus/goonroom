"use client";

import { useCallback, useState } from "react";
import { Images } from "lucide-react";
import { MediaToolbar } from "./MediaToolbar";
import { MediaGrid } from "./MediaGrid";
import { MediaTheater } from "./MediaTheater";
import type { Tables } from "@/types/database";
import type { MediaItem, MediaSort, GridSize } from "@/types/media";

interface MediaAreaProps {
  channel: Tables<"channels">;
  initialItems: MediaItem[];
  initialTotal: number;
}

export function MediaArea({
  channel,
  initialItems,
  initialTotal,
}: MediaAreaProps) {
  const [sort, setSort] = useState<MediaSort>({
    field: "created_at",
    order: "desc",
  });
  const [gridSize, setGridSize] = useState<GridSize>("md");
  const [theaterItem, setTheaterItem] = useState<MediaItem | null>(null);

  const handlePrev = useCallback(() => {
    if (!theaterItem) return;
    const idx = initialItems.findIndex((i) => i.id === theaterItem.id);
    if (idx > 0) setTheaterItem(initialItems[idx - 1]);
  }, [theaterItem, initialItems]);

  const handleNext = useCallback(() => {
    if (!theaterItem) return;
    const idx = initialItems.findIndex((i) => i.id === theaterItem.id);
    if (idx < initialItems.length - 1) setTheaterItem(initialItems[idx + 1]);
  }, [theaterItem, initialItems]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Channel header */}
      <header className="flex h-12 shrink-0 items-center border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
        <Images className="mr-2 h-5 w-5 shrink-0 text-[#8e9297]" />
        <span className="font-semibold text-white">{channel.name}</span>
        {channel.description && (
          <>
            <div className="mx-3 h-4 w-px shrink-0 bg-[#3f4147]" />
            <span className="truncate text-sm text-[#8e9297]">
              {channel.description}
            </span>
          </>
        )}
      </header>

      {/* Sort / grid controls */}
      <MediaToolbar
        totalCount={initialTotal}
        sort={sort}
        gridSize={gridSize}
        onSortChange={setSort}
        onGridSizeChange={setGridSize}
      />

      {/* Gallery grid */}
      <MediaGrid
        channelId={channel.id}
        initialItems={initialItems}
        initialTotal={initialTotal}
        sort={sort}
        gridSize={gridSize}
        onItemClick={setTheaterItem}
      />

      {/* Theater overlay */}
      {theaterItem && (
        <MediaTheater
          item={theaterItem}
          onClose={() => setTheaterItem(null)}
          onPrev={
            initialItems.findIndex((i) => i.id === theaterItem.id) > 0
              ? handlePrev
              : null
          }
          onNext={
            initialItems.findIndex((i) => i.id === theaterItem.id) <
            initialItems.length - 1
              ? handleNext
              : null
          }
        />
      )}
    </div>
  );
}
