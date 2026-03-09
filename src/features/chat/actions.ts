"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const sendMessageSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
});

export async function sendMessage(input: {
  channelId: string;
  content: string;
}): Promise<{ error: string } | undefined> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Not authenticated. Please sign in again." };
  }

  const { data: channel, error: chanErr } = await supabase
    .from("channels")
    .select("id, type")
    .eq("id", parsed.data.channelId)
    .single();

  if (chanErr || !channel || channel.type !== "CHAT") {
    return { error: "Channel not found or not a text channel." };
  }

  const { error: insertError } = await supabase.from("messages").insert({
    channel_id: parsed.data.channelId,
    user_id: user.id,
    content: parsed.data.content,
  });

  if (insertError) {
    return { error: insertError.message };
  }
}
