"use client";

import { ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface NSFWAgeGateModalProps {
  open: boolean;
  channelName: string;
  onConfirm: () => void;
  onDecline: () => void;
}

export function NSFWAgeGateModal({
  open,
  channelName,
  onConfirm,
  onDecline,
}: NSFWAgeGateModalProps): React.ReactNode {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onDecline(); }}>
      <DialogContent className="border-[#1e1f22] bg-[#313338] text-white sm:max-w-sm">
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ed4245]/10">
            <ShieldAlert className="h-8 w-8 text-[#ed4245]" />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Age-Restricted Channel</h2>
            <p className="mt-1 text-sm text-[#8e9297]">
              <span className="font-semibold text-[#ed4245]"># {channelName}</span> is marked as
              NSFW (18+). You must be 18 or older to view this content.
            </p>
          </div>

          <p className="text-xs text-[#4f545c]">
            By continuing, you confirm you are at least 18 years of age.
          </p>

          <div className="flex w-full flex-col gap-2">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full rounded-md bg-[#ed4245] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#c03537]"
            >
              I am 18 or older — Continue
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="w-full rounded-md px-4 py-2.5 text-sm font-medium text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-white"
            >
              Go Back
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
