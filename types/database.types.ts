export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      invoice_items: {
        Row: {
          amount: number;
          id: string;
          invoice_id: string;
          label: string;
        };
        Insert: {
          amount?: number;
          id?: string;
          invoice_id: string;
          label: string;
        };
        Update: {
          amount?: number;
          id?: string;
          invoice_id?: string;
          label?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          created_at: string;
          due_date: string;
          electricity_amount: number;
          id: string;
          lease_id: string;
          org_id: string;
          other_fees: number;
          paid_at: string | null;
          period: string;
          rent_amount: number;
          status: string;
          total_amount: number;
          updated_at: string;
          water_amount: number;
        };
        Insert: {
          created_at?: string;
          due_date: string;
          electricity_amount?: number;
          id?: string;
          lease_id: string;
          org_id: string;
          other_fees?: number;
          paid_at?: string | null;
          period: string;
          rent_amount?: number;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          water_amount?: number;
        };
        Update: {
          created_at?: string;
          due_date?: string;
          electricity_amount?: number;
          id?: string;
          lease_id?: string;
          org_id?: string;
          other_fees?: number;
          paid_at?: string | null;
          period?: string;
          rent_amount?: number;
          status?: string;
          total_amount?: number;
          updated_at?: string;
          water_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_lease_id_fkey";
            columns: ["lease_id"];
            isOneToOne: false;
            referencedRelation: "leases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      leases: {
        Row: {
          contract_file_url: string | null;
          created_at: string;
          deposit: number;
          end_date: string | null;
          id: string;
          monthly_rent: number;
          org_id: string;
          room_id: string;
          start_date: string;
          status: string;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          contract_file_url?: string | null;
          created_at?: string;
          deposit?: number;
          end_date?: string | null;
          id?: string;
          monthly_rent?: number;
          org_id: string;
          room_id: string;
          start_date: string;
          status?: string;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          contract_file_url?: string | null;
          created_at?: string;
          deposit?: number;
          end_date?: string | null;
          id?: string;
          monthly_rent?: number;
          org_id?: string;
          room_id?: string;
          start_date?: string;
          status?: string;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leases_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leases_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leases_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          address: string | null;
          bank_account_name: string | null;
          bank_account_no: string | null;
          bank_id: string | null;
          created_at: string;
          default_electricity_price: number | null;
          default_water_price: number | null;
          id: string;
          invoice_notes: string | null;
          name: string;
          phone: string | null;
          show_qr_invoice: boolean;
          slug: string | null;
          transfer_template: string | null;
          updated_at: string;
        };
        Insert: {
          address?: string | null;
          bank_account_name?: string | null;
          bank_account_no?: string | null;
          bank_id?: string | null;
          created_at?: string;
          default_electricity_price?: number | null;
          default_water_price?: number | null;
          id?: string;
          invoice_notes?: string | null;
          name: string;
          phone?: string | null;
          show_qr_invoice?: boolean;
          slug?: string | null;
          transfer_template?: string | null;
          updated_at?: string;
        };
        Update: {
          address?: string | null;
          bank_account_name?: string | null;
          bank_account_no?: string | null;
          bank_id?: string | null;
          created_at?: string;
          default_electricity_price?: number | null;
          default_water_price?: number | null;
          id?: string;
          invoice_notes?: string | null;
          name?: string;
          phone?: string | null;
          show_qr_invoice?: boolean;
          slug?: string | null;
          transfer_template?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          full_name: string | null;
          id: string;
          org_id: string | null;
          phone: string | null;
          role: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          full_name?: string | null;
          id: string;
          org_id?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          full_name?: string | null;
          id?: string;
          org_id?: string | null;
          phone?: string | null;
          role?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      properties: {
        Row: {
          address: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          org_id: string;
          updated_at: string;
        };
        Insert: {
          address: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          org_id: string;
          updated_at?: string;
        };
        Update: {
          address?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          org_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "properties_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      rooms: {
        Row: {
          area: number | null;
          base_price: number;
          created_at: string;
          id: string;
          org_id: string;
          property_id: string;
          room_code: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          area?: number | null;
          base_price?: number;
          created_at?: string;
          id?: string;
          org_id: string;
          property_id: string;
          room_code: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          area?: number | null;
          base_price?: number;
          created_at?: string;
          id?: string;
          org_id?: string;
          property_id?: string;
          room_code?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "rooms_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rooms_property_id_fkey";
            columns: ["property_id"];
            isOneToOne: false;
            referencedRelation: "properties";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          id_card_number: string | null;
          org_id: string;
          phone: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          full_name: string;
          id?: string;
          id_card_number?: string | null;
          org_id: string;
          phone: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          id_card_number?: string | null;
          org_id?: string;
          phone?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenants_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      utility_readings: {
        Row: {
          created_at: string;
          electricity_new: number;
          electricity_old: number;
          id: string;
          org_id: string;
          period: string;
          room_id: string;
          updated_at: string;
          water_new: number;
          water_old: number;
        };
        Insert: {
          created_at?: string;
          electricity_new?: number;
          electricity_old?: number;
          id?: string;
          org_id: string;
          period: string;
          room_id: string;
          updated_at?: string;
          water_new?: number;
          water_old?: number;
        };
        Update: {
          created_at?: string;
          electricity_new?: number;
          electricity_old?: number;
          id?: string;
          org_id?: string;
          period?: string;
          room_id?: string;
          updated_at?: string;
          water_new?: number;
          water_old?: number;
        };
        Relationships: [
          {
            foreignKeyName: "utility_readings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "utility_readings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
      meter_readings: {
        Row: {
          consumption: number | null;
          created_at: string;
          id: string;
          invoice_id: string | null;
          new_value: number;
          old_value: number;
          org_id: string;
          period: string;
          reading_date: string;
          room_id: string;
          total_amount: number;
          type: "electricity" | "water";
          unit_price: number;
          updated_at: string;
        };
        Insert: {
          consumption?: number | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          new_value: number;
          old_value?: number;
          org_id: string;
          period: string;
          reading_date?: string;
          room_id: string;
          total_amount?: number;
          type: "electricity" | "water";
          unit_price?: number;
          updated_at?: string;
        };
        Update: {
          consumption?: number | null;
          created_at?: string;
          id?: string;
          invoice_id?: string | null;
          new_value?: number;
          old_value?: number;
          org_id?: string;
          period?: string;
          reading_date?: string;
          room_id?: string;
          total_amount?: number;
          type?: "electricity" | "water";
          unit_price?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meter_readings_invoice_id_fkey";
            columns: ["invoice_id"];
            isOneToOne: false;
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meter_readings_org_id_fkey";
            columns: ["org_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meter_readings_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "rooms";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_auth_org_id: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Database;

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
