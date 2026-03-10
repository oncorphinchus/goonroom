"use client";

import { useRef, useState } from "react";
import { Send, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { sendMessage } from "@/features/chat/actions";

interface MessageInputProps {
  channelId: string;
  postId?: string;
  channelName: string;
  onOptimisticSend: (content: string) => void;
  onOptimisticFail: (content: string) => void;
  onUploadClick?: () => void;
}

const MAX_HEIGHT_PX = 200;

export function MessageInput({
  channelId,
  postId,
  channelName,
  onOptimisticSend,
  onOptimisticFail,
  onUploadClick,
}: MessageInputProps): React.ReactNode {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_HEIGHT_PX)}px`;
  };

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setError(null);
    setContent("");
    resetTextareaHeight();
    textareaRef.current?.focus();

    onOptimisticSend(trimmed);

    const result = await sendMessage({ channelId, postId, content: trimmed });

    if (result?.error) {
      onOptimisticFail(trimmed);
      setError(result.error);
      setContent(trimmed);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(
          textareaRef.current.scrollHeight,
          MAX_HEIGHT_PX
        )}px`;
      }
    }

    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  return (
    <div className="shrink-0 px-4 pb-6 pt-2">
      {error && (
        <p className="mb-1.5 text-xs text-[#ed4245]" role="alert">
          {error}
        </p>
      )}

      <div
        className={cn(
          "flex items-end gap-2 rounded-lg bg-[#40444b] px-3 py-2.5",
          "transition-shadow focus-within:shadow-[0_0_0_2px_rgba(88,101,242,0.4)]"
        )}
      >
        {onUploadClick && (
          <button
            type="button"
            onClick={onUploadClick}
            aria-label="Upload file"
            className={cn(
              "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
              "text-[#b5bac1] transition-colors",
              "hover:text-[#dcddde] hover:bg-[#35373c]",
            )}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Message #${channelName}`}
          rows={1}
          disabled={isSending}
          aria-label={`Message #${channelName}`}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm text-[#dcddde]",
            "placeholder:text-[#72767d] outline-none",
            "overflow-y-auto leading-5",
            "disabled:opacity-60"
          )}
          style={{ maxHeight: `${MAX_HEIGHT_PX}px` }}
        />

        <button
          type="button"
          onClick={() => void handleSend()}
          disabled={!content.trim() || isSending}
          aria-label="Send message"
          className={cn(
            "mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded",
            "text-[#72767d] transition-colors",
            "hover:text-[#dcddde]",
            "disabled:cursor-not-allowed disabled:opacity-40"
          )}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1 text-xs text-[#4f545c]">
        Enter to send&nbsp;&nbsp;·&nbsp;&nbsp;Shift + Enter for newline
      </p>
    </div>
  );
}
