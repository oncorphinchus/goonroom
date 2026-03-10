"use server";

import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import type { MessageWithProfile } from "@/types/chat";

const sendMessageSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  postId: z.string().uuid("Invalid post ID").nullable().optional(),
  replyToId: z.string().uuid("Invalid reply ID").nullable().optional(),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
});

export async function sendMessage(input: {
  channelId: string;
  postId?: string | null;
  replyToId?: string | null;
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
    reply_to_id: parsed.data.replyToId ?? null,
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

const editMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(4000, "Message is too long (max 4000 characters)"),
});

export async function editMessage(input: {
  messageId: string;
  content: string;
}): Promise<{ error: string } | undefined> {
  const parsed = editMessageSchema.safeParse(input);
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
    return { error: "You can only edit your own messages." };
  }

  const { error: updateErr } = await supabase
    .from("messages")
    .update({
      content: parsed.data.content,
      edited_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.messageId);

  if (updateErr) {
    return { error: updateErr.message };
  }
}

const reactionSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
  emoji: z.string().min(1, "Emoji required").max(8, "Invalid emoji"),
});

export async function addReaction(input: {
  messageId: string;
  emoji: string;
}): Promise<{ error: string } | undefined> {
  const parsed = reactionSchema.safeParse(input);
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

  const { data: message, error: msgErr } = await supabase
    .from("messages")
    .select("channel_id")
    .eq("id", parsed.data.messageId)
    .single();

  if (msgErr || !message) {
    return { error: "Message not found." };
  }

  const { error: insertErr } = await supabase
    .from("message_reactions")
    .upsert(
      {
        message_id: parsed.data.messageId,
        user_id: user.id,
        emoji: parsed.data.emoji,
        channel_id: message.channel_id,
      },
      { onConflict: "message_id,user_id,emoji", ignoreDuplicates: true },
    );

  if (insertErr) {
    return { error: insertErr.message };
  }
}

export async function removeReaction(input: {
  messageId: string;
  emoji: string;
}): Promise<{ error: string } | undefined> {
  const parsed = reactionSchema.safeParse(input);
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

  const { error: deleteErr } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", parsed.data.messageId)
    .eq("user_id", user.id)
    .eq("emoji", parsed.data.emoji);

  if (deleteErr) {
    return { error: deleteErr.message };
  }
}

const pinMessageSchema = z.object({
  messageId: z.string().uuid("Invalid message ID"),
});

export async function pinMessage(input: {
  messageId: string;
}): Promise<{ error: string } | undefined> {
  const parsed = pinMessageSchema.safeParse(input);
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
    .select("id, channel_id")
    .eq("id", parsed.data.messageId)
    .single();

  if (fetchErr || !message) {
    return { error: "Message not found." };
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", message.channel_id)
    .single();

  if (!channel) {
    return { error: "Channel not found." };
  }

  const { data: role } = await supabase.rpc("get_server_role", {
    target_server_id: channel.server_id,
  });

  if (role !== "owner" && role !== "admin") {
    return { error: "Only admins can pin messages." };
  }

  const { error: updateErr } = await supabase
    .from("messages")
    .update({ pinned: true })
    .eq("id", parsed.data.messageId);

  if (updateErr) {
    return { error: updateErr.message };
  }
}

export async function unpinMessage(input: {
  messageId: string;
}): Promise<{ error: string } | undefined> {
  const parsed = pinMessageSchema.safeParse(input);
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
    .select("id, channel_id")
    .eq("id", parsed.data.messageId)
    .single();

  if (fetchErr || !message) {
    return { error: "Message not found." };
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", message.channel_id)
    .single();

  if (!channel) {
    return { error: "Channel not found." };
  }

  const { data: role } = await supabase.rpc("get_server_role", {
    target_server_id: channel.server_id,
  });

  if (role !== "owner" && role !== "admin") {
    return { error: "Only admins can unpin messages." };
  }

  const { error: updateErr } = await supabase
    .from("messages")
    .update({ pinned: false })
    .eq("id", parsed.data.messageId);

  if (updateErr) {
    return { error: updateErr.message };
  }
}

const fetchPinnedSchema = z.object({
  channelId: z.string().uuid("Invalid channel ID"),
  postId: z.string().uuid("Invalid post ID").nullable().optional(),
});

export async function fetchPinnedMessages(input: {
  channelId: string;
  postId?: string | null;
}): Promise<{ data: MessageWithProfile[] } | { error: string }> {
  const parsed = fetchPinnedSchema.safeParse(input);
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

  let query = supabase
    .from("messages")
    .select("*, profiles(id, username, avatar_url)")
    .eq("channel_id", parsed.data.channelId)
    .eq("pinned", true);

  if (parsed.data.postId) {
    query = query.eq("post_id", parsed.data.postId);
  } else {
    query = query.is("post_id", null);
  }

  const { data, error } = await query.order("created_at", {
    ascending: false,
  });

  if (error) {
    return { error: error.message };
  }

  return { data: (data ?? []) as MessageWithProfile[] };
}
