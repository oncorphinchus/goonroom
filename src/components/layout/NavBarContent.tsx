"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Server } from "@/types/server";

interface NavBarContentProps {
  servers: Server[];
  activeServerId: string;
}

function ServerIcon({
  server,
  active,
  index,
}: {
  server: Server;
  active: boolean;
  index: number;
}): React.ReactNode {
  const initials = server.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.4), ease: "easeOut" }}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={`/servers/${server.id}`}
            className={cn(
              "group relative flex h-12 w-12 items-center justify-center rounded-[24px] transition-all duration-200",
              "hover:rounded-[16px]",
              active
                ? "rounded-[16px] bg-[#5865f2] text-white"
                : "bg-[#313338] text-[#949ba4] hover:bg-[#5865f2] hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId="server-active-pill"
                className="absolute -left-3 h-8 w-1 rounded-r-full bg-white"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
            <span className="text-sm font-bold select-none">{initials}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="border-none bg-[#18191c] text-sm font-medium text-white"
        >
          {server.name}
        </TooltipContent>
      </Tooltip>
    </motion.div>
  );
}

export function NavBarContent({ servers, activeServerId }: NavBarContentProps): React.ReactNode {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/"
            className="mb-2 flex h-12 w-12 items-center justify-center rounded-[24px] bg-[#5865f2] text-lg font-bold text-white transition-all duration-200 hover:rounded-[16px] select-none"
          >
            G
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="border-none bg-[#18191c] text-sm font-medium text-white"
        >
          Home
        </TooltipContent>
      </Tooltip>

      <div className="mb-2 h-px w-8 bg-[#3f4147]" />

      <div className="flex flex-1 flex-col items-center gap-2 overflow-y-auto">
        {servers.map((server, i) => (
          <ServerIcon
            key={server.id}
            server={server}
            active={
              server.id === activeServerId ||
              pathname.startsWith(`/servers/${server.id}`)
            }
            index={i}
          />
        ))}
      </div>

      <div className="mt-2 h-px w-8 bg-[#3f4147]" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href="/create-server"
            className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-[#313338] text-[#3ba55c] transition-all duration-200 hover:rounded-[16px] hover:bg-[#3ba55c] hover:text-white"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          className="border-none bg-[#18191c] text-sm font-medium text-white"
        >
          Create Server
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
