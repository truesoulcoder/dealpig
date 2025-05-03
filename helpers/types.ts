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

// Metadata types for lead sources
// Updated to store target table and column mapping
export interface LeadSourceMetadata {
  tableName: string; // The target table for normalized leads (e.g., 'leads')
  columnMap: Record<string, string | null>; // Maps CSV Header -> Lead Table Column (or null if unmapped)
}

// Lead types
export interface Lead {
  Id: UUID;
  // Property Information
  PropertyAddress: string | null;
  PropertyCity: string | null;
  PropertyState: string | null;
  PropertyZip: string | null;
  PropertyType: string | null;
  Beds: number | null;
  Baths: number | null;
  SquareFootage: number | null;
  YearBuilt: number | null;
  
  // Valuation
  WholesaleValue: number | null;
  MarketValue: number | null;
  AssessedTotal: number | null;
  
  // MLS Information
  DaysOnMarket: number | null;
  MLSStatus: string | null;
  MLSListDate: string | null;
  MLSListPrice: number | null;
  
  // Owner Information
  /**
   * Normalized owner name field. Raw source: 'Contact#Name' from uploaded data.
   */
  OwnerName: string | null;
  OwnerEmail: string | null;
  OwnerType: string | null;  // 'OWNER' or 'AGENT'
  
  // Mailing Information
  MailingAddress: string | null;
  MailingCity: string | null;
  MailingState: string | null;
  MailingZip: string | null;
  
  // System Fields
  Status: string;
  SourceId: UUID | null;
  AssignedTo: UUID | null;
  LastContactedAt: Timestamp | null;
  Notes: string | null;
  CreatedAt: Timestamp;
  UpdatedAt: Timestamp;

  // Provenance fields added for normalization
  RawLeadTable: string | null; // Name of the original dynamic table
  RawLeadId: string | number | null; // ID from the original dynamic table (adjust type if needed)
}

// Type definition based on the normalized_leads table schema
export interface NormalizedLead {
  Id: number; // SERIAL PRIMARY KEY
  OriginalLeadId?: number | null; // BIGINT, optional link to source leads.id
  ContactName: string | null;
  ContactEmail: string | null;
  PropertyAddress: string | null;
  PropertyCity: string | null;
  PropertyState: string | null;
  PropertyPostalCode: string | null;
  PropertyType: string | null;
  Baths: string | null; // TEXT
  Beds: number | null; // INTEGER
  YearBuilt: number | null; // INTEGER
  SquareFootage: number | null; // INTEGER
  WholesaleValue: number | null; // NUMERIC
  AssessedTotal: number | null; // NUMERIC
  MLSCurrStatus: string | null;
  MLSCurrDaysOnMarket: number | null; // INTEGER
  // Add CreatedAt/UpdatedAt if your table has them
  CreatedAt?: string;
  UpdatedAt?: string;
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
  storage_path: string;  // Path in storage bucket where the file is stored
  last_imported: Timestamp | null;
  record_count: number | null;
  is_active: boolean;
  metadata: LeadSourceMetadata | null; // Use the updated metadata type
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
        Insert: Omit<LeadSource, 'created_at' | 'updated_at' | 'is_active' | 'id' | 'record_count'> & { 
          id?: UUID;
          is_active?: boolean;
          record_count?: number;
          metadata?: LeadSourceMetadata;
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

// Lead field mappings for templates and email personalization
export const LEAD_TEMPLATE_FIELDS = {
  // Contact Information
  OwnerName: 'OwnerName',        // From Contact#Name or MLSCurrListAgentName
  OwnerEmail: 'OwnerEmail',      // From Contact#Email_1 or MLSCurrListAgentEmail
  ContactType: 'ContactType',    // 'OWNER' or 'AGENT'

  // Property Details
  PropertyAddress: 'PropertyAddress',  // From PropertyAddress
  PropertyCity: 'PropertyCity',        // From PropertyCity
  PropertyState: 'PropertyState',      // From PropertyState
  PropertyZip: 'PropertyZip',          // From PropertyPostalCode
  PropertyType: 'PropertyType',        // From PropertyType
  
  // Valuation
  WholesaleValue: 'WholesaleValue',   // From WholesaleValue
  AssessedTotal: 'AssessedTotal',     // From AssessedTotal
  
  // MLS Information
  MLSStatus: 'MLSStatus',            // From MLSCurrStatus
  DaysOnMarket: 'DaysOnMarket',    // From MLSCurrDaysOnMarket
} as const;

// Type for template variables
export type LeadTemplateField = keyof typeof LEAD_TEMPLATE_FIELDS;

// Example template usage:
// Dear {{OWNER_NAME}},
// I noticed your property at {{PROPERTY_ADDRESS}} in {{PROPERTY_CITY}} has been listed for {{DAYS_ON_MARKET}} days.
// This {{BEDS}} bedroom, {{BATHS}} bathroom home built in {{YEAR_BUILT}} ...

// Documentation for template creators
export const TEMPLATE_FIELD_DESCRIPTIONS = {
  OwnerName: 'The name of the property owner or listing agent',
  OwnerEmail: 'The email address of the property owner or listing agent',
  ContactType: 'Whether this contact is an owner or agent',
  PropertyAddress: 'The street address of the property',
  PropertyCity: 'The city where the property is located',
  PropertyState: 'The state where the property is located',
  PropertyZip: 'The postal code of the property',
  PropertyType: 'The type of property (e.g., Single Family, Multi-Family)',
  Beds: 'Number of bedrooms',
  Baths: 'Number of bathrooms',
  YearBuilt: 'Year the property was built',
  SquareFootage: 'Total square footage of the property',
  WholesaleValue: 'Estimated wholesale value of the property',
  AssessedTotal: 'Total assessed value of the property',
  MLSStatus: 'Current MLS listing status',
  DaysOnMarket: 'Number of days the property has been on the market'
} as const;
