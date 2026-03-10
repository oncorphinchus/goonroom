import type { Tables } from "@/types/database";

export type ForumPost = Tables<"forum_posts">;

export type ForumPostWithProfile = ForumPost & {
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url"> | null;
};

export const FORUM_PAGE_SIZE = 20;
