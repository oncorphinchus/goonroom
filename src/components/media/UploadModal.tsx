"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  CloudUpload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Film,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatBytes } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  requestPresignedUrl,
  insertMediaItem,
} from "@/features/media/actions";
import type { MediaItem } from "@/types/media";

const MAX_FILE_SIZE = 500 * 1024 * 1024;

type FileStatus =
  | "pending"
  | "thumbnail"
  | "uploading"
  | "inserting"
  | "done"
  | "error";

interface FileEntry {
  id: string;
  file: File;
  status: FileStatus;
  progress: number;
  error: string | null;
  previewUrl: string | null;
}

interface UploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  postId?: string;
  onFileQueued: (tempId: string, fileName: string) => void;
  onFileComplete: (tempId: string, item: MediaItem) => void;
  onFileFailed: (tempId: string) => void;
}

function isImageType(mime: string): boolean {
  return mime.startsWith("image/");
}

function isVideoType(mime: string): boolean {
  return mime.startsWith("video/");
}

function isAcceptedType(mime: string): boolean {
  return isImageType(mime) || isVideoType(mime);
}

function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = (): void => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 320;
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas 2D context unavailable"));
        return;
      }

      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Thumbnail generation failed"));
        },
        "image/jpeg",
        0.8,
      );
    };

    img.onerror = (): void => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image for thumbnail"));
    };

    img.src = objectUrl;
  });
}

function getVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);

    video.onloadedmetadata = (): void => {
      URL.revokeObjectURL(url);
      const dur = Math.round(video.duration);
      resolve(Number.isFinite(dur) ? dur : null);
    };

    video.onerror = (): void => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    video.src = url;
  });
}

function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.send(body);
  });
}

function statusLabel(status: FileStatus): string {
  switch (status) {
    case "pending":
      return "Waiting…";
    case "thumbnail":
      return "Generating thumbnail…";
    case "uploading":
      return "Uploading…";
    case "inserting":
      return "Saving…";
    case "done":
      return "Complete";
    case "error":
      return "Failed";
  }
}

