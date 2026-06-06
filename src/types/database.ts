export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          birth_date: string | null
          height_cm: number | null
          weight_kg: number | null
          gender: 'male' | 'female' | 'other' | 'prefer_not' | null
          level: 'beginner' | 'intermediate' | 'advanced'
          goal: 'performance' | 'health' | 'weight_loss' | 'muscle_gain' | 'endurance'
          sports: string[]
          is_premium: boolean
          lang: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string }
        Update: Partial<Database['public']['Tables']['profiles']['Row']>
      }
      strength_sessions: {
        Row: {
          id: string
          user_id: string
          name: string
          notes: string | null
          duration_minutes: number | null
          session_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['strength_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['strength_sessions']['Row']>
      }
      strength_sets: {
        Row: {
          id: string
          session_id: string
          user_id: string
          exercise: string
          set_number: number
          reps: number | null
          weight_kg: number | null
          rpe: number | null
          notes: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['strength_sets']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['strength_sets']['Row']>
      }
      endurance_sessions: {
        Row: {
          id: string
          user_id: string
          sport: 'running' | 'cycling' | 'swimming' | 'rowing' | 'other'
          duration_minutes: number
          distance_km: number | null
          avg_pace_sec: number | null
          avg_speed_kmh: number | null
          avg_hr: number | null
          max_hr: number | null
          elevation_m: number | null
          notes: string | null
          session_date: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['endurance_sessions']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['endurance_sessions']['Row']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type StrengthSession = Database['public']['Tables']['strength_sessions']['Row']
export type StrengthSet = Database['public']['Tables']['strength_sets']['Row']
export type EnduranceSession = Database['public']['Tables']['endurance_sessions']['Row']
