"use client";

import { useState } from "react";
import { Camera, Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { updateBio } from "@/features/auth/actions";
import { requestPresignedUrl } from "@/features/media/actions";
import { updateAvatar } from "@/features/auth/avatar";
import type { Tables } from "@/types/database";

interface ProfileTabProps {
  profile: Tables<"profiles">;
  onBioUpdated: (bio: string | null) => void;
  onAvatarUpdated: (avatarUrl: string) => void;
}

export function ProfileTab({ profile, onBioUpdated, onAvatarUpdated }: ProfileTabProps): React.ReactNode {
  const [bio, setBio] = useState(profile.bio ?? "");
  const [bioLoading, setBioLoading] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [avatarUploading, setAvatarUploading] = useState(false);

  const initials = profile.username?.slice(0, 2).toUpperCase() ?? "??";

  async function handleSaveBio(): Promise<void> {
    setBioLoading(true);
    const result = await updateBio({ bio });
    setBioLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Bio saved.");
    onBioUpdated(bio || null);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file."); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5 MB."); return; }

    setAvatarUploading(true);

    const presignResult = await requestPresignedUrl({
      fileName: file.name,
      mimeType: file.type,
      prefix: "avatars",
    });

    if (presignResult.error || !presignResult.data) {
      toast.error(presignResult.error ?? "Failed to get upload URL.");
      setAvatarUploading(false);
      return;
    }

    try {
      const res = await fetch(presignResult.data.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    } catch {
      toast.error("Failed to upload image.");
      setAvatarUploading(false);
      return;
    }

    const updateResult = await updateAvatar({ avatarUrl: presignResult.data.fileUrl });
    if (updateResult.error) {
      toast.error(updateResult.error);
      setAvatarUploading(false);
      return;
    }

    toast.success("Avatar updated.");
    setAvatarUrl(presignResult.data.fileUrl);
    onAvatarUpdated(presignResult.data.fileUrl);
    setAvatarUploading(false);
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-white">Profile</h2>

      {/* Profile preview card */}
      <div className="mb-8 overflow-hidden rounded-lg bg-[#111214]">
        <div className="h-20 bg-gradient-to-r from-[#5865f2] to-[#7289da]" />
        <div className="p-4">
          <div className="relative -mt-10 mb-3 inline-block">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-4 border-[#111214] bg-[#5865f2]">
              {avatarUrl ? (
                <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
              ) : (
                <span className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
                  {initials}
                </span>
              )}
            </div>
          </div>
          <p className="text-base font-bold text-white">{profile.username}</p>
          {bio && <p className="mt-1 text-sm text-[#8e9297]">{bio}</p>}
        </div>
      </div>

      {/* Avatar upload */}
      <div className="mb-8 rounded-md bg-[#1e1f22] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#80848e]">
          Avatar
        </h3>
        <div className="flex items-center gap-4">
          <label className="group relative flex h-16 w-16 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#5865f2]">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="64px" />
            ) : (
              <span className="text-sm font-bold text-white">{initials}</span>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              {avatarUploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-white" />
              ) : (
                <>
                  <Camera className="h-4 w-4 text-white" />
                  <span className="mt-0.5 text-[10px] text-white">Change</span>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
              disabled={avatarUploading}
            />
          </label>
          <div>
            <p className="text-sm text-[#dcddde]">Click the avatar to upload a new photo.</p>
            <p className="mt-0.5 text-xs text-[#80848e]">JPG, PNG, GIF — max 5 MB.</p>
          </div>
          {avatarUploading && (
            <div className="flex items-center gap-2 text-sm text-[#8e9297]">
              <Upload className="h-4 w-4" />
              Uploading…
            </div>
          )}
        </div>
      </div>

      {/* Bio */}
      <div className="rounded-md bg-[#1e1f22] p-4">
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#80848e]">
          About Me
        </h3>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value.slice(0, 190))}
          placeholder="Tell others a bit about yourself."
          rows={4}
          className="w-full resize-none rounded bg-[#313338] px-3 py-2 text-sm text-[#dcddde] outline-none placeholder:text-[#6d6f78] focus:ring-1 focus:ring-[#5865f2]"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className={`text-xs ${bio.length >= 180 ? "text-[#ed4245]" : "text-[#80848e]"}`}>
            {bio.length}/190
          </span>
          <button
            type="button"
            onClick={() => void handleSaveBio()}
            disabled={bioLoading}
            className="flex items-center gap-2 rounded bg-[#5865f2] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
          >
            {bioLoading && <Loader2 className="h-3 w-3 animate-spin" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
