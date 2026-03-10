"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { requestPresignedUrl } from "@/features/media/actions";
import { updateAvatar } from "@/features/auth/avatar";

interface AvatarUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl: string | null;
  onAvatarUpdated: (url: string) => void;
}

export function AvatarUploadModal({
  open,
  onOpenChange,
  currentAvatarUrl,
  onAvatarUpdated,
}: AvatarUploadModalProps): React.ReactNode {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setPreview(null);
    setFile(null);
    setError(null);
  }

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (selected.size > 5 * 1024 * 1024) {
      setError("Image must be under 5 MB.");
      return;
    }

    setError(null);
    setFile(selected);
    const objectUrl = URL.createObjectURL(selected);
    setPreview(objectUrl);
  }, []);

  async function handleUpload(): Promise<void> {
    if (!file) return;
    setUploading(true);
    setError(null);

    const presignResult = await requestPresignedUrl({
      fileName: file.name,
      mimeType: file.type,
      prefix: "media",
    });

    if (presignResult.error || !presignResult.data) {
      const errMsg = presignResult.error ?? "Failed to get upload URL.";
      setError(errMsg);
      toast.error(errMsg);
      setUploading(false);
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
      setError("Failed to upload image.");
      toast.error("Failed to upload image.");
      setUploading(false);
      return;
    }

    const updateResult = await updateAvatar({ avatarUrl: presignResult.data.fileUrl });

    if (updateResult.error) {
      setError(updateResult.error);
      toast.error(updateResult.error);
      setUploading(false);
      return;
    }

    toast.success("Avatar updated");
    onAvatarUpdated(presignResult.data.fileUrl);
    setUploading(false);
    reset();
    onOpenChange(false);
  }

  const displayUrl = preview ?? currentAvatarUrl;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-[#1e1f22] bg-[#313338] text-white sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Change Avatar</DialogTitle>
          <DialogDescription className="text-sm text-[#8e9297]">
            Upload a new profile picture.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-[#5865f2]"
          >
            {displayUrl ? (
              <Image
                src={displayUrl}
                alt="Avatar preview"
                fill
                className="object-cover"
                sizes="96px"
                unoptimized={!!preview}
              />
            ) : (
              <Camera className="h-8 w-8 text-white" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Upload className="h-6 w-6 text-white" />
            </div>
          </button>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="text-sm font-medium text-[#00aff4] transition-colors hover:text-[#00aff4]/80"
          >
            Choose Image
          </button>
        </div>

        {error && (
          <p className="rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onOpenChange(false); }}
            className="rounded-md px-4 py-2 text-sm font-medium text-[#8e9297] transition-colors hover:text-white"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleUpload()}
            disabled={!file || uploading}
            className="flex items-center gap-2 rounded-md bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {uploading ? "Uploading..." : "Save"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
