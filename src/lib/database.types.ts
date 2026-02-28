export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ❌ Ganti dari:
// export interface Database {

// ✅ Menjadi:
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id:         string
          username:   string
          full_name:  string | null
          avatar_url: string | null
          role:       'admin' | 'author'
          bio:        string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id:          string
          username:    string
          full_name?:  string | null
          avatar_url?: string | null
          role?:       'admin' | 'author'
          bio?:        string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?:         string
          username?:   string
          full_name?:  string | null
          avatar_url?: string | null
          role?:       'admin' | 'author'
          bio?:        string | null
          created_at?: string
          updated_at?: string
        }
      }
      tags: {
        Row: {
          id:         string
          name:       string
          slug:       string
          color:      string
          created_at: string
        }
        Insert: {
          id?:         string
          name:        string
          slug:        string
          color?:      string
          created_at?: string
        }
        Update: {
          id?:         string
          name?:       string
          slug?:       string
          color?:      string
          created_at?: string
        }
      }
      artists: {
        Row: {
          id:               string
          name:             string
          slug:             string
          bio:              string | null
          origin:           string | null
          formed_year:      number | null
          disbanded_year:   number | null
          genre:            string[]
          cover_image:      string | null
          banner_image:     string | null
          social_links:     Json
          meta_title:       string | null
          meta_description: string | null
          is_active:        boolean
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          name:              string
          slug:              string
          bio?:              string | null
          origin?:           string | null
          formed_year?:      number | null
          disbanded_year?:   number | null
          genre?:            string[]
          cover_image?:      string | null
          banner_image?:     string | null
          social_links?:     Json
          meta_title?:       string | null
          meta_description?: string | null
          is_active?:        boolean
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: {
          id?:               string
          name?:             string
          slug?:             string
          bio?:              string | null
          origin?:           string | null
          formed_year?:      number | null
          disbanded_year?:   number | null
          genre?:            string[]
          cover_image?:      string | null
          banner_image?:     string | null
          social_links?:     Json
          meta_title?:       string | null
          meta_description?: string | null
          is_active?:        boolean
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
      }
      albums: {
        Row: {
          id:               string
          artist_id:        string
          title:            string
          slug:             string
          release_date:     string | null
          cover_image:      string | null
          description:      string | null
          album_type:       'album' | 'ep' | 'single' | 'compilation' | 'live'
          total_tracks:     number | null
          meta_title:       string | null
          meta_description: string | null
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          artist_id:         string
          title:             string
          slug:              string
          release_date?:     string | null
          cover_image?:      string | null
          description?:      string | null
          album_type?:       'album' | 'ep' | 'single' | 'compilation' | 'live'
          total_tracks?:     number | null
          meta_title?:       string | null
          meta_description?: string | null
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: {
          id?:               string
          artist_id?:        string
          title?:            string
          slug?:             string
          release_date?:     string | null
          cover_image?:      string | null
          description?:      string | null
          album_type?:       'album' | 'ep' | 'single' | 'compilation' | 'live'
          total_tracks?:     number | null
          meta_title?:       string | null
          meta_description?: string | null
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
      }
      songs: {
        Row: {
          id:               string
          artist_id:        string
          album_id:         string | null
          title:            string
          slug:             string
          spotify_track_id: string | null
          youtube_url:      string | null
          release_date:     string | null
          duration_sec:     number | null
          cover_image:      string | null
          language:         string
          view_count:       number
          is_published:     boolean
          published_at:     string | null
          meta_title:       string | null
          meta_description: string | null
          og_image:         string | null
          created_by:       string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:               string
          artist_id:         string
          album_id?:         string | null
          title:             string
          slug:              string
          spotify_track_id?: string | null
          youtube_url?:      string | null
          release_date?:     string | null
          duration_sec?:     number | null
          cover_image?:      string | null
          language?:         string
          view_count?:       number
          is_published?:     boolean
          published_at?:     string | null
          meta_title?:       string | null
          meta_description?: string | null
          og_image?:         string | null
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
        Update: {
          id?:               string
          artist_id?:        string
          album_id?:         string | null
          title?:            string
          slug?:             string
          spotify_track_id?: string | null
          youtube_url?:      string | null
          release_date?:     string | null
          duration_sec?:     number | null
          cover_image?:      string | null
          language?:         string
          view_count?:       number
          is_published?:     boolean
          published_at?:     string | null
          meta_title?:       string | null
          meta_description?: string | null
          og_image?:         string | null
          created_by?:       string | null
          created_at?:       string
          updated_at?:       string
        }
      }
      song_tags: {
        Row: {
          song_id: string
          tag_id:  string
        }
        Insert: {
          song_id: string
          tag_id:  string
        }
        Update: {
          song_id?: string
          tag_id?:  string
        }
      }
      lyric_analyses: {
        Row: {
          id:           string
          song_id:      string
          author_id:    string | null
          intro:        string | null
          theme:        string | null
          background:   string | null
          conclusion:   string | null
          is_published: boolean
          published_at: string | null
          created_at:   string
          updated_at:   string
        }
        Insert: {
          id?:           string
          song_id:       string
          author_id?:    string | null
          intro?:        string | null
          theme?:        string | null
          background?:   string | null
          conclusion?:   string | null
          is_published?: boolean
          published_at?: string | null
          created_at?:   string
          updated_at?:   string
        }
        Update: {
          id?:           string
          song_id?:      string
          author_id?:    string | null
          intro?:        string | null
          theme?:        string | null
          background?:   string | null
          conclusion?:   string | null
          is_published?: boolean
          published_at?: string | null
          created_at?:   string
          updated_at?:   string
        }
      }
      lyric_sections: {
        Row: {
          id:            string
          analysis_id:   string
          section_type:  string
          section_label: string
          content:       string
          order_index:   number
          created_at:    string
          updated_at:    string
        }
        Insert: {
          id?:            string
          analysis_id:    string
          section_type:   string
          section_label:  string
          content:        string
          order_index?:   number
          created_at?:    string
          updated_at?:    string
        }
        Update: {
          id?:            string
          analysis_id?:   string
          section_type?:  string
          section_label?: string
          content?:       string
          order_index?:   number
          created_at?:    string
          updated_at?:    string
        }
      }
      lyric_highlights: {
        Row: {
          id:             string
          section_id:     string
          phrase:         string
          meaning:        string
          start_index:    number
          end_index:      number
          color_tag:      string | null
          highlight_type: string | null
          order_index:    number
          created_at:     string
        }
        Insert: {
          id?:             string
          section_id:      string
          phrase:          string
          meaning:         string
          start_index:     number
          end_index:       number
          color_tag?:      string | null
          highlight_type?: string | null
          order_index?:    number
          created_at?:     string
        }
        Update: {
          id?:             string
          section_id?:     string
          phrase?:         string
          meaning?:        string
          start_index?:    number
          end_index?:      number
          color_tag?:      string | null
          highlight_type?: string | null
          order_index?:    number
          created_at?:     string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_song_view: {
        Args: {
          song_slug: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}