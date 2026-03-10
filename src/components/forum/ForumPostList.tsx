"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSquareText, Plus, Loader2, Images, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ForumPostCard } from "./ForumPostCard";
import { CreatePostModal } from "./CreatePostModal";
import { ForumMediaTab } from "./ForumMediaTab";
import { fetchForumPosts } from "@/features/forum/actions";
import type { Tables } from "@/types/database";
import type { ForumPostWithProfile } from "@/types/forum";
import { FORUM_PAGE_SIZE } from "@/types/forum";

interface ForumPostListProps {
  channel: Tables<"channels">;
  serverId: string;
}

type ViewTab = "posts" | "media";

export function ForumPostList({
  channel,
  serverId,
}: ForumPostListProps): React.ReactNode {
  const [tab, setTab] = useState<ViewTab>("posts");
  const [posts, setPosts] = useState<ForumPostWithProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasMore = (page + 1) * FORUM_PAGE_SIZE < total;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchForumPosts({
      channelId: channel.id,
      page: 0,
      sortField: "last_activity_at",
      sortOrder: "desc",
    }).then((result) => {
      if (cancelled) return;
      setPosts(result.items);
      setTotal(result.total);
      setPage(0);
      setLoading(false);
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError(err instanceof Error ? err.message : "Failed to load posts.");
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [channel.id]);

  useEffect(() => {
    const subscription = supabase
      .channel(`forum-posts-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "forum_posts",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          const raw = payload.new as Tables<"forum_posts">;
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, username, avatar_url")
            .eq("id", raw.user_id)
            .single();

          const newPost: ForumPostWithProfile = { ...raw, profiles: profile };
          setPosts((prev) => {
            if (prev.some((p) => p.id === raw.id)) return prev;
            return [newPost, ...prev];
          });
          setTotal((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "forum_posts",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const updated = payload.new as Tables<"forum_posts">;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === updated.id ? { ...p, ...updated } : p,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "forum_posts",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setPosts((prev) => prev.filter((p) => p.id !== old.id));
            setTotal((prev) => Math.max(0, prev - 1));
          }
        },
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [channel.id, supabase]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);

    try {
      const nextPage = page + 1;
      const result = await fetchForumPosts({
        channelId: channel.id,
        page: nextPage,
        sortField: "last_activity_at",
        sortOrder: "desc",
      });

      setPosts((prev) => [...prev, ...result.items]);
      setTotal(result.total);
      setPage(nextPage);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load more posts.");
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, channel.id]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
        <div className="flex items-center gap-2">
          <MessageSquareText className="h-5 w-5 shrink-0 text-[#8e9297]" />
          <span className="font-semibold text-white">{channel.name}</span>
          {channel.description && (
            <>
              <div className="mx-2 h-4 w-px shrink-0 bg-[#3f4147]" />
              <span className="truncate text-sm text-[#8e9297]">
                {channel.description}
              </span>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-[#5865f2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752c4]"
        >
          <Plus className="h-3.5 w-3.5" />
          New Post
        </button>
      </header>

      <div className="flex shrink-0 gap-1 border-b border-[#1e1f22] bg-[#2b2d31] px-4 py-1">
        <button
          type="button"
          onClick={() => setTab("posts")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "posts"
              ? "bg-[#404249] text-white"
              : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
          )}
        >
          <MessageSquareText className="mr-1.5 inline h-3.5 w-3.5" />
          Posts
        </button>
        <button
          type="button"
          onClick={() => setTab("media")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            tab === "media"
              ? "bg-[#404249] text-white"
              : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
          )}
        >
          <Images className="mr-1.5 inline h-3.5 w-3.5" />
          Media
        </button>
      </div>

      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-md bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {tab === "media" ? (
        <ForumMediaTab channel={channel} />
      ) : (
        <div className="flex flex-1 flex-col overflow-y-auto">
          {!loading && !error && posts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#5865f2]/10">
                <MessageSquareText className="h-10 w-10 text-[#5865f2]" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  No posts yet
                </p>
                <p className="mt-1 text-sm text-[#8e9297]">
                  Be the first to start a discussion.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4">
              {posts.map((post, i) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  serverId={serverId}
                  channelId={channel.id}
                  index={i}
                />
              ))}

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

              {loading && posts.length === 0 && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[#5865f2]" />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <CreatePostModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        channelId={channel.id}
        serverId={serverId}
      />
    </div>
  );
}
