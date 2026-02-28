export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      albums: {
        Row: {
          album_type: string
          artist_id: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          reject_reason: string | null
          release_date: string | null
          slug: string
          status: string
          title: string
          total_tracks: number | null
          updated_at: string
        }
        Insert: {
          album_type?: string
          artist_id: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          reject_reason?: string | null
          release_date?: string | null
          slug: string
          status?: string
          title: string
          total_tracks?: number | null
          updated_at?: string
        }
        Update: {
          album_type?: string
          artist_id?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          reject_reason?: string | null
          release_date?: string | null
          slug?: string
          status?: string
          title?: string
          total_tracks?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "albums_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "albums_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          banner_image: string | null
          bio: string | null
          cover_image: string | null
          created_at: string
          created_by: string | null
          disbanded_year: number | null
          formed_year: number | null
          genre: string[] | null
          id: string
          is_active: boolean
          meta_description: string | null
          meta_title: string | null
          name: string
          origin: string | null
          reject_reason: string | null
          slug: string
          social_links: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          bio?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          disbanded_year?: number | null
          formed_year?: number | null
          genre?: string[] | null
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name: string
          origin?: string | null
          reject_reason?: string | null
          slug: string
          social_links?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          bio?: string | null
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          disbanded_year?: number | null
          formed_year?: number | null
          genre?: string[] | null
          id?: string
          is_active?: boolean
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          origin?: string | null
          reject_reason?: string | null
          slug?: string
          social_links?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artists_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lyric_analyses: {
        Row: {
          author_id: string | null
          background: string | null
          conclusion: string | null
          created_at: string
          id: string
          intro: string | null
          is_published: boolean
          published_at: string | null
          reject_reason: string | null
          song_id: string
          status: string
          theme: string | null
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          background?: string | null
          conclusion?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          is_published?: boolean
          published_at?: string | null
          reject_reason?: string | null
          song_id: string
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          background?: string | null
          conclusion?: string | null
          created_at?: string
          id?: string
          intro?: string | null
          is_published?: boolean
          published_at?: string | null
          reject_reason?: string | null
          song_id?: string
          status?: string
          theme?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyric_analyses_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lyric_analyses_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: true
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
        ]
      }
      lyric_highlights: {
        Row: {
          color_tag: string
          created_at: string
          end_index: number | null
          highlight_type: string | null
          id: string
          meaning: string
          order_index: number
          phrase: string
          section_id: string
          start_index: number | null
        }
        Insert: {
          color_tag?: string
          created_at?: string
          end_index?: number | null
          highlight_type?: string | null
          id?: string
          meaning: string
          order_index?: number
          phrase: string
          section_id: string
          start_index?: number | null
        }
        Update: {
          color_tag?: string
          created_at?: string
          end_index?: number | null
          highlight_type?: string | null
          id?: string
          meaning?: string
          order_index?: number
          phrase?: string
          section_id?: string
          start_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lyric_highlights_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "lyric_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      lyric_sections: {
        Row: {
          analysis_id: string
          content: string
          created_at: string
          id: string
          order_index: number
          section_label: string
          section_type: string
          updated_at: string
        }
        Insert: {
          analysis_id: string
          content: string
          created_at?: string
          id?: string
          order_index?: number
          section_label: string
          section_type: string
          updated_at?: string
        }
        Update: {
          analysis_id?: string
          content?: string
          created_at?: string
          id?: string
          order_index?: number
          section_label?: string
          section_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lyric_sections_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "lyric_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      song_tags: {
        Row: {
          song_id: string
          tag_id: string
        }
        Insert: {
          song_id: string
          tag_id: string
        }
        Update: {
          song_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_tags_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "songs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      songs: {
        Row: {
          album_id: string | null
          artist_id: string
          cover_image: string | null
          created_at: string
          created_by: string | null
          duration_sec: number | null
          id: string
          is_published: boolean
          language: string
          meta_description: string | null
          meta_title: string | null
          og_image: string | null
          published_at: string | null
          reject_reason: string | null
          release_date: string | null
          slug: string
          spotify_track_id: string | null
          status: string
          title: string
          updated_at: string
          view_count: number
          youtube_url: string | null
        }
        Insert: {
          album_id?: string | null
          artist_id: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec?: number | null
          id?: string
          is_published?: boolean
          language?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          reject_reason?: string | null
          release_date?: string | null
          slug: string
          spotify_track_id?: string | null
          status?: string
          title: string
          updated_at?: string
          view_count?: number
          youtube_url?: string | null
        }
        Update: {
          album_id?: string | null
          artist_id?: string
          cover_image?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec?: number | null
          id?: string
          is_published?: boolean
          language?: string
          meta_description?: string | null
          meta_title?: string | null
          og_image?: string | null
          published_at?: string | null
          reject_reason?: string | null
          release_date?: string | null
          slug?: string
          spotify_track_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "songs_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "songs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_song_view:
        | { Args: { song_id: string }; Returns: undefined }
        | { Args: { song_slug: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
