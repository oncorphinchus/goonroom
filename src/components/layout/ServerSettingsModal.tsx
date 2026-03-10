"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Camera,
  ChevronRight,
  Hash,
  Loader2,
  MessageSquareText,
  Pencil,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  updateServer,
  deleteServer,
  getServerMembers,
  getServerInvites,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/features/server/actions";
import { updateChannel } from "@/features/channel/actions";
import { requestPresignedUrl } from "@/features/media/actions";
import type { Tables } from "@/types/database";
import type { ServerMemberWithProfile } from "@/types/server";

type Tab = "overview" | "channels" | "members" | "invites" | "danger";

interface ServerSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId: string;
  serverName: string;
  serverIconUrl: string | null;
  serverBannerUrl?: string | null;
  serverDescription?: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  channels: Tables<"channels">[];
  categories: Tables<"channel_categories">[];
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({
  serverId,
  serverName,
  serverIconUrl,
  serverBannerUrl,
  serverDescription,
  onClose,
}: {
  serverId: string;
  serverName: string;
  serverIconUrl: string | null;
  serverBannerUrl: string | null;
  serverDescription: string | null;
  onClose: () => void;
}): React.ReactNode {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(serverName);
  const [description, setDescription] = useState(serverDescription ?? "");
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayIcon = iconPreview ?? serverIconUrl;
  const displayBanner = bannerPreview ?? serverBannerUrl;
  const initials = serverName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError(null);
    setIconFile(f);
    setIconPreview(URL.createObjectURL(f));
  }, []);

  const handleBannerSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please select an image file."); return; }
    if (f.size > 5 * 1024 * 1024) { setError("Image must be under 5 MB."); return; }
    setError(null);
    setBannerFile(f);
    setBannerPreview(URL.createObjectURL(f));
  }, []);

  const isDirty =
    name.trim() !== serverName ||
    description.trim() !== (serverDescription ?? "") ||
    !!iconFile ||
    !!bannerFile;

  async function handleSave(): Promise<void> {
    if (!isDirty) return;
    setSaving(true);
    setError(null);

    let newIconUrl: string | undefined;
    if (iconFile) {
      const presignResult = await requestPresignedUrl({ fileName: iconFile.name, mimeType: iconFile.type, prefix: "avatars" });
      if (presignResult.error || !presignResult.data) {
        setError(presignResult.error ?? "Failed to get upload URL.");
        toast.error(presignResult.error ?? "Failed to get upload URL.");
        setSaving(false);
        return;
      }
      const res = await fetch(presignResult.data.uploadUrl, { method: "PUT", body: iconFile, headers: { "Content-Type": iconFile.type } });
      if (!res.ok) {
        setError("Failed to upload icon.");
        toast.error("Failed to upload icon.");
        setSaving(false);
        return;
      }
      newIconUrl = presignResult.data.fileUrl;
    }

    let newBannerUrl: string | undefined;
    if (bannerFile) {
      const presignResult = await requestPresignedUrl({ fileName: bannerFile.name, mimeType: bannerFile.type, prefix: "banners" });
      if (presignResult.error || !presignResult.data) {
        setError(presignResult.error ?? "Failed to get upload URL.");
        toast.error(presignResult.error ?? "Failed to get upload URL.");
        setSaving(false);
        return;
      }
      const res = await fetch(presignResult.data.uploadUrl, { method: "PUT", body: bannerFile, headers: { "Content-Type": bannerFile.type } });
      if (!res.ok) {
        setError("Failed to upload banner.");
        toast.error("Failed to upload banner.");
        setSaving(false);
        return;
      }
      newBannerUrl = presignResult.data.fileUrl;
    }

    const result = await updateServer({
      serverId,
      name: name.trim() !== serverName ? name.trim() : undefined,
      iconUrl: newIconUrl,
      bannerUrl: newBannerUrl,
      description: description.trim() !== (serverDescription ?? "") ? (description.trim() || null) : undefined,
    });

    if (result.error) {
      setError(result.error);
      toast.error(result.error);
    } else {
      toast.success("Server updated");
      onClose();
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white">Overview</h2>

      {/* Icon upload */}
      <div className="flex items-center gap-5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="group relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#5865f2]"
        >
          {displayIcon ? (
            <Image src={displayIcon} alt="Server icon" fill className="object-cover" sizes="80px" unoptimized={!!iconPreview} />
          ) : (
            <span className="text-xl font-bold text-white select-none">{initials}</span>
          )}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-5 w-5 text-white" />
            <span className="mt-0.5 text-[10px] text-white">Change Icon</span>
          </div>
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
        <div>
          <p className="text-sm font-medium text-white">Server Icon</p>
          <p className="mt-0.5 text-xs text-[#8e9297]">Recommended: 512×512. Max 5 MB.</p>
          {iconPreview && (
            <button
              type="button"
              onClick={() => { setIconPreview(null); setIconFile(null); }}
              className="mt-1 text-xs text-[#ed4245] hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {/* Banner upload */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            className="group relative flex h-16 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#1e1f22]"
          >
            {displayBanner ? (
              <Image src={displayBanner} alt="Banner" fill className="object-cover" sizes="128px" unoptimized={!!bannerPreview} />
            ) : (
              <span className="text-xs text-[#8e9297]">No banner</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="h-4 w-4 text-white" />
            </div>
          </button>
          <input ref={bannerRef} type="file" accept="image/*" onChange={handleBannerSelect} className="hidden" />
          <div>
            <p className="text-sm font-medium text-white">Server Banner</p>
            <p className="mt-0.5 text-xs text-[#8e9297]">Shown at top of channel sidebar. Max 5 MB.</p>
            {bannerPreview && (
              <button
                type="button"
                onClick={() => { setBannerPreview(null); setBannerFile(null); }}
                className="mt-1 text-xs text-[#ed4245] hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Server name */}
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
      </div>

      {/* Server description */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
          Server Description
          <span className="ml-1 normal-case tracking-normal text-[#4f545c]">(optional)</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 500))}
          placeholder="What is this server about?"
          rows={3}
          className="w-full rounded-md bg-[#1e1f22] px-3 py-2.5 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]"
        />
        <p className="mt-0.5 text-xs text-[#8e9297]">{description.length}/500</p>
      </div>

      {error && (
        <p className="rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">{error}</p>
      )}

      {isDirty && (
        <div className="flex justify-end">
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
  );
}

// ─── Channels Tab ─────────────────────────────────────────────────────────────
function ChannelsTab({
  serverId,
  channels,
  categories: initialCategories,
}: {
  serverId: string;
  channels: Tables<"channels">[];
  categories: Tables<"channel_categories">[];
}): React.ReactNode {
  const router = useRouter();
  const [cats, setCats] = useState(initialCategories);
  const [newCatName, setNewCatName] = useState("");
  const [creatingCat, setCreatingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState("");

  async function handleCreateCategory(): Promise<void> {
    if (!newCatName.trim()) return;
    setCreatingCat(true);
    const result = await createCategory({ serverId, name: newCatName.trim() });
    if (result.error) {
      toast.error(result.error);
    } else if (result.data) {
      setCats((prev) => [...prev, result.data]);
      setNewCatName("");
      toast.success("Category created");
      router.refresh();
    }
    setCreatingCat(false);
  }

  async function handleRenameCategory(id: string): Promise<void> {
    if (!editingCatName.trim()) return;
    const result = await updateCategory({ categoryId: id, name: editingCatName.trim() });
    if (result.error) {
      toast.error(result.error);
    } else {
      setCats((prev) => prev.map((c) => c.id === id ? { ...c, name: editingCatName.trim() } : c));
      setEditingCatId(null);
      toast.success("Category renamed");
      router.refresh();
    }
  }

  async function handleDeleteCategory(id: string): Promise<void> {
    const result = await deleteCategory({ categoryId: id });
    if (result.error) {
      toast.error(result.error);
    } else {
      setCats((prev) => prev.filter((c) => c.id !== id));
      toast.success("Category deleted");
      router.refresh();
    }
  }

  async function handleAssignCategory(channelId: string, categoryId: string | null): Promise<void> {
    const result = await updateChannel({ channelId, categoryId });
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Channel updated");
      router.refresh();
    }
  }

  const uncategorized = channels.filter((c) => !c.category_id);

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white">Channels</h2>

      {/* Create category */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#b5bac1]">
          New Category
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="Category name"
            onKeyDown={(e) => { if (e.key === "Enter") void handleCreateCategory(); }}
            className="flex-1 rounded-md bg-[#1e1f22] px-3 py-2 text-sm text-white placeholder-[#4f545c] outline-none focus:ring-2 focus:ring-[#5865f2]"
          />
          <button
            type="button"
            onClick={() => void handleCreateCategory()}
            disabled={creatingCat || !newCatName.trim()}
            className="rounded-md bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
          >
            {creatingCat ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
          </button>
        </div>
      </div>

      {/* Categories */}
      {cats.length > 0 && (
        <div className="flex flex-col gap-3">
          {cats.map((cat) => (
            <div key={cat.id} className="rounded-md border border-[#3f4147] bg-[#2b2d31] p-3">
              <div className="flex items-center justify-between gap-2">
                {editingCatId === cat.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleRenameCategory(cat.id);
                        if (e.key === "Escape") setEditingCatId(null);
                      }}
                      autoFocus
                      className="flex-1 rounded bg-[#1e1f22] px-2 py-1 text-sm text-white outline-none focus:ring-1 focus:ring-[#5865f2]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleRenameCategory(cat.id)}
                      className="text-xs text-[#3ba55c] hover:underline"
                    >Save</button>
                    <button
                      type="button"
                      onClick={() => setEditingCatId(null)}
                      className="text-xs text-[#8e9297] hover:underline"
                    >Cancel</button>
                  </div>
                ) : (
                  <>
                    <span className="text-sm font-semibold uppercase tracking-wide text-[#80848e]">{cat.name}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name); }}
                        className="rounded p-1 text-[#8e9297] transition-colors hover:bg-[#404249] hover:text-white"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(cat.id)}
                        className="rounded p-1 text-[#8e9297] transition-colors hover:bg-[#ed4245]/20 hover:text-[#ed4245]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              {/* Channels in this category */}
              <div className="mt-2 space-y-1">
                {channels.filter((c) => c.category_id === cat.id).map((ch) => {
                  const Icon = ch.type === "TEXT" ? Hash : MessageSquareText;
                  return (
                    <div key={ch.id} className="flex items-center justify-between rounded px-2 py-1 text-sm text-[#8e9297]">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{ch.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleAssignCategory(ch.id, null)}
                        className="text-xs text-[#8e9297] hover:text-[#ed4245]"
                        title="Remove from category"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uncategorized channels */}
      {uncategorized.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#80848e]">Uncategorized</p>
          <div className="space-y-1">
            {uncategorized.map((ch) => {
              const Icon = ch.type === "TEXT" ? Hash : MessageSquareText;
              return (
                <div key={ch.id} className="flex items-center justify-between rounded-md bg-[#2b2d31] px-3 py-2 text-sm text-[#8e9297]">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{ch.name}</span>
                  </div>
                  {cats.length > 0 && (
                    <select
                      onChange={(e) => void handleAssignCategory(ch.id, e.target.value || null)}
                      defaultValue=""
                      className="rounded bg-[#1e1f22] px-2 py-0.5 text-xs text-[#b5bac1] outline-none"
                    >
                      <option value="">Move to category…</option>
                      {cats.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Members Tab ──────────────────────────────────────────────────────────────
function MembersTab({ serverId }: { serverId: string }): React.ReactNode {
  const [members, setMembers] = useState<ServerMemberWithProfile[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void getServerMembers(serverId).then((data) => {
      setMembers(data);
      setLoading(false);
    });
  }, [serverId]);

  const roleBadge: Record<string, string> = {
    owner: "bg-[#faa61a]/20 text-[#faa61a]",
    admin: "bg-[#5865f2]/20 text-[#5865f2]",
    member: "bg-[#3f4147] text-[#8e9297]",
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-white">Members</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#5865f2]" />
        </div>
      ) : (
        <div className="space-y-1">
          {(members ?? []).map((m) => {
            const p = m.profiles;
            const initials = (p?.username ?? "?").slice(0, 2).toUpperCase();
            return (
              <div key={m.user_id} className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-[#35373c]">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarImage src={p?.avatar_url ?? undefined} />
                  <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{p?.username ?? "Unknown"}</p>
                </div>
                <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium capitalize", roleBadge[m.role] ?? roleBadge.member)}>
                  {m.role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Invites Tab ──────────────────────────────────────────────────────────────
function InvitesTab({ serverId }: { serverId: string }): React.ReactNode {
  const [invites, setInvites] = useState<Tables<"server_invites">[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    void getServerInvites(serverId).then((data) => {
      setInvites(data);
      setLoading(false);
    });
  }, [serverId]);

  function copyInvite(code: string): void {
    void navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    toast.success("Invite link copied");
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-white">Invites</h2>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#5865f2]" />
        </div>
      ) : (invites ?? []).length === 0 ? (
        <p className="text-sm text-[#8e9297]">No active invites.</p>
      ) : (
        <div className="space-y-2">
          {(invites ?? []).map((inv) => (
            <div key={inv.id} className="flex items-center justify-between gap-3 rounded-md bg-[#2b2d31] px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-mono text-sm font-medium text-[#00aff4]">{inv.code}</p>
                <p className="mt-0.5 text-xs text-[#8e9297]">
                  {inv.uses} use{inv.uses !== 1 ? "s" : ""}
                  {inv.max_uses ? ` / ${inv.max_uses}` : ""}
                  {inv.expires_at ? ` · Expires ${new Date(inv.expires_at).toLocaleDateString()}` : " · Never expires"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyInvite(inv.code)}
                className="shrink-0 rounded px-3 py-1 text-xs font-medium text-[#b5bac1] transition-colors hover:bg-[#404249] hover:text-white"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Danger Zone Tab ──────────────────────────────────────────────────────────
function DangerZoneTab({
  serverId,
  isOwner,
  onClose,
}: {
  serverId: string;
  isOwner: boolean;
  onClose: () => void;
}): React.ReactNode {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(): Promise<void> {
    setDeleting(true);
    const result = await deleteServer({ serverId });
    if (result.error) {
      setError(result.error);
      toast.error(result.error);
      setDeleting(false);
      return;
    }
    toast.success("Server deleted");
    onClose();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold text-white">Danger Zone</h2>
      {isOwner ? (
        <div className="rounded-md border border-[#ed4245]/30 p-5">
          <div className="flex items-center gap-2 text-[#ed4245]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span className="font-semibold">Delete Server</span>
          </div>
          <p className="mt-2 text-sm text-[#8e9297]">
            This action is permanent and cannot be undone. All channels, messages, and media will be deleted.
          </p>
          {error && (
            <p className="mt-2 rounded bg-[#ed4245]/10 px-3 py-2 text-sm text-[#ed4245]">{error}</p>
          )}
          {!confirm ? (
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="mt-4 rounded-md border border-[#ed4245] px-4 py-2 text-sm font-medium text-[#ed4245] transition-colors hover:bg-[#ed4245]/10"
            >
              Delete Server
            </button>
          ) : (
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="flex items-center gap-2 rounded-md bg-[#ed4245] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c73e40] disabled:opacity-50"
              >
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Yes, delete it permanently
              </button>
              <button
                type="button"
                onClick={() => setConfirm(false)}
                className="text-sm text-[#8e9297] hover:text-white"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-[#8e9297]">Only the server owner can delete this server.</p>
      )}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function ServerSettingsModal({
  open,
  onOpenChange,
  serverId,
  serverName,
  serverIconUrl,
  serverBannerUrl,
  serverDescription,
  isOwner,
  isAdmin,
  channels,
  categories,
}: ServerSettingsModalProps): React.ReactNode {
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  if (!open) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean; ownerOnly?: boolean }[] = [
    { id: "overview", label: "Overview", icon: <Settings className="h-4 w-4" /> },
    { id: "channels", label: "Channels", icon: <Hash className="h-4 w-4" />, adminOnly: true },
    { id: "members", label: "Members", icon: <Users className="h-4 w-4" />, adminOnly: true },
    { id: "invites", label: "Invites", icon: <ChevronRight className="h-4 w-4" />, adminOnly: true },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="h-4 w-4" />, ownerOnly: true },
  ];

  const visibleTabs = tabs.filter((t) => {
    if (t.ownerOnly) return isOwner;
    if (t.adminOnly) return isAdmin;
    return true;
  });

  function close(): void {
    onOpenChange(false);
    setActiveTab("overview");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="flex h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-[#313338] shadow-2xl">
        {/* Left nav */}
        <aside className="flex w-56 shrink-0 flex-col bg-[#2b2d31] p-4">
          <p className="mb-2 truncate px-2 text-xs font-semibold uppercase tracking-wide text-[#8e9297]">
            {serverName}
          </p>
          <nav className="flex flex-col gap-0.5">
            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  activeTab === tab.id
                    ? "bg-[#404249] text-white"
                    : tab.id === "danger"
                      ? "text-[#ed4245] hover:bg-[#ed4245]/10 hover:text-[#ed4245]"
                      : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Right content */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1e1f22] px-6 py-4">
            <span className="text-sm font-semibold text-[#8e9297]">Server Settings</span>
            <button
              type="button"
              onClick={close}
              className="flex h-8 w-8 items-center justify-center rounded-full text-[#8e9297] transition-colors hover:bg-[#404249] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <OverviewTab
                serverId={serverId}
                serverName={serverName}
                serverIconUrl={serverIconUrl}
                serverBannerUrl={serverBannerUrl ?? null}
                serverDescription={serverDescription ?? null}
                onClose={close}
              />
            )}
            {activeTab === "channels" && (
              <ChannelsTab
                serverId={serverId}
                channels={channels}
                categories={categories}
              />
            )}
            {activeTab === "members" && (
              <MembersTab serverId={serverId} />
            )}
            {activeTab === "invites" && (
              <InvitesTab serverId={serverId} />
            )}
            {activeTab === "danger" && (
              <DangerZoneTab
                serverId={serverId}
                isOwner={isOwner}
                onClose={close}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Settings({ className }: { className?: string }): React.ReactNode {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
