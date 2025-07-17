export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          admin_user: string | null
          details: Json | null
          id: string
          target_user_id: string | null
          timestamp: string | null
        }
        Insert: {
          action: string
          admin_id: string
          admin_user?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
          timestamp?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          admin_user?: string | null
          details?: Json | null
          id?: string
          target_user_id?: string | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contests: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          entry_fee: number | null
          id: string
          max_participants: number | null
          prize_pool: number | null
          result: string | null
          sport_type: string
          start_time: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          entry_fee?: number | null
          id?: string
          max_participants?: number | null
          prize_pool?: number | null
          result?: string | null
          sport_type: string
          start_time: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          entry_fee?: number | null
          id?: string
          max_participants?: number | null
          prize_pool?: number | null
          result?: string | null
          sport_type?: string
          start_time?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          date: string
          id: string
          location: string
          name: string
          setup_instructions: string | null
          time_control: string
          tornelo_link: string | null
          zoom_link: string | null
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          location: string
          name: string
          setup_instructions?: string | null
          time_control: string
          tornelo_link?: string | null
          zoom_link?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          location?: string
          name?: string
          setup_instructions?: string | null
          time_control?: string
          tornelo_link?: string | null
          zoom_link?: string | null
        }
        Relationships: []
      }
      Events: {
        Row: {
          date: string | null
          id: string | null
          location: string | null
          name: string | null
          time_control: string | null
        }
        Insert: {
          date?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          time_control?: string | null
        }
        Update: {
          date?: string | null
          id?: string | null
          location?: string | null
          name?: string | null
          time_control?: string | null
        }
        Relationships: []
      }
      games: {
        Row: {
          black_player_id: string | null
          event_id: string
          id: string
          opponent_name: string
          rating_after: number
          rating_before: number
          result: string
          round: number | null
          timestamp: string | null
          tournament_id: string | null
          user_id: string
          white_player_id: string | null
        }
        Insert: {
          black_player_id?: string | null
          event_id: string
          id?: string
          opponent_name: string
          rating_after: number
          rating_before: number
          result: string
          round?: number | null
          timestamp?: string | null
          tournament_id?: string | null
          user_id: string
          white_player_id?: string | null
        }
        Update: {
          black_player_id?: string | null
          event_id?: string
          id?: string
          opponent_name?: string
          rating_after?: number
          rating_before?: number
          result?: string
          round?: number | null
          timestamp?: string | null
          tournament_id?: string | null
          user_id?: string
          white_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_black_player_id_fkey"
            columns: ["black_player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_white_player_id_fkey"
            columns: ["white_player_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      Games: {
        Row: {
          event_id: string | null
          id: string | null
          opponent_name: string | null
          rating_after: number | null
          rating_before: number | null
          result: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_id?: string | null
          id?: string | null
          opponent_name?: string | null
          rating_after?: number | null
          rating_before?: number | null
          result?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_id?: string | null
          id?: string | null
          opponent_name?: string | null
          rating_after?: number | null
          rating_before?: number | null
          result?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paypal_payment_id: string | null
          status: string | null
          stripe_payment_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paypal_payment_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paypal_payment_id?: string | null
          status?: string | null
          stripe_payment_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          actual_payout: number | null
          bet_amount: number
          contest_id: string
          created_at: string
          id: string
          potential_payout: number | null
          prediction_data: Json
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_payout?: number | null
          bet_amount: number
          contest_id: string
          created_at?: string
          id?: string
          potential_payout?: number | null
          prediction_data: Json
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_payout?: number | null
          bet_amount?: number
          contest_id?: string
          created_at?: string
          id?: string
          potential_payout?: number | null
          prediction_data?: Json
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictions_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean | null
          language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_admin?: boolean | null
          language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          calculation_method: string
          created_at: string
          game_id: string | null
          id: string
          k_factor: number
          new_rating: number
          old_rating: number
          rating_change: number
          tournament_id: string | null
          user_id: string
        }
        Insert: {
          calculation_method?: string
          created_at?: string
          game_id?: string | null
          id?: string
          k_factor?: number
          new_rating: number
          old_rating: number
          rating_change: number
          tournament_id?: string | null
          user_id: string
        }
        Update: {
          calculation_method?: string
          created_at?: string
          game_id?: string | null
          id?: string
          k_factor?: number
          new_rating?: number
          old_rating?: number
          rating_change?: number
          tournament_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rating_history_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_history_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rating_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          created_at: string | null
          id: string
          payment_status: string | null
          paypal_transaction_id: string | null
          stripe_session_id: string | null
          tornelo_synced: boolean | null
          tournament_id: string
          uscf_membership_purchased: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          paypal_transaction_id?: string | null
          stripe_session_id?: string | null
          tornelo_synced?: boolean | null
          tournament_id: string
          uscf_membership_purchased?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payment_status?: string | null
          paypal_transaction_id?: string | null
          stripe_session_id?: string | null
          tornelo_synced?: boolean | null
          tournament_id?: string
          uscf_membership_purchased?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tournament_registrations: {
        Row: {
          camera_overlay_confirmed: boolean | null
          current_rating: number | null
          email: string
          games_count: number | null
          id: string
          platform: string
          platform_username: string
          rating_fee_owed: number | null
          registered_at: string
          setup_completed: boolean | null
          total_paid: number | null
          tournament_id: string
          uscf_id: string | null
          uscf_membership_fee: number | null
          uscf_membership_purchased: boolean | null
          user_id: string
          zoom_joined: boolean | null
          zoom_ready: boolean | null
        }
        Insert: {
          camera_overlay_confirmed?: boolean | null
          current_rating?: number | null
          email: string
          games_count?: number | null
          id?: string
          platform: string
          platform_username: string
          rating_fee_owed?: number | null
          registered_at?: string
          setup_completed?: boolean | null
          total_paid?: number | null
          tournament_id: string
          uscf_id?: string | null
          uscf_membership_fee?: number | null
          uscf_membership_purchased?: boolean | null
          user_id: string
          zoom_joined?: boolean | null
          zoom_ready?: boolean | null
        }
        Update: {
          camera_overlay_confirmed?: boolean | null
          current_rating?: number | null
          email?: string
          games_count?: number | null
          id?: string
          platform?: string
          platform_username?: string
          rating_fee_owed?: number | null
          registered_at?: string
          setup_completed?: boolean | null
          total_paid?: number | null
          tournament_id?: string
          uscf_id?: string | null
          uscf_membership_fee?: number | null
          uscf_membership_purchased?: boolean | null
          user_id?: string
          zoom_joined?: boolean | null
          zoom_ready?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tournament_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          created_at: string | null
          date: string
          entry_fee: number | null
          id: string
          name: string
          prize_pool: number | null
          time_control: string
        }
        Insert: {
          created_at?: string | null
          date: string
          entry_fee?: number | null
          id?: string
          name: string
          prize_pool?: number | null
          time_control: string
        }
        Update: {
          created_at?: string | null
          date?: string
          entry_fee?: number | null
          id?: string
          name?: string
          prize_pool?: number | null
          time_control?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          global_speed_rating: number | null
          gscr: number | null
          id: string
          is_admin: boolean | null
          name: string
          stripe_customer_id: string | null
          updated_at: string | null
          uscf_id: number | null
          uscf_rating: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          global_speed_rating?: number | null
          gscr?: number | null
          id?: string
          is_admin?: boolean | null
          name: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          uscf_id?: number | null
          uscf_rating?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          global_speed_rating?: number | null
          gscr?: number | null
          id?: string
          is_admin?: boolean | null
          name?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
          uscf_id?: number | null
          uscf_rating?: number | null
        }
        Relationships: []
      }
      Users: {
        Row: {
          created_at: string | null
          email: string | null
          gscr: number | null
          id: string | null
          name: string | null
          stripe_id: string | null
          uscf_id: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          gscr?: number | null
          id?: string | null
          name?: string | null
          stripe_id?: string | null
          uscf_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          gscr?: number | null
          id?: string | null
          name?: string | null
          stripe_id?: string | null
          uscf_id?: number | null
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          transaction_type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          bet_points: number | null
          created_at: string
          id: string
          total_deposited: number | null
          total_withdrawn: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bet_points?: number | null
          created_at?: string
          id?: string
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bet_points?: number | null
          created_at?: string
          id?: string
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_gscr_rating: {
        Args: {
          player_rating: number
          opponent_rating: number
          game_result: string
          k_factor?: number
        }
        Returns: number
      }
      place_bet: {
        Args: {
          p_user_id: string
          p_contest_id: string
          p_prediction_data: Json
          p_bet_amount: number
        }
        Returns: string
      }
      update_wallet_balance: {
        Args: {
          p_user_id: string
          p_amount: number
          p_transaction_type: string
          p_description?: string
          p_reference_id?: string
        }
        Returns: boolean
      }
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
