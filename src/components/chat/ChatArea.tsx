"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Hash } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";
import { UploadModal } from "@/components/media/UploadModal";
import { deleteMessage } from "@/features/chat/actions";
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
}: ChatAreaProps): React.ReactNode {
  const [messages, setMessages] =
    useState<MessageWithProfile[]>(initialMessages);
  const [uploadOpen, setUploadOpen] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const profileCache = useRef<Map<string, ProfileSnippet>>(new Map());
  const inflightProfileFetches = useRef<Map<string, Promise<ProfileSnippet | null>>>(new Map());

  const currentUserProfile = useRef<ProfileSnippet | null>(null);

  useEffect(() => {
    initialMessages.forEach((m) => {
      if (m.profiles) profileCache.current.set(m.profiles.id, m.profiles);
    });
    currentUserProfile.current =
      profileCache.current.get(currentUserId) ?? null;
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
    [supabase]
  );

  const addOptimisticMessage = useCallback(
    (content: string) => {
      const tempId = crypto.randomUUID();

      const pending: MessageWithProfile = {
        id: tempId,
        channel_id: channel.id,
        post_id: null,
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

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
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
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
          return next;
        });
      }
    },
    [],
  );

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

            if (prev.some((m) => m.id === raw.id)) return prev;
            return [...prev, { ...raw, profiles: profile }];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const old = payload.old as { id?: string };
          if (old.id) {
            setMessages((prev) => prev.filter((m) => m.id !== old.id));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [channel.id, supabase, currentUserId, fetchProfile]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center border-b border-[#1e1f22] bg-[#313338] px-4 shadow-sm">
        <Hash className="mr-2 h-5 w-5 shrink-0 text-[#8e9297]" />
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
        onDeleteMessage={handleDeleteMessage}
      />

      <MessageInput
        channelId={channel.id}
        channelName={channel.name}
        onOptimisticSend={addOptimisticMessage}
        onOptimisticFail={removeOptimisticMessage}
        onUploadClick={() => setUploadOpen(true)}
      />

      <UploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        channelId={channel.id}
        onFileQueued={() => {}}
        onFileComplete={() => {}}
        onFileFailed={() => {}}
      />
    </div>
  );
}
