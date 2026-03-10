export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          position: number;
          created_at: string;
          server_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          server_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          position?: number;
          created_at?: string;
          server_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "channels_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
        ];
      };
      forum_posts: {
        Row: {
          id: string;
          channel_id: string;
          title: string;
          user_id: string;
          pinned: boolean;
          locked: boolean;
          reply_count: number;
          last_activity_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          channel_id: string;
          title: string;
          user_id: string;
          pinned?: boolean;
          locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          channel_id?: string;
          title?: string;
          user_id?: string;
          pinned?: boolean;
          locked?: boolean;
          reply_count?: number;
          last_activity_at?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "forum_posts_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "forum_posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      media_attachments: {
        Row: {
          id: string;
          channel_id: string;
          message_id: string | null;
          user_id: string;
          file_url: string;
          file_key: string;
          thumbnail_url: string | null;
          file_name: string;
          file_size: number;
          mime_type: string;
          duration_seconds: number | null;
          created_at: string;
          post_id: string | null;
        };
        Insert: {
          id?: string;
          channel_id: string;
          message_id?: string | null;
          user_id: string;
          file_url: string;
          file_key: string;
          thumbnail_url?: string | null;
          file_name: string;
          file_size: number;
          mime_type: string;
          duration_seconds?: number | null;
          created_at?: string;
          post_id?: string | null;
        };
        Update: {
          id?: string;
          channel_id?: string;
          message_id?: string | null;
          user_id?: string;
          file_url?: string;
          file_key?: string;
          thumbnail_url?: string | null;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          duration_seconds?: number | null;
          created_at?: string;
          post_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_attachments_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_attachments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      message_reactions: {
        Row: {
          id: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at: string;
          channel_id: string;
        };
        Insert: {
          id?: string;
          message_id: string;
          user_id: string;
          emoji: string;
          created_at?: string;
          channel_id: string;
        };
        Update: {
          id?: string;
          message_id?: string;
          user_id?: string;
          emoji?: string;
          created_at?: string;
          channel_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey";
            columns: ["message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "message_reactions_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at: string;
          post_id: string | null;
          edited_at: string | null;
          reply_to_id: string | null;
          pinned: boolean;
        };
        Insert: {
          id?: string;
          channel_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          post_id?: string | null;
          edited_at?: string | null;
          reply_to_id?: string | null;
          pinned?: boolean;
        };
        Update: {
          id?: string;
          channel_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
          post_id?: string | null;
          edited_at?: string | null;
          reply_to_id?: string | null;
          pinned?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      server_invites: {
        Row: {
          id: string;
          server_id: string;
          code: string;
          created_by: string;
          expires_at: string | null;
          max_uses: number | null;
          uses: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          server_id: string;
          code: string;
          created_by: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          server_id?: string;
          code?: string;
          created_by?: string;
          expires_at?: string | null;
          max_uses?: number | null;
          uses?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "server_invites_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "server_invites_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      server_members: {
        Row: {
          server_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          server_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          server_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "server_members_server_id_fkey";
            columns: ["server_id"];
            isOneToOne: false;
            referencedRelation: "servers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "server_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      servers: {
        Row: {
          id: string;
          name: string;
          icon_url: string | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          icon_url?: string | null;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          icon_url?: string | null;
          owner_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "servers_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_server_role: {
        Args: {
          target_server_id: string;
        };
        Returns: string;
      };
      is_server_member: {
        Args: {
          target_server_id: string;
        };
        Returns: boolean;
      };
      increment_invite_uses: {
        Args: {
          p_invite_id: string;
        };
        Returns: undefined;
      };
      delete_user: {
        Args: Record<string, never>;
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
