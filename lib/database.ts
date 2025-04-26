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
  owner_type?: string;
  property_type?: string;
  beds?: string;
  baths?: string;
  square_footage?: string;
  year_built?: string;
  assessed_total?: number;
  contact1name?: string;
  contact1phone_1?: string;
  contact1email_1?: string;
  contact2name?: string;
  contact2phone_1?: string;
  contact2email_1?: string;
  contact3name?: string;
  contact3phone_1?: string;
  contact3email_1?: string;
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
  file_url?: string; // Added file_url to support storage URLs
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
  profile_picture?: string;
  verified_email?: string;
  oauth_token?: string;
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
  message_id?: string;    // Gmail message ID for tracking replies
  campaignId?: string;    // Campaign ID for associating emails with campaigns
  created_at?: string;
  updated_at?: string;
}

export interface Template {
  id?: string;
  name: string;
  subject?: string;
  content: string;
  type?: string;
  path?: string;      // Added path to support storage file path
  file_url?: string;  // Added file_url to support public URLs
  created_at?: string;
  updated_at?: string;
}

// Campaign-related interfaces
export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  status?: string;
  email_template_id?: string;
  loi_template_id?: string;
  leads_per_day?: number;
  start_time?: string;
  end_time?: string;
  min_interval_minutes?: number;
  max_interval_minutes?: number;
  attachment_type?: string;
  total_leads?: number;
  leads_worked?: number;
  company_logo_path?: string;
  email_subject?: string;
  email_body?: string;
  created_at?: string;
  updated_at?: string;
  tracking_enabled?: boolean;
}

