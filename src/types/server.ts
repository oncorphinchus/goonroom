import type { Tables } from "@/types/database";

export type Server = Tables<"servers">;
export type ServerMember = Tables<"server_members">;
export type ServerInvite = Tables<"server_invites">;

export type ServerMemberWithProfile = ServerMember & {
  profiles: Pick<Tables<"profiles">, "id" | "username" | "avatar_url"> | null;
};
