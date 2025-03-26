export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_spotify_auth: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          settings?: string | null
          created_at?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: number
          settings?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: number
          settings?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 