export function UploadModal({
  open,
  onOpenChange,
  channelId,
  postId,
  onFileQueued,
  onFileComplete,
  onFileFailed,
}: UploadModalProps): React.ReactNode {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const callbackRefs = useRef({ onFileQueued, onFileComplete, onFileFailed });
  useEffect(() => {
    callbackRefs.current = { onFileQueued, onFileComplete, onFileFailed };
  }, [onFileQueued, onFileComplete, onFileFailed]);

  const channelIdRef = useRef(channelId);
  useEffect(() => {
    channelIdRef.current = channelId;
  }, [channelId]);

  const postIdRef = useRef(postId);
  useEffect(() => {
    postIdRef.current = postId;
  }, [postId]);

  const previewUrls = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setEntries([]);
      setDragging(false);
    }
  }, [open]);

  const updateEntry = useCallback(
    (id: string, updates: Partial<Omit<FileEntry, "id" | "file">>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
    },
    [],
  );

  const processFile = useCallback(
    async (entry: FileEntry) => {
      const image = isImageType(entry.file.type);
      const video = isVideoType(entry.file.type);

      let thumbnailUrl: string | null = null;
      let durationSeconds: number | null = null;

      try {
        if (image) {
          updateEntry(entry.id, { status: "thumbnail" });
          const thumbBlob = await generateThumbnail(entry.file);

          const thumbPresign = await requestPresignedUrl({
            fileName: `thumb_${entry.file.name}`,
            mimeType: "image/jpeg",
            prefix: "thumbnails",
          });
          if (thumbPresign.error || !thumbPresign.data) {
            throw new Error(thumbPresign.error ?? "Failed to get thumbnail upload URL");
          }

          await putWithProgress(
            thumbPresign.data.uploadUrl,
            thumbBlob,
            "image/jpeg",
            () => {},
          );
          thumbnailUrl = thumbPresign.data.fileUrl;
        }

        if (video) {
          durationSeconds = await getVideoDuration(entry.file);
        }

        updateEntry(entry.id, { status: "uploading", progress: 0 });

        const presign = await requestPresignedUrl({
          fileName: entry.file.name,
          mimeType: entry.file.type,
          prefix: "media",
        });
        if (presign.error || !presign.data) {
          throw new Error(presign.error ?? "Failed to get upload URL");
        }
        const { uploadUrl, fileKey, fileUrl } = presign.data;

        await putWithProgress(
          uploadUrl,
          entry.file,
          entry.file.type,
          (pct) => updateEntry(entry.id, { progress: pct }),
        );

        updateEntry(entry.id, { status: "inserting" });

        const result = await insertMediaItem({
          channelId: channelIdRef.current,
          postId: postIdRef.current ?? null,
          fileName: entry.file.name,
          fileKey,
          fileUrl,
          fileSize: entry.file.size,
          mimeType: entry.file.type,
          thumbnailUrl,
          durationSeconds,
        });
        if (result.error || !result.data) {
          throw new Error(result.error ?? "Failed to save media item");
        }

        updateEntry(entry.id, { status: "done", progress: 100 });
        toast.success("Upload complete");
        callbackRefs.current.onFileComplete(entry.id, result.data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Upload failed";
        updateEntry(entry.id, { status: "error", error: msg });
        toast.error(msg);
        callbackRefs.current.onFileFailed(entry.id);
      }
    },
    [updateEntry],
  );

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const batch: FileEntry[] = [];

      for (const file of files) {
        const id = crypto.randomUUID();

        if (!isAcceptedType(file.type)) {
          batch.push({
            id,
            file,
            status: "error",
            progress: 0,
            error: "Unsupported file type. Only images and videos accepted.",
            previewUrl: null,
          });
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          batch.push({
            id,
            file,
            status: "error",
            progress: 0,
            error: `File too large (${formatBytes(file.size)}). Max 500 MB.`,
            previewUrl: null,
          });
          continue;
        }

        let previewUrl: string | null = null;
        if (isImageType(file.type)) {
          previewUrl = URL.createObjectURL(file);
          previewUrls.current.add(previewUrl);
        }

        batch.push({
          id,
          file,
          status: "pending",
          progress: 0,
          error: null,
          previewUrl,
        });

        callbackRefs.current.onFileQueued(id, file.name);
      }

      setEntries((prev) => [...prev, ...batch]);

      for (const entry of batch) {
        if (entry.status === "pending") {
          void processFile(entry);
        }
      }
    },
    [processFile],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        e.target.value = "";
      }
    },
    [addFiles],
  );

  const isProcessing = entries.some(
    (e) =>
      e.status === "pending" ||
      e.status === "thumbnail" ||
      e.status === "uploading" ||
      e.status === "inserting",
  );

  const doneCount = entries.filter((e) => e.status === "done").length;
  const errorCount = entries.filter((e) => e.status === "error").length;

  const handleClose = useCallback(
    (value: boolean) => {
      if (!value && isProcessing) return;
      if (!value) {
        previewUrls.current.forEach((u) => URL.revokeObjectURL(u));
        previewUrls.current.clear();
        setEntries([]);
      }
      onOpenChange(value);
    },
    [isProcessing, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-[#1e1f22] bg-[#313338] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Upload Media</DialogTitle>
          <DialogDescription className="text-[#8e9297]">
            Drag & drop files or click to browse. Images and videos up to
            500&nbsp;MB.
          </DialogDescription>
        </DialogHeader>

        {entries.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 transition-colors",
              dragging
                ? "border-[#5865f2] bg-[#5865f2]/10"
                : "border-[#4f545c] hover:border-[#8e9297] hover:bg-[#2b2d31]",
            )}
          >
            <CloudUpload
              className={cn(
                "h-12 w-12",
                dragging ? "text-[#5865f2]" : "text-[#72767d]",
              )}
            />
            <p className="text-sm text-[#b9bbbe]">
              {dragging ? "Drop files here" : "Click or drag files here"}
            </p>
            <p className="text-xs text-[#72767d]">
              Images &amp; Videos &bull; Max 500 MB each
            </p>
          </div>
        ) : (
          <div className="flex max-h-[400px] flex-col gap-2 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2",
                  entry.status === "error" ? "bg-red-500/10" : "bg-[#2b2d31]",
                )}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-[#1e1f22]">
                  {entry.previewUrl ? (
                    <Image
                      src={entry.previewUrl}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : isVideoType(entry.file.type) ? (
                    <span className="flex h-full w-full items-center justify-center">
                      <Film className="h-5 w-5 text-[#72767d]" />
                    </span>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-[#72767d]" />
                    </span>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-[#dcddde]">
                      {entry.file.name}
                    </span>
                    <span className="shrink-0 text-xs text-[#72767d]">
                      {formatBytes(entry.file.size)}
                    </span>
                  </div>

                  {entry.status === "uploading" ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-[#1e1f22]">
                        <div
                          className="h-full rounded-full bg-[#5865f2] transition-all duration-300"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-xs text-[#8e9297]">
                        {entry.progress}%
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {entry.status === "done" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                      )}
                      {entry.status === "error" && (
                        <AlertCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {entry.status !== "done" && entry.status !== "error" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#5865f2]" />
                      )}
                      <span
                        className={cn(
                          "truncate text-xs",
                          entry.status === "done" && "text-green-400",
                          entry.status === "error" && "text-red-400",
                          entry.status !== "done" &&
                            entry.status !== "error" &&
                            "text-[#8e9297]",
                        )}
                      >
                        {entry.error ?? statusLabel(entry.status)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {!isProcessing && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-[#b9bbbe] hover:bg-[#40444b] hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <CloudUpload className="mr-1.5 h-3.5 w-3.5" />
                  Add more
                </Button>
              )}
              <span className="text-xs text-[#72767d]">
                {doneCount > 0 && `${doneCount} uploaded`}
                {doneCount > 0 && errorCount > 0 && " · "}
                {errorCount > 0 && `${errorCount} failed`}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleClose(false)}
              className={cn(
                "h-8 text-xs",
                isProcessing
                  ? "text-[#4f545c]"
                  : "text-[#b9bbbe] hover:bg-[#40444b] hover:text-white",
              )}
            >
              {isProcessing ? "Uploading…" : "Done"}
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileInput}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  );
}
