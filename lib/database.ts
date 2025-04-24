import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';

// Type definitions based on our database schema
export interface Lead {
  id?: string;
  property_address: string;
  property_city: string;
  property_state: string;
  property_zip: string;
  wholesale_value?: number;
  market_value?: number;
  days_on_market?: number;
  mls_status?: string;
  mls_list_date?: string;
  mls_list_price?: number;
  status?: string;
  source_id?: string;
  created_at?: string;
  updated_at?: string;
  contacts?: Contact[];
}

export interface Contact {
  id?: string;
  name: string;
  email: string;
  lead_id: string;
  is_primary?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LeadSource {
  id?: string;
  name: string;
  file_name: string;
  last_imported: string;
  record_count: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Sender {
  id?: string;
  name: string;
  email: string;
  title: string;
  daily_quota?: number;
  emails_sent?: number;
  last_sent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Email {
  id?: string;
  lead_id: string;
  sender_id: string;
  subject: string;
  body: string;
  loi_path?: string;
  status?: string;
  opened_at?: string;
  replied_at?: string;
  bounced_at?: string;
  bounce_reason?: string;
  sent_at?: string;
  tracking_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id?: string;
  name: string;
  subject?: string;
  content: string;
  type?: string;
  created_at?: string;
  updated_at?: string;
}

// Database Operations

// Lead operations
export async function createLead(lead: Lead): Promise<Lead | null> {
  const now = new Date().toISOString();
  const newLead = {
    ...lead,
    status: lead.status || 'NEW',
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('leads')
    .insert([newLead])
    .select();

  if (error || !data || data.length === 0) {
    console.error('Error creating lead:', error);
    return null;
  }

  return data[0] as Lead;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      contacts (*)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching lead:', error);
    return null;
  }

  return data as Lead;
}

export async function getLeads(status?: string, search?: string, limit = 100, offset = 0): Promise<Lead[]> {
  let query = supabase.from('leads').select(`
    *,
    contacts (*)
  `);

  if (status) {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`
      property_address.ilike.%${search}%,
      property_city.ilike.%${search}%,
      property_state.ilike.%${search}%,
      property_zip.ilike.%${search}%
    `);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching leads:', error);
    return []; // Return empty array on error
  }

  return data as Lead[];
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating lead:', error);
    return null;
  }

  return data[0] as Lead;
}

export async function deleteLead(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting lead:', error);
    return false;
  }

  return true;
}

// Contact operations
export async function createContact(contact: Contact): Promise<Contact | null> {
  const now = new Date().toISOString();
  const newContact = {
    ...contact,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('contacts')
    .insert([newContact])
    .select();

  if (error || !data || data.length === 0) {
    console.error('Error creating contact:', error);
    return null;
  }

  return data[0] as Contact;
}

export async function getContactsByLeadId(leadId: string): Promise<Contact[]> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('lead_id', leadId)
    .order('is_primary', { ascending: false });

  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }

  return data as Contact[];
}

// Email operations
export async function createEmail(email: Email): Promise<Email | null> {
  const now = new Date().toISOString();
  const trackingId = uuidv4();
  
  const newEmail = {
    ...email,
    status: email.status || 'PENDING',
    tracking_id: email.tracking_id || trackingId,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('emails')
    .insert([newEmail])
    .select();

  if (error || !data || data.length === 0) {
    console.error('Error creating email record:', error);
    return null;
  }

  return data[0] as Email;
}

export async function updateEmailStatus(id: string, status: string, additionalData?: Partial<Email>): Promise<Email | null> {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  };

  // Add timestamp for specific statuses
  if (status === 'SENT') {
    updates.sent_at = new Date().toISOString();
  } else if (status === 'OPENED') {
    updates.opened_at = new Date().toISOString();
  } else if (status === 'REPLIED') {
    updates.replied_at = new Date().toISOString();
  } else if (status === 'BOUNCED') {
    updates.bounced_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('emails')
    .update(updates)
    .eq('id', id)
    .select();

  if (error || !data || data.length === 0) {
    console.error('Error updating email status:', error);
    return null;
  }

  return data[0] as Email;
}

export async function getEmailsByLeadId(leadId: string): Promise<Email[]> {
  const { data, error } = await supabase
    .from('emails')
    .select(`
      *,
      senders:sender_id (name, email, title)
    `)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching emails:', error);
    return [];
  }

  return data as unknown as Email[];
}

// Template operations
export async function getTemplates(type?: string): Promise<Template[]> {
  let query = supabase.from('templates').select('*');
  
  if (type) {
    query = query.eq('type', type);
  }
  
  const { data, error } = await query.order('name');

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data as Template[];
}

export async function getTemplateById(id: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching template:', error);
    return null;
  }

  return data as Template;
}

// Sender operations
export async function getSenders(): Promise<Sender[]> {
  const { data, error } = await supabase
    .from('senders')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching senders:', error);
    return [];
  }

  return data as Sender[];
}

export async function getSenderByEmail(email: string): Promise<Sender | null> {
  const { data, error } = await supabase
    .from('senders')
    .select('*')
    .eq('email', email)
    .single();

  if (error) {
    console.error('Error fetching sender:', error);
    return null;
  }

  return data as Sender;
}

// Lead Source operations
export async function createLeadSource(source: LeadSource): Promise<LeadSource | null> {
  const now = new Date().toISOString();
  const newSource = {
    ...source,
    created_at: now,
    updated_at: now,
    is_active: source.is_active ?? true
  };

  const { data, error } = await supabase
    .from('lead_sources')
    .insert([newSource])
    .select();

  if (error) {
    console.error('Error creating lead source:', error);
    return null;
  }

  return data[0] as LeadSource;
}