"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateChannel } from "@/features/channel/actions";
import type { Tables } from "@/types/database";

interface EditChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channel: Tables<"channels">;
  onSaved: () => void;
}

export function EditChannelModal({
  open,
  onOpenChange,
  channel,
  onSaved,
}: EditChannelModalProps): React.ReactNode {
  const [name, setName] = useState(channel.name);
  const [description, setDescription] = useState(channel.description ?? "");
  const [nsfw, setNsfw] = useState(channel.nsfw ?? false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setName(channel.name);
    setDescription(channel.description ?? "");
    setNsfw(channel.nsfw ?? false);
    setError(null);
  }

  async function handleSave(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await updateChannel({
      channelId: channel.id,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      description: description.trim() || null,
      nsfw,
    });

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
    toast.success("Channel updated");
    onSaved();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-[#1e1f22] bg-[#313338] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Edit Channel</DialogTitle>
          <DialogDescription className="text-sm text-[#8e9297]">
            Update the name, topic, or settings for this channel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Channel Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="channel-name"
              required
              className="w-full rounded-md bg-[#1e1f22] px-3 py-2 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-1 focus:ring-[#5865f2]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Channel Topic
              <span className="ml-1 normal-case tracking-normal text-[#4f545c]">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              placeholder="Let everyone know how to use this channel!"
              className="w-full rounded-md bg-[#1e1f22] px-3 py-2 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-1 focus:ring-[#5865f2]"
            />
            <p className="mt-1 text-right text-xs text-[#4f545c]">
              {description.length}/500
            </p>
          </div>

          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={nsfw}
              onChange={(e) => setNsfw(e.target.checked)}
              className="h-4 w-4 rounded border-[#4f545c] bg-[#1e1f22] accent-[#5865f2]"
            />
            <span className="text-sm text-[#dcddde]">NSFW channel (age-restricted)</span>
          </label>

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
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-md bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
