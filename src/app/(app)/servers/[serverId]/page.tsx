import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface ServerPageProps {
  params: Promise<{ serverId: string }>;
}

export default async function ServerPage({ params }: ServerPageProps): Promise<never> {
  const { serverId } = await params;
  const supabase = await createClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("id")
    .eq("server_id", serverId)
    .order("position")
    .limit(1);

  if (channels && channels.length > 0) {
    redirect(`/servers/${serverId}/channels/${channels[0].id}`);
  }

  redirect(`/servers/${serverId}/channels`);
}
