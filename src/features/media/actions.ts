"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getPresignedUploadUrl } from "@/lib/s3";
import type { MediaItem } from "@/types/media";

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  prefix: z.enum(["media", "thumbnails", "avatars"]),
});

export async function requestPresignedUrl(input: {
  fileName: string;
  mimeType: string;
  prefix: "media" | "thumbnails" | "avatars";
}): Promise<
  | { data: { uploadUrl: string; fileKey: string; fileUrl: string }; error?: undefined }
  | { data?: undefined; error: string }
> {
  const parsed = presignSchema.safeParse(input);
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

  try {
    const result = await getPresignedUploadUrl(
      parsed.data.fileName,
      parsed.data.mimeType,
      parsed.data.prefix,
    );
    return { data: result };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Failed to generate upload URL",
    };
  }
}

const insertMediaSchema = z.object({
  channelId: z.string().uuid(),
  postId: z.string().uuid().nullable().optional(),
  fileName: z.string().min(1).max(255),
  fileKey: z.string().min(1),
  fileUrl: z.string().url(),
  fileSize: z.number().int().positive(),
  mimeType: z.string().regex(/^(image|video)\/[a-zA-Z0-9.+\-]+$/, "Must be an image or video MIME type"),
  thumbnailUrl: z.string().url().nullable(),
  durationSeconds: z.number().nullable(),
});

export async function insertMediaItem(
  input: z.input<typeof insertMediaSchema>,
): Promise<
  | { data: MediaItem; error?: undefined }
  | { data?: undefined; error: string }
> {
  const parsed = insertMediaSchema.safeParse(input);
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

  const { data, error } = await supabase
    .from("media_attachments")
    .insert({
      channel_id: parsed.data.channelId,
      post_id: parsed.data.postId ?? null,
      user_id: user.id,
      file_name: parsed.data.fileName,
      file_key: parsed.data.fileKey,
      file_url: parsed.data.fileUrl,
      file_size: parsed.data.fileSize,
      mime_type: parsed.data.mimeType,
      thumbnail_url: parsed.data.thumbnailUrl,
      duration_seconds: parsed.data.durationSeconds,
    })
    .select("*, profiles(id, username, avatar_url)")
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: data as MediaItem };
}
