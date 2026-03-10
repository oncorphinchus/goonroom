"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

const createChannelSchema = z.object({
  serverId: z.string().uuid(),
  name: z.string().min(1).max(100),
  type: z.enum(["TEXT", "FORUM"]),
  description: z.string().max(500).nullable().optional(),
});

export async function createChannel(
  input: z.input<typeof createChannelSchema>,
): Promise<{ data: Tables<"channels">; error?: undefined } | { data?: undefined; error: string }> {
  const parsed = createChannelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: parsed.data.serverId });
  if (role !== "owner" && role !== "admin") return { error: "You must be an admin to create channels." };

  const { data: maxPos } = await supabase
    .from("channels")
    .select("position")
    .eq("server_id", parsed.data.serverId)
    .order("position", { ascending: false })
    .limit(1)
    .single();

  const nextPosition = (maxPos?.position ?? -1) + 1;

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      server_id: parsed.data.serverId,
      name: parsed.data.name,
      type: parsed.data.type,
      description: parsed.data.description ?? null,
      position: nextPosition,
    })
    .select()
    .single();

  if (error || !channel) return { error: error?.message ?? "Failed to create channel." };
  return { data: channel };
}

const updateChannelSchema = z.object({
  channelId: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

export async function updateChannel(
  input: z.input<typeof updateChannelSchema>,
): Promise<{ error?: string }> {
  const parsed = updateChannelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: ch } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", parsed.data.channelId)
    .single();
  if (!ch) return { error: "Channel not found." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: ch.server_id });
  if (role !== "owner" && role !== "admin") return { error: "You must be an admin to edit channels." };

  const updates: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.description !== undefined) updates.description = parsed.data.description;
  if (parsed.data.categoryId !== undefined) updates.category_id = parsed.data.categoryId;

  if (Object.keys(updates).length === 0) return {};

  const { error } = await supabase
    .from("channels")
    .update(updates)
    .eq("id", parsed.data.channelId);

  if (error) return { error: error.message };
  return {};
}

const reorderChannelsSchema = z.object({
  order: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number().int(),
      categoryId: z.string().uuid().nullable().optional(),
    }),
  ),
});

export async function reorderChannels(
  input: z.input<typeof reorderChannelsSchema>,
): Promise<{ error?: string }> {
  const parsed = reorderChannelsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  if (parsed.data.order.length === 0) return {};

  const { data: ch } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", parsed.data.order[0].id)
    .single();
  if (!ch) return { error: "Channel not found." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: ch.server_id });
  if (role !== "owner" && role !== "admin") return { error: "Only admins can reorder channels." };

  for (const { id, position, categoryId } of parsed.data.order) {
    const update: Record<string, unknown> = { position };
    if (categoryId !== undefined) update.category_id = categoryId;
    await supabase.from("channels").update(update).eq("id", id);
  }

  return {};
}

const deleteChannelSchema = z.object({
  channelId: z.string().uuid(),
});

export async function deleteChannel(
  input: z.input<typeof deleteChannelSchema>,
): Promise<{ error: string } | undefined> {
  const parsed = deleteChannelSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: ch } = await supabase
    .from("channels")
    .select("server_id")
    .eq("id", parsed.data.channelId)
    .single();

  if (!ch) return { error: "Channel not found." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: ch.server_id });
  if (role !== "owner" && role !== "admin") return { error: "You must be an admin to delete channels." };

  const { error } = await supabase
    .from("channels")
    .delete()
    .eq("id", parsed.data.channelId);

  if (error) return { error: error.message };
}
