"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NSFWAgeGateModal } from "./NSFWAgeGateModal";
import type { Tables } from "@/types/database";

interface ChannelPageContentProps {
  channel: Tables<"channels">;
  children: React.ReactNode;
}

export function ChannelPageContent({
  channel,
  children,
}: ChannelPageContentProps): React.ReactNode {
  const router = useRouter();
  const [gateOpen, setGateOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!channel.nsfw) {
      setConfirmed(true);
      return;
    }
    const key = `nsfw-${channel.id}`;
    if (typeof window !== "undefined" && sessionStorage.getItem(key)) {
      setConfirmed(true);
    } else {
      setGateOpen(true);
    }
  }, [channel.id, channel.nsfw]);

  function handleConfirm(): void {
    sessionStorage.setItem(`nsfw-${channel.id}`, "1");
    setGateOpen(false);
    setConfirmed(true);
  }

  function handleDecline(): void {
    setGateOpen(false);
    router.back();
  }

  if (!confirmed) {
    return (
      <NSFWAgeGateModal
        open={gateOpen}
        channelName={channel.name}
        onConfirm={handleConfirm}
        onDecline={handleDecline}
      />
    );
  }

  return <>{children}</>;
}
