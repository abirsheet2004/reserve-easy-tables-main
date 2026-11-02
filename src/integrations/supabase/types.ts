export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17";
  };
  public: {
    Tables: {
      favourite_tables: {
        Row: {
          created_at: string;
          id: string;
          table_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          table_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          table_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "favourite_tables_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          is_read: boolean;
          message: string;
          reservation_id: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Insert: {
          channel?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message: string;
          reservation_id?: string | null;
          title: string;
          type: Database["public"]["Enums"]["notification_type"];
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          is_read?: boolean;
          message?: string;
          reservation_id?: string | null;
          title?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_reservation_id_fkey";
            columns: ["reservation_id"];
            isOneToOne: false;
            referencedRelation: "reservations";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          allergies: string | null;
          created_at: string;
          dietary_preferences: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          is_vip: boolean;
          loyalty_points: number;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          allergies?: string | null;
          created_at?: string;
          dietary_preferences?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          is_vip?: boolean;
          loyalty_points?: number;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          allergies?: string | null;
          created_at?: string;
          dietary_preferences?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          is_vip?: boolean;
          loyalty_points?: number;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      reservations: {
        Row: {
          created_at: string;
          customer_id: string;
          ends_at: string;
          guest_email: string | null;
          guest_name: string;
          guest_phone: string | null;
          id: string;
          party_size: number;
          special_requests: string | null;
          starts_at: string;
          status: Database["public"]["Enums"]["reservation_status"];
          table_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          ends_at: string;
          guest_email?: string | null;
          guest_name: string;
          guest_phone?: string | null;
          id?: string;
          party_size: number;
          special_requests?: string | null;
          starts_at: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          table_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          ends_at?: string;
          guest_email?: string | null;
          guest_name?: string;
          guest_phone?: string | null;
          id?: string;
          party_size?: number;
          special_requests?: string | null;
          starts_at?: string;
          status?: Database["public"]["Enums"]["reservation_status"];
          table_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reservations_table_id_fkey";
            columns: ["table_id"];
            isOneToOne: false;
            referencedRelation: "restaurant_tables";
            referencedColumns: ["id"];
          },
        ];
      };
      restaurant_tables: {
        Row: {
          capacity: number;
          category: Database["public"]["Enums"]["table_category"];
          created_at: string;
          id: string;
          label: string;
          notes: string | null;
          position_x: number;
          position_y: number;
          status: Database["public"]["Enums"]["table_status"];
          updated_at: string;
        };
        Insert: {
          capacity: number;
          category?: Database["public"]["Enums"]["table_category"];
          created_at?: string;
          id?: string;
          label: string;
          notes?: string | null;
          position_x?: number;
          position_y?: number;
          status?: Database["public"]["Enums"]["table_status"];
          updated_at?: string;
        };
        Update: {
          capacity?: number;
          category?: Database["public"]["Enums"]["table_category"];
          created_at?: string;
          id?: string;
          label?: string;
          notes?: string | null;
          position_x?: number;
          position_y?: number;
          status?: Database["public"]["Enums"]["table_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_reservation_alerts: { Args: never; Returns: undefined };
      find_available_tables: {
        Args: {
          _category?: Database["public"]["Enums"]["table_category"];
          _ends_at: string;
          _exclude_reservation_id?: string;
          _party_size: number;
          _starts_at: string;
        };
        Returns: {
          capacity: number;
          category: Database["public"]["Enums"]["table_category"];
          created_at: string;
          id: string;
          label: string;
          notes: string | null;
          position_x: number;
          position_y: number;
          status: Database["public"]["Enums"]["table_status"];
          updated_at: string;
        }[];
        SetofOptions: {
          from: "*";
          to: "restaurant_tables";
          isOneToOne: false;
          isSetofReturn: true;
        };
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_staff: { Args: { _user_id: string }; Returns: boolean };
      table_bookings_between: {
        Args: { _from: string; _to: string };
        Returns: {
          ends_at: string;
          starts_at: string;
          table_id: string;
        }[];
      };
    };
    Enums: {
      app_role: "admin" | "manager" | "staff" | "customer";
      notification_type:
        | "reservation_created"
        | "reservation_confirmed"
        | "reservation_cancelled"
        | "reservation_modified"
        | "reservation_reminder"
        | "seating_alert"
        | "table_assigned";
      reservation_status:
        "pending" | "confirmed" | "seated" | "completed" | "cancelled" | "no_show";
      table_category: "window" | "vip" | "family" | "outdoor" | "standard";
      table_status: "available" | "reserved" | "occupied" | "cleaning" | "maintenance";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "staff", "customer"],
      notification_type: [
        "reservation_created",
        "reservation_confirmed",
        "reservation_cancelled",
        "reservation_modified",
        "reservation_reminder",
        "seating_alert",
        "table_assigned",
      ],
      reservation_status: ["pending", "confirmed", "seated", "completed", "cancelled", "no_show"],
      table_category: ["window", "vip", "family", "outdoor", "standard"],
      table_status: ["available", "reserved", "occupied", "cleaning", "maintenance"],
    },
  },
} as const;
