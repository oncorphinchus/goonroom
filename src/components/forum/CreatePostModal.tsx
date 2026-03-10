"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createForumPost } from "@/features/forum/actions";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelId: string;
  serverId: string;
}

export function CreatePostModal({
  open,
  onOpenChange,
  channelId,
  serverId,
}: CreatePostModalProps): React.ReactNode {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setError(null);

    const result = await createForumPost({
      channelId,
      title: title.trim(),
      content: content.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    if (result.data) {
      toast.success("Post created");
      onOpenChange(false);
      setTitle("");
      setContent("");
      router.push(
        `/servers/${serverId}/channels/${channelId}/posts/${result.data.id}`,
      );
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-[#1e1f22] bg-[#313338] text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Create Post</DialogTitle>
          <DialogDescription className="text-[#8e9297]">
            Start a new discussion thread.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <p className="rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
              {error}
            </p>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
              required
              maxLength={300}
              className="w-full rounded-md border-none bg-[#1e1f22] px-3 py-2.5 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Message (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start the conversation..."
              rows={4}
              maxLength={4000}
              className={cn(
                "w-full resize-none rounded-md border-none bg-[#1e1f22] px-3 py-2.5 text-sm text-white",
                "placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]",
              )}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-[#b9bbbe] hover:bg-[#40444b] hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim()}
              className="bg-[#5865f2] text-white hover:bg-[#4752c4] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
