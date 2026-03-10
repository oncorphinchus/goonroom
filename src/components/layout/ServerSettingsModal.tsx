"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateServer, deleteServer } from "@/features/server/actions";

interface ServerSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
  isOwner: boolean;
}

export function ServerSettingsModal({
  open,
  onOpenChange,
  serverId,
  serverName,
  isOwner,
}: ServerSettingsModalProps): React.ReactNode {
  const router = useRouter();
  const [name, setName] = useState(serverName);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(): Promise<void> {
    if (!name.trim() || name === serverName) return;
    setSaving(true);
    setError(null);

    const result = await updateServer({ serverId, name: name.trim() });
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSaving(false);
    onOpenChange(false);
    router.refresh();
  }

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    setError(null);

    const result = await deleteServer({ serverId });
    if (result.error) {
      setError(result.error);
      setDeleting(false);
      return;
    }

    setDeleting(false);
    onOpenChange(false);
    router.push("/");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setConfirmDelete(false);
          setError(null);
          setName(serverName);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="border-[#1e1f22] bg-[#313338] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Server Settings</DialogTitle>
          <DialogDescription className="text-sm text-[#8e9297]">
            Manage your server.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
              Server Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md bg-[#1e1f22] px-3 py-2.5 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]"
            />
            {name.trim() && name !== serverName && (
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-md bg-[#3ba55c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d9149] disabled:opacity-50"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            )}
          </div>

          {isOwner && (
            <div className="rounded-md border border-[#ed4245]/30 p-4">
              <div className="flex items-center gap-2 text-[#ed4245]">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="text-sm font-semibold">Danger Zone</span>
              </div>
              <p className="mt-2 text-xs text-[#8e9297]">
                Deleting a server is permanent and cannot be undone. All channels, messages, and media will be lost.
              </p>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="mt-3 rounded-md border border-[#ed4245] px-4 py-2 text-sm font-medium text-[#ed4245] transition-colors hover:bg-[#ed4245]/10"
                >
                  Delete Server
                </button>
              ) : (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={deleting}
                    className="flex items-center gap-2 rounded-md bg-[#ed4245] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c73e40] disabled:opacity-50"
                  >
                    {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    Yes, delete it
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-sm text-[#8e9297] transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">
              {error}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
