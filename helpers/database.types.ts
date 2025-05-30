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
      campaign_leads: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          bounced_at: string | null
          campaign_id: string
          clicked_at: string | null
          converted_at: string | null
          created_at: string
          id: string
          lead_id: string
          opened_at: string | null
          replied_at: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          bounced_at?: string | null
          campaign_id: string
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          bounced_at?: string | null
          campaign_id?: string
          clicked_at?: string | null
          converted_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          opened_at?: string | null
          replied_at?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_leads_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_senders: {
        Row: {
          campaign_id: string
          created_at: string
          daily_quota: number | null
          emails_sent_today: number | null
          id: string
          sender_id: string
          total_emails_sent: number | null
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          daily_quota?: number | null
          emails_sent_today?: number | null
          id?: string
          sender_id: string
          total_emails_sent?: number | null
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          daily_quota?: number | null
          emails_sent_today?: number | null
          id?: string
          sender_id?: string
          total_emails_sent?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_senders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          attachment_type: string | null
          company_logo_path: string | null
          created_at: string
          description: string | null
          email_body: string | null
          email_subject: string | null
          email_template_id: string | null
          end_time: string | null
          id: string
          lead_source_id: string | null
          leads_per_day: number
          leads_worked: number | null
          loi_template_id: string | null
          max_interval_minutes: number | null
          min_interval_minutes: number | null
          name: string
          start_time: string | null
          status: string
          total_leads: number | null
          tracking_enabled: boolean | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attachment_type?: string | null
          company_logo_path?: string | null
          created_at?: string
          description?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          end_time?: string | null
          id?: string
          lead_source_id?: string | null
          leads_per_day?: number
          leads_worked?: number | null
          loi_template_id?: string | null
          max_interval_minutes?: number | null
          min_interval_minutes?: number | null
          name: string
          start_time?: string | null
          status?: string
          total_leads?: number | null
          tracking_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attachment_type?: string | null
          company_logo_path?: string | null
          created_at?: string
          description?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          end_time?: string | null
          id?: string
          lead_source_id?: string | null
          leads_per_day?: number
          leads_worked?: number | null
          loi_template_id?: string | null
          max_interval_minutes?: number | null
          min_interval_minutes?: number | null
          name?: string
          start_time?: string | null
          status?: string
          total_leads?: number | null
          tracking_enabled?: boolean | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_lead_source"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      console_log_events: {
        Row: {
          created_at: string | null
          id: string
          message: string
          timestamp: number
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          timestamp?: number
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          timestamp?: number
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      lead_sources: {
        Row: {
          created_at: string
          description: string | null
          file_name: string | null
          id: string
          is_active: boolean | null
          last_imported: string | null
          metadata: Json | null
          name: string
          record_count: number | null
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          is_active?: boolean | null
          last_imported?: string | null
          metadata?: Json | null
          name: string
          record_count?: number | null
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string | null
          id?: string
          is_active?: boolean | null
          last_imported?: string | null
          metadata?: Json | null
          name?: string
          record_count?: number | null
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          address_hash: string | null
          air_conditioning: string | null
          airconditioning: string | null
          assessed_total: string | null
          assessed_year: string | null
          assigned_to: string | null
          avm: string | null
          basement: string | null
          baths: string | null
          beds: string | null
          condition: string | null
          contact1_email_1: string | null
          contact1_email_2: string | null
          contact1_email_3: string | null
          contact1_name: string | null
          contact1_phone_1: string | null
          contact1_phone_1_dnc: string | null
          contact1_phone_1_litigator: string | null
          contact1_phone_1_type: string | null
          contact1_phone_2: string | null
          contact1_phone_2_dnc: string | null
          contact1_phone_2_litigator: string | null
          contact1_phone_2_type: string | null
          contact1_phone_3: string | null
          contact1_phone_3_dnc: string | null
          contact1_phone_3_litigator: string | null
          contact1_phone_3_type: string | null
          contact2_email_1: string | null
          contact2_email_2: string | null
          contact2_email_3: string | null
          contact2_name: string | null
          contact2_phone_1: string | null
          contact2_phone_1_dnc: string | null
          contact2_phone_1_litigator: string | null
          contact2_phone_1_type: string | null
          contact2_phone_2: string | null
          contact2_phone_2_dnc: string | null
          contact2_phone_2_litigator: string | null
          contact2_phone_2_type: string | null
          contact2_phone_3: string | null
          contact2_phone_3_dnc: string | null
          contact2_phone_3_litigator: string | null
          contact2_phone_3_type: string | null
          contact3_email_1: string | null
          contact3_email_2: string | null
          contact3_email_3: string | null
          contact3_name: string | null
          contact3_phone_1: string | null
          contact3_phone_1_dnc: string | null
          contact3_phone_1_litigator: string | null
          contact3_phone_1_type: string | null
          contact3_phone_2: string | null
          contact3_phone_2_dnc: string | null
          contact3_phone_2_litigator: string | null
          contact3_phone_2_type: string | null
          contact3_phone_3: string | null
          contact3_phone_3_dnc: string | null
          contact3_phone_3_litigator: string | null
          contact3_phone_3_type: string | null
          county: string | null
          created_at: string
          exterior: string | null
          fireplace: string | null
          first_name: string | null
          garage: string | null
          heating: string | null
          heating_fuel: string | null
          house_style: string | null
          id: string
          interior_walls: string | null
          last_contacted_at: string | null
          last_name: string | null
          last_sales_date: string | null
          last_sales_price: string | null
          lead_source_id: string | null
          location_influence: string | null
          lot_size_sqft: string | null
          market_value: string | null
          mls_curr_basement: string | null
          mls_curr_baths: string | null
          mls_curr_beds: string | null
          mls_curr_days_on_market: string | null
          mls_curr_description: string | null
          mls_curr_garage: string | null
          mls_curr_list_agent_email: string | null
          mls_curr_list_agent_name: string | null
          mls_curr_list_agent_office: string | null
          mls_curr_list_agent_phone: string | null
          mls_curr_list_date: string | null
          mls_curr_list_price: string | null
          mls_curr_listing_id: string | null
          mls_curr_lot: string | null
          mls_curr_photos: string | null
          mls_curr_price_per_sqft: string | null
          mls_curr_sale_price: string | null
          mls_curr_sold_date: string | null
          mls_curr_source: string | null
          mls_curr_sqft: string | null
          mls_curr_status: string | null
          mls_curr_stories: string | null
          mls_curr_year_built: string | null
          mls_prev_basement: string | null
          mls_prev_baths: string | null
          mls_prev_beds: string | null
          mls_prev_days_on_market: string | null
          mls_prev_description: string | null
          mls_prev_garage: string | null
          mls_prev_list_agent_email: string | null
          mls_prev_list_agent_name: string | null
          mls_prev_list_agent_office: string | null
          mls_prev_list_agent_phone: string | null
          mls_prev_list_date: string | null
          mls_prev_list_price: string | null
          mls_prev_listing_id: string | null
          mls_prev_lot: string | null
          mls_prev_photos: string | null
          mls_prev_price_per_sqft: string | null
          mls_prev_sale_price: string | null
          mls_prev_sold_date: string | null
          mls_prev_source: string | null
          mls_prev_sqft: string | null
          mls_prev_status: string | null
          mls_prev_stories: string | null
          mls_prev_year_built: string | null
          notes: string | null
          owner_type: string | null
          patio: string | null
          pool: string | null
          porch: string | null
          price_per_sqft: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          raw_lead_id: string | null
          raw_lead_table: string | null
          recipient_address: string | null
          recipient_city: string | null
          recipient_postal_code: string | null
          recipient_state: string | null
          rental_estimate_high: string | null
          rental_estimate_low: string | null
          roof: string | null
          roof_shape: string | null
          school_district: string | null
          sewer: string | null
          source_id: string | null
          square_footage: string | null
          status: string
          stories: string | null
          subdivision: string | null
          tax_amount: string | null
          units: string | null
          updated_at: string
          water: string | null
          wholesale_value: string | null
          year_built: string | null
          zoning: string | null
        }
        Insert: {
          address_hash?: string | null
          air_conditioning?: string | null
          airconditioning?: string | null
          assessed_total?: string | null
          assessed_year?: string | null
          assigned_to?: string | null
          avm?: string | null
          basement?: string | null
          baths?: string | null
          beds?: string | null
          condition?: string | null
          contact1_email_1?: string | null
          contact1_email_2?: string | null
          contact1_email_3?: string | null
          contact1_name?: string | null
          contact1_phone_1?: string | null
          contact1_phone_1_dnc?: string | null
          contact1_phone_1_litigator?: string | null
          contact1_phone_1_type?: string | null
          contact1_phone_2?: string | null
          contact1_phone_2_dnc?: string | null
          contact1_phone_2_litigator?: string | null
          contact1_phone_2_type?: string | null
          contact1_phone_3?: string | null
          contact1_phone_3_dnc?: string | null
          contact1_phone_3_litigator?: string | null
          contact1_phone_3_type?: string | null
          contact2_email_1?: string | null
          contact2_email_2?: string | null
          contact2_email_3?: string | null
          contact2_name?: string | null
          contact2_phone_1?: string | null
          contact2_phone_1_dnc?: string | null
          contact2_phone_1_litigator?: string | null
          contact2_phone_1_type?: string | null
          contact2_phone_2?: string | null
          contact2_phone_2_dnc?: string | null
          contact2_phone_2_litigator?: string | null
          contact2_phone_2_type?: string | null
          contact2_phone_3?: string | null
          contact2_phone_3_dnc?: string | null
          contact2_phone_3_litigator?: string | null
          contact2_phone_3_type?: string | null
          contact3_email_1?: string | null
          contact3_email_2?: string | null
          contact3_email_3?: string | null
          contact3_name?: string | null
          contact3_phone_1?: string | null
          contact3_phone_1_dnc?: string | null
          contact3_phone_1_litigator?: string | null
          contact3_phone_1_type?: string | null
          contact3_phone_2?: string | null
          contact3_phone_2_dnc?: string | null
          contact3_phone_2_litigator?: string | null
          contact3_phone_2_type?: string | null
          contact3_phone_3?: string | null
          contact3_phone_3_dnc?: string | null
          contact3_phone_3_litigator?: string | null
          contact3_phone_3_type?: string | null
          county?: string | null
          created_at?: string
          exterior?: string | null
          fireplace?: string | null
          first_name?: string | null
          garage?: string | null
          heating?: string | null
          heating_fuel?: string | null
          house_style?: string | null
          id?: string
          interior_walls?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_sales_date?: string | null
          last_sales_price?: string | null
          lead_source_id?: string | null
          location_influence?: string | null
          lot_size_sqft?: string | null
          market_value?: string | null
          mls_curr_basement?: string | null
          mls_curr_baths?: string | null
          mls_curr_beds?: string | null
          mls_curr_days_on_market?: string | null
          mls_curr_description?: string | null
          mls_curr_garage?: string | null
          mls_curr_list_agent_email?: string | null
          mls_curr_list_agent_name?: string | null
          mls_curr_list_agent_office?: string | null
          mls_curr_list_agent_phone?: string | null
          mls_curr_list_date?: string | null
          mls_curr_list_price?: string | null
          mls_curr_listing_id?: string | null
          mls_curr_lot?: string | null
          mls_curr_photos?: string | null
          mls_curr_price_per_sqft?: string | null
          mls_curr_sale_price?: string | null
          mls_curr_sold_date?: string | null
          mls_curr_source?: string | null
          mls_curr_sqft?: string | null
          mls_curr_status?: string | null
          mls_curr_stories?: string | null
          mls_curr_year_built?: string | null
          mls_prev_basement?: string | null
          mls_prev_baths?: string | null
          mls_prev_beds?: string | null
          mls_prev_days_on_market?: string | null
          mls_prev_description?: string | null
          mls_prev_garage?: string | null
          mls_prev_list_agent_email?: string | null
          mls_prev_list_agent_name?: string | null
          mls_prev_list_agent_office?: string | null
          mls_prev_list_agent_phone?: string | null
          mls_prev_list_date?: string | null
          mls_prev_list_price?: string | null
          mls_prev_listing_id?: string | null
          mls_prev_lot?: string | null
          mls_prev_photos?: string | null
          mls_prev_price_per_sqft?: string | null
          mls_prev_sale_price?: string | null
          mls_prev_sold_date?: string | null
          mls_prev_source?: string | null
          mls_prev_sqft?: string | null
          mls_prev_status?: string | null
          mls_prev_stories?: string | null
          mls_prev_year_built?: string | null
          notes?: string | null
          owner_type?: string | null
          patio?: string | null
          pool?: string | null
          porch?: string | null
          price_per_sqft?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          raw_lead_id?: string | null
          raw_lead_table?: string | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_postal_code?: string | null
          recipient_state?: string | null
          rental_estimate_high?: string | null
          rental_estimate_low?: string | null
          roof?: string | null
          roof_shape?: string | null
          school_district?: string | null
          sewer?: string | null
          source_id?: string | null
          square_footage?: string | null
          status?: string
          stories?: string | null
          subdivision?: string | null
          tax_amount?: string | null
          units?: string | null
          updated_at?: string
          water?: string | null
          wholesale_value?: string | null
          year_built?: string | null
          zoning?: string | null
        }
        Update: {
          address_hash?: string | null
          air_conditioning?: string | null
          airconditioning?: string | null
          assessed_total?: string | null
          assessed_year?: string | null
          assigned_to?: string | null
          avm?: string | null
          basement?: string | null
          baths?: string | null
          beds?: string | null
          condition?: string | null
          contact1_email_1?: string | null
          contact1_email_2?: string | null
          contact1_email_3?: string | null
          contact1_name?: string | null
          contact1_phone_1?: string | null
          contact1_phone_1_dnc?: string | null
          contact1_phone_1_litigator?: string | null
          contact1_phone_1_type?: string | null
          contact1_phone_2?: string | null
          contact1_phone_2_dnc?: string | null
          contact1_phone_2_litigator?: string | null
          contact1_phone_2_type?: string | null
          contact1_phone_3?: string | null
          contact1_phone_3_dnc?: string | null
          contact1_phone_3_litigator?: string | null
          contact1_phone_3_type?: string | null
          contact2_email_1?: string | null
          contact2_email_2?: string | null
          contact2_email_3?: string | null
          contact2_name?: string | null
          contact2_phone_1?: string | null
          contact2_phone_1_dnc?: string | null
          contact2_phone_1_litigator?: string | null
          contact2_phone_1_type?: string | null
          contact2_phone_2?: string | null
          contact2_phone_2_dnc?: string | null
          contact2_phone_2_litigator?: string | null
          contact2_phone_2_type?: string | null
          contact2_phone_3?: string | null
          contact2_phone_3_dnc?: string | null
          contact2_phone_3_litigator?: string | null
          contact2_phone_3_type?: string | null
          contact3_email_1?: string | null
          contact3_email_2?: string | null
          contact3_email_3?: string | null
          contact3_name?: string | null
          contact3_phone_1?: string | null
          contact3_phone_1_dnc?: string | null
          contact3_phone_1_litigator?: string | null
          contact3_phone_1_type?: string | null
          contact3_phone_2?: string | null
          contact3_phone_2_dnc?: string | null
          contact3_phone_2_litigator?: string | null
          contact3_phone_2_type?: string | null
          contact3_phone_3?: string | null
          contact3_phone_3_dnc?: string | null
          contact3_phone_3_litigator?: string | null
          contact3_phone_3_type?: string | null
          county?: string | null
          created_at?: string
          exterior?: string | null
          fireplace?: string | null
          first_name?: string | null
          garage?: string | null
          heating?: string | null
          heating_fuel?: string | null
          house_style?: string | null
          id?: string
          interior_walls?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_sales_date?: string | null
          last_sales_price?: string | null
          lead_source_id?: string | null
          location_influence?: string | null
          lot_size_sqft?: string | null
          market_value?: string | null
          mls_curr_basement?: string | null
          mls_curr_baths?: string | null
          mls_curr_beds?: string | null
          mls_curr_days_on_market?: string | null
          mls_curr_description?: string | null
          mls_curr_garage?: string | null
          mls_curr_list_agent_email?: string | null
          mls_curr_list_agent_name?: string | null
          mls_curr_list_agent_office?: string | null
          mls_curr_list_agent_phone?: string | null
          mls_curr_list_date?: string | null
          mls_curr_list_price?: string | null
          mls_curr_listing_id?: string | null
          mls_curr_lot?: string | null
          mls_curr_photos?: string | null
          mls_curr_price_per_sqft?: string | null
          mls_curr_sale_price?: string | null
          mls_curr_sold_date?: string | null
          mls_curr_source?: string | null
          mls_curr_sqft?: string | null
          mls_curr_status?: string | null
          mls_curr_stories?: string | null
          mls_curr_year_built?: string | null
          mls_prev_basement?: string | null
          mls_prev_baths?: string | null
          mls_prev_beds?: string | null
          mls_prev_days_on_market?: string | null
          mls_prev_description?: string | null
          mls_prev_garage?: string | null
          mls_prev_list_agent_email?: string | null
          mls_prev_list_agent_name?: string | null
          mls_prev_list_agent_office?: string | null
          mls_prev_list_agent_phone?: string | null
          mls_prev_list_date?: string | null
          mls_prev_list_price?: string | null
          mls_prev_listing_id?: string | null
          mls_prev_lot?: string | null
          mls_prev_photos?: string | null
          mls_prev_price_per_sqft?: string | null
          mls_prev_sale_price?: string | null
          mls_prev_sold_date?: string | null
          mls_prev_source?: string | null
          mls_prev_sqft?: string | null
          mls_prev_status?: string | null
          mls_prev_stories?: string | null
          mls_prev_year_built?: string | null
          notes?: string | null
          owner_type?: string | null
          patio?: string | null
          pool?: string | null
          porch?: string | null
          price_per_sqft?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          raw_lead_id?: string | null
          raw_lead_table?: string | null
          recipient_address?: string | null
          recipient_city?: string | null
          recipient_postal_code?: string | null
          recipient_state?: string | null
          rental_estimate_high?: string | null
          rental_estimate_low?: string | null
          roof?: string | null
          roof_shape?: string | null
          school_district?: string | null
          sewer?: string | null
          source_id?: string | null
          square_footage?: string | null
          status?: string
          stories?: string | null
          subdivision?: string | null
          tax_amount?: string | null
          units?: string | null
          updated_at?: string
          water?: string | null
          wholesale_value?: string | null
          year_built?: string | null
          zoning?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      normal_austin_90days_0_b731cf9c: {
        Row: {
          assessed_total: string | null
          baths: string | null
          beds: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: number | null
          mls_curr_days_on_market: string | null
          mls_curr_status: string | null
          original_lead_id: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: string | null
          wholesale_value: string | null
          year_built: string | null
        }
        Insert: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Update: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Relationships: []
      }
      normal_brownsville_90days_0_c84e96b0: {
        Row: {
          assessed_total: string | null
          baths: string | null
          beds: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: number | null
          mls_curr_days_on_market: string | null
          mls_curr_status: string | null
          original_lead_id: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: string | null
          wholesale_value: string | null
          year_built: string | null
        }
        Insert: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Update: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Relationships: []
      }
      normal_houston_houses_90dom_0_3b104df5: {
        Row: {
          assessed_total: string | null
          baths: string | null
          beds: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: number | null
          mls_curr_days_on_market: string | null
          mls_curr_status: string | null
          original_lead_id: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: string | null
          wholesale_value: string | null
          year_built: string | null
        }
        Insert: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Update: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Relationships: []
      }
      normal_indianapolis_houses_90dom_0_bf9754b0: {
        Row: {
          assessed_total: string | null
          baths: string | null
          beds: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: number | null
          mls_curr_days_on_market: string | null
          mls_curr_status: string | null
          original_lead_id: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: string | null
          wholesale_value: string | null
          year_built: string | null
        }
        Insert: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Update: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number | null
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Relationships: []
      }
      normalized_leads: {
        Row: {
          assessed_total: string | null
          baths: string | null
          beds: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string | null
          id: number
          mls_curr_days_on_market: string | null
          mls_curr_status: string | null
          original_lead_id: string | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: string | null
          wholesale_value: string | null
          year_built: string | null
        }
        Insert: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Update: {
          assessed_total?: string | null
          baths?: string | null
          beds?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string | null
          id?: number
          mls_curr_days_on_market?: string | null
          mls_curr_status?: string | null
          original_lead_id?: string | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: string | null
          wholesale_value?: string | null
          year_built?: string | null
        }
        Relationships: []
      }
      processing_status: {
        Row: {
          completed_at: string | null
          file: string
          id: number
          normalized_at: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          file: string
          id?: number
          normalized_at?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          file?: string
          id?: number
          normalized_at?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          id: string
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      senders: {
        Row: {
          created_at: string
          daily_quota: number | null
          email: string
          emails_sent: number
          id: string
          is_active: boolean | null
          last_sent_at: string | null
          name: string
          oauth_token: string | null
          provider: string | null
          refresh_token: string | null
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          daily_quota?: number | null
          email: string
          emails_sent?: number
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name: string
          oauth_token?: string | null
          provider?: string | null
          refresh_token?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          daily_quota?: number | null
          email?: string
          emails_sent?: number
          id?: string
          is_active?: boolean | null
          last_sent_at?: string | null
          name?: string
          oauth_token?: string | null
          provider?: string | null
          refresh_token?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_normalized_leads: {
        Args: { source_filename: string }
        Returns: undefined
      }
      clear_lead_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      exec_sql: {
        Args: { query: string }
        Returns: undefined
      }
      get_latest_lead_filename: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      list_dynamic_lead_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      list_normalized_lead_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      normalize_archive_table_types: {
        Args: { archive_table_name: string }
        Returns: undefined
      }
      normalize_staged_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_sql: {
        Args: { sql: string }
        Returns: {
          result: Json
        }[]
      }
      test_jsonb_return: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
