"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { MediaItem } from "@/types/media";
import { PAGE_SIZE } from "@/types/media";

const fetchMediaPageSchema = z.object({
  channelId: z.string().uuid(),
  postId: z.string().uuid().nullable().optional(),
  page: z.number().int().nonnegative(),
  sortField: z.enum(["created_at", "file_size", "file_name"]),
  sortOrder: z.enum(["asc", "desc"]),
});

export async function fetchMediaPage(
  options: z.input<typeof fetchMediaPageSchema>,
): Promise<{
  items: MediaItem[];
  total: number;
  hasMore: boolean;
}> {
  const parsed = fetchMediaPageSchema.safeParse(options);
  if (!parsed.success) {
    throw new Error(`Invalid fetchMediaPage input: ${parsed.error.message}`);
  }

  const { channelId, postId, page, sortField, sortOrder } = parsed.data;
  const supabase = await createClient();

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("media_attachments")
    .select("*, profiles(id, username, avatar_url)", { count: "exact" })
    .eq("channel_id", channelId);

  if (postId) {
    query = query.eq("post_id", postId);
  }

  const { data, count, error } = await query
    .order(sortField, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    items: (data ?? []) as MediaItem[],
    total: count ?? 0,
    hasMore: to < (count ?? 0) - 1,
  };
}
