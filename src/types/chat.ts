import type { Tables } from "@/types/database";

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
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url"> | null;
  _pending?: boolean;
  _replyTo?: ReplySnippet | null;
  _reactions?: ReactionGroup[];
};

export interface MessageGroup {
  key: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  timestamp: string;
  messages: MessageWithProfile[];
}
