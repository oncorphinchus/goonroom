import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatArea } from "@/components/chat/ChatArea";
import { ForumPostList } from "@/components/forum/ForumPostList";
import type { MessageWithProfile } from "@/types/chat";

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

  if (channel.type === "FORUM") {
    return (
      <ForumPostList
        key={channelId}
        channel={channel}
        serverId={serverId}
      />
    );
  }

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*, profiles(id, username, avatar_url)")
    .eq("channel_id", channelId)
    .is("post_id", null)
    .order("created_at", { ascending: true })
    .limit(50);

  return (
    <ChatArea
      key={channelId}
      channel={channel}
      initialMessages={(rawMessages ?? []) as MessageWithProfile[]}
      currentUserId={user.id}
    />
  );
}