export interface CampaignSender {
  id?: string;
  campaign_id: string;
  sender_id: string;
  emails_sent_today?: number;
  total_emails_sent?: number;
  last_sent_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignLead {
  id?: string;
  campaign_id: string;
  lead_id: string;
  status?: string;
  processed_at?: string;
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

// Add insertLead as an alias for createLead to match what the tests are expecting
export const insertLead = createLead;

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
  try {
    // First, fetch the leads
    let query = supabase.from('leads').select('*');

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

    const { data: leadsData, error: leadsError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
      return []; // Return empty array on error
    }

    // Now fetch all contacts for these leads in a single query
    if (leadsData && leadsData.length > 0) {
      const leadIds = leadsData.map(lead => lead.id);
      
      const { data: contactsData, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .in('lead_id', leadIds)
        .order('is_primary', { ascending: false });

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        // Return leads without contacts
        return leadsData as Lead[];
      }

      // Group contacts by lead_id
      const contactsByLeadId: Record<string, Contact[]> = {};
      contactsData?.forEach(contact => {
        if (!contactsByLeadId[contact.lead_id]) {
          contactsByLeadId[contact.lead_id] = [];
        }
        contactsByLeadId[contact.lead_id].push(contact as Contact);
      });

      // Attach contacts to their leads
      const leadsWithContacts = leadsData.map(lead => {
        return {
          ...lead,
          contacts: contactsByLeadId[lead.id || ''] || []
        };
      });

      return leadsWithContacts as Lead[];
    }

    return leadsData as Lead[];
  } catch (error) {
    console.error('Error in getLeads:', error);
    return [];
  }
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

export async function updateLeadStatus(id: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating lead status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateLeadStatus:', error);
    return false;
  }
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

/**
 * Get emails by message ID (needed for Gmail reply tracking)
 * @param messageId The Gmail message ID to search for
 * @returns Array of matching Email records
 */
export async function getEmailsByMessageId(messageId: string): Promise<Email[]> {
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('message_id', messageId);
      
    if (error) {
      console.error('Error fetching emails by message ID:', error);
      return [];
    }
    
    return data as Email[];
  } catch (error) {
    console.error('Error in getEmailsByMessageId:', error);
    return [];
  }
}

/**
 * Get all active senders that need email monitoring
 * @returns Array of active senders with validated OAuth tokens
 */
export async function getAllActiveSenders(): Promise<Sender[]> {
  try {
    // Join senders with oauth_tokens to only get senders with valid tokens
    const { data, error } = await supabase
      .from('senders')
      .select(`
        *,
        oauth_tokens:oauth_tokens!inner (*)
      `)
      .neq('oauth_tokens.refresh_token', null);
      
    if (error) {
      console.error('Error fetching active senders:', error);
      return [];
    }
    
    return data.map(item => ({
      ...item,
      oauth_token: item.oauth_tokens?.refresh_token
    })) as Sender[];
  } catch (error) {
    console.error('Error in getAllActiveSenders:', error);
    return [];
  }
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

// Template save operation
export async function saveTemplate(template: Template): Promise<Template | null> {
  const now = new Date().toISOString();
  
  try {
    // If ID exists, update existing template
    if (template.id) {
      const { data, error } = await supabase
        .from('templates')
        .update({
          ...template,
          updated_at: now
        })
        .eq('id', template.id)
        .select();
      
      if (error) {
        console.error('Error updating template:', error);
        return null;
      }
      
      return data[0] as Template;
    } 
    // Otherwise create new template
    else {
      const { data, error } = await supabase
        .from('templates')
        .insert([{
          ...template,
          created_at: now,
          updated_at: now
        }])
        .select();
      
      if (error) {
        console.error('Error creating template:', error);
        return null;
      }
      
      return data[0] as Template;
    }
  } catch (error) {
    console.error('Error in saveTemplate:', error);
    return null;
  }
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

export async function getSenderById(id: string): Promise<Sender | null> {
  const { data, error } = await supabase
    .from('senders')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching sender by ID:', error);
    return null;
  }

  return data as Sender;
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

export async function createSender(sender: Sender): Promise<Sender | null> {
  try {
    const now = new Date().toISOString();
    const newSender = {
      ...sender,
      created_at: now,
      updated_at: now,
      emails_sent: 0,
      daily_quota: sender.daily_quota || 100
    };

    const { data, error } = await supabase
      .from('senders')
      .insert([newSender])
      .select();

    if (error) {
      console.error('Error creating sender:', error);
      return null;
    }

    return data[0] as Sender;
  } catch (error) {
    console.error('Error in createSender:', error);
    return null;
  }
}

export async function updateSenderProfile(id: string, updates: Partial<Sender>): Promise<Sender | null> {
  try {
    const { data, error } = await supabase
      .from('senders')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Error updating sender:', error);
      return null;
    }

    return data[0] as Sender;
  } catch (error) {
    console.error('Error in updateSenderProfile:', error);
    return null;
  }
}

export async function deleteSender(id: string): Promise<boolean> {
  try {
    // First delete any OAuth tokens for this sender
    await supabase
      .from('oauth_tokens')
      .delete()
      .eq('sender_id', id);
      
    // Then delete the sender record
    const { error } = await supabase
      .from('senders')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting sender:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteSender:', error);
    return false;
  }
}
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

// Campaign operations
export async function getCampaigns(status?: string): Promise<Campaign[]> {
  try {
    let query = supabase.from('campaigns').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error getting campaigns:', error);
      return [];
    }
    
    return data as Campaign[];
  } catch (error) {
    console.error('Error in getCampaigns:', error);
    return [];
  }
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error getting campaign:', error);
      return null;
    }
    
    return data as Campaign;
  } catch (error) {
    console.error('Error in getCampaignById:', error);
    return null;
  }
}

export async function createCampaign(campaign: Campaign): Promise<Campaign | null> {
  try {
    const now = new Date().toISOString();
    
    const newCampaign = {
      ...campaign,
      created_at: now,
      updated_at: now,
      status: campaign.status || 'DRAFT',
      leads_worked: 0
    };
    
    const { data, error } = await supabase
      .from('campaigns')
      .insert([newCampaign])
      .select();
    
    if (error || !data || data.length === 0) {
      console.error('Error creating campaign:', error);
      return null;
    }
    
    return data[0] as Campaign;
  } catch (error) {
    console.error('Error in createCampaign:', error);
    return null;
  }
}

export async function updateCampaignStatus(id: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating campaign status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCampaignStatus:', error);
    return false;
  }
}

