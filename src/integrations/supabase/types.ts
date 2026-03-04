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
      daily_checklist: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          id: string
          item_key: string
          note: string | null
          protocol: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          item_key: string
          note?: string | null
          protocol: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          id?: string
          item_key?: string
          note?: string | null
          protocol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checklist_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          completed: boolean
          id: string
          muscle_groups: string
          name: string
          order_index: number
          reps: string
          rest_seconds: number
          sets: number
          weight_suggested: string | null
          workout_id: string
        }
        Insert: {
          completed?: boolean
          id?: string
          muscle_groups?: string
          name: string
          order_index?: number
          reps?: string
          rest_seconds?: number
          sets?: number
          weight_suggested?: string | null
          workout_id: string
        }
        Update: {
          completed?: boolean
          id?: string
          muscle_groups?: string
          name?: string
          order_index?: number
          reps?: string
          rest_seconds?: number
          sets?: number
          weight_suggested?: string | null
          workout_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercises_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          id: string
          professional_name: string | null
          reviewed_by_professional: boolean
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          professional_name?: string | null
          reviewed_by_professional?: boolean
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          professional_name?: string | null
          reviewed_by_professional?: boolean
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          completed: boolean
          day_of_week: number
          foods: Json
          id: string
          meal_plan_id: string
          meal_type: string
          total_calories: number
          total_carbs: number
          total_fat: number
          total_protein: number
        }
        Insert: {
          completed?: boolean
          day_of_week: number
          foods?: Json
          id?: string
          meal_plan_id: string
          meal_type: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
        }
        Update: {
          completed?: boolean
          day_of_week?: number
          foods?: Json
          id?: string
          meal_plan_id?: string
          meal_type?: string
          total_calories?: number
          total_carbs?: number
          total_fat?: number
          total_protein?: number
        }
        Relationships: [
          {
            foreignKeyName: "meals_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_records: {
        Row: {
          exercise_name: string
          id: string
          recorded_at: string
          reps: number
          user_id: string
          weight: number
        }
        Insert: {
          exercise_name: string
          id?: string
          recorded_at?: string
          reps: number
          user_id: string
          weight: number
        }
        Update: {
          exercise_name?: string
          id?: string
          recorded_at?: string
          reps?: number
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "personal_records_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cidade: string | null
          created_at: string
          dias_treino: number | null
          email: string
          equipamento: string | null
          id: string
          nivel: string | null
          nome: string
          objetivo: string | null
          onboarding_complete: boolean
          restricoes_alimentares: string | null
          streak_atual: number
          streak_maximo: number
        }
        Insert: {
          cidade?: string | null
          created_at?: string
          dias_treino?: number | null
          email?: string
          equipamento?: string | null
          id: string
          nivel?: string | null
          nome?: string
          objetivo?: string | null
          onboarding_complete?: boolean
          restricoes_alimentares?: string | null
          streak_atual?: number
          streak_maximo?: number
        }
        Update: {
          cidade?: string | null
          created_at?: string
          dias_treino?: number | null
          email?: string
          equipamento?: string | null
          id?: string
          nivel?: string | null
          nome?: string
          objetivo?: string | null
          onboarding_complete?: boolean
          restricoes_alimentares?: string | null
          streak_atual?: number
          streak_maximo?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          day_name: string
          day_of_week: number
          id: string
          status: string
          user_id: string
          week_number: number
        }
        Insert: {
          created_at?: string
          day_name?: string
          day_of_week: number
          id?: string
          status?: string
          user_id: string
          week_number: number
        }
        Update: {
          created_at?: string
          day_name?: string
          day_of_week?: number
          id?: string
          status?: string
          user_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "workouts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
