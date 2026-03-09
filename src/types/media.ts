import type { Tables } from "@/types/database";

export type MediaItem = Tables<"media_attachments"> & {
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url"> | null;
};

export type MediaSortField = "created_at" | "file_size" | "file_name";
export type MediaSortOrder = "asc" | "desc";

export interface MediaSort {
  field: MediaSortField;
  order: MediaSortOrder;
}

export type GridSize = "sm" | "md" | "lg";

export const GRID_COLUMNS: Record<GridSize, string> = {
  sm: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8",
  md: "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  lg: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
};

export const PAGE_SIZE = 40;
