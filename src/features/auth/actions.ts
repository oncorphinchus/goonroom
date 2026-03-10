"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(formData: {
  email: string;
  password: string;
  redirectTo?: string;
}): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) return { error: error.message };

  const redirectTo = formData.redirectTo?.trim();
  const safeRedirect =
    redirectTo &&
    redirectTo.startsWith("/") &&
    !redirectTo.startsWith("//") &&
    !redirectTo.includes("\n")
      ? redirectTo
      : "/";
  redirect(safeRedirect);
}

export async function signUp(formData: {
  email: string;
  username: string;
  password: string;
}): Promise<{ error: string } | undefined> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { username: formData.username },
    },
  });

  if (error) return { error: error.message };

  if (data.session) {
    redirect("/");
  }

  redirect("/login?message=check-email");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export interface ProfileData {
  profile: Tables<"profiles">;
  email: string;
}

export async function fetchProfile(): Promise<{ data?: ProfileData; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !profile) return { error: error?.message ?? "Profile not found." };

  return { data: { profile, email: user.email ?? "" } };
}

export interface UserProfilePublic {
  profile: Tables<"profiles">;
  serverRole?: string;
}

export async function fetchUserProfile(
  userId: string,
  serverId?: string,
): Promise<{ data?: UserProfilePublic; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !profile) return { error: error?.message ?? "Profile not found." };

  let serverRole: string | undefined;
  if (serverId) {
    const { data: member } = await supabase
      .from("server_members")
      .select("role")
      .eq("server_id", serverId)
      .eq("user_id", userId)
      .single();
    serverRole = member?.role ?? undefined;
  }

  return { data: { profile, serverRole } };
}

// ─── Username ────────────────────────────────────────────────────────────────

const updateUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be at most 32 characters.")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores."),
});

export async function updateUsername(
  input: z.input<typeof updateUsernameSchema>,
): Promise<{ error?: string }> {
  const parsed = updateUsernameSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", parsed.data.username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "Username is already taken." };

  const { error } = await supabase
    .from("profiles")
    .update({ username: parsed.data.username })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ─── Password ────────────────────────────────────────────────────────────────

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export async function updatePassword(
  input: z.input<typeof updatePasswordSchema>,
): Promise<{ error?: string }> {
  const parsed = updatePasswordSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user || !user.email) return { error: "Not authenticated." };

  const { error: reAuthErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reAuthErr) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) return { error: error.message };
  return {};
}

// ─── Email ─────────────────────────────────────────────────────────────────────

const updateEmailSchema = z.object({
  newEmail: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required to change email"),
});

export async function updateEmail(
  input: z.input<typeof updateEmailSchema>,
): Promise<{ error?: string }> {
  const parsed = updateEmailSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user || !user.email) return { error: "Not authenticated." };

  const { error: reAuthErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.password,
  });
  if (reAuthErr) return { error: "Current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ email: parsed.data.newEmail });
  if (error) return { error: error.message };
  return {};
}

// ─── Bio ──────────────────────────────────────────────────────────────────────

const updateBioSchema = z.object({
  bio: z.string().max(190, "Bio must be at most 190 characters."),
});

export async function updateBio(
  input: z.input<typeof updateBioSchema>,
): Promise<{ error?: string }> {
  const parsed = updateBioSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ bio: parsed.data.bio || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ─── Custom status ─────────────────────────────────────────────────────────────

const updateCustomStatusSchema = z.object({
  customStatus: z.string().max(128, "Status must be at most 128 characters"),
});

export async function updateCustomStatus(
  input: z.input<typeof updateCustomStatusSchema>,
): Promise<{ error?: string }> {
  const parsed = updateCustomStatusSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ custom_status: parsed.data.customStatus || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ─── Accent color ─────────────────────────────────────────────────────────────

const updateAccentColorSchema = z.object({
  accentColor: z.union([
    z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color"),
    z.literal(""),
  ]),
});

export async function updateAccentColor(
  input: z.input<typeof updateAccentColorSchema>,
): Promise<{ error?: string }> {
  const parsed = updateAccentColorSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error } = await supabase
    .from("profiles")
    .update({ accent_color: parsed.data.accentColor || null })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// ─── Delete account ───────────────────────────────────────────────────────────

const deleteAccountSchema = z.object({
  confirmation: z.string().refine((v) => v === "DELETE", {
    message: 'Type "DELETE" to confirm.',
  }),
});

export async function deleteAccount(
  input: z.input<typeof deleteAccountSchema>,
): Promise<{ error?: string }> {
  const parsed = deleteAccountSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid confirmation." };

  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) return { error: "Not authenticated." };

  const { error: deleteErr } = await supabase.rpc("delete_user");
  if (deleteErr) return { error: deleteErr.message };

  await supabase.auth.signOut();
  redirect("/login");
}
