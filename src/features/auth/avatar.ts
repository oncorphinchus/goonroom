"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url("Invalid URL"),
});

export async function updateAvatar(
  input: z.input<typeof updateAvatarSchema>,
): Promise<{ error?: string }> {
  const parsed = updateAvatarSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: parsed.data.avatarUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };
  return {};
}
