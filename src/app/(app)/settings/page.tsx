import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsShell } from "@/components/settings/SettingsShell";

export const metadata = { title: "User Settings — GoonRoom" };

export default async function SettingsPage(): Promise<React.ReactNode> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();

  if (authErr || !user) redirect("/login");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) redirect("/");

  const newEmail = (user as { new_email?: string | null }).new_email ?? null;
  return (
    <SettingsShell
      profile={profile}
      email={user.email ?? ""}
      newEmail={newEmail}
    />
  );
}
