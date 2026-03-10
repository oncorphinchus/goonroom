import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyServers } from "@/features/server/actions";

export default async function AppRootPage(): Promise<never> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const servers = await getMyServers();
  if (servers.length > 0) {
    redirect(`/servers/${servers[0].id}`);
  }

  redirect("/create-server");
}
