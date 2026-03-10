"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Images } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { MediaToolbar } from "./MediaToolbar";
import { MediaGrid } from "./MediaGrid";
import { MediaTheater } from "./MediaTheater";
import { UploadModal } from "./UploadModal";
import type { Tables } from "@/types/database";
import type { MediaItem, MediaSort, GridSize, PendingUpload } from "@/types/media";

interface MediaAreaProps {
  channel: Tables<"channels">;
  initialItems: MediaItem[];
  initialTotal: number;
}

export function MediaArea({
  channel,
  initialItems,
  initialTotal,
}: MediaAreaProps): React.ReactNode {
  const [sort, setSort] = useState<MediaSort>({
    field: "created_at",
    order: "desc",
  });
  const [gridSize, setGridSize] = useState<GridSize>("md");
  const [theaterItem, setTheaterItem] = useState<MediaItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [total, setTotal] = useState(initialTotal);
  const [pendingUploads, setPendingUploads] = useState<PendingUpload[]>([]);
  const supabase = useMemo(() => createClient(), []);

  const dataKey = useMemo(
    () => `${initialItems[0]?.id ?? "empty"}-${initialTotal}`,
    [initialItems, initialTotal],
  );
  const [activeKey, setActiveKey] = useState(dataKey);

  if (dataKey !== activeKey) {
    setActiveKey(dataKey);
    setItems(initialItems);
    setTotal(initialTotal);
  }

  useEffect(() => {
    const subscription = supabase
      .channel(`media-channel-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "media_attachments",
          filter: `channel_id=eq.${channel.id}`,
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
          filter: `channel_id=eq.${channel.id}`,
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
  }, [channel.id, supabase]);

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
        totalCount={total}
        sort={sort}
        gridSize={gridSize}
        onSortChange={setSort}
        onGridSizeChange={setGridSize}
        onUploadClick={() => setUploadOpen(true)}
      />

      {/* Gallery grid */}
      <MediaGrid
        channelId={channel.id}
        items={items}
        total={total}
        sort={sort}
        gridSize={gridSize}
        onItemClick={setTheaterItem}
        onLoadMore={handleLoadMore}
        pendingUploads={pendingUploads}
      />

      {/* Theater overlay */}
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
              items.findIndex((i) => i.id === theaterItem.id) <
              items.length - 1
                ? handleNext
                : null
            }
          />
        )}
      </AnimatePresence>

      {/* Upload modal */}
      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        channelId={channel.id}
        onFileQueued={handleFileQueued}
        onFileComplete={handleFileComplete}
        onFileFailed={handleFileFailed}
      />
    </div>
  );
}
