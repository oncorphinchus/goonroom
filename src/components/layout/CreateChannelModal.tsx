"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, MessageSquareText } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createChannel } from "@/features/channel/actions";

interface CreateChannelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
}

type ChannelType = "TEXT" | "FORUM";

export function CreateChannelModal({
  open,
  onOpenChange,
  serverId,
}: CreateChannelModalProps): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState("");
  const [type, setType] = useState<ChannelType>("TEXT");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset(): void {
    setName("");
    setType("TEXT");
    setDescription("");
    setError(null);
  }

  async function handleCreate(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await createChannel({
      serverId,
      name: name.trim().toLowerCase().replace(/\s+/g, "-"),
      type,
      description: description.trim() || null,
    });

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    reset();
    onOpenChange(false);
    toast.success("Channel created");
    router.refresh();
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
          <DialogTitle className="text-lg font-bold">Create Channel</DialogTitle>
          <DialogDescription className="text-sm text-[#8e9297]">
            Pick a type and name for your new channel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Channel Type
            </span>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setType("TEXT")}
                className={cn(
                  "flex items-center gap-3 rounded-md p-3 transition-colors",
                  type === "TEXT"
                    ? "bg-[#404249] ring-2 ring-[#5865f2]"
                    : "bg-[#2b2d31] hover:bg-[#35373c]",
                )}
              >
                <Hash className="h-5 w-5 shrink-0 text-[#8e9297]" />
                <div className="text-left">
                  <p className="text-sm font-medium">Text</p>
                  <p className="text-xs text-[#8e9297]">Send messages, images, and more</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setType("FORUM")}
                className={cn(
                  "flex items-center gap-3 rounded-md p-3 transition-colors",
                  type === "FORUM"
                    ? "bg-[#404249] ring-2 ring-[#5865f2]"
                    : "bg-[#2b2d31] hover:bg-[#35373c]",
                )}
              >
                <MessageSquareText className="h-5 w-5 shrink-0 text-[#8e9297]" />
                <div className="text-left">
                  <p className="text-sm font-medium">Forum</p>
                  <p className="text-xs text-[#8e9297]">Threaded discussions with media galleries</p>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Channel Name
            </label>
            <div className="flex items-center gap-2 rounded-md bg-[#1e1f22] px-3 py-2">
              {type === "TEXT" ? (
                <Hash className="h-4 w-4 shrink-0 text-[#4f545c]" />
              ) : (
                <MessageSquareText className="h-4 w-4 shrink-0 text-[#4f545c]" />
              )}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="new-channel"
                required
                className="flex-1 bg-transparent text-sm text-white placeholder-[#4f545c] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Description
              <span className="ml-1 normal-case tracking-normal text-[#4f545c]">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this channel about?"
              className="w-full rounded-md bg-[#1e1f22] px-3 py-2 text-sm text-white placeholder-[#4f545c] outline-none"
            />
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
              type="submit"
              disabled={loading || !name.trim()}
              className="rounded-md bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
