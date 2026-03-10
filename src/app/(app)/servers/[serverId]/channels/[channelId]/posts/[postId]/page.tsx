import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThreadView } from "@/components/forum/ThreadView";
import type { MessageWithProfile } from "@/types/chat";
import type { MediaItem } from "@/types/media";
import type { ForumPostWithProfile } from "@/types/forum";

interface PostPageProps {
  params: Promise<{ serverId: string; channelId: string; postId: string }>;
}

export default async function PostPage({ params }: PostPageProps): Promise<React.ReactNode> {
  const { serverId, channelId, postId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: channel } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .eq("server_id", serverId)
    .single();

  if (!channel || channel.type !== "FORUM") notFound();

  const { data: memberRow } = await supabase
    .from("server_members")
    .select("role")
    .eq("server_id", serverId)
    .eq("user_id", user.id)
    .single();

  const isAdmin =
    memberRow?.role === "owner" || memberRow?.role === "admin";

  const { data: post } = await supabase
    .from("forum_posts")
    .select("*, profiles(id, username, avatar_url, custom_status)")
    .eq("id", postId)
    .eq("channel_id", channelId)
    .single();

  if (!post) notFound();

  const [messagesResult, mediaResult, messageMediaResult] = await Promise.all([
    supabase
      .from("messages")
      .select("*, profiles(id, username, avatar_url, custom_status)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("media_attachments")
      .select("*, profiles(id, username, avatar_url)", { count: "exact" })
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("media_attachments")
      .select("*, profiles(id, username, avatar_url)")
      .eq("post_id", postId)
      .not("message_id", "is", null),
  ]);

  const msgs = (messagesResult.data ?? []) as MessageWithProfile[];
  const messageMedia = (messageMediaResult.data ?? []) as MediaItem[];
  const mediaMap = new Map<string, MediaItem[]>();
  for (const m of messageMedia) {
    const msgId = m.message_id as string | null;
    if (msgId) {
      const list = mediaMap.get(msgId) ?? [];
      list.push(m);
      mediaMap.set(msgId, list);
    }
  }
  const enrichedMessages: MessageWithProfile[] = msgs.map((m) => ({
    ...m,
    _media: mediaMap.get(m.id) ?? [],
  }));

  return (
    <ThreadView
      key={postId}
      channel={channel}
      post={post as ForumPostWithProfile}
      serverId={serverId}
      initialMessages={enrichedMessages}
      initialMedia={(mediaResult.data ?? []) as MediaItem[]}
      initialMediaTotal={mediaResult.count ?? 0}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  );
}
