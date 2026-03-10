"use client";

import { useState } from "react";
import { Pencil, Check, X, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { updateUsername, updatePassword, updateEmail, deleteAccount } from "@/features/auth/actions";
import type { Tables } from "@/types/database";

interface MyAccountTabProps {
  profile: Tables<"profiles">;
  email: string;
  newEmail?: string | null;
  onUsernameUpdated: (username: string) => void;
}

function Section({ title, children }: { title: string; children: React.ReactNode }): React.ReactNode {
  return (
    <div className="mb-8">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[#80848e]">{title}</h3>
      {children}
    </div>
  );
}

function InfoRow({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: string;
  onEdit?: () => void;
}): React.ReactNode {
  return (
    <div className="flex items-center justify-between rounded-md bg-[#1e1f22] px-4 py-3">
      <div>
        <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-[#80848e]">{label}</p>
        <p className="text-sm text-[#f2f3f5]">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="rounded bg-[#4e5058] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#6d6f78]"
        >
          Edit
        </button>
      )}
    </div>
  );
}

export function MyAccountTab({ profile, email, newEmail, onUsernameUpdated }: MyAccountTabProps): React.ReactNode {
  const [editingUsername, setEditingUsername] = useState(false);
  const [usernameInput, setUsernameInput] = useState(profile.username);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [emailLoading, setEmailLoading] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleSaveUsername(): Promise<void> {
    setUsernameLoading(true);
    const result = await updateUsername({ username: usernameInput });
    setUsernameLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Username updated.");
    onUsernameUpdated(usernameInput);
    setEditingUsername(false);
  }

  async function handleSaveEmail(): Promise<void> {
    setEmailLoading(true);
    const result = await updateEmail({ newEmail: newEmailInput, password: emailPassword });
    setEmailLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Check your inbox to confirm the new email address.");
    setShowEmailForm(false);
    setNewEmailInput("");
    setEmailPassword("");
  }

  async function handleSavePassword(): Promise<void> {
    setPasswordLoading(true);
    const result = await updatePassword({ currentPassword, newPassword, confirmPassword });
    setPasswordLoading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
  }

  async function handleDeleteAccount(): Promise<void> {
    setDeleteLoading(true);
    const result = await deleteAccount({ confirmation: deleteConfirm });
    setDeleteLoading(false);
    if (result.error) {
      toast.error(result.error);
    }
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-white">My Account</h2>

      {/* Account Info */}
      <Section title="Account Info">
        <div className="space-y-2">
          {/* Username row with inline edit */}
          <div className="rounded-md bg-[#1e1f22] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-[#80848e]">
                  Username
                </p>
                {editingUsername ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => setUsernameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveUsername();
                        if (e.key === "Escape") { setEditingUsername(false); setUsernameInput(profile.username); }
                      }}
                      className="rounded bg-[#313338] px-2 py-1 text-sm text-white outline-none ring-1 ring-[#5865f2] focus:ring-2"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => void handleSaveUsername()}
                      disabled={usernameLoading}
                      className="flex h-6 w-6 items-center justify-center rounded bg-[#3ba55c] text-white transition-colors hover:bg-[#3ba55c]/80 disabled:opacity-50"
                    >
                      {usernameLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingUsername(false); setUsernameInput(profile.username); }}
                      className="flex h-6 w-6 items-center justify-center rounded bg-[#ed4245] text-white transition-colors hover:bg-[#ed4245]/80"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-[#f2f3f5]">{profile.username}</p>
                )}
              </div>
              {!editingUsername && (
                <button
                  type="button"
                  onClick={() => setEditingUsername(true)}
                  className="flex items-center gap-1.5 rounded bg-[#4e5058] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#6d6f78]"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </button>
              )}
            </div>
          </div>

          <div className="rounded-md bg-[#1e1f22] px-4 py-3">
            <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-[#80848e]">
              Email
            </p>
            {newEmail ? (
              <p className="text-sm text-[#f2f3f5]">
                {email} → <span className="text-[#3ba55c]">{newEmail}</span> (pending confirmation)
              </p>
            ) : showEmailForm ? (
              <div className="mt-2 space-y-2">
                <input
                  type="email"
                  value={newEmailInput}
                  onChange={(e) => setNewEmailInput(e.target.value)}
                  placeholder="New email address"
                  className="w-full rounded bg-[#313338] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6d6f78] focus:ring-1 focus:ring-[#5865f2]"
                />
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Current password"
                  className="w-full rounded bg-[#313338] px-3 py-2 text-sm text-white outline-none placeholder:text-[#6d6f78] focus:ring-1 focus:ring-[#5865f2]"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void handleSaveEmail()}
                    disabled={emailLoading || !newEmailInput || !emailPassword}
                    className="flex items-center gap-2 rounded bg-[#5865f2] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
                  >
                    {emailLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEmailForm(false); setNewEmailInput(""); setEmailPassword(""); }}
                    className="rounded px-4 py-1.5 text-sm font-medium text-[#8e9297] transition-colors hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#f2f3f5]">{email}</p>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(true)}
                  className="rounded bg-[#4e5058] px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-[#6d6f78]"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <InfoRow label="User ID" value={profile.id} />
          <InfoRow label="Member Since" value={memberSince} />
        </div>
      </Section>

      {/* Change Password */}
      <Section title="Password & Security">
        {!showPasswordForm ? (
          <button
            type="button"
            onClick={() => setShowPasswordForm(true)}
            className="rounded-md bg-[#4e5058] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6d6f78]"
          >
            Change Password
          </button>
        ) : (
          <div className="space-y-3 rounded-md bg-[#1e1f22] p-4">
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#80848e]">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded bg-[#313338] px-3 py-2 pr-10 text-sm text-white outline-none ring-1 ring-[#1e1f22] focus:ring-[#5865f2]"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e9297] hover:text-white"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#80848e]">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded bg-[#313338] px-3 py-2 pr-10 text-sm text-white outline-none ring-1 ring-[#1e1f22] focus:ring-[#5865f2]"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8e9297] hover:text-white"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-[#80848e]">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded bg-[#313338] px-3 py-2 text-sm text-white outline-none ring-1 ring-[#1e1f22] focus:ring-[#5865f2]"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => void handleSavePassword()}
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 rounded bg-[#5865f2] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4752c4] disabled:opacity-50"
              >
                {passwordLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Save
              </button>
              <button
                type="button"
                onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                className="rounded bg-transparent px-4 py-2 text-sm font-medium text-[#8e9297] transition-colors hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <div className="rounded-md border border-[#ed4245]/30 bg-[#ed4245]/5 p-4">
          <p className="mb-3 text-sm text-[#dcddde]">
            Permanently delete your account. This action cannot be undone.
          </p>
          {!deleteOpen ? (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-md bg-[#ed4245] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c03537]"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#ed4245]">
                Type <span className="font-bold">DELETE</span> to confirm
              </p>
              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
                className="w-full max-w-xs rounded bg-[#313338] px-3 py-2 text-sm text-white outline-none ring-1 ring-[#ed4245]/50 focus:ring-[#ed4245]"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void handleDeleteAccount()}
                  disabled={deleteConfirm !== "DELETE" || deleteLoading}
                  className="flex items-center gap-2 rounded bg-[#ed4245] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#c03537] disabled:opacity-50"
                >
                  {deleteLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                  Confirm Delete
                </button>
                <button
                  type="button"
                  onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); }}
                  className="rounded px-4 py-2 text-sm font-medium text-[#8e9297] transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}
