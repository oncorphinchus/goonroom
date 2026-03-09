"use server";

import { createClient } from "@/lib/supabase/server";
import type { MediaSortField, MediaSortOrder } from "@/types/media";

const PAGE_SIZE = 40;

export async function fetchMediaPage(options: {
  channelId: string;
  page: number;
  sortField: MediaSortField;
  sortOrder: MediaSortOrder;
}): Promise<{
  items: unknown[];
  total: number;
  hasMore: boolean;
}> {
  const supabase = await createClient();
  const { channelId, page, sortField, sortOrder } = options;

  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, count, error } = await supabase
    .from("media_attachments")
    .select("*, profiles(id, username, avatar_url)", { count: "exact" })
    .eq("channel_id", channelId)
    .order(sortField, { ascending: sortOrder === "asc" })
    .range(from, to);

  if (error) throw new Error(error.message);

  return {
    items: data ?? [],
    total: count ?? 0,
    hasMore: to < (count ?? 0) - 1,
  };
}
