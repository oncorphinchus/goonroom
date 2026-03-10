"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const upsertServerProfileSchema = z.object({
  serverId: z.string().uuid(),
  nickname: z.string().min(1).max(32).nullable().optional(),
  serverAvatarUrl: z.string().url().nullable().optional(),
});

export async function upsertServerProfile(
  input: z.input<typeof upsertServerProfileSchema>,
): Promise<{ error?: string }> {
  const parsed = upsertServerProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("server_profiles")
    .upsert(
      {
        server_id: parsed.data.serverId,
        user_id: user.id,
        nickname: parsed.data.nickname ?? null,
        server_avatar_url: parsed.data.serverAvatarUrl ?? null,
      },
      { onConflict: "server_id,user_id" },
    );

  if (error) return { error: error.message };
  return {};
}

export async function getServerProfile(
  serverId: string,
  userId: string,
): Promise<Tables<"server_profiles"> | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("server_profiles")
    .select("*")
    .eq("server_id", serverId)
    .eq("user_id", userId)
    .maybeSingle();

  return data ?? null;
}

export async function getAllServerProfiles(
  serverId: string,
): Promise<Tables<"server_profiles">[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("server_profiles")
    .select("*")
    .eq("server_id", serverId);

  return data ?? [];
}
