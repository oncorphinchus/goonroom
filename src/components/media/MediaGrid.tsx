"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Images, CloudUpload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MediaCard } from "./MediaCard";
import { fetchMediaPage } from "@/features/media/queries";
import type { MediaItem, GridSize, MediaSort, PendingUpload } from "@/types/media";
import { GRID_COLUMNS, PAGE_SIZE } from "@/types/media";

interface MediaGridProps {
  channelId: string;
  postId?: string;
  items: MediaItem[];
  total: number;
  sort: MediaSort;
  gridSize: GridSize;
  onItemClick: (item: MediaItem) => void;
  onLoadMore: (newItems: MediaItem[], newTotal: number) => void;
  pendingUploads: PendingUpload[];
}

export function MediaGrid({
  channelId,
  postId,
  items,
  total,
  sort,
  gridSize,
  onItemClick,
  onLoadMore,
  pendingUploads,
}: MediaGridProps): React.ReactNode {
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const prevChannelId = useRef(channelId);
  const prevSortField = useRef(sort.field);
  const prevSortOrder = useRef(sort.order);

  if (
    channelId !== prevChannelId.current ||
    sort.field !== prevSortField.current ||
    sort.order !== prevSortOrder.current
  ) {
    prevChannelId.current = channelId;
    prevSortField.current = sort.field;
    prevSortOrder.current = sort.order;
    setPage(0);
  }

  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = (page + 1) * PAGE_SIZE < total;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    setLoadError(null);

    try {
      const nextPage = page + 1;
      const result = await fetchMediaPage({
        channelId,
        postId: postId ?? null,
        page: nextPage,
        sortField: sort.field,
        sortOrder: sort.order,
      });

      onLoadMore(result.items, result.total);
      setPage(nextPage);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load more media.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, channelId, sort.field, sort.order, onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { rootMargin: "200px" },
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
        {pendingUploads.map((p) => (
          <div
            key={p.tempId}
            className="flex flex-col overflow-hidden rounded-lg bg-[#2b2d31]"
          >
            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[#1e1f22]">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-[#5865f2]" />
                <CloudUpload className="h-4 w-4 text-[#5865f2]/60" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 px-2.5 py-2">
              <span className="truncate text-xs font-medium text-[#dcddde]">
                {p.fileName}
              </span>
              <span className="text-[10px] text-[#5865f2]">Uploading…</span>
            </div>
          </div>
        ))}

        {items.map((item, i) => (
          <MediaCard
            key={item.id}
            item={item}
            onClick={() => onItemClick(item)}
            index={i}
          />
        ))}
      </div>

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

      {loadError && (
        <div className="mx-4 my-2 flex items-center gap-2 rounded-md bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {loadError}
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
