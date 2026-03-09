import type { Tables } from "@/types/database";

export type MessageWithProfile = Tables<"messages"> & {
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url"> | null;
  _pending?: boolean;
};

export interface MessageGroup {
  key: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  timestamp: string;
  messages: MessageWithProfile[];
}
