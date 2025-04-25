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

// Additional functions needed by campaignScheduler.ts
export async function updateLeadStatus(leadId: string, status: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({ 
        status, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', leadId);
    
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

export async function getSenderById(id: string): Promise<Sender | null> {
  try {
    const { data, error } = await supabase
      .from('senders')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching sender:', error);
      return null;
    }
    
    return data as Sender;
  } catch (error) {
    console.error('Error in getSenderById:', error);
    return null;
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

export async function updateSenderStats(senderId: string, stats: any): Promise<boolean> {
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
    console.error('Error in updateSenderStats:', error);
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
      campaign_id: item.campaign_id,
      campaign_lead_id: item.id,
      status: item.status,
      processed_at: item.processed_at,
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

export async function updateCampaignLeadStatus(
  campaignId: string,
  leadId: string,
  status: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('campaign_leads')
      .update({
        status,
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

export async function getCampaignStatsByDate(
  campaignId: string,
  startDate: string,
  endDate: string
): Promise<any[]> {
  try {
    // This is a simplified version - in a real implementation,
    // you would use a SQL query with GROUP BY to aggregate data by date
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('sent_at', startDate)
      .lte('sent_at', endDate);
    
    if (error || !data) {
      console.error('Error getting campaign stats:', error);
      return [];
    }
    
    // Process the data to group by date
    const statsByDate = new Map<string, any>();
    
    data.forEach(email => {
      if (!email.sent_at) return;
      
      const date = email.sent_at.split('T')[0];
      
      if (!statsByDate.has(date)) {
        statsByDate.set(date, {
          date,
          total_sent: 0,
          total_opened: 0,
          total_replied: 0,
          total_bounced: 0
        });
      }
      
      const stats = statsByDate.get(date);
      stats.total_sent++;
      
      if (email.opened_at) stats.total_opened++;
      if (email.replied_at) stats.total_replied++;
      if (email.bounced_at) stats.total_bounced++;
    });
    
    return Array.from(statsByDate.values());
  } catch (error) {
    console.error('Error in getCampaignStatsByDate:', error);
    return [];
  }
}

// Campaign status update functions
export async function startCampaign(campaignId: string): Promise<boolean> {
  return updateCampaignStatus(campaignId, 'ACTIVE');
}

export async function pauseCampaign(campaignId: string): Promise<boolean> {
  return updateCampaignStatus(campaignId, 'PAUSED');
}

export async function completeCampaign(campaignId: string): Promise<boolean> {
  return updateCampaignStatus(campaignId, 'COMPLETED');
}

// OAuth Token storage interfaces
export interface OAuthCredentials {
  id?: string;
  user_id?: string;
  sender_id?: string;
  email: string;
  client_id?: string;
  client_secret?: string;
  refresh_token: string;
  access_token: string;
  token_type?: string;
  expiry_date?: number;
  created_at?: string;
  updated_at?: string;
  scopes?: string;
}

// OAuth token operations
export async function saveOAuthToken(credentials: OAuthCredentials): Promise<OAuthCredentials | null> {
  try {
    const now = new Date().toISOString();
    
    // Check if a record already exists for this email
    const { data: existingData, error: fetchError } = await supabase
      .from('oauth_tokens')
      .select('id')
      .eq('email', credentials.email)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking for existing token:', fetchError);
      return null;
    }
    
    // If token exists, update it
    if (existingData?.id) {
      const { data: updatedData, error: updateError } = await supabase
        .from('oauth_tokens')
        .update({
          ...credentials,
          updated_at: now
        })
        .eq('id', existingData.id)
        .select();
        
      if (updateError) {
        console.error('Error updating OAuth token:', updateError);
        return null;
      }
      
      return updatedData[0] as OAuthCredentials;
    }
    
    // Otherwise insert a new record
    const { data: insertedData, error: insertError } = await supabase
      .from('oauth_tokens')
      .insert([{
        ...credentials,
        created_at: now,
        updated_at: now
      }])
      .select();
      
    if (insertError) {
      console.error('Error saving OAuth token:', insertError);
      return null;
    }
    
    return insertedData[0] as OAuthCredentials;
  } catch (error) {
    console.error('Error in saveOAuthToken:', error);
    return null;
  }
}

export async function getOAuthTokenByEmail(email: string): Promise<OAuthCredentials | null> {
  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('email', email)
      .maybeSingle();
      
    if (error || !data) {
      console.error('Error fetching OAuth token:', error);
      return null;
    }
    
    return data as OAuthCredentials;
  } catch (error) {
    console.error('Error in getOAuthTokenByEmail:', error);
    return null;
  }
}

export async function saveClientSecret(clientId: string, clientSecret: string): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    
    // Check if client secret already exists
    const { data: existingData, error: fetchError } = await supabase
      .from('oauth_client_secrets')
      .select('id')
      .eq('client_id', clientId)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking for existing client secret:', fetchError);
      return false;
    }
    
    // If client secret exists, update it
    if (existingData?.id) {
      const { error: updateError } = await supabase
        .from('oauth_client_secrets')
        .update({
          client_secret: clientSecret,
          updated_at: now
        })
        .eq('id', existingData.id);
        
      if (updateError) {
        console.error('Error updating client secret:', updateError);
        return false;
      }
      
      return true;
    }
    
    // Otherwise insert a new record
    const { error: insertError } = await supabase
      .from('oauth_client_secrets')
      .insert([{
        client_id: clientId,
        client_secret: clientSecret,
        created_at: now,
        updated_at: now
      }]);
      
    if (insertError) {
      console.error('Error saving client secret:', insertError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in saveClientSecret:', error);
    return false;
  }
}

export async function getClientSecret(clientId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('oauth_client_secrets')
      .select('client_secret')
      .eq('client_id', clientId)
      .maybeSingle();
      
    if (error || !data) {
      console.error('Error fetching client secret:', error);
      return null;
    }
    
    return data.client_secret;
  } catch (error) {
    console.error('Error in getClientSecret:', error);
    return null;
  }
}

// Get all OAuth tokens for a user
export async function getOAuthTokensForUser(userId: string): Promise<OAuthCredentials[]> {
  try {
    const { data, error } = await supabase
      .from('oauth_tokens')
      .select('*')
      .eq('user_id', userId);
      
    if (error) {
      console.error('Error fetching OAuth tokens for user:', error);
      return [];
    }
    
    return data as OAuthCredentials[];
  } catch (error) {
    console.error('Error in getOAuthTokensForUser:', error);
    return [];
  }
}

// Delete an OAuth token
export async function deleteOAuthToken(id: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('oauth_tokens')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting OAuth token:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in deleteOAuthToken:', error);
    return false;
  }
}