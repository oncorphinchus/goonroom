"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  // One stable Supabase client for the lifetime of this component instance.
  // The parent page passes key={channelId}, so this component fully unmounts
  // and remounts on channel navigation — no manual reset logic needed.
  const supabase = useMemo(() => createClient(), []);

  // Profile cache: avoids a round-trip for senders whose profiles are already
  // in the initial batch. Lazily fetches profiles for new participants.
  const profileCache = useRef<Map<string, ProfileSnippet>>(new Map());

  // Populate cache from initial messages on mount.
  useEffect(() => {
    initialMessages.forEach((m) => {
      if (m.profiles) profileCache.current.set(m.profiles.id, m.profiles);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime subscription — scoped to this channel.
  // Cleanup runs automatically when the component unmounts (channel switch
  // triggers a full remount via the key={channelId} set by the parent).
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

          // Try cache first, then fetch.
          let profile: ProfileSnippet | null =
            profileCache.current.get(raw.user_id) ?? null;

          if (!profile) {
            const { data } = await supabase
              .from("profiles")
              .select("id, username, avatar_url")
              .eq("id", raw.user_id)
              .single();

            if (data) {
              profileCache.current.set(data.id, data);
              profile = data;
            }
          }

          setMessages((prev) => [...prev, { ...raw, profiles: profile }]);
        }
      )
      .subscribe();

    // CRITICAL: unsubscribe on unmount to prevent WebSocket leaks.
    return () => {
      subscription.unsubscribe();
    };
    // channel.id is stable for this component instance (key prop).
    // supabase is stable (useMemo with [] deps).
  }, [channel.id, supabase]);

  const ChannelIcon = channel.type === "CHAT" ? Hash : Images;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Channel header */}
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

      <MessageInput channelId={channel.id} channelName={channel.name} />
    </div>
  );
}