export async function updateCampaignProgress(id: string, additionalLeadsWorked: number): Promise<boolean> {
  try {
    // First get the current campaign to get the current leads_worked
    const campaign = await getCampaignById(id);
    if (!campaign) return false;
    
    const currentLeadsWorked = campaign.leads_worked || 0;
    const newLeadsWorked = currentLeadsWorked + additionalLeadsWorked;
    
    // Update the campaign with the new leads_worked count
    const { error } = await supabase
      .from('campaigns')
      .update({
        leads_worked: newLeadsWorked,
        updated_at: new Date().toISOString(),
        // If all leads have been worked, update the status to COMPLETED
        ...(newLeadsWorked >= (campaign.total_leads || 0) ? { status: 'COMPLETED' } : {})
      })
      .eq('id', id);
    
    if (error) {
      console.error('Error updating campaign progress:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCampaignProgress:', error);
    return false;
  }
}

export async function getCampaignSenders(campaignId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_senders')
      .select(`
        *,
        sender:sender_id (*)
      `)
      .eq('campaign_id', campaignId);
    
    if (error || !data) {
      console.error('Error getting campaign senders:', error);
      return [];
    }
    
    // Transform the data to include sender details
    return data.map(item => ({
      id: item.sender_id,
      campaign_id: item.campaign_id,
      emails_sent_today: item.emails_sent_today || 0,
      total_emails_sent: item.total_emails_sent || 0,
      last_sent_at: item.last_sent_at,
      ...item.sender
    }));
  } catch (error) {
    console.error('Error in getCampaignSenders:', error);
    return [];
  }
}

export async function addSendersToCampaign(campaignId: string, senderIds: string[]): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    const campaignSenders = senderIds.map(senderId => ({
      campaign_id: campaignId,
      sender_id: senderId,
      emails_sent_today: 0,
      total_emails_sent: 0,
      created_at: now,
      updated_at: now
    }));
    
    const { error } = await supabase
      .from('campaign_senders')
      .insert(campaignSenders);
    
    if (error) {
      console.error('Error adding senders to campaign:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in addSendersToCampaign:', error);
    return false;
  }
}

export async function updateCampaignSenderStats(senderId: string, stats: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_senders')
      .update({
        ...stats,
        updated_at: new Date().toISOString()
      })
      .eq('sender_id', senderId);
    
    if (error) {
      console.error('Error updating sender stats:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCampaignSenderStats:', error);
    return false;
  }
}

export async function resetDailySenderStats(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_senders')
      .update({
        emails_sent_today: 0,
        updated_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error resetting daily sender stats:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in resetDailySenderStats:', error);
    return false;
  }
}

export async function getCampaignLeads(campaignId: string, status?: string): Promise<any[]> {
  try {
    let query = supabase
      .from('campaign_leads')
      .select(`
        *,
        lead:lead_id (*)
      `)
      .eq('campaign_id', campaignId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      console.error('Error getting campaign leads:', error);
      return [];
    }
    
    // Transform the data to include lead details
    return data.map(item => ({
      id: item.lead_id,
      campaign_lead_id: item.id,
      campaign_id: item.campaign_id,
      status: item.status,
      ...item.lead
    }));
  } catch (error) {
    console.error('Error in getCampaignLeads:', error);
    return [];
  }
}

export async function addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    const campaignLeads = leadIds.map(leadId => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'PENDING',
      created_at: now,
      updated_at: now
    }));
    
    const { error } = await supabase
      .from('campaign_leads')
      .insert(campaignLeads);
    
    if (error) {
      console.error('Error adding leads to campaign:', error);
      return false;
    }
    
    // Update the campaign's total_leads count
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        total_leads: leadIds.length,
        updated_at: now
      })
      .eq('id', campaignId);
    
    if (updateError) {
      console.error('Error updating campaign total_leads:', updateError);
    }
    
    return true;
  } catch (error) {
    console.error('Error in addLeadsToCampaign:', error);
    return false;
  }
}

/**
 * Update campaign lead status with assigned sender
 * Extends the basic updateCampaignLeadStatus function to include sender assignment
 */
