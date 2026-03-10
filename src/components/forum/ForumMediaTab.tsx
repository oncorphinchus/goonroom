"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { MediaToolbar } from "@/components/media/MediaToolbar";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaTheater } from "@/components/media/MediaTheater";
import { UploadModal } from "@/components/media/UploadModal";
import { fetchMediaPage } from "@/features/media/queries";
import type { Tables } from "@/types/database";
import type { MediaItem, MediaSort, GridSize, PendingUpload } from "@/types/media";

interface ForumMediaTabProps {
  channel: Tables<"channels">;
  postId?: string;
  initialItems?: MediaItem[];
  initialTotal?: number;
}

export function ForumMediaTab({
  channel,
  postId,
  initialItems,
  initialTotal,
}: ForumMediaTabProps): React.ReactNode {
  const [sort, setSort] = useState<MediaSort>({ field: "created_at", order: "desc" });
  const [gridSize, setGridSize] = useState<GridSize>("md");
  const [theaterItem, setTheaterItem] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[]>(initialItems ?? []);
  const [total, setTotal] = useState(initialTotal ?? 0);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const [initialLoading, setInitialLoading] = useState(!initialItems);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  const skipInitialFetch = !!(initialItems && sort.field === "created_at" && sort.order === "desc");

  useEffect(() => {
    if (skipInitialFetch) return;

    let cancelled = false;

    fetchMediaPage({
      channelId: channel.id,
      postId: postId ?? null,
      page: 0,
      sortField: sort.field,
      sortOrder: sort.order,
    }).then((result) => {
      if (cancelled) return;
      setItems(result.items);
      setTotal(result.total);
      setInitialLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Failed to load media.");
      setInitialLoading(false);
    });

    return () => { cancelled = true; };
  }, [channel.id, postId, sort.field, sort.order, skipInitialFetch]);

  useEffect(() => {
    const filterColumn = postId ? "post_id" : "channel_id";
    const filterValue = postId ?? channel.id;

    const subscription = supabase
      .channel(`forum-media-${filterValue}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "media_attachments",
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        async (payload) => {
          const raw = payload.new as Tables<"media_attachments">;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", raw.user_id)
            .single();

          const newItem = { ...raw, profiles: profile } as MediaItem;
          setItems((prev) => {
            if (prev.some((i) => i.id === raw.id)) return prev;
            return [newItem, ...prev];
          });
          setTotal((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "media_attachments",
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setItems((prev) => prev.filter((i) => i.id !== old.id));
            setTotal((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [channel.id, postId, supabase]);

  const handleLoadMore = useCallback(
    (newItems: MediaItem[], newTotal: number) => {
      setItems((prev) => [...prev, ...newItems]);
      setTotal(newTotal);
    },
    [],
  );

  const handlePrev = useCallback(() => {
    if (!theaterItem) return;
    const idx = items.findIndex((i) => i.id === theaterItem.id);
    if (idx > 0) setTheaterItem(items[idx - 1]);
  }, [theaterItem, items]);

  const handleNext = useCallback(() => {
    if (!theaterItem) return;
    const idx = items.findIndex((i) => i.id === theaterItem.id);
    if (idx < items.length - 1) setTheaterItem(items[idx + 1]);
  }, [theaterItem, items]);

  const handleFileQueued = useCallback(
    (tempId: string, fileName: string) => {
      setPendingUploads((prev) => [...prev, { tempId, fileName }]);
    },
    [],
  );

  const handleFileComplete = useCallback(
    (tempId: string, item: MediaItem) => {
      setPendingUploads((prev) => prev.filter((p) => p.tempId !== tempId));
      setItems((prev) => [item, ...prev]);
      setTotal((prev) => prev + 1);
    },
    [],
  );

  const handleFileFailed = useCallback((tempId: string) => {
    setPendingUploads((prev) => prev.filter((p) => p.tempId !== tempId));
  }, []);

  if (initialLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#5865f2] border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-[#ed4245]">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <MediaToolbar
        totalCount={total}
        sort={sort}
        gridSize={gridSize}
        onSortChange={setSort}
        onGridSizeChange={setGridSize}
        onUploadClick={() => setUploadOpen(true)}
      />

      <MediaGrid
        channelId={channel.id}
        postId={postId}
        items={items}
        total={total}
        sort={sort}
        gridSize={gridSize}
        onItemClick={setTheaterItem}
        onLoadMore={handleLoadMore}
        pendingUploads={pendingUploads}
      />

      <AnimatePresence>
        {theaterItem && (
          <MediaTheater
            item={theaterItem}
            onClose={() => setTheaterItem(null)}
            onPrev={
              items.findIndex((i) => i.id === theaterItem.id) > 0
                ? handlePrev
                : null
            }
            onNext={
              items.findIndex((i) => i.id === theaterItem.id) < items.length - 1
                ? handleNext
                : null
            }
          />
        )}
      </AnimatePresence>

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        channelId={channel.id}
        postId={postId}
        onFileQueued={handleFileQueued}
        onFileComplete={handleFileComplete}
        onFileFailed={handleFileFailed}
      />
    </div>
  );
}
