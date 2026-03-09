import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/layout/NavBar";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [profileResult, channelsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("channels").select("*").order("position"),
  ]);

  const { data: profile, error: profileError } = profileResult;
  const { data: channels } = channelsResult;

  if (profileError || !profile) {
    throw new Error(
      `Failed to load user profile: ${profileError?.message ?? "Profile not found"}`
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#313338]">
      <NavBar />
      <ChannelSidebar channels={channels ?? []} profile={profile} />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
