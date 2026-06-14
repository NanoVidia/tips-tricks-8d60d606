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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          category: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          category?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      app_translations: {
        Row: {
          ar: string
          category: string
          context: string | null
          en: string
          id: string
          key: string
          updated_at: string
        }
        Insert: {
          ar: string
          category?: string
          context?: string | null
          en: string
          id?: string
          key: string
          updated_at?: string
        }
        Update: {
          ar?: string
          category?: string
          context?: string | null
          en?: string
          id?: string
          key?: string
          updated_at?: string
        }
        Relationships: []
      }
      case_of_the_day: {
        Row: {
          active: boolean
          answer: string
          body: string
          case_date: string
          created_at: string
          id: string
          references_list: string[]
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer: string
          body: string
          case_date: string
          created_at?: string
          id?: string
          references_list?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer?: string
          body?: string
          case_date?: string
          created_at?: string
          id?: string
          references_list?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams_meta: {
        Row: {
          active: boolean
          authority: string
          country: string
          country_code: string
          created_at: string
          display_order: number
          duration: string
          exam_id: string
          exam_name: string
          fee_usd: string
          flag: string
          format: string
          id: string
          level: string
          notes: string | null
          official_url: string
          pass_mark: string
          platform: string
          questions: number
          refs: string[]
          register_url: string
          syllabus: string[]
          updated_at: string
          validity_years: string
        }
        Insert: {
          active?: boolean
          authority: string
          country: string
          country_code: string
          created_at?: string
          display_order?: number
          duration: string
          exam_id: string
          exam_name: string
          fee_usd: string
          flag: string
          format: string
          id?: string
          level: string
          notes?: string | null
          official_url: string
          pass_mark: string
          platform: string
          questions: number
          refs?: string[]
          register_url: string
          syllabus?: string[]
          updated_at?: string
          validity_years: string
        }
        Update: {
          active?: boolean
          authority?: string
          country?: string
          country_code?: string
          created_at?: string
          display_order?: number
          duration?: string
          exam_id?: string
          exam_name?: string
          fee_usd?: string
          flag?: string
          format?: string
          id?: string
          level?: string
          notes?: string | null
          official_url?: string
          pass_mark?: string
          platform?: string
          questions?: number
          refs?: string[]
          register_url?: string
          syllabus?: string[]
          updated_at?: string
          validity_years?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          active: boolean
          color: string | null
          created_at: string
          display_order: number
          icon: string | null
          id: string
          link: string | null
          slot: string
          subtitle_ar: string | null
          subtitle_en: string | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          link?: string | null
          slot: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string | null
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          link?: string | null
          slot?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      mcq_questions: {
        Row: {
          active: boolean
          answer_index: number
          created_at: string
          difficulty: string
          exams: string[]
          explanation: string
          external_id: string | null
          id: string
          options: string[]
          reference: string | null
          stem: string
          topic: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          answer_index: number
          created_at?: string
          difficulty?: string
          exams?: string[]
          explanation: string
          external_id?: string | null
          id?: string
          options: string[]
          reference?: string | null
          stem: string
          topic: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          answer_index?: number
          created_at?: string
          difficulty?: string
          exams?: string[]
          explanation?: string
          external_id?: string | null
          id?: string
          options?: string[]
          reference?: string | null
          stem?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      medical_scenarios: {
        Row: {
          action_ar: string
          action_en: string
          category: Database["public"]["Enums"]["scenario_category"]
          created_at: string
          id: string
          script_ar: string
          script_en: string
          situation_ar: string
          situation_en: string
          synonyms: string[] | null
          title_ar: string
          title_en: string
          updated_at: string
        }
        Insert: {
          action_ar: string
          action_en: string
          category: Database["public"]["Enums"]["scenario_category"]
          created_at?: string
          id?: string
          script_ar: string
          script_en: string
          situation_ar: string
          situation_en: string
          synonyms?: string[] | null
          title_ar: string
          title_en: string
          updated_at?: string
        }
        Update: {
          action_ar?: string
          action_en?: string
          category?: Database["public"]["Enums"]["scenario_category"]
          created_at?: string
          id?: string
          script_ar?: string
          script_en?: string
          situation_ar?: string
          situation_en?: string
          synonyms?: string[] | null
          title_ar?: string
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          notification_type: number | null
          order_id: string | null
          processed: boolean
          product_id: string | null
          purchase_token: string | null
          raw_payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          notification_type?: number | null
          order_id?: string | null
          processed?: boolean
          product_id?: string | null
          purchase_token?: string | null
          raw_payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          notification_type?: number | null
          order_id?: string | null
          processed?: boolean
          product_id?: string | null
          purchase_token?: string | null
          raw_payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      scheduled_notifications: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          repeat_pattern: string
          scheduled_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          repeat_pattern?: string
          scheduled_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          repeat_pattern?: string
          scheduled_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renewing: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          last_verified_at: string | null
          order_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          product_id: string | null
          purchase_token: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auto_renewing?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_verified_at?: string | null
          order_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          product_id?: string | null
          purchase_token?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auto_renewing?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          last_verified_at?: string | null
          order_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          product_id?: string | null
          purchase_token?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      surgeries: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string | null
          difficulty: number
          display_order: number
          external_id: string | null
          id: string
          mcqs: Json
          name_ar: string | null
          name_en: string
          pearls: string[]
          references_list: string[]
          steps: Json
          updated_at: string
          video_id: string | null
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description?: string | null
          difficulty?: number
          display_order?: number
          external_id?: string | null
          id?: string
          mcqs?: Json
          name_ar?: string | null
          name_en: string
          pearls?: string[]
          references_list?: string[]
          steps?: Json
          updated_at?: string
          video_id?: string | null
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string | null
          difficulty?: number
          display_order?: number
          external_id?: string | null
          id?: string
          mcqs?: Json
          name_ar?: string | null
          name_en?: string
          pearls?: string[]
          references_list?: string[]
          steps?: Json
          updated_at?: string
          video_id?: string | null
        }
        Relationships: []
      }
      tools_ddx: {
        Row: {
          active: boolean
          created_at: string
          differentials: string[]
          display_order: number
          id: string
          presentation: string
          red_flags: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          differentials?: string[]
          display_order?: number
          id?: string
          presentation: string
          red_flags?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          differentials?: string[]
          display_order?: number
          id?: string
          presentation?: string
          red_flags?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tools_drugs: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          lactation: string
          name: string
          notes: string | null
          trimester: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          lactation: string
          name: string
          notes?: string | null
          trimester: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          lactation?: string
          name?: string
          notes?: string | null
          trimester?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools_guidelines: {
        Row: {
          active: boolean
          color: string
          created_at: string
          display_order: number
          id: string
          items: string[]
          region: string
          society: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          items?: string[]
          region: string
          society: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          items?: string[]
          region?: string
          society?: string
          updated_at?: string
        }
        Relationships: []
      }
      tools_protocols: {
        Row: {
          active: boolean
          color: string
          created_at: string
          display_order: number
          external_id: string | null
          id: string
          steps: string[]
          targets: string | null
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          external_id?: string | null
          id?: string
          steps?: string[]
          targets?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          display_order?: number
          external_id?: string | null
          id?: string
          steps?: string[]
          targets?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      trial_starts: {
        Row: {
          created_at: string
          device_id: string | null
          ends_at: string
          id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          ends_at: string
          id?: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string | null
          ends_at?: string
          id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_admin_sessions: { Args: never; Returns: undefined }
      has_active_access: { Args: { _user_id: string }; Returns: boolean }
      search_scenarios: {
        Args: {
          category_filter?: Database["public"]["Enums"]["scenario_category"]
          search_query: string
        }
        Returns: {
          action_ar: string
          action_en: string
          category: Database["public"]["Enums"]["scenario_category"]
          created_at: string
          id: string
          script_ar: string
          script_en: string
          situation_ar: string
          situation_en: string
          synonyms: string[] | null
          title_ar: string
          title_en: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "medical_scenarios"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      scenario_category: "clinic" | "or_labor" | "behavior" | "qa"
      subscription_plan: "monthly" | "yearly" | "lifetime"
      subscription_status:
        | "trial"
        | "active"
        | "expired"
        | "cancelled"
        | "on_hold"
        | "paused"
        | "refunded"
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
    Enums: {
      scenario_category: ["clinic", "or_labor", "behavior", "qa"],
      subscription_plan: ["monthly", "yearly", "lifetime"],
      subscription_status: [
        "trial",
        "active",
        "expired",
        "cancelled",
        "on_hold",
        "paused",
        "refunded",
      ],
    },
  },
} as const
