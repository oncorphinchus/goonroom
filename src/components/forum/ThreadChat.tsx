"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { deleteMessage, sendMessage } from "@/features/chat/actions";
import type { Tables } from "@/types/database";
import type { ForumPostWithProfile } from "@/types/forum";
import type { MessageWithProfile } from "@/types/chat";

type ProfileSnippet = Pick<Tables<"profiles">, "id" | "username" | "avatar_url">;

interface ThreadChatProps {
  channel: Tables<"channels">;
  post: ForumPostWithProfile;
  initialMessages: MessageWithProfile[];
  currentUserId: string;
}

export function ThreadChat({
  channel,
  post,
  initialMessages,
  currentUserId,
}: ThreadChatProps): React.ReactNode {
  const [messages, setMessages] = useState<MessageWithProfile[]>(initialMessages);
  const supabase = useMemo(() => createClient(), []);

  const profileCache = useRef<Map<string, ProfileSnippet>>(new Map());
  const inflightProfileFetches = useRef<Map<string, Promise<ProfileSnippet | null>>>(new Map());
  const currentUserProfile = useRef<ProfileSnippet | null>(null);

  useEffect(() => {
    initialMessages.forEach((m) => {
      if (m.profiles) profileCache.current.set(m.profiles.id, m.profiles);
    });
    currentUserProfile.current = profileCache.current.get(currentUserId) ?? null;
  }, [initialMessages, currentUserId]);

  const fetchProfile = useCallback(
    async (userId: string): Promise<ProfileSnippet | null> => {
      const cached = profileCache.current.get(userId);
      if (cached) return cached;

      const inflight = inflightProfileFetches.current.get(userId);
      if (inflight) return inflight;

      const promise = (async (): Promise<ProfileSnippet | null> => {
        const { data } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", userId)
          .single();

        if (data) profileCache.current.set(data.id, data);
        inflightProfileFetches.current.delete(userId);
        return data;
      })();

      inflightProfileFetches.current.set(userId, promise);
      return promise;
    },
    [supabase],
  );

  const addOptimisticMessage = useCallback(
    (content: string) => {
      const pending: MessageWithProfile = {
        id: crypto.randomUUID(),
        channel_id: channel.id,
        post_id: post.id,
        user_id: currentUserId,
        content,
        created_at: new Date().toISOString(),
        profiles: currentUserProfile.current,
        _pending: true,
      };
      setMessages((prev) => [...prev, pending]);
    },
    [channel.id, post.id, currentUserId],
  );

  const removeOptimisticMessage = useCallback((content: string) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m._pending && m.content === content);
      if (idx === -1) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    let removed: MessageWithProfile | undefined;
    setMessages((prev) => {
      removed = prev.find((m) => m.id === messageId);
      return prev.filter((m) => m.id !== messageId);
    });

    const result = await deleteMessage({ messageId });
    if (result?.error && removed) {
      const rollback = removed;
      setMessages((prev) => {
        if (prev.some((m) => m.id === messageId)) return prev;
        const next = [...prev, rollback];
        next.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        return next;
      });
    }
  }, []);

  useEffect(() => {
    const subscription = supabase
      .channel(`messages-post-${post.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `post_id=eq.${post.id}`,
        },
        async (payload) => {
          const raw = payload.new as Tables<"messages">;
          const profile = await fetchProfile(raw.user_id);

          setMessages((prev) => {
            if (raw.user_id === currentUserId) {
              const pendingIdx = prev.findIndex(
                (m) => m._pending && m.content === raw.content,
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = { ...raw, profiles: profile };
                return next;
              }
            }
            if (prev.some((m) => m.id === raw.id)) return prev;
            return [...prev, { ...raw, profiles: profile }];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setMessages((prev) => prev.filter((m) => m.id !== old.id));
          }
        },
      )
      .subscribe();

    return () => { subscription.unsubscribe(); };
  }, [post.id, supabase, currentUserId, fetchProfile]);

  return (
    <>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        channelName={post.title}
        onDeleteMessage={handleDeleteMessage}
      />

      {post.locked ? (
        <div className="shrink-0 px-4 pb-6 pt-2">
          <div className="flex items-center justify-center rounded-lg bg-[#40444b] px-3 py-3 text-sm text-[#8e9297]">
            This post is locked. No new messages can be sent.
          </div>
        </div>
      ) : (
        <MessageInput
          channelId={channel.id}
          postId={post.id}
          channelName={post.title}
          onOptimisticSend={addOptimisticMessage}
          onOptimisticFail={removeOptimisticMessage}
        />
      )}
    </>
  );
}
