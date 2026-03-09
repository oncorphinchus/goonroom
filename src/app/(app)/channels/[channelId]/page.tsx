import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatArea } from "@/components/chat/ChatArea";
import { MediaArea } from "@/components/media/MediaArea";
import type { MessageWithProfile } from "@/types/chat";
import type { MediaItem } from "@/types/media";

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (channelError || !channel) notFound();

  if (channel.type === "MEDIA") {
    const { data: mediaItems, count } = await supabase
      .from("media_attachments")
      .select("*, profiles(id, username, avatar_url)", { count: "exact" })
      .eq("channel_id", channelId)
      .order("created_at", { ascending: false })
      .limit(40);

    return (
      <MediaArea
        key={channelId}
        channel={channel}
        initialItems={(mediaItems ?? []) as MediaItem[]}
        initialTotal={count ?? 0}
      />
    );
  }

  const { data: rawMessages } = await supabase
    .from("messages")
    .select("*, profiles(id, username, avatar_url)")
    .eq("channel_id", channelId)
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
