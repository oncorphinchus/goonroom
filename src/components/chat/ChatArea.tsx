"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash, Images } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import type { Tables } from "@/types/database";
import type { MessageWithProfile } from "@/types/chat";

interface ChatAreaProps {
  channel: Tables<"channels">;
  initialMessages: MessageWithProfile[];
  currentUserId: string;
}

type ProfileSnippet = Pick<
  Tables<"profiles">,
  "id" | "username" | "avatar_url"
>;

export function ChatArea({
  channel,
  initialMessages,
  currentUserId,
}: ChatAreaProps) {
  const [messages, setMessages] =
    useState<MessageWithProfile[]>(initialMessages);

  const supabase = useMemo(() => createClient(), []);

  const profileCache = useRef<Map<string, ProfileSnippet>>(new Map());
  const inflightProfileFetches = useRef<Map<string, Promise<ProfileSnippet | null>>>(new Map());

  const currentUserProfile = useRef<ProfileSnippet | null>(null);

  // Seed the profile cache from initialMessages once on mount.
  // This effect runs before the Realtime subscription effect because
  // React fires effects in declaration order within the same render.
  useEffect(() => {
    initialMessages.forEach((m) => {
      if (m.profiles) profileCache.current.set(m.profiles.id, m.profiles);
    });
    currentUserProfile.current =
      profileCache.current.get(currentUserId) ?? null;
  }, [initialMessages, currentUserId]);

  // Deduplicated profile fetch — concurrent Realtime events for the same
  // uncached user coalesce into a single database query.
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
    [supabase]
  );

  // Push an optimistic (pending) message into local state immediately.
  const addOptimisticMessage = useCallback(
    (content: string) => {
      const tempId = crypto.randomUUID();

      const pending: MessageWithProfile = {
        id: tempId,
        channel_id: channel.id,
        user_id: currentUserId,
        content,
        created_at: new Date().toISOString(),
        profiles: currentUserProfile.current,
        _pending: true,
      };

      setMessages((prev) => [...prev, pending]);
    },
    [channel.id, currentUserId]
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

  // Realtime subscription — reconciles optimistic messages with confirmed rows.
  useEffect(() => {
    const subscription = supabase
      .channel(`messages-channel-${channel.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        async (payload) => {
          const raw = payload.new as Tables<"messages">;
          const profile = await fetchProfile(raw.user_id);

          setMessages((prev) => {
            // If this is the current user's message, replace the earliest
            // pending message with matching content — that's the optimistic
            // placeholder we inserted on send.
            if (raw.user_id === currentUserId) {
              const pendingIdx = prev.findIndex(
                (m) => m._pending && m.content === raw.content
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = { ...raw, profiles: profile };
                return next;
              }
            }

            // Otherwise it's someone else's message (or no pending match).
            // Guard against duplicates — Realtime can occasionally re-deliver.
            if (prev.some((m) => m.id === raw.id)) return prev;
            return [...prev, { ...raw, profiles: profile }];
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel.id, supabase, currentUserId, fetchProfile]);

  const ChannelIcon = channel.type === "CHAT" ? Hash : Images;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
        <ChannelIcon className="mr-2 h-5 w-5 shrink-0 text-[#8e9297]" />
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

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        channelName={channel.name}
      />

      <MessageInput
        channelId={channel.id}
        channelName={channel.name}
        onOptimisticSend={addOptimisticMessage}
        onOptimisticFail={removeOptimisticMessage}
      />
    </div>
  );
}
