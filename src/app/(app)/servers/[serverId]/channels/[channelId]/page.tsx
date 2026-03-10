import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatArea } from "@/components/chat/ChatArea";
import { ForumPostList } from "@/components/forum/ForumPostList";
import { ChannelPageContent } from "@/components/layout/ChannelPageContent";
import type { MessageWithProfile, ReactionGroup } from "@/types/chat";

interface ChannelPageProps {
  params: Promise<{ serverId: string; channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps): Promise<React.ReactNode> {
  const { serverId, channelId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .eq("server_id", serverId)
    .single();

  if (channelError || !channel) notFound();

  const { data: memberRow } = await supabase
    .from("server_members")
    .select("role")
    .eq("server_id", serverId)
    .eq("user_id", user.id)
    .single();

  const isAdmin =
    memberRow?.role === "owner" || memberRow?.role === "admin";

  if (channel.type === "FORUM") {
    return (
      <ChannelPageContent channel={channel}>
        <ForumPostList
          key={channelId}
          channel={channel}
          serverId={serverId}
          isAdmin={isAdmin}
        />
      </ChannelPageContent>
    );
  }

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*, profiles(id, username, avatar_url, custom_status)")
    .eq("channel_id", channelId)
    .is("post_id", null)
    .order("created_at", { ascending: true })
    .limit(50);

  const msgs = (rawMessages ?? []) as MessageWithProfile[];

  const replyIds = msgs
    .map((m) => m.reply_to_id)
    .filter((id): id is string => id !== null);

  const replyMap = new Map<string, { id: string; content: string; username: string }>();
  if (replyIds.length > 0) {
    const { data: replyRows } = await supabase
      .from("messages")
      .select("id, content, profiles(username)")
      .in("id", replyIds);

    if (replyRows) {
      for (const row of replyRows) {
        const profile = row.profiles as { username: string } | null;
        replyMap.set(row.id, {
          id: row.id,
          content: row.content,
          username: profile?.username ?? "Unknown",
        });
      }
    }
  }

  const msgIds = msgs.map((m) => m.id);
  const mediaMap = new Map<string, import("@/types/media").MediaItem[]>();
  if (msgIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from("media_attachments")
      .select("*, profiles(id, username, avatar_url)")
      .in("message_id", msgIds)
      .not("message_id", "is", null);
    if (mediaRows) {
      for (const row of mediaRows) {
        const msgId = row.message_id as string;
        if (!msgId) continue;
        const list = mediaMap.get(msgId) ?? [];
        list.push(row as import("@/types/media").MediaItem);
        mediaMap.set(msgId, list);
      }
    }
  }

  const reactionsMap = new Map<string, ReactionGroup[]>();
  if (msgIds.length > 0) {
    const { data: reactionRows } = await supabase
      .from("message_reactions")
      .select("message_id, emoji, user_id")
      .in("message_id", msgIds);

    if (reactionRows) {
      const grouped = new Map<string, Map<string, string[]>>();
      for (const r of reactionRows) {
        if (!grouped.has(r.message_id)) grouped.set(r.message_id, new Map());
        const emojiMap = grouped.get(r.message_id)!;
        if (!emojiMap.has(r.emoji)) emojiMap.set(r.emoji, []);
        emojiMap.get(r.emoji)!.push(r.user_id);
      }

      for (const [msgId, emojiMap] of grouped) {
        const reactions: ReactionGroup[] = [];
        for (const [emoji, userIds] of emojiMap) {
          reactions.push({ emoji, userIds, count: userIds.length });
        }
        reactionsMap.set(msgId, reactions);
      }
    }
  }

  const enrichedMessages: MessageWithProfile[] = msgs.map((m) => ({
    ...m,
    _replyTo: m.reply_to_id ? replyMap.get(m.reply_to_id) ?? null : null,
    _reactions: reactionsMap.get(m.id) ?? [],
    _media: mediaMap.get(m.id) ?? [],
  }));

  const { data: serverProfileRows } = await supabase
    .from("server_profiles")
    .select("user_id, nickname, server_avatar_url")
    .eq("server_id", serverId);

  const serverProfilesMap: Record<string, { nickname: string | null; serverAvatarUrl: string | null }> = {};
  for (const sp of serverProfileRows ?? []) {
    serverProfilesMap[sp.user_id] = {
      nickname: sp.nickname,
      serverAvatarUrl: sp.server_avatar_url,
    };
  }

  return (
    <ChannelPageContent channel={channel}>
      <ChatArea
        key={channelId}
        channel={channel}
        initialMessages={enrichedMessages}
        currentUserId={user.id}
        isAdmin={isAdmin}
        serverId={serverId}
        serverProfiles={serverProfilesMap}
      />
    </ChannelPageContent>
  );
}
