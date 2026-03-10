"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Server, ServerMemberWithProfile } from "@/types/server";

const createServerSchema = z.object({
  name: z.string().min(1, "Server name is required").max(100),
  iconUrl: z.string().url().nullable().optional(),
});

export async function createServer(
  input: z.input<typeof createServerSchema>,
): Promise<{ data: { server: Server; inviteCode: string }; error?: undefined } | { data?: undefined; error: string }> {
  const parsed = createServerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  const { data: server, error: serverErr } = await supabase
    .from("servers")
    .insert({ name: parsed.data.name, icon_url: parsed.data.iconUrl ?? null, owner_id: user.id })
    .select()
    .single();

  if (serverErr || !server) return { error: serverErr?.message ?? "Failed to create server." };

  const { error: memberErr } = await supabase
    .from("server_members")
    .insert({ server_id: server.id, user_id: user.id, role: "owner" });

  if (memberErr) {
    await supabase.from("servers").delete().eq("id", server.id);
    return { error: memberErr.message };
  }

  const { error: channelErr } = await supabase
    .from("channels")
    .insert({ server_id: server.id, name: "general", type: "TEXT", position: 0 });

  if (channelErr) {
    await supabase.from("server_members").delete().eq("server_id", server.id).eq("user_id", user.id);
    await supabase.from("servers").delete().eq("id", server.id);
    return { error: channelErr.message };
  }

  const { error: inviteErr } = await supabase
    .from("server_invites")
    .insert({ server_id: server.id, code, created_by: user.id });

  if (inviteErr) return { error: inviteErr.message };

  return { data: { server, inviteCode: code } };
}

const joinServerSchema = z.object({
  inviteCode: z.string().min(1, "Invite code is required"),
});

export async function joinServer(
  input: z.input<typeof joinServerSchema>,
): Promise<{ data: Server; error?: undefined } | { data?: undefined; error: string }> {
  const parsed = joinServerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: invite, error: inviteErr } = await supabase
    .from("server_invites")
    .select("*")
    .eq("code", parsed.data.inviteCode)
    .single();

  if (inviteErr || !invite) return { error: "Invalid or expired invite code." };

  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return { error: "This invite has expired." };
  }
  if (invite.max_uses && invite.uses >= invite.max_uses) {
    return { error: "This invite has reached its maximum uses." };
  }

  const { data: existing } = await supabase
    .from("server_members")
    .select("server_id")
    .eq("server_id", invite.server_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { data: server } = await supabase.from("servers").select().eq("id", invite.server_id).single();
    return server ? { data: server } : { error: "Server not found." };
  }

  const { error: joinErr } = await supabase
    .from("server_members")
    .insert({ server_id: invite.server_id, user_id: user.id });

  if (joinErr) return { error: joinErr.message };

  await supabase.rpc("increment_invite_uses", { p_invite_id: invite.id });

  const { data: server } = await supabase.from("servers").select().eq("id", invite.server_id).single();
  return server ? { data: server } : { error: "Server not found." };
}

export async function getMyServers(): Promise<Server[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberships } = await supabase
    .from("server_members")
    .select("server_id")
    .eq("user_id", user.id);

  if (!memberships || memberships.length === 0) return [];

  const serverIds = memberships.map((m) => m.server_id);
  const { data: servers } = await supabase
    .from("servers")
    .select("*")
    .in("id", serverIds)
    .order("created_at");

  return servers ?? [];
}

const createInviteSchema = z.object({
  serverId: z.string().uuid(),
  expiresInHours: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
});

export async function createInvite(
  input: z.input<typeof createInviteSchema>,
): Promise<{ data: string; error?: undefined } | { data?: undefined; error: string }> {
  const parsed = createInviteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: parsed.data.serverId });
  if (role !== "owner" && role !== "admin") return { error: "You must be an admin to create invites." };

  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const expiresAt = parsed.data.expiresInHours
    ? new Date(Date.now() + parsed.data.expiresInHours * 3600_000).toISOString()
    : null;

  const { error } = await supabase.from("server_invites").insert({
    server_id: parsed.data.serverId,
    code,
    created_by: user.id,
    expires_at: expiresAt,
    max_uses: parsed.data.maxUses ?? null,
  });

  if (error) return { error: error.message };
  return { data: code };
}

const updateServerSchema = z.object({
  serverId: z.string().uuid(),
  name: z.string().min(1, "Server name is required").max(100),
});

export async function updateServer(
  input: z.input<typeof updateServerSchema>,
): Promise<{ error?: string }> {
  const parsed = updateServerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: parsed.data.serverId });
  if (role !== "owner" && role !== "admin") return { error: "Only admins can update server settings." };

  const { error } = await supabase
    .from("servers")
    .update({ name: parsed.data.name })
    .eq("id", parsed.data.serverId);

  if (error) return { error: error.message };
  return {};
}

const deleteServerSchema = z.object({
  serverId: z.string().uuid(),
});

export async function deleteServer(
  input: z.input<typeof deleteServerSchema>,
): Promise<{ error?: string }> {
  const parsed = deleteServerSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: role } = await supabase.rpc("get_server_role", { target_server_id: parsed.data.serverId });
  if (role !== "owner") return { error: "Only the server owner can delete the server." };

  const { error } = await supabase
    .from("servers")
    .delete()
    .eq("id", parsed.data.serverId);

  if (error) return { error: error.message };
  return {};
}

export async function getServerMembers(
  serverId: string,
): Promise<ServerMemberWithProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("server_members")
    .select("*, profiles(id, username, avatar_url)")
    .eq("server_id", serverId)
    .order("joined_at");

  return (data ?? []) as ServerMemberWithProfile[];
}
