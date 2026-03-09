"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, Images, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", icon: MessageSquare, label: "Channels" },
  { href: "/media", icon: Images, label: "Media Gallery" },
];

interface NavItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              "group relative flex h-12 w-12 items-center justify-center rounded-[24px] transition-all duration-200",
              "hover:rounded-[16px]",
              active
                ? "rounded-[16px] bg-[#5865f2] text-white"
                : "bg-[#313338] text-[#949ba4] hover:bg-[#5865f2] hover:text-white"
            )}
          >
            {active && (
              <span className="absolute -left-3 h-8 w-1 rounded-r-full bg-white" />
            )}
            <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-[#18191c] text-white border-none text-sm font-medium">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav
      className="flex w-[72px] min-w-[72px] flex-col items-center bg-[#1e1f22] py-3 gap-2"
      aria-label="Main navigation"
    >
      {/* App icon pill */}
      <Link
        href="/"
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-[24px] bg-[#5865f2] text-white font-bold text-lg hover:rounded-[16px] transition-all duration-200 select-none"
      >
        G
      </Link>

      <div className="w-8 h-px bg-[#3f4147] mb-2" />

      <div className="flex flex-col items-center gap-1">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={
              item.href === "/"
                ? pathname === "/" || pathname.startsWith("/channels")
                : pathname.startsWith(item.href)
            }
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-[#313338] text-[#949ba4] transition-all duration-200 hover:rounded-[16px] hover:bg-[#5865f2] hover:text-white"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#18191c] text-white border-none text-sm font-medium">
              Settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </nav>
  );
}