export async function updateCampaignLeadStatus(
  campaignId: string,
  leadId: string,
  status: string,
  senderId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_leads')
      .update({
        status,
        assigned_sender_id: senderId,
        updated_at: new Date().toISOString(),
        ...(status === 'PROCESSED' ? { processed_at: new Date().toISOString() } : {})
      })
      .eq('campaign_id', campaignId)
      .eq('lead_id', leadId);
    
    if (error) {
      console.error('Error updating campaign lead status:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCampaignLeadStatus:', error);
    return false;
  }
}

/**
 * Get unassigned leads for a campaign
 * Returns leads that are in PENDING status (not yet assigned to any sender)
 */
export async function getCampaignUnassignedLeads(
  campaignId: string,
  limit: number = 10
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        lead:lead_id (*)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'PENDING')
      .is('assigned_sender_id', null)
      .limit(limit);
    
    if (error || !data) {
      console.error('Error getting unassigned campaign leads:', error);
      return [];
    }
    
    // Transform the data to include lead details
    return data.map(item => ({
      id: item.lead_id,
      campaign_lead_id: item.id,
      campaign_id: item.campaign_id,
      status: item.status,
      ...item.lead
    }));
  } catch (error) {
    console.error('Error in getCampaignUnassignedLeads:', error);
    return [];
  }
}

/**
 * Mark a lead as worked by a sender with specific results
 * This updates the lead status and records the outcome in campaign_lead_results
 */
export async function markLeadAsWorked(
  campaignId: string,
  leadId: string,
  senderId: string,
  workResult: {
    status: 'CONTACTED' | 'BOUNCED' | 'FAILED' | 'SKIPPED';
    emailSent?: boolean;
    emailOpened?: boolean;
    emailClicked?: boolean;
    emailReplied?: boolean;
    notes?: string;
  }
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // 1. Update the campaign_leads status to PROCESSED
    const { error: updateError } = await supabase
      .from('campaign_leads')
      .update({
        status: 'PROCESSED',
        processed_at: now,
        updated_at: now
      })
      .eq('campaign_id', campaignId)
      .eq('lead_id', leadId);
    
    if (updateError) {
      console.error('Error updating campaign lead as processed:', updateError);
      return false;
    }
    
    // 2. Record the result details in campaign_lead_results
    const { error: resultError } = await supabase
      .from('campaign_lead_results')
      .insert([{
        campaign_id: campaignId,
        lead_id: leadId,
        sender_id: senderId,
        result_status: workResult.status,
        email_sent: workResult.emailSent || false,
        email_opened: workResult.emailOpened || false,
        email_clicked: workResult.emailClicked || false,
        email_replied: workResult.emailReplied || false,
        notes: workResult.notes || '',
        created_at: now
      }]);
    
    if (resultError) {
      console.error('Error recording campaign lead result:', resultError);
      return false;
    }
    
    // 3. Increment the campaign's leads_worked count by 1
    await updateCampaignProgress(campaignId, 1);
    
    return true;
  } catch (error) {
    console.error('Error in markLeadAsWorked:', error);
    return false;
  }
}

/**
 * Update campaign statistics
 */
