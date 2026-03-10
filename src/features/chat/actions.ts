"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const sendMessageSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  postId: z.string().uuid("Invalid post ID").nullable().optional(),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
});

export async function sendMessage(input: {
  channelId: string;
  postId?: string | null;
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

  if (chanErr || !channel) {
    return { error: "Channel not found." };
  }

  const postId = parsed.data.postId ?? null;

  if (channel.type === "TEXT" && postId) {
    return { error: "Text channels do not support posts." };
  }

  if (channel.type === "FORUM") {
    if (!postId) {
      return { error: "Forum channels require a post context." };
    }
    const { data: post, error: postErr } = await supabase
      .from("forum_posts")
      .select("id, locked")
      .eq("id", postId)
      .eq("channel_id", parsed.data.channelId)
      .single();

    if (postErr || !post) {
      return { error: "Post not found in this channel." };
    }
    if (post.locked) {
      return { error: "This post is locked." };
    }
  }

  const { error: insertError } = await supabase.from("messages").insert({
    channel_id: parsed.data.channelId,
    post_id: postId,
    user_id: user.id,
    content: parsed.data.content,
  });

  if (insertError) {
    return { error: insertError.message };
  }
}

const deleteMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
});

export async function deleteMessage(input: {
  messageId: string;
}): Promise<{ error: string } | undefined> {
  const parsed = deleteMessageSchema.safeParse(input);
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

  const { data: message, error: fetchErr } = await supabase
    .from("messages")
    .select("id, user_id")
    .eq("id", parsed.data.messageId)
    .single();

  if (fetchErr || !message) {
    return { error: "Message not found." };
  }

  if (message.user_id !== user.id) {
    return { error: "You can only delete your own messages." };
  }

  const { error: deleteErr } = await supabase
    .from("messages")
    .delete()
    .eq("id", parsed.data.messageId);

  if (deleteErr) {
    return { error: deleteErr.message };
  }
}
