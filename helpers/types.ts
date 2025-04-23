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
      contact_emails: {
        Row: {
          contact_id: number
          created_at: string
          email: string
          id: number
          updated_at: string
        }
        Insert: {
          contact_id: number
          created_at?: string
          email: string
          id: number
          updated_at?: string
        }
        Update: {
          contact_id?: number
          created_at?: string
          email?: string
          id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_emails_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: number
          is_primary: boolean
          lead_id: number
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: number
          is_primary?: boolean
          lead_id: number
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: number
          is_primary?: boolean
          lead_id?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string
          bounce_reason: string | null
          bounced_at: string | null
          created_at: string
          id: number
          lead_id: number
          loi_path: string | null
          opened_at: string | null
          replied_at: string | null
          sender_id: number
          sent_at: string | null
          status: string
          subject: string
          tracking_id: string
          updated_at: string
        }
        Insert: {
          body: string
          bounce_reason?: string | null
          bounced_at?: string | null
          created_at?: string
          id: number
          lead_id: number
          loi_path?: string | null
          opened_at?: string | null
          replied_at?: string | null
          sender_id: number
          sent_at?: string | null
          status?: string
          subject: string
          tracking_id: string
          updated_at?: string
        }
        Update: {
          body?: string
          bounce_reason?: string | null
          bounced_at?: string | null
          created_at?: string
          id?: number
          lead_id?: number
          loi_path?: string | null
          opened_at?: string | null
          replied_at?: string | null
          sender_id?: number
          sent_at?: string | null
          status?: string
          subject?: string
          tracking_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "senders"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          file_name: string
          id: number
          is_active: boolean
          last_imported: string
          name: string
          record_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          id: number
          is_active?: boolean
          last_imported: string
          name: string
          record_count: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          id?: number
          is_active?: boolean
          last_imported?: string
          name?: string
          record_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: number
          source_id: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          source_id?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          source_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_source"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      oauth_tokens: {
        Row: {
          access_token: string
          created_at: string
          email: string
          expiry_date: number
          id: number
          refresh_token: string
          scope: string
          token_type: string
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          email: string
          expiry_date: number
          id: number
          refresh_token: string
          scope: string
          token_type: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          email?: string
          expiry_date?: number
          id?: number
          refresh_token?: string
          scope?: string
          token_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      senders: {
        Row: {
          created_at: string
          daily_quota: number
          email: string
          emails_sent: number
          id: number
          last_sent_at: string | null
          name: string
          oauth_token: string
          refresh_token: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_quota?: number
          email: string
          emails_sent?: number
          id: number
          last_sent_at?: string | null
          name: string
          oauth_token: string
          refresh_token: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_quota?: number
          email?: string
          emails_sent?: number
          id?: number
          last_sent_at?: string | null
          name?: string
          oauth_token?: string
          refresh_token?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      template_variables: {
        Row: {
          created_at: string
          id: number
          name: string
          template_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: number
          name: string
          template_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          template_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "template_variables_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string
          created_at: string
          id: number
          name: string
          subject: string | null
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id: number
          name: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          name?: string
          subject?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
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

export interface Lead {
  id: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  wholesale_value: number;
  market_value: number;
  days_on_market: number;
  mls_status: string;
  mls_list_date?: Date;
  mls_list_price?: number;
  status: string;
  source_id?: string;
  contacts?: Contact[];
  created_at: Date;
  updated_at: Date;
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  lead_id: string;
  is_primary: boolean;
  created_at: Date;
  updated_at: Date;
}
