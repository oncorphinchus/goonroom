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
    .select("*, profiles(id, username, avatar_url)")
    .eq("id", postId)
    .eq("channel_id", channelId)
    .single();

  if (!post) notFound();

  const [messagesResult, mediaResult] = await Promise.all([
    supabase
      .from("messages")
      .select("*, profiles(id, username, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })
      .limit(50),
    supabase
      .from("media_attachments")
      .select("*, profiles(id, username, avatar_url)", { count: "exact" })
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  return (
    <ThreadView
      key={postId}
      channel={channel}
      post={post as ForumPostWithProfile}
      serverId={serverId}
      initialMessages={(messagesResult.data ?? []) as MessageWithProfile[]}
      initialMedia={(mediaResult.data ?? []) as MediaItem[]}
      initialMediaTotal={mediaResult.count ?? 0}
      currentUserId={user.id}
      isAdmin={isAdmin}
    />
  );
}
