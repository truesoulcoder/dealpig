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
          campaign_id: string
          created_at: string | null
          id: string
          lead_record_id: string
          lead_source_id: string
          processed_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          lead_record_id: string
          lead_source_id: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          lead_record_id?: string
          lead_source_id?: string
          processed_at?: string | null
          status?: string | null
          updated_at?: string | null
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
            foreignKeyName: "campaign_leads_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_senders: {
        Row: {
          campaign_id: string
          created_at: string | null
          emails_sent_today: number | null
          id: string
          last_sent_at: string | null
          sender_id: string
          total_emails_sent: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          emails_sent_today?: number | null
          id?: string
          last_sent_at?: string | null
          sender_id: string
          total_emails_sent?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          emails_sent_today?: number | null
          id?: string
          last_sent_at?: string | null
          sender_id?: string
          total_emails_sent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_senders_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_senders_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "senders"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          attachment_type: string | null
          company_logo_path: string | null
          created_at: string | null
          description: string | null
          email_body: string | null
          email_subject: string | null
          email_template_id: string | null
          end_time: string | null
          id: string
          leads_per_day: number | null
          leads_worked: number | null
          loi_template_id: string | null
          max_interval_minutes: number | null
          min_interval_minutes: number | null
          name: string
          start_time: string | null
          status: string | null
          total_leads: number | null
          tracking_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          attachment_type?: string | null
          company_logo_path?: string | null
          created_at?: string | null
          description?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          end_time?: string | null
          id?: string
          leads_per_day?: number | null
          leads_worked?: number | null
          loi_template_id?: string | null
          max_interval_minutes?: number | null
          min_interval_minutes?: number | null
          name: string
          start_time?: string | null
          status?: string | null
          total_leads?: number | null
          tracking_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          attachment_type?: string | null
          company_logo_path?: string | null
          created_at?: string | null
          description?: string | null
          email_body?: string | null
          email_subject?: string | null
          email_template_id?: string | null
          end_time?: string | null
          id?: string
          leads_per_day?: number | null
          leads_worked?: number | null
          loi_template_id?: string | null
          max_interval_minutes?: number | null
          min_interval_minutes?: number | null
          name?: string
          start_time?: string | null
          status?: string | null
          total_leads?: number | null
          tracking_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_email_template_id_fkey"
            columns: ["email_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_loi_template_id_fkey"
            columns: ["loi_template_id"]
            isOneToOne: false
            referencedRelation: "templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          email_id: string | null
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          recipient_email: string
          user_agent: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          email_id?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_email: string
          user_agent?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          email_id?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          recipient_email?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "emails"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          body: string
          bounce_reason: string | null
          bounced_at: string | null
          campaign_id: string | null
          created_at: string | null
          delivered_at: string | null
          id: string
          lead_record_id: string
          lead_source_id: string
          loi_path: string | null
          sender_id: string
          sent_at: string | null
          status: string | null
          subject: string
          tracking_id: string | null
          updated_at: string | null
        }
        Insert: {
          body: string
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          lead_record_id: string
          lead_source_id: string
          loi_path?: string | null
          sender_id: string
          sent_at?: string | null
          status?: string | null
          subject: string
          tracking_id?: string | null
          updated_at?: string | null
        }
        Update: {
          body?: string
          bounce_reason?: string | null
          bounced_at?: string | null
          campaign_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          lead_record_id?: string
          lead_source_id?: string
          loi_path?: string | null
          sender_id?: string
          sent_at?: string | null
          status?: string | null
          subject?: string
          tracking_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emails_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emails_lead_source_id_fkey"
            columns: ["lead_source_id"]
            isOneToOne: false
            referencedRelation: "lead_sources"
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
          created_at: string | null
          file_name: string
          id: string
          is_active: boolean | null
          last_imported: string
          metadata: Json | null
          name: string
          record_count: number
          storage_path: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          id?: string
          is_active?: boolean | null
          last_imported?: string
          metadata?: Json | null
          name: string
          record_count?: number
          storage_path?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          id?: string
          is_active?: boolean | null
          last_imported?: string
          metadata?: Json | null
          name?: string
          record_count?: number
          storage_path?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          absentee_owner: boolean | null
          active_investor_owned: boolean | null
          active_listing: boolean | null
          address_hash: string | null
          air_conditioning: string | null
          assessed_total: number | null
          assessed_year: number | null
          assigned_to: string | null
          auction_date: string | null
          avm: number | null
          basement: string | null
          baths: number | null
          beds: number | null
          bored_investor: boolean | null
          buyer: string | null
          cash_buyer: boolean | null
          condition: string | null
          contact1_email_1: string | null
          contact1_email_2: string | null
          contact1_email_3: string | null
          contact1_name: string | null
          contact1_phone_1: string | null
          contact1_phone_1_dnc: boolean | null
          contact1_phone_1_litigator: boolean | null
          contact1_phone_1_type: string | null
          contact1_phone_2: string | null
          contact1_phone_2_dnc: boolean | null
          contact1_phone_2_litigator: boolean | null
          contact1_phone_2_type: string | null
          contact1_phone_3: string | null
          contact1_phone_3_dnc: boolean | null
          contact1_phone_3_litigator: boolean | null
          contact1_phone_3_type: string | null
          contact2_email_1: string | null
          contact2_email_2: string | null
          contact2_email_3: string | null
          contact2_name: string | null
          contact2_phone_1: string | null
          contact2_phone_1_dnc: boolean | null
          contact2_phone_1_litigator: boolean | null
          contact2_phone_1_type: string | null
          contact2_phone_2: string | null
          contact2_phone_2_dnc: boolean | null
          contact2_phone_2_litigator: boolean | null
          contact2_phone_2_type: string | null
          contact2_phone_3: string | null
          contact2_phone_3_dnc: boolean | null
          contact2_phone_3_litigator: boolean | null
          contact2_phone_3_type: string | null
          contact3_email_1: string | null
          contact3_email_2: string | null
          contact3_email_3: string | null
          contact3_name: string | null
          contact3_phone_1: string | null
          contact3_phone_1_dnc: boolean | null
          contact3_phone_1_litigator: boolean | null
          contact3_phone_1_type: string | null
          contact3_phone_2: string | null
          contact3_phone_2_dnc: boolean | null
          contact3_phone_2_litigator: boolean | null
          contact3_phone_2_type: string | null
          contact3_phone_3: string | null
          contact3_phone_3_dnc: boolean | null
          contact3_phone_3_litigator: boolean | null
          contact3_phone_3_type: string | null
          county: string | null
          created_at: string
          delinquent_tax_activity: boolean | null
          estimated_mortgage_balance: number | null
          estimated_mortgage_payment: number | null
          event: string | null
          exterior: string | null
          fireplace: number | null
          first_name: string | null
          flipped: boolean | null
          foreclosures: boolean | null
          free_and_clear: boolean | null
          garage: string | null
          heating: string | null
          heating_fuel: string | null
          high_equity: boolean | null
          house_style: string | null
          id: string
          interior_walls: string | null
          last_contacted_at: string | null
          last_name: string | null
          last_notice_date: string | null
          last_sales_date: string | null
          last_sales_price: number | null
          lead_source_id: string | null
          lender_name: string | null
          loan_amount: number | null
          loan_type: string | null
          location_influence: string | null
          long_term_owner: boolean | null
          lot_size_sqft: number | null
          low_equity: boolean | null
          ltv: number | null
          market_value: number | null
          maturity_date: string | null
          mls_curr_basement: string | null
          mls_curr_baths: number | null
          mls_curr_beds: number | null
          mls_curr_days_on_market: number | null
          mls_curr_description: string | null
          mls_curr_garage: string | null
          mls_curr_list_agent_email: string | null
          mls_curr_list_agent_name: string | null
          mls_curr_list_agent_office: string | null
          mls_curr_list_agent_phone: string | null
          mls_curr_list_date: string | null
          mls_curr_list_price: number | null
          mls_curr_listing_id: string | null
          mls_curr_lot: number | null
          mls_curr_photos: string | null
          mls_curr_price_per_sqft: number | null
          mls_curr_sale_price: number | null
          mls_curr_sold_date: string | null
          mls_curr_source: string | null
          mls_curr_sqft: number | null
          mls_curr_status: string | null
          mls_curr_stories: number | null
          mls_curr_year_built: number | null
          mls_prev_basement: string | null
          mls_prev_baths: number | null
          mls_prev_beds: number | null
          mls_prev_days_on_market: number | null
          mls_prev_description: string | null
          mls_prev_garage: string | null
          mls_prev_list_agent_email: string | null
          mls_prev_list_agent_name: string | null
          mls_prev_list_agent_office: string | null
          mls_prev_list_agent_phone: string | null
          mls_prev_list_date: string | null
          mls_prev_list_price: number | null
          mls_prev_listing_id: string | null
          mls_prev_lot: number | null
          mls_prev_photos: string | null
          mls_prev_price_per_sqft: number | null
          mls_prev_sale_price: number | null
          mls_prev_sold_date: string | null
          mls_prev_source: string | null
          mls_prev_sqft: number | null
          mls_prev_status: string | null
          mls_prev_stories: number | null
          mls_prev_year_built: number | null
          mortgage_interest_rate: number | null
          notes: string | null
          number_of_loans: number | null
          owner_type: string | null
          patio: string | null
          pool: string | null
          porch: string | null
          potentially_inherited: boolean | null
          pre_foreclosure: boolean | null
          price_per_sqft: number | null
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
          recording_date: string | null
          rental_estimate_high: number | null
          rental_estimate_low: number | null
          rental_score: string | null
          retail_score: string | null
          roof: string | null
          roof_shape: string | null
          school_district: string | null
          seller: string | null
          sewer: string | null
          source_id: string | null
          square_footage: number | null
          status: string
          stories: number | null
          subdivision: string | null
          tax_amount: number | null
          total_loans: number | null
          units: number | null
          updated_at: string
          upside_down: boolean | null
          vacancy: boolean | null
          water: string | null
          wholesale_score: string | null
          wholesale_value: number | null
          year_built: number | null
          zombie_property: boolean | null
          zoning: string | null
        }
        Insert: {
          absentee_owner?: boolean | null
          active_investor_owned?: boolean | null
          active_listing?: boolean | null
          address_hash?: string | null
          air_conditioning?: string | null
          assessed_total?: number | null
          assessed_year?: number | null
          assigned_to?: string | null
          auction_date?: string | null
          avm?: number | null
          basement?: string | null
          baths?: number | null
          beds?: number | null
          bored_investor?: boolean | null
          buyer?: string | null
          cash_buyer?: boolean | null
          condition?: string | null
          contact1_email_1?: string | null
          contact1_email_2?: string | null
          contact1_email_3?: string | null
          contact1_name?: string | null
          contact1_phone_1?: string | null
          contact1_phone_1_dnc?: boolean | null
          contact1_phone_1_litigator?: boolean | null
          contact1_phone_1_type?: string | null
          contact1_phone_2?: string | null
          contact1_phone_2_dnc?: boolean | null
          contact1_phone_2_litigator?: boolean | null
          contact1_phone_2_type?: string | null
          contact1_phone_3?: string | null
          contact1_phone_3_dnc?: boolean | null
          contact1_phone_3_litigator?: boolean | null
          contact1_phone_3_type?: string | null
          contact2_email_1?: string | null
          contact2_email_2?: string | null
          contact2_email_3?: string | null
          contact2_name?: string | null
          contact2_phone_1?: string | null
          contact2_phone_1_dnc?: boolean | null
          contact2_phone_1_litigator?: boolean | null
          contact2_phone_1_type?: string | null
          contact2_phone_2?: string | null
          contact2_phone_2_dnc?: boolean | null
          contact2_phone_2_litigator?: boolean | null
          contact2_phone_2_type?: string | null
          contact2_phone_3?: string | null
          contact2_phone_3_dnc?: boolean | null
          contact2_phone_3_litigator?: boolean | null
          contact2_phone_3_type?: string | null
          contact3_email_1?: string | null
          contact3_email_2?: string | null
          contact3_email_3?: string | null
          contact3_name?: string | null
          contact3_phone_1?: string | null
          contact3_phone_1_dnc?: boolean | null
          contact3_phone_1_litigator?: boolean | null
          contact3_phone_1_type?: string | null
          contact3_phone_2?: string | null
          contact3_phone_2_dnc?: boolean | null
          contact3_phone_2_litigator?: boolean | null
          contact3_phone_2_type?: string | null
          contact3_phone_3?: string | null
          contact3_phone_3_dnc?: boolean | null
          contact3_phone_3_litigator?: boolean | null
          contact3_phone_3_type?: string | null
          county?: string | null
          created_at?: string
          delinquent_tax_activity?: boolean | null
          estimated_mortgage_balance?: number | null
          estimated_mortgage_payment?: number | null
          event?: string | null
          exterior?: string | null
          fireplace?: number | null
          first_name?: string | null
          flipped?: boolean | null
          foreclosures?: boolean | null
          free_and_clear?: boolean | null
          garage?: string | null
          heating?: string | null
          heating_fuel?: string | null
          high_equity?: boolean | null
          house_style?: string | null
          id?: string
          interior_walls?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_notice_date?: string | null
          last_sales_date?: string | null
          last_sales_price?: number | null
          lead_source_id?: string | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location_influence?: string | null
          long_term_owner?: boolean | null
          lot_size_sqft?: number | null
          low_equity?: boolean | null
          ltv?: number | null
          market_value?: number | null
          maturity_date?: string | null
          mls_curr_basement?: string | null
          mls_curr_baths?: number | null
          mls_curr_beds?: number | null
          mls_curr_days_on_market?: number | null
          mls_curr_description?: string | null
          mls_curr_garage?: string | null
          mls_curr_list_agent_email?: string | null
          mls_curr_list_agent_name?: string | null
          mls_curr_list_agent_office?: string | null
          mls_curr_list_agent_phone?: string | null
          mls_curr_list_date?: string | null
          mls_curr_list_price?: number | null
          mls_curr_listing_id?: string | null
          mls_curr_lot?: number | null
          mls_curr_photos?: string | null
          mls_curr_price_per_sqft?: number | null
          mls_curr_sale_price?: number | null
          mls_curr_sold_date?: string | null
          mls_curr_source?: string | null
          mls_curr_sqft?: number | null
          mls_curr_status?: string | null
          mls_curr_stories?: number | null
          mls_curr_year_built?: number | null
          mls_prev_basement?: string | null
          mls_prev_baths?: number | null
          mls_prev_beds?: number | null
          mls_prev_days_on_market?: number | null
          mls_prev_description?: string | null
          mls_prev_garage?: string | null
          mls_prev_list_agent_email?: string | null
          mls_prev_list_agent_name?: string | null
          mls_prev_list_agent_office?: string | null
          mls_prev_list_agent_phone?: string | null
          mls_prev_list_date?: string | null
          mls_prev_list_price?: number | null
          mls_prev_listing_id?: string | null
          mls_prev_lot?: number | null
          mls_prev_photos?: string | null
          mls_prev_price_per_sqft?: number | null
          mls_prev_sale_price?: number | null
          mls_prev_sold_date?: string | null
          mls_prev_source?: string | null
          mls_prev_sqft?: number | null
          mls_prev_status?: string | null
          mls_prev_stories?: number | null
          mls_prev_year_built?: number | null
          mortgage_interest_rate?: number | null
          notes?: string | null
          number_of_loans?: number | null
          owner_type?: string | null
          patio?: string | null
          pool?: string | null
          porch?: string | null
          potentially_inherited?: boolean | null
          pre_foreclosure?: boolean | null
          price_per_sqft?: number | null
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
          recording_date?: string | null
          rental_estimate_high?: number | null
          rental_estimate_low?: number | null
          rental_score?: string | null
          retail_score?: string | null
          roof?: string | null
          roof_shape?: string | null
          school_district?: string | null
          seller?: string | null
          sewer?: string | null
          source_id?: string | null
          square_footage?: number | null
          status?: string
          stories?: number | null
          subdivision?: string | null
          tax_amount?: number | null
          total_loans?: number | null
          units?: number | null
          updated_at?: string
          upside_down?: boolean | null
          vacancy?: boolean | null
          water?: string | null
          wholesale_score?: string | null
          wholesale_value?: number | null
          year_built?: number | null
          zombie_property?: boolean | null
          zoning?: string | null
        }
        Update: {
          absentee_owner?: boolean | null
          active_investor_owned?: boolean | null
          active_listing?: boolean | null
          address_hash?: string | null
          air_conditioning?: string | null
          assessed_total?: number | null
          assessed_year?: number | null
          assigned_to?: string | null
          auction_date?: string | null
          avm?: number | null
          basement?: string | null
          baths?: number | null
          beds?: number | null
          bored_investor?: boolean | null
          buyer?: string | null
          cash_buyer?: boolean | null
          condition?: string | null
          contact1_email_1?: string | null
          contact1_email_2?: string | null
          contact1_email_3?: string | null
          contact1_name?: string | null
          contact1_phone_1?: string | null
          contact1_phone_1_dnc?: boolean | null
          contact1_phone_1_litigator?: boolean | null
          contact1_phone_1_type?: string | null
          contact1_phone_2?: string | null
          contact1_phone_2_dnc?: boolean | null
          contact1_phone_2_litigator?: boolean | null
          contact1_phone_2_type?: string | null
          contact1_phone_3?: string | null
          contact1_phone_3_dnc?: boolean | null
          contact1_phone_3_litigator?: boolean | null
          contact1_phone_3_type?: string | null
          contact2_email_1?: string | null
          contact2_email_2?: string | null
          contact2_email_3?: string | null
          contact2_name?: string | null
          contact2_phone_1?: string | null
          contact2_phone_1_dnc?: boolean | null
          contact2_phone_1_litigator?: boolean | null
          contact2_phone_1_type?: string | null
          contact2_phone_2?: string | null
          contact2_phone_2_dnc?: boolean | null
          contact2_phone_2_litigator?: boolean | null
          contact2_phone_2_type?: string | null
          contact2_phone_3?: string | null
          contact2_phone_3_dnc?: boolean | null
          contact2_phone_3_litigator?: boolean | null
          contact2_phone_3_type?: string | null
          contact3_email_1?: string | null
          contact3_email_2?: string | null
          contact3_email_3?: string | null
          contact3_name?: string | null
          contact3_phone_1?: string | null
          contact3_phone_1_dnc?: boolean | null
          contact3_phone_1_litigator?: boolean | null
          contact3_phone_1_type?: string | null
          contact3_phone_2?: string | null
          contact3_phone_2_dnc?: boolean | null
          contact3_phone_2_litigator?: boolean | null
          contact3_phone_2_type?: string | null
          contact3_phone_3?: string | null
          contact3_phone_3_dnc?: boolean | null
          contact3_phone_3_litigator?: boolean | null
          contact3_phone_3_type?: string | null
          county?: string | null
          created_at?: string
          delinquent_tax_activity?: boolean | null
          estimated_mortgage_balance?: number | null
          estimated_mortgage_payment?: number | null
          event?: string | null
          exterior?: string | null
          fireplace?: number | null
          first_name?: string | null
          flipped?: boolean | null
          foreclosures?: boolean | null
          free_and_clear?: boolean | null
          garage?: string | null
          heating?: string | null
          heating_fuel?: string | null
          high_equity?: boolean | null
          house_style?: string | null
          id?: string
          interior_walls?: string | null
          last_contacted_at?: string | null
          last_name?: string | null
          last_notice_date?: string | null
          last_sales_date?: string | null
          last_sales_price?: number | null
          lead_source_id?: string | null
          lender_name?: string | null
          loan_amount?: number | null
          loan_type?: string | null
          location_influence?: string | null
          long_term_owner?: boolean | null
          lot_size_sqft?: number | null
          low_equity?: boolean | null
          ltv?: number | null
          market_value?: number | null
          maturity_date?: string | null
          mls_curr_basement?: string | null
          mls_curr_baths?: number | null
          mls_curr_beds?: number | null
          mls_curr_days_on_market?: number | null
          mls_curr_description?: string | null
          mls_curr_garage?: string | null
          mls_curr_list_agent_email?: string | null
          mls_curr_list_agent_name?: string | null
          mls_curr_list_agent_office?: string | null
          mls_curr_list_agent_phone?: string | null
          mls_curr_list_date?: string | null
          mls_curr_list_price?: number | null
          mls_curr_listing_id?: string | null
          mls_curr_lot?: number | null
          mls_curr_photos?: string | null
          mls_curr_price_per_sqft?: number | null
          mls_curr_sale_price?: number | null
          mls_curr_sold_date?: string | null
          mls_curr_source?: string | null
          mls_curr_sqft?: number | null
          mls_curr_status?: string | null
          mls_curr_stories?: number | null
          mls_curr_year_built?: number | null
          mls_prev_basement?: string | null
          mls_prev_baths?: number | null
          mls_prev_beds?: number | null
          mls_prev_days_on_market?: number | null
          mls_prev_description?: string | null
          mls_prev_garage?: string | null
          mls_prev_list_agent_email?: string | null
          mls_prev_list_agent_name?: string | null
          mls_prev_list_agent_office?: string | null
          mls_prev_list_agent_phone?: string | null
          mls_prev_list_date?: string | null
          mls_prev_list_price?: number | null
          mls_prev_listing_id?: string | null
          mls_prev_lot?: number | null
          mls_prev_photos?: string | null
          mls_prev_price_per_sqft?: number | null
          mls_prev_sale_price?: number | null
          mls_prev_sold_date?: string | null
          mls_prev_source?: string | null
          mls_prev_sqft?: number | null
          mls_prev_status?: string | null
          mls_prev_stories?: number | null
          mls_prev_year_built?: number | null
          mortgage_interest_rate?: number | null
          notes?: string | null
          number_of_loans?: number | null
          owner_type?: string | null
          patio?: string | null
          pool?: string | null
          porch?: string | null
          potentially_inherited?: boolean | null
          pre_foreclosure?: boolean | null
          price_per_sqft?: number | null
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
          recording_date?: string | null
          rental_estimate_high?: number | null
          rental_estimate_low?: number | null
          rental_score?: string | null
          retail_score?: string | null
          roof?: string | null
          roof_shape?: string | null
          school_district?: string | null
          seller?: string | null
          sewer?: string | null
          source_id?: string | null
          square_footage?: number | null
          status?: string
          stories?: number | null
          subdivision?: string | null
          tax_amount?: number | null
          total_loans?: number | null
          units?: number | null
          updated_at?: string
          upside_down?: boolean | null
          vacancy?: boolean | null
          water?: string | null
          wholesale_score?: string | null
          wholesale_value?: number | null
          year_built?: number | null
          zombie_property?: boolean | null
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
      normalized_leads: {
        Row: {
          assessed_total: number | null
          baths: string | null
          beds: number | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          id: number
          mls_curr_days_on_market: number | null
          mls_curr_status: string | null
          original_lead_id: number | null
          property_address: string | null
          property_city: string | null
          property_postal_code: string | null
          property_state: string | null
          property_type: string | null
          square_footage: number | null
          wholesale_value: number | null
          year_built: number | null
        }
        Insert: {
          assessed_total?: number | null
          baths?: string | null
          beds?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: number
          mls_curr_days_on_market?: number | null
          mls_curr_status?: string | null
          original_lead_id?: number | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: number | null
          wholesale_value?: number | null
          year_built?: number | null
        }
        Update: {
          assessed_total?: number | null
          baths?: string | null
          beds?: number | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          id?: number
          mls_curr_days_on_market?: number | null
          mls_curr_status?: string | null
          original_lead_id?: number | null
          property_address?: string | null
          property_city?: string | null
          property_postal_code?: string | null
          property_state?: string | null
          property_type?: string | null
          square_footage?: number | null
          wholesale_value?: number | null
          year_built?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      senders: {
        Row: {
          created_at: string | null
          daily_quota: number | null
          email: string
          emails_sent: number | null
          id: string
          last_sent_at: string | null
          name: string
          oauth_token: string | null
          refresh_token: string | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_quota?: number | null
          email: string
          emails_sent?: number | null
          id?: string
          last_sent_at?: string | null
          name: string
          oauth_token?: string | null
          refresh_token?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_quota?: number | null
          email?: string
          emails_sent?: number | null
          id?: string
          last_sent_at?: string | null
          name?: string
          oauth_token?: string | null
          refresh_token?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "senders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      templates: {
        Row: {
          content: string
          created_at: string | null
          id: string
          name: string
          subject: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          name: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          name?: string
          subject?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_dynamic_lead_table: {
        Args: { table_name_param: string; column_definitions: string }
        Returns: boolean
      }
      create_policy_if_not_exists: {
        Args: {
          p_policy_name: string
          p_table_name: string
          p_operation: string
          p_using_expr: string
          p_with_check_expr?: string
        }
        Returns: undefined
      }
      exec_sql: {
        Args: { query: string }
        Returns: undefined
      }
      execute_sql: {
        Args: { sql: string }
        Returns: Json
      }
      get_daily_stats: {
        Args: { campaign_id_param: string; start_date: string }
        Returns: {
          date: string
          sent: number
          delivered: number
          bounced: number
        }[]
      }
      get_sender_stats: {
        Args: { campaign_id_param: string }
        Returns: {
          sender_id: string
          sender_name: string
          sent: number
          delivered: number
          bounced: number
        }[]
      }
      get_table_columns: {
        Args: Record<PropertyKey, never>
        Returns: unknown[]
      }
      group_by_status: {
        Args: { campaign_id_param: string }
        Returns: {
          status: string
          count: number
        }[]
      }
      list_dynamic_lead_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          record_count: number
        }[]
      }
      list_normalized_lead_tables: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
        }[]
      }
      normalize_staged_leads: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      query_dynamic_lead_table: {
        Args: {
          table_name: string
          query_conditions?: string
          page_number?: number
          page_size?: number
          sort_field?: string
          sort_direction?: string
        }
        Returns: Json
      }
      run_sql: {
        Args: { sql: string }
        Returns: undefined
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
