import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyServers } from "@/features/server/actions";
import { NavBar } from "@/components/layout/NavBar";
import { NavBarContent } from "@/components/layout/NavBarContent";
import { ChannelSidebar } from "@/components/layout/ChannelSidebar";
import { MobileShell } from "@/components/layout/MobileShell";

interface ServerLayoutProps {
  children: React.ReactNode;
  params: Promise<{ serverId: string }>;
}

export default async function ServerLayout({
  children,
  params,
}: ServerLayoutProps): Promise<React.ReactNode> {
  const { serverId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const servers = await getMyServers();
  const currentServer = servers.find((s) => s.id === serverId);
  if (!currentServer) notFound();

  const [profileResult, channelsResult, memberResult, categoriesResult, serverProfileResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("channels").select("*").eq("server_id", serverId).order("position"),
    supabase
      .from("server_members")
      .select("role")
      .eq("server_id", serverId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("channel_categories")
      .select("*")
      .eq("server_id", serverId)
      .order("position"),
    supabase
      .from("server_profiles")
      .select("nickname, server_avatar_url")
      .eq("server_id", serverId)
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (profileResult.error || !profileResult.data) {
    throw new Error(
      `Failed to load user profile: ${profileResult.error?.message ?? "Profile not found"}`,
    );
  }

  const userRole = memberResult.data?.role ?? "member";
  const serverNickname = serverProfileResult.data?.nickname ?? null;

  const sidebarElement = (
    <ChannelSidebar
      serverId={serverId}
      serverName={currentServer.name}
      serverIconUrl={currentServer.icon_url ?? null}
      serverBannerUrl={currentServer.banner_url ?? null}
      serverDescription={currentServer.description ?? null}
      channels={channelsResult.data ?? []}
      categories={categoriesResult.data ?? []}
      profile={profileResult.data}
      userRole={userRole}
      serverNickname={serverNickname}
    />
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#313338]">
      {/* Desktop: full 3-pane layout */}
      <NavBar servers={servers} activeServerId={serverId} />
      <div className="hidden md:flex">
        {sidebarElement}
      </div>

      {/* Mobile: hamburger → Sheet with nav + sidebar */}
      <MobileShell
        navbar={<NavBarContent servers={servers} activeServerId={serverId} />}
        sidebar={sidebarElement}
      >
        {children}
      </MobileShell>
    </div>
  );
}
