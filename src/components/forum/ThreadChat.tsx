"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import {
  deleteMessage,
  editMessage,
  addReaction,
  removeReaction,
  pinMessage,
  unpinMessage,
} from "@/features/chat/actions";
import { PinnedMessagesPanel } from "@/components/chat/PinnedMessagesPanel";
import type { Tables } from "@/types/database";
import type { ForumPostWithProfile } from "@/types/forum";
import type { MessageWithProfile, ReplySnippet } from "@/types/chat";

type ProfileSnippet = Pick<
  Tables<"profiles">,
  "id" | "username" | "avatar_url"
>;

interface ThreadChatProps {
  channel: Tables<"channels">;
  post: ForumPostWithProfile;
  initialMessages: MessageWithProfile[];
  currentUserId: string;
  isAdmin?: boolean;
  serverId?: string;
}

export function ThreadChat({
  channel,
  post,
  initialMessages,
  currentUserId,
  isAdmin = false,
  serverId,
}: ThreadChatProps): React.ReactNode {
  const [messages, setMessages] =
    useState<MessageWithProfile[]>(initialMessages);
  const [replyingTo, setReplyingTo] = useState<ReplySnippet | null>(null);
  const [pinnedPanelOpen, setPinnedPanelOpen] = useState(false);
  const scrollToMessageRef = useRef<((messageId: string) => void) | null>(null);
  const supabase = useMemo(() => createClient(), []);

  const profileCache = useRef<Map<string, ProfileSnippet>>(new Map());
  const inflightProfileFetches = useRef<
    Map<string, Promise<ProfileSnippet | null>>
  >(new Map());
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
        edited_at: null,
        reply_to_id: replyingTo?.id ?? null,
        pinned: false,
        profiles: currentUserProfile.current,
        _pending: true,
        _replyTo: replyingTo ?? null,
        _reactions: [],
      };
      setMessages((prev) => [...prev, pending]);
    },
    [channel.id, post.id, currentUserId, replyingTo],
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
    if (result?.error) {
      toast.error(result.error);
    }
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
  }, []);

  const handleEditMessage = useCallback(
    async (messageId: string, content: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId
            ? { ...m, content, edited_at: new Date().toISOString() }
            : m,
        ),
      );
      const result = await editMessage({ messageId, content });
      if (result?.error) {
        toast.error(result.error);
      }
    },
    [],
  );

  const handleReplyToMessage = useCallback(
    (message: MessageWithProfile) => {
      setReplyingTo({
        id: message.id,
        content: message.content,
        username: message.profiles?.username ?? "Unknown",
      });
    },
    [],
  );

  const handleCancelReply = useCallback(() => {
    setReplyingTo(null);
  }, []);

  const handleAddReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = [...(m._reactions ?? [])];
          const idx = reactions.findIndex((r) => r.emoji === emoji);
          if (idx >= 0) {
            const existing = reactions[idx];
            if (!existing.userIds.includes(currentUserId)) {
              reactions[idx] = {
                ...existing,
                userIds: [...existing.userIds, currentUserId],
                count: existing.count + 1,
              };
            }
          } else {
            reactions.push({ emoji, userIds: [currentUserId], count: 1 });
          }
          return { ...m, _reactions: reactions };
        }),
      );
      const result = await addReaction({ messageId, emoji });
      if (result?.error) toast.error(result.error);
    },
    [currentUserId],
  );

  const handleRemoveReaction = useCallback(
    async (messageId: string, emoji: string) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id !== messageId) return m;
          const reactions = (m._reactions ?? [])
            .map((r) => {
              if (r.emoji !== emoji) return r;
              const newUserIds = r.userIds.filter(
                (uid) => uid !== currentUserId,
              );
              return { ...r, userIds: newUserIds, count: newUserIds.length };
            })
            .filter((r) => r.count > 0);
          return { ...m, _reactions: reactions };
        }),
      );
      const result = await removeReaction({ messageId, emoji });
      if (result?.error) toast.error(result.error);
    },
    [currentUserId],
  );

  const handlePinMessage = useCallback(
    async (messageId: string, currentlyPinned: boolean) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, pinned: !currentlyPinned } : m,
        ),
      );

      const result = currentlyPinned
        ? await unpinMessage({ messageId })
        : await pinMessage({ messageId });

      if (result?.error) {
        toast.error(result.error);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, pinned: currentlyPinned } : m,
          ),
        );
      }
    },
    [],
  );

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

          let replyTo: ReplySnippet | null = null;
          if (raw.reply_to_id) {
            const { data: replyMsg } = await supabase
              .from("messages")
              .select("id, content, profiles(username)")
              .eq("id", raw.reply_to_id)
              .single();
            if (replyMsg) {
              const rp = replyMsg.profiles as { username: string } | null;
              replyTo = {
                id: replyMsg.id,
                content: replyMsg.content,
                username: rp?.username ?? "Unknown",
              };
            }
          }

          setMessages((prev) => {
            if (raw.user_id === currentUserId) {
              const pendingIdx = prev.findIndex(
                (m) => m._pending && m.content === raw.content,
              );
              if (pendingIdx !== -1) {
                const next = [...prev];
                next[pendingIdx] = {
                  ...raw,
                  profiles: profile,
                  _replyTo: replyTo,
                  _reactions: [],
                };
                return next;
              }
            }
            if (prev.some((m) => m.id === raw.id)) return prev;
            return [
              ...prev,
              { ...raw, profiles: profile, _replyTo: replyTo, _reactions: [] },
            ];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `post_id=eq.${post.id}`,
        },
        (payload) => {
          const updated = payload.new as Tables<"messages">;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? {
                    ...m,
                    content: updated.content,
                    edited_at: updated.edited_at,
                    pinned: updated.pinned,
                  }
                : m,
            ),
          );
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "message_reactions",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const raw = payload.new as Tables<"message_reactions">;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== raw.message_id) return m;
              const reactions = [...(m._reactions ?? [])];
              const idx = reactions.findIndex((r) => r.emoji === raw.emoji);
              if (idx >= 0) {
                const existing = reactions[idx];
                if (!existing.userIds.includes(raw.user_id)) {
                  reactions[idx] = {
                    ...existing,
                    userIds: [...existing.userIds, raw.user_id],
                    count: existing.count + 1,
                  };
                }
              } else {
                reactions.push({
                  emoji: raw.emoji,
                  userIds: [raw.user_id],
                  count: 1,
                });
              }
              return { ...m, _reactions: reactions };
            }),
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "message_reactions",
          filter: `channel_id=eq.${channel.id}`,
        },
        (payload) => {
          const old = payload.old as {
            id?: string;
            message_id?: string;
            user_id?: string;
            emoji?: string;
          };
          if (!old.message_id || !old.emoji || !old.user_id) return;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id !== old.message_id) return m;
              const reactions = (m._reactions ?? [])
                .map((r) => {
                  if (r.emoji !== old.emoji) return r;
                  const newUserIds = r.userIds.filter(
                    (uid) => uid !== old.user_id,
                  );
                  return {
                    ...r,
                    userIds: newUserIds,
                    count: newUserIds.length,
                  };
                })
                .filter((r) => r.count > 0);
              return { ...m, _reactions: reactions };
            }),
          );
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [post.id, supabase, currentUserId, fetchProfile]);

  return (
    <>
      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        channelName={post.title}
        isAdmin={isAdmin}
        serverId={serverId}
        onDeleteMessage={handleDeleteMessage}
        onEditMessage={handleEditMessage}
        onReplyToMessage={handleReplyToMessage}
        onAddReaction={handleAddReaction}
        onRemoveReaction={handleRemoveReaction}
        onPinMessage={handlePinMessage}
        onScrollToMessageRef={(fn) => {
          scrollToMessageRef.current = fn;
        }}
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
          replyingTo={replyingTo}
          onCancelReply={handleCancelReply}
          onOptimisticSend={addOptimisticMessage}
          onOptimisticFail={removeOptimisticMessage}
        />
      )}

      <PinnedMessagesPanel
        channelId={channel.id}
        postId={post.id}
        open={pinnedPanelOpen}
        onClose={() => setPinnedPanelOpen(false)}
        isAdmin={isAdmin}
        onUnpin={(messageId) => handlePinMessage(messageId, true)}
        onScrollToMessage={(messageId) =>
          scrollToMessageRef.current?.(messageId)
        }
      />
    </>
  );
}
