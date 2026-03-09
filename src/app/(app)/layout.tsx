import { redirect } from "next/navigation";
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

  if (!user) {
    redirect("/login");
  }

  const [profileResult, channelsResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("channels").select("*").order("position"),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error(
      `Failed to load user profile: ${profileResult.error?.message ?? "Profile not found"}`
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#313338]">
      <NavBar />
      <ChannelSidebar
        channels={channelsResult.data ?? []}
        profile={profileResult.data}
      />
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
