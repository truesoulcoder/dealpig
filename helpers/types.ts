/**
 * TypeScript type definitions for dealpig application
 * Generated from Supabase database schema
 */

// Base types for JSON and DateTime handling
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UUID = string;
export type Timestamp = string; // ISO timestamp string

// Profile types
export interface Profile {
  id: UUID;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  updated_at: Timestamp | null;
  created_at: Timestamp;
}

// Lead types
export interface Lead {
  id: UUID;
  property_address: string | null;
  property_city: string | null;
  property_state: string | null;
  property_zip: string | null;
  owner_name: string | null;
  mailing_address: string | null;
  mailing_city: string | null;
  mailing_state: string | null;
  mailing_zip: string | null;
  wholesale_value: number | null;
  market_value: number | null;
  days_on_market: number | null;
  mls_status: string | null;
  mls_list_date: string | null;
  mls_list_price: number | null;
  status: string;
  source_id: UUID | null;
  assigned_to: UUID | null;
  owner_type: string | null;
  property_type: string | null;
  beds: string | null;
  baths: string | null;
  square_footage: string | null;
  year_built: string | null;
  assessed_total: number | null;
  last_contacted_at: Timestamp | null;
  notes: string | null;
  
  // Contact fields
  contact1name: string | null;
  contact1firstname: string | null;
  contact1lastname: string | null;
  contact1phone_1: string | null;
  contact1phone_2: string | null;
  contact1phone_3: string | null;
  contact1email_1: string | null;
  contact1email_2: string | null;
  contact1email_3: string | null;
  contact2name: string | null;
  contact2firstname: string | null;
  contact2lastname: string | null;
  contact2phone_1: string | null;
  contact2phone_2: string | null;
  contact2phone_3: string | null;
  contact2email_1: string | null;
  contact2email_2: string | null;
  contact2email_3: string | null;
  contact3name: string | null;
  contact3firstname: string | null;
  contact3lastname: string | null;
  contact3phone_1: string | null;
  contact3phone_2: string | null;
  contact3phone_3: string | null;
  contact3email_1: string | null;
  contact3email_2: string | null;
  contact3email_3: string | null;
  contact4name: string | null;
  contact4firstname: string | null;
  contact4lastname: string | null;
  contact4phone_1: string | null;
  contact4phone_2: string | null;
  contact4phone_3: string | null;
  contact4email_1: string | null;
  contact4email_2: string | null;
  contact4email_3: string | null;
  contact5name: string | null;
  contact5firstname: string | null;
  contact5lastname: string | null;
  contact5phone_1: string | null;
  contact5phone_2: string | null;
  contact5phone_3: string | null;
  contact5email_1: string | null;
  contact5email_2: string | null;
  contact5email_3: string | null;
  
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Contact types
export interface Contact {
  id: UUID;
  name: string;
  email: string;
  lead_id: UUID;
  is_primary: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Lead Source types
export interface LeadSource {
  id: UUID;
  name: string;
  file_name: string;
  last_imported: Timestamp;
  record_count: number;
  is_active: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Sender types
export interface Sender {
  id: UUID;
  name: string;
  email: string;
  title: string;
  daily_quota: number;
  emails_sent: number;
  oauth_token: string | null;
  refresh_token: string | null;
  last_sent_at: Timestamp | null;
  user_id: UUID | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Template types
export interface Template {
  id: UUID;
  name: string;
  subject: string | null;
  content: string;
  type: string | null; // 'EMAIL', 'LOI', etc.
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Email Template type (more specific than general Template)
export interface EmailTemplate extends Template {
  type: 'EMAIL';
}

// Document Template type (more specific than general Template)
export interface DocumentTemplate extends Template {
  type: 'LOI' | 'CONTRACT' | 'LETTER';
}

// Campaign types
export interface Campaign {
  id: UUID;
  name: string;
  description: string | null;
  status: string; // 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'
  email_template_id: UUID | null;
  loi_template_id: UUID | null;
  leads_per_day: number;
  start_time: string;
  end_time: string;
  min_interval_minutes: number;
  max_interval_minutes: number;
  attachment_type: string;
  tracking_enabled: boolean;
  total_leads: number;
  leads_worked: number;
  company_logo_path: string | null;
  email_subject: string | null;
  email_body: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
  user_id: UUID | null;
}

// Campaign Sender junction
export interface CampaignSender {
  id: UUID;
  campaign_id: UUID;
  sender_id: UUID;
  emails_sent_today: number;
  total_emails_sent: number;
  last_sent_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Campaign Lead junction
export interface CampaignLead {
  id: UUID;
  campaign_id: UUID;
  lead_id: UUID;
  status: string; // 'PENDING', 'SCHEDULED', 'PROCESSED', 'ERROR'
  processed_at: Timestamp | null;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Email types
export interface Email {
  id: UUID;
  lead_id: UUID;
  sender_id: UUID;
  campaign_id: UUID | null;
  subject: string;
  body: string;
  loi_path: string | null;
  status: string; // 'PENDING', 'SENT', 'OPENED', 'REPLIED', 'BOUNCED'
  opened_at: Timestamp | null;
  replied_at: Timestamp | null;
  bounced_at: Timestamp | null;
  bounce_reason: string | null;
  sent_at: Timestamp | null;
  tracking_id: UUID;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// Email Event types
export interface EmailEvent {
  id: UUID;
  email_id: UUID;
  event_type: string; // 'sent', 'delivered', 'opened', 'clicked', etc.
  recipient_email: string;
  campaign_id: UUID | null;
  metadata: Json | null;
  user_agent: string | null;
  ip_address: string | null;
  created_at: Timestamp;
}

// Database schema representation
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { 
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Profile, 'id'>>;
      };
      leads: {
        Row: Lead;
        Insert: Omit<Lead, 'created_at' | 'updated_at' | 'id' | 'status'> & { 
          id?: UUID;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Lead, 'id'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'created_at' | 'updated_at' | 'is_primary' | 'id'> & { 
          id?: UUID;
          is_primary?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Contact, 'id'>>;
      };
      lead_sources: {
        Row: LeadSource;
        Insert: Omit<LeadSource, 'created_at' | 'updated_at' | 'is_active' | 'id'> & { 
          id?: UUID;
          is_active?: boolean;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<LeadSource, 'id'>>;
      };
      senders: {
        Row: Sender;
        Insert: Omit<Sender, 'created_at' | 'updated_at' | 'daily_quota' | 'emails_sent' | 'id'> & { 
          id?: UUID;
          daily_quota?: number;
          emails_sent?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Sender, 'id'>>;
      };
      templates: {
        Row: Template;
        Insert: Omit<Template, 'created_at' | 'updated_at' | 'id'> & { 
          id?: UUID;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Template, 'id'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'created_at' | 'updated_at' | 'id' | 'status' | 'leads_per_day' | 
          'start_time' | 'end_time' | 'min_interval_minutes' | 'max_interval_minutes' | 
          'attachment_type' | 'tracking_enabled' | 'total_leads' | 'leads_worked'> & { 
          id?: UUID;
          status?: string;
          leads_per_day?: number;
          start_time?: string;
          end_time?: string;
          min_interval_minutes?: number;
          max_interval_minutes?: number;
          attachment_type?: string;
          tracking_enabled?: boolean;
          total_leads?: number;
          leads_worked?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Campaign, 'id'>>;
      };
      campaign_senders: {
        Row: CampaignSender;
        Insert: Omit<CampaignSender, 'created_at' | 'updated_at' | 'id' | 'emails_sent_today' | 'total_emails_sent'> & { 
          id?: UUID;
          emails_sent_today?: number;
          total_emails_sent?: number;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<CampaignSender, 'id'>>;
      };
      campaign_leads: {
        Row: CampaignLead;
        Insert: Omit<CampaignLead, 'created_at' | 'updated_at' | 'id' | 'status'> & { 
          id?: UUID;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<CampaignLead, 'id'>>;
      };
      emails: {
        Row: Email;
        Insert: Omit<Email, 'created_at' | 'updated_at' | 'id' | 'status'> & { 
          id?: UUID;
          status?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<Omit<Email, 'id'>>;
      };
      email_events: {
        Row: EmailEvent;
        Insert: Omit<EmailEvent, 'created_at' | 'id'> & { 
          id?: UUID;
          created_at?: Timestamp;
        };
        Update: Partial<Omit<EmailEvent, 'id'>>;
      };
    };
  };
};

// Auth-related types
export interface LoginFormType {
  email: string;
  password: string;
}

export interface RegisterFormType {
  full_name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RequestPasswordResetFormType {
  email: string;
}

export interface ResetPasswordFormType {
  password: string;
  confirmPassword: string;
}

// Enum for lead statuses
export enum LeadStatus {
  NEW = "NEW",
  CONTACTED = "CONTACTED",
  QUALIFIED = "QUALIFIED",
  NEGOTIATING = "NEGOTIATING",
  UNDER_CONTRACT = "UNDER_CONTRACT",
  CLOSED = "CLOSED",
  DEAD = "DEAD",
}

// Enum for campaign statuses
export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
}

// Enum for email statuses
export enum EmailStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  OPENED = "OPENED",
  REPLIED = "REPLIED",
  BOUNCED = "BOUNCED",
}

// Enum for campaign lead statuses
export enum CampaignLeadStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  PROCESSED = "PROCESSED",
  ERROR = "ERROR",
}
