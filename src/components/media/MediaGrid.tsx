"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Images } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaCard } from "./MediaCard";
import { fetchMediaPage } from "@/features/media/queries";
import type { MediaItem, GridSize, MediaSort } from "@/types/media";
import { GRID_COLUMNS, PAGE_SIZE } from "@/types/media";

interface MediaGridProps {
  channelId: string;
  initialItems: MediaItem[];
  initialTotal: number;
  sort: MediaSort;
  gridSize: GridSize;
  onItemClick: (item: MediaItem) => void;
}

export function MediaGrid({
  channelId,
  initialItems,
  initialTotal,
  sort,
  gridSize,
  onItemClick,
}: MediaGridProps) {
  // Derive a stable identity from the initial dataset so we can detect when
  // the parent re-fetched (e.g. sort changed). Using the first item's id + total
  // avoids deep comparison while still catching every meaningful reset.
  const dataKey = useMemo(
    () => `${initialItems[0]?.id ?? "empty"}-${initialTotal}`,
    [initialItems, initialTotal]
  );

  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeKey, setActiveKey] = useState(dataKey);

  if (dataKey !== activeKey) {
    setActiveKey(dataKey);
    setItems(initialItems);
    setTotal(initialTotal);
    setPage(0);
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = (page + 1) * PAGE_SIZE < total;

  // Infinite scroll via IntersectionObserver.
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const result = await fetchMediaPage({
      channelId,
      page: nextPage,
      sortField: sort.field,
      sortOrder: sort.order,
    });

    setItems((prev) => [...prev, ...(result.items as MediaItem[])]);
    setTotal(result.total);
    setPage(nextPage);
    setLoading(false);
  }, [loading, hasMore, page, channelId, sort.field, sort.order]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5865f2]/10">
          <Images className="h-10 w-10 text-[#5865f2]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-white">No media yet</p>
          <p className="mt-1 text-sm text-[#8e9297]">
            Upload images and videos to see them here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className={cn("grid gap-3 p-4", GRID_COLUMNS[gridSize])}>
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
          />
        ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex items-center justify-center py-6"
        >
          {loading && (
            <Loader2 className="h-6 w-6 animate-spin text-[#5865f2]" />
          )}
        </div>
      )}

      {!hasMore && items.length > 0 && (
        <p className="py-4 text-center text-xs text-[#4f545c]">
          Showing all {total} items
        </p>
      )}
    </div>
  );
}
