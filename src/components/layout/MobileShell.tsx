"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface MobileShellProps {
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function MobileShell({
  navbar,
  sidebar,
  children,
}: MobileShellProps): React.ReactNode {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile header — visible only below md */}
      <div className="flex md:hidden h-12 shrink-0 items-center gap-2 border-b border-[#1e1f22] bg-[#2b2d31] px-3">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-[#8e9297] transition-colors hover:bg-[#35373c] hover:text-white"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-white">GoonRoom</span>
      </div>

      {/* Mobile sheet drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex w-[calc(72px+240px)] max-w-[85vw] gap-0 border-none bg-[#1e1f22] p-0"
        >
          <VisuallyHidden.Root>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden.Root>
          <div className="flex h-full w-[72px] min-w-[72px] flex-col items-center bg-[#1e1f22] py-3 gap-2">
            {navbar}
          </div>
          <div
            className="flex-1 overflow-hidden"
            onClick={() => setOpen(false)}
            onKeyDown={(e) => { if (e.key === "Enter") setOpen(false); }}
            role="presentation"
          >
            {sidebar}
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
    </>
  );
}
