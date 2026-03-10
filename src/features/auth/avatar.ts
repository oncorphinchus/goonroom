"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const updateAvatarSchema = z.object({
  avatarUrl: z.string().url("Invalid URL"),
});

const updateBannerSchema = z.object({
  bannerUrl: z.string().url("Invalid URL"),
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
  revalidatePath("/", "layout");
  return {};
}

export async function updateBanner(
  input: z.input<typeof updateBannerSchema>,
): Promise<{ error?: string }> {
  const parsed = updateBannerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ banner_url: parsed.data.bannerUrl })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
