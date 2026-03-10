import type { Tables } from "@/types/database";
import type { MediaItem } from "@/types/media";

export type ReactionGroup = {
  emoji: string;
  userIds: string[];
  count: number;
};

export type ReplySnippet = {
  id: string;
  content: string;
  username: string;
};

export type MessageWithProfile = Tables<"messages"> & {
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url" | "custom_status"> | null;
  _pending?: boolean;
  _replyTo?: ReplySnippet | null;
  _reactions?: ReactionGroup[];
  _media?: MediaItem[];
};

export interface MessageGroup {
  key: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  customStatus: string | null;
  timestamp: string;
  messages: MessageWithProfile[];
}
