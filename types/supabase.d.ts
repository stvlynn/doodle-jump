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
      leaderboard: {
        Row: {
          id: string
          TwitterID: string
          TwitterName: string
          TwitterAvatar: string
          doodleScore: number
          created_at: string
        }
        Insert: {
          id?: string
          TwitterID: string
          TwitterName: string
          TwitterAvatar: string
          doodleScore: number
          created_at?: string
        }
        Update: {
          id?: string
          TwitterID?: string
          TwitterName?: string
          TwitterAvatar?: string
          doodleScore?: number
          created_at?: string
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