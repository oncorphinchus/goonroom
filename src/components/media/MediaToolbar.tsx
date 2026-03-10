"use client";

import type { ElementType } from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  CloudUpload,
  Grid2x2,
  Grid3x3,
  HardDrive,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GridSize, MediaSort, MediaSortField } from "@/types/media";

interface MediaToolbarProps {
  totalCount: number;
  sort: MediaSort;
  gridSize: GridSize;
  onSortChange: (sort: MediaSort) => void;
  onGridSizeChange: (size: GridSize) => void;
  onUploadClick: () => void;
}

const sortOptions: { field: MediaSortField; label: string; icon: ElementType }[] = [
  { field: "created_at", label: "Upload date", icon: Calendar },
  { field: "file_size", label: "File size", icon: HardDrive },
  { field: "file_name", label: "File name", icon: ArrowDownAZ },
];

const gridOptions: { size: GridSize; label: string; icon: ElementType }[] = [
  { size: "sm", label: "Small", icon: Grid3x3 },
  { size: "md", label: "Medium", icon: Grid2x2 },
  { size: "lg", label: "Large", icon: LayoutGrid },
];

export function MediaToolbar({
  totalCount,
  sort,
  gridSize,
  onSortChange,
  onGridSizeChange,
  onUploadClick,
}: MediaToolbarProps) {
  const activeSortLabel =
    sortOptions.find((o) => o.field === sort.field)?.label ?? "Sort";

  return (
    <div className="flex items-center gap-2 border-b border-[#1e1f22] bg-[#313338] px-4 py-2">
      {/* Item count */}
      <span className="mr-auto text-xs text-[#8e9297]">
        {totalCount} {totalCount === 1 ? "item" : "items"}
      </span>

      {/* Upload button */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 text-xs text-[#b9bbbe] hover:bg-[#5865f2] hover:text-white"
        onClick={onUploadClick}
      >
        <CloudUpload className="h-3.5 w-3.5" />
        Upload
      </Button>

      {/* Sort dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-[#b9bbbe] hover:bg-[#35373c] hover:text-white"
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            {activeSortLabel}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="bg-[#18191c] border-[#3f4147]"
        >
          {sortOptions.map(({ field, label, icon: Icon }) => (
            <DropdownMenuItem
              key={field}
              onClick={() =>
                onSortChange({
                  field,
                  order:
                    sort.field === field && sort.order === "desc"
                      ? "asc"
                      : "desc",
                })
              }
              className={cn(
                "gap-2 text-[#b9bbbe] hover:bg-[#35373c] hover:text-white cursor-pointer",
                sort.field === field && "text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {sort.field === field && (
                <span className="ml-auto text-xs text-[#72767d]">
                  {sort.order === "asc" ? "↑" : "↓"}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Grid size toggle */}
      <div className="flex items-center gap-0.5 rounded-md bg-[#2b2d31] p-0.5">
        {gridOptions.map(({ size, label, icon: Icon }) => (
          <button
            key={size}
            type="button"
            title={label}
            onClick={() => onGridSizeChange(size)}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded transition-colors",
              gridSize === size
                ? "bg-[#40444b] text-white"
                : "text-[#72767d] hover:text-[#b9bbbe]"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}