export async function updateCampaignStats(
  campaignId: string,
  stats: {
    leadsWorked?: number;
    emailsSent?: number;
    emailsOpened?: number;
    emailsClicked?: number;
    emailsReplied?: number;
    emailsBounced?: number;
  }
): Promise<boolean> {
  try {
    // Get current campaign stats
    const { data: campaign, error: getError } = await supabase
      .from('campaigns')
      .select('stats')
      .eq('id', campaignId)
      .single();
    
    if (getError) {
      console.error('Error getting campaign stats:', getError);
      return false;
    }
    
    // Initialize or update stats object
    const currentStats = campaign.stats || {
      leadsWorked: 0,
      emailsSent: 0,
      emailsOpened: 0,
      emailsClicked: 0,
      emailsReplied: 0,
      emailsBounced: 0
    };
    
    const newStats = {
      leadsWorked: (currentStats.leadsWorked || 0) + (stats.leadsWorked || 0),
      emailsSent: (currentStats.emailsSent || 0) + (stats.emailsSent || 0),
      emailsOpened: (currentStats.emailsOpened || 0) + (stats.emailsOpened || 0),
      emailsClicked: (currentStats.emailsClicked || 0) + (stats.emailsClicked || 0),
      emailsReplied: (currentStats.emailsReplied || 0) + (stats.emailsReplied || 0),
      emailsBounced: (currentStats.emailsBounced || 0) + (stats.emailsBounced || 0)
    };
    
    // Update campaign with new stats
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({
        stats: newStats,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    if (updateError) {
      console.error('Error updating campaign stats:', updateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateCampaignStats:', error);
    return false;
  }
}

/**
 * Update sender statistics for a campaign
 */
export async function updateSenderStats(
  senderId: string,
  stats: {
    leadsWorked?: number;
    emailsSent?: number;
    emailsOpened?: number;
    emailsClicked?: number;
    emailsReplied?: number;
    emailsBounced?: number;
  }
): Promise<boolean> {
  try {
    // Get current sender stats from campaign_senders
    const { data: senderEntries, error: getError } = await supabase
      .from('campaign_senders')
      .select('*')
      .eq('sender_id', senderId);
    
    if (getError) {
      console.error('Error getting sender stats:', getError);
      return false;
    }
    
    // For each campaign this sender is part of, update their stats
    for (const entry of senderEntries) {
      // Update campaign-specific stats
      const currentEmailsSent = entry.total_emails_sent || 0;
      const currentEmailsSentToday = entry.emails_sent_today || 0;
      
      const { error: updateError } = await supabase
        .from('campaign_senders')
        .update({
          total_emails_sent: currentEmailsSent + (stats.emailsSent || 0),
          emails_sent_today: currentEmailsSentToday + (stats.emailsSent || 0),
          last_sent_at: stats.emailsSent ? new Date().toISOString() : entry.last_sent_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', entry.id);
      
      if (updateError) {
        console.error('Error updating sender stats for campaign:', updateError);
        // Continue with other campaigns even if one fails
      }
    }
    
    // Update global sender stats
    const { data: sender, error: senderGetError } = await supabase
      .from('senders')
      .select('emails_sent, last_sent_at')
      .eq('id', senderId)
      .single();
    
    if (senderGetError) {
      console.error('Error getting sender:', senderGetError);
      return false;
    }
    
    const currentEmailsSent = sender.emails_sent || 0;
    
    const { error: senderUpdateError } = await supabase
      .from('senders')
      .update({
        emails_sent: currentEmailsSent + (stats.emailsSent || 0),
        last_sent_at: stats.emailsSent ? new Date().toISOString() : sender.last_sent_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', senderId);
    
    if (senderUpdateError) {
      console.error('Error updating global sender stats:', senderUpdateError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateSenderStats:', error);
    return false;
  }
}

/**
 * Start a campaign by setting its status to ACTIVE
 */
export async function startCampaign(campaignId: string): Promise<boolean> {
  try {
    return await updateCampaignStatus(campaignId, 'ACTIVE');
  } catch (error) {
    console.error('Error starting campaign:', error);
    return false;
  }
}

/**
 * Pause a campaign by setting its status to PAUSED
 */
export async function pauseCampaign(campaignId: string): Promise<boolean> {
  try {
    return await updateCampaignStatus(campaignId, 'PAUSED');
  } catch (error) {
    console.error('Error pausing campaign:', error);
    return false;
  }
}

/**
 * Complete a campaign by setting its status to COMPLETED
 */
export async function completeCampaign(campaignId: string): Promise<boolean> {
  try {
    return await updateCampaignStatus(campaignId, 'COMPLETED');
  } catch (error) {
    console.error('Error completing campaign:', error);
    return false;
  }
}

/**
 * OAuth Credentials Type Definition
 * Used for storing and retrieving OAuth tokens
 */
export interface OAuthCredentials {
  email: string;
  sender_id?: string;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expiry_date?: number;
  scopes?: string;
  client_id?: string;
  client_secret?: string;
}

/**
 * Get OAuth token by email address
 */
export async function getOAuthTokenByEmail(email: string): Promise<OAuthCredentials | null> {
  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) {
      console.error('Error getting OAuth token by email:', error);
      return null;
    }
    
    return data as OAuthCredentials;
  } catch (error) {
    console.error('Error in getOAuthTokenByEmail:', error);
    return null;
  }
}

/**
 * Save or update OAuth token
 */
export async function saveOAuthToken(credentials: OAuthCredentials): Promise<OAuthCredentials | null> {
  try {
    // First check if a token already exists for this email
    const { data: existingToken } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', credentials.email)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    if (existingToken) {
      // Update existing token
      const { data, error } = await supabase
        .from('oauth_tokens')
        .update({
          ...credentials,
          updated_at: now
        })
        .eq('email', credentials.email)
        .select();
      
      if (error) {
        console.error('Error updating OAuth token:', error);
        return null;
      }
      
      return data[0] as OAuthCredentials;
    } else {
      // Insert new token
      const { data, error } = await supabase
        .from('oauth_tokens')
        .insert([{
          ...credentials,
          created_at: now,
          updated_at: now
        }])
        .select();
      
      if (error) {
        console.error('Error creating OAuth token:', error);
        return null;
      }
      
      return data[0] as OAuthCredentials;
    }
  } catch (error) {
    console.error('Error in saveOAuthToken:', error);
    return null;
  }
}

/**
 * Get client secret by client ID
 */
export async function getClientSecret(clientId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('client_secrets')
      .select('client_secret')
      .eq('client_id', clientId)
      .single();
    
    if (error || !data) {
      console.error('Error getting client secret:', error);
      return null;
    }
    
    return data.client_secret as string;
  } catch (error) {
    console.error('Error in getClientSecret:', error);
    return null;
  }
}

/**
 * Save client secret
 */
export async function saveClientSecret(clientId: string, clientSecret: string): Promise<boolean> {
  try {
    // First check if a client secret already exists for this client ID
    const { data: existingSecret } = await supabase
      .from('client_secrets')
      .select('*')
      .eq('client_id', clientId)
      .maybeSingle();
    
    const now = new Date().toISOString();
    
    if (existingSecret) {
      // Update existing secret
      const { error } = await supabase
        .from('client_secrets')
        .update({
          client_secret: clientSecret,
          updated_at: now
        })
        .eq('client_id', clientId);
      
      if (error) {
        console.error('Error updating client secret:', error);
        return false;
      }
    } else {
      // Insert new secret
      const { error } = await supabase
        .from('client_secrets')
        .insert([{
          client_id: clientId,
          client_secret: clientSecret,
          created_at: now,
          updated_at: now
        }]);
      
      if (error) {
        console.error('Error creating client secret:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveClientSecret:', error);
    return false;
  }
}

/**
 * Get all OAuth tokens from the database
 * @param userId Optional user ID to filter tokens by
 */
export async function getAllOAuthTokens(userId?: string): Promise<any[]> {
  try {
    let query = supabase.from('oauth_tokens').select('*');
    
    if (userId) {
      // If a user ID is provided, filter by user ID
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error getting OAuth tokens:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getAllOAuthTokens:', error);
    return [];
  }
}

/**
 * Update token refresh attempt status and track failures
 * @param tokenId The ID of the token
 * @param success Whether the refresh attempt was successful
 * @param errorMessage Optional error message if the attempt failed
 */
export async function updateTokenRefreshAttempt(
  tokenId: string, 
  success: boolean,
  errorMessage?: string
): Promise<boolean> {
  try {
    // First get the current token to check its consecutive failures
    const { data: currentToken, error: getError } = await supabase
      .from('oauth_tokens')
      .select('consecutive_refresh_failures')
      .eq('id', tokenId)
      .single();
    
    if (getError) {
      console.error('Error getting current token status:', getError);
      return false;
    }
    
    // Calculate the new failure count
    let consecutiveFailures = currentToken?.consecutive_refresh_failures || 0;
    
    if (success) {
      // Reset failure count on success
      consecutiveFailures = 0;
    } else {
      // Increment failure count on failure
      consecutiveFailures += 1;
    }
    
    // Update the token record
    const { error } = await supabase
      .from('oauth_tokens')
      .update({
        consecutive_refresh_failures: consecutiveFailures,
        last_refresh_attempt: new Date().toISOString(),
        last_refresh_error: success ? null : errorMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', tokenId);
    
    if (error) {
      console.error('Error updating token refresh attempt:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in updateTokenRefreshAttempt:', error);
    return false;
  }
}