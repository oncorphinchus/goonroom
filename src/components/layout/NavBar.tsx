"use client";

import { NavBarContent } from "./NavBarContent";
import type { Server } from "@/types/server";

interface NavBarProps {
  servers: Server[];
  activeServerId: string;
}

export function NavBar({ servers, activeServerId }: NavBarProps): React.ReactNode {
  return (
    <nav
      className="hidden md:flex w-[72px] min-w-[72px] flex-col items-center bg-[#1e1f22] py-3 gap-2"
      aria-label="Server navigation"
    >
      <NavBarContent servers={servers} activeServerId={activeServerId} />
    </nav>
  );
}
