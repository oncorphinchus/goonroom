"use client";

import { useEffect, useRef, useState } from "react";
import { Pin, X, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatMessageTime } from "@/lib/utils";
import { MessageMarkdown } from "./MessageMarkdown";
import { fetchPinnedMessages } from "@/features/chat/actions";
import type { MessageWithProfile } from "@/types/chat";

interface PinnedMessagesPanelProps {
  channelId: string;
  postId?: string;
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  onUnpin: (messageId: string) => void;
  onScrollToMessage: (messageId: string) => void;
}

function PinnedMessageSkeleton(): React.ReactNode {
  return (
    <div className="flex animate-pulse gap-3 rounded-md bg-[#2b2d31] p-3">
      <div className="h-8 w-8 shrink-0 rounded-full bg-[#3f4147]" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 rounded bg-[#3f4147]" />
        <div className="h-3 w-full rounded bg-[#3f4147]" />
        <div className="h-3 w-3/4 rounded bg-[#3f4147]" />
      </div>
    </div>
  );
}

export function PinnedMessagesPanel({
  channelId,
  postId,
  open,
  onClose,
  isAdmin,
  onUnpin,
  onScrollToMessage,
}: PinnedMessagesPanelProps): React.ReactNode {
  const [pinnedMessages, setPinnedMessages] = useState<MessageWithProfile[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  // dirty=true means the list needs a fresh fetch (first open, after pin/unpin, or scope change)
  const dirty = useRef(true);
  const prevScope = useRef(`${channelId}:${postId ?? ""}`);

  useEffect(() => {
    const scope = `${channelId}:${postId ?? ""}`;
    if (scope !== prevScope.current) {
      prevScope.current = scope;
      dirty.current = true;
    }
  }, [channelId, postId]);

  useEffect(() => {
    if (!open) return;
    if (!dirty.current) return;

    dirty.current = false;
    setLoading(true);
    fetchPinnedMessages({ channelId, postId })
      .then((result) => {
        if ("error" in result) {
          toast.error(result.error);
          dirty.current = true;
        } else {
          setPinnedMessages(result.data);
        }
      })
      .finally(() => setLoading(false));
  }, [open, channelId, postId]);

  function handleJump(messageId: string): void {
    onScrollToMessage(messageId);
    onClose();
  }

  function handleUnpin(messageId: string): void {
    setPinnedMessages((prev) => prev.filter((m) => m.id !== messageId));
    dirty.current = true;
    onUnpin(messageId);
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="flex w-80 flex-col border-l border-[#1e1f22] bg-[#2b2d31] p-0"
      >
        <SheetHeader className="flex flex-row items-center justify-between border-b border-[#1e1f22] px-4 py-3">
          <div className="flex items-center gap-2">
            <Pin className="h-4 w-4 text-[#faa61a]" />
            <SheetTitle className="text-sm font-semibold text-white">
              Pinned Messages
            </SheetTitle>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-[#b5bac1] transition-colors hover:bg-[#404249] hover:text-white"
            aria-label="Close pinned messages"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3">
          {loading ? (
            <>
              <PinnedMessageSkeleton />
              <PinnedMessageSkeleton />
              <PinnedMessageSkeleton />
            </>
          ) : pinnedMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Pin className="h-8 w-8 text-[#3f4147]" />
              <p className="text-sm text-[#72767d]">No pinned messages yet.</p>
              {isAdmin && (
                <p className="text-xs text-[#4e5058]">
                  Hover a message and click the pin icon to pin it.
                </p>
              )}
            </div>
          ) : (
            pinnedMessages.map((message) => {
              const username = message.profiles?.username ?? "Unknown";
              const initials = username.slice(0, 2).toUpperCase();
              return (
                <div
                  key={message.id}
                  className="group rounded-md border border-[#1e1f22] bg-[#313338] p-3 transition-colors hover:bg-[#35373c]"
                >
                  <div className="flex items-start gap-2">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage
                        src={message.profiles?.avatar_url ?? undefined}
                        alt={username}
                      />
                      <AvatarFallback className="bg-[#5865f2] text-xs font-bold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs font-semibold text-white">
                          {username}
                        </span>
                        <span className="text-[10px] text-[#72767d]">
                          {formatMessageTime(message.created_at)}
                        </span>
                      </div>
                      <div className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-[#dcddde]">
                        <MessageMarkdown content={message.content} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleJump(message.id)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#00aff4] transition-colors hover:bg-[#00aff4]/10"
                    >
                      <ArrowRight className="h-3 w-3" />
                      Jump
                    </button>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleUnpin(message.id)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-[#b5bac1] transition-colors hover:bg-[#ed4245]/10 hover:text-[#ed4245]"
                      >
                        <Pin className="h-3 w-3" />
                        Unpin
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
