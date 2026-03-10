"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ForumPostWithProfile } from "@/types/forum";
import { FORUM_PAGE_SIZE } from "@/types/forum";

const createPostSchema = z.object({
  channelId: z.string().uuid(),
  title: z.string().min(1, "Title is required").max(300),
  content: z.string().max(4000).optional(),
});

export async function createForumPost(
  input: z.input<typeof createPostSchema>,
): Promise<{ data: ForumPostWithProfile; error?: undefined } | { data?: undefined; error: string }> {
  const parsed = createPostSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: channel } = await supabase
    .from("channels")
    .select("id, type")
    .eq("id", parsed.data.channelId)
    .single();

  if (!channel || channel.type !== "FORUM") {
    return { error: "Channel not found or not a forum." };
  }

  const { data: post, error: postErr } = await supabase
    .from("forum_posts")
    .insert({
      channel_id: parsed.data.channelId,
      title: parsed.data.title,
      user_id: user.id,
    })
    .select("*, profiles(id, username, avatar_url)")
    .single();

  if (postErr || !post) return { error: postErr?.message ?? "Failed to create post." };

  if (parsed.data.content) {
    await supabase.from("messages").insert({
      channel_id: parsed.data.channelId,
      post_id: post.id,
      user_id: user.id,
      content: parsed.data.content,
    });
  }

  return { data: post as ForumPostWithProfile };
}

const fetchPostsSchema = z.object({
  channelId: z.string().uuid(),
  page: z.number().int().nonnegative(),
  sortField: z.enum(["last_activity_at", "created_at"]),
  sortOrder: z.enum(["asc", "desc"]),
});

export async function fetchForumPosts(
  options: z.input<typeof fetchPostsSchema>,
): Promise<{
  items: ForumPostWithProfile[];
  total: number;
  hasMore: boolean;
}> {
  const parsed = fetchPostsSchema.safeParse(options);
  if (!parsed.success) throw new Error(`Invalid input: ${parsed.error.message}`);

  const { channelId, page, sortField, sortOrder } = parsed.data;
  const supabase = await createClient();

  const from = page * FORUM_PAGE_SIZE;
  const to = from + FORUM_PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("forum_posts")
    .select("*, profiles(id, username, avatar_url)", { count: "exact" })
    .eq("channel_id", channelId)
    .order(sortField, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    items: (data ?? []) as ForumPostWithProfile[],
    total: count ?? 0,
    hasMore: to < (count ?? 0) - 1,
  };
}

const togglePostSchema = z.object({
  postId: z.string().uuid(),
});

export async function lockPost(
  input: z.input<typeof togglePostSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = togglePostSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_posts")
    .update({ locked: true })
    .eq("id", parsed.data.postId);

  if (error) return { error: error.message };
}

export async function unlockPost(
  input: z.input<typeof togglePostSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = togglePostSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_posts")
    .update({ locked: false })
    .eq("id", parsed.data.postId);

  if (error) return { error: error.message };
}

export async function pinPost(
  input: z.input<typeof togglePostSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = togglePostSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_posts")
    .update({ pinned: true })
    .eq("id", parsed.data.postId);

  if (error) return { error: error.message };
}

export async function deletePost(
  input: z.input<typeof togglePostSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = togglePostSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid input" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("forum_posts")
    .delete()
    .eq("id", parsed.data.postId);

  if (error) return { error: error.message };
}
