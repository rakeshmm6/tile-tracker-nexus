export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          boxes_on_hand: number
          brand: string
          price_per_sqft: number
          product_id: number
          tile_height: number
          tile_width: number
          tiles_per_box: number
        }
        Insert: {
          boxes_on_hand: number
          brand: string
          price_per_sqft: number
          product_id?: number
          tile_height: number
          tile_width: number
          tiles_per_box: number
        }
        Update: {
          boxes_on_hand?: number
          brand?: string
          price_per_sqft?: number
          product_id?: number
          tile_height?: number
          tile_width?: number
          tiles_per_box?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          boxes_sold: number
          item_id: number
          order_id: string
          price_per_sqft: number
          product_id: number
        }
        Insert: {
          boxes_sold: number
          item_id?: number
          order_id: string
          price_per_sqft: number
          product_id: number
        }
        Update: {
          boxes_sold?: number
          item_id?: number
          order_id?: string
          price_per_sqft?: number
          product_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["order_id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["product_id"]
          },
        ]
      }
      orders: {
        Row: {
          client_address: string
          client_gst: string | null
          client_name: string
          client_phone: string
          eway_bill: string | null
          hsn_code: string
          is_reverse_charge: boolean
          order_date: string
          order_id: string
          state_code: string
          vehicle_no: string | null
        }
        Insert: {
          client_address: string
          client_gst?: string | null
          client_name: string
          client_phone: string
          eway_bill?: string | null
          hsn_code: string
          is_reverse_charge?: boolean
          order_date?: string
          order_id?: string
          state_code: string
          vehicle_no?: string | null
        }
        Update: {
          client_address?: string
          client_gst?: string | null
          client_name?: string
          client_phone?: string
          eway_bill?: string | null
          hsn_code?: string
          is_reverse_charge?: boolean
          order_date?: string
          order_id?: string
          state_code?: string
          vehicle_no?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          role: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      inventory_in: {
        Row: {
          id: number;
          truck_number: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          truck_number: string;
          date: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          truck_number?: string;
          date?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      inventory_in_products: {
        Row: {
          id: number;
          inventory_in_id: number;
          product_id: number;
          quantity: number;
        };
        Insert: {
          id?: number;
          inventory_in_id: number;
          product_id: number;
          quantity: number;
        };
        Update: {
          id?: number;
          inventory_in_id?: number;
          product_id?: number;
          quantity?: number;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_in_products_inventory_in_id_fkey",
            columns: ["inventory_in_id"],
            isOneToOne: false,
            referencedRelation: "inventory_in",
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_in_products_product_id_fkey",
            columns: ["product_id"],
            isOneToOne: false,
            referencedRelation: "inventory",
            referencedColumns: ["product_id"]
          }
        ];
      };
      ledger_entries: {
        Row: {
          id: number;
          order_id: string | null;
          client_name: string | null;
          total_amount: number;
          products: any | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          order_id?: string | null;
          client_name?: string | null;
          total_amount: number;
          products?: any | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          order_id?: string | null;
          client_name?: string | null;
          total_amount?: number;
          products?: any | null;
          created_at?: string;
        };
        Relationships: [];
      };
      ledger_payments: {
        Row: {
          id: number;
          ledger_entry_id: number;
          payment_type: string;
          amount: number;
          payment_date: string;
          note: string | null;
        };
        Insert: {
          id?: number;
          ledger_entry_id: number;
          payment_type: string;
          amount: number;
          payment_date?: string;
          note?: string | null;
        };
        Update: {
          id?: number;
          ledger_entry_id?: number;
          payment_type?: string;
          amount?: number;
          payment_date?: string;
          note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ledger_payments_ledger_entry_id_fkey",
            columns: ["ledger_entry_id"],
            isOneToOne: false,
            referencedRelation: "ledger_entries",
            referencedColumns: ["id"]
          }
        ];
      };
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
