"use client";

import { useState } from "react";
import { ArrowLeft, User, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MyAccountTab } from "./MyAccountTab";
import { ProfileTab } from "./ProfileTab";
import type { Tables } from "@/types/database";

type SettingsTab = "account" | "profile";

interface SettingsShellProps {
  profile: Tables<"profiles">;
  email: string;
  newEmail?: string | null;
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "account", label: "My Account", icon: <User className="h-4 w-4" /> },
  { id: "profile", label: "Profile", icon: <Shield className="h-4 w-4" /> },
];

export function SettingsShell({ profile, email, newEmail }: SettingsShellProps): React.ReactNode {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");
  const [currentProfile, setCurrentProfile] = useState(profile);

  return (
    <div className="flex h-screen w-full bg-[#313338] text-[#dcddde]">
      {/* Left sidebar */}
      <div className="flex w-[240px] shrink-0 flex-col bg-[#2b2d31] pt-14 pl-4 pr-2">
        <nav className="flex flex-col gap-0.5">
          <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-[#80848e]">
            User Settings
          </p>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-[#404249] text-white"
                  : "text-[#8e9297] hover:bg-[#35373c] hover:text-[#dcddde]",
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto pb-6">
          <div className="my-2 h-px bg-[#1e1f22]" />
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-[#dcddde]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex flex-1 justify-center overflow-y-auto">
        <div className="w-full max-w-2xl px-10 py-14">
          {activeTab === "account" && (
            <MyAccountTab
              profile={currentProfile}
              email={email}
              newEmail={newEmail}
              onUsernameUpdated={(username) =>
                setCurrentProfile((p) => ({ ...p, username }))
              }
            />
          )}
          {activeTab === "profile" && (
            <ProfileTab
              profile={currentProfile}
              onBioUpdated={(bio) => setCurrentProfile((p) => ({ ...p, bio }))}
              onAvatarUpdated={(avatar_url) =>
                setCurrentProfile((p) => ({ ...p, avatar_url }))
              }
              onCustomStatusUpdated={(custom_status) =>
                setCurrentProfile((p) => ({ ...p, custom_status }))
              }
              onBannerUpdated={(banner_url) =>
                setCurrentProfile((p) => ({ ...p, banner_url }))
              }
              onAccentColorUpdated={(accent_color) =>
                setCurrentProfile((p) => ({ ...p, accent_color }))
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
