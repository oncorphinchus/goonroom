import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatArea } from "@/components/chat/ChatArea";
import type { MessageWithProfile } from "@/types/chat";

interface ChannelPageProps {
  params: Promise<{ channelId: string }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { channelId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const [{ data: channel, error: channelError }, { data: rawMessages }] =
    await Promise.all([
      supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single(),
      supabase
        .from("messages")
        .select("*, profiles(id, username, avatar_url)")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(50),
    ]);

  if (channelError || !channel) notFound();

  if (channel.type !== "CHAT") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5865f2]/10">
          <span className="text-2xl">🖼️</span>
        </div>
        <p className="text-lg font-semibold text-white">{channel.name}</p>
        <p className="text-sm text-[#8e9297]">
          Media gallery view is coming in Phase 4.
        </p>
      </div>
    );
  }

  return (
    <ChatArea
      key={channelId}
      channel={channel}
      initialMessages={(rawMessages ?? []) as MessageWithProfile[]}
      currentUserId={user.id}
    />
  );
}
