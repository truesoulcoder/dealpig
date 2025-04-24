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

// Campaign-related interfaces
export interface Campaign {
  id?: string;
  name: string;
  description?: string;
  email_template_id?: string;
  loi_template_id?: string;
  status?: string;
  leads_per_day?: number;
  start_time?: string;
  end_time?: string;
  min_interval_minutes?: number;
  max_interval_minutes?: number;
  attachment_type?: string;
  started_at?: string;
  completed_at?: string;
  total_leads?: number;
  leads_worked?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignLead {
  id?: string;
  campaign_id: string;
  lead_id: string;
  sender_id?: string;
  status?: string;
  scheduled_for?: string;
  processed_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignSender {
  id?: string;
  campaign_id: string;
  sender_id: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SenderToken {
  id?: string;
  sender_id: string;
  oauth_token: string;
  refresh_token: string;
  expires_at: string;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignStats {
  id?: string;
  campaign_id: string;
  date: string;
  total_sent: number;
  total_opened: number;
  total_replied: number;
  total_bounced: number;
  created_at?: string;
  updated_at?: string;
}

export interface SenderStats {
  id?: string;
  sender_id: string;
  campaign_id: string;
  date: string;
  emails_sent: number;
  emails_opened: number;
  emails_replied: number;
  emails_bounced: number;
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

// Campaign operations
export async function createCampaign(campaign: Campaign): Promise<Campaign | null> {
  const now = new Date().toISOString();
  const newCampaign = {
    ...campaign,
    status: campaign.status || 'DRAFT',
    leads_per_day: campaign.leads_per_day || 20,
    min_interval_minutes: campaign.min_interval_minutes || 15,
    max_interval_minutes: campaign.max_interval_minutes || 60,
    attachment_type: campaign.attachment_type || 'PDF',
    total_leads: 0,
    leads_worked: 0,
    created_at: now,
    updated_at: now
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
}

export async function getCampaigns(status?: string): Promise<Campaign[]> {
  let query = supabase
    .from('campaigns')
    .select(`
      *,
      email_template:email_template_id (name, type),
      loi_template:loi_template_id (name, type)
    `);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaigns:', error);
    return [];
  }

  return data as Campaign[];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(`
      *,
      email_template:email_template_id (name, subject, content, type),
      loi_template:loi_template_id (name, content, type)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching campaign:', error);
    return null;
  }

  return data as Campaign;
}

export async function updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating campaign:', error);
    return null;
  }

  return data[0] as Campaign;
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting campaign:', error);
    return false;
  }

  return true;
}

// Campaign status operations
export async function startCampaign(id: string): Promise<Campaign | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ 
      status: 'ACTIVE', 
      started_at: now,
      updated_at: now 
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error starting campaign:', error);
    return null;
  }

  return data[0] as Campaign;
}

export async function pauseCampaign(id: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from('campaigns')
    .update({ 
      status: 'PAUSED',
      updated_at: new Date().toISOString() 
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error pausing campaign:', error);
    return null;
  }

  return data[0] as Campaign;
}

export async function completeCampaign(id: string): Promise<Campaign | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ 
      status: 'COMPLETED',
      completed_at: now,
      updated_at: now
    })
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error completing campaign:', error);
    return null;
  }

  return data[0] as Campaign;
}

// Campaign Leads operations
export async function addLeadsToCampaign(campaignId: string, leadIds: string[]): Promise<number> {
  const now = new Date().toISOString();
  const campaignLeads = leadIds.map(leadId => ({
    campaign_id: campaignId,
    lead_id: leadId,
    status: 'PENDING',
    created_at: now,
    updated_at: now
  }));

  const { data, error } = await supabase
    .from('campaign_leads')
    .insert(campaignLeads)
    .select();

  if (error) {
    console.error('Error adding leads to campaign:', error);
    return 0;
  }

  // Update the campaign's total_leads count
  await supabase
    .from('campaigns')
    .update({ 
      total_leads: supabase.rpc('increment', { x: leadIds.length }),
      updated_at: now
    })
    .eq('id', campaignId);

  return data.length;
}

export async function removeLeadFromCampaign(campaignId: string, leadId: string): Promise<boolean> {
  const { error } = await supabase
    .from('campaign_leads')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('lead_id', leadId);

  if (error) {
    console.error('Error removing lead from campaign:', error);
    return false;
  }

  // Decrement the campaign's total_leads count
  await supabase
    .from('campaigns')
    .update({ 
      total_leads: supabase.rpc('decrement', { x: 1 }),
      updated_at: new Date().toISOString()
    })
    .eq('id', campaignId);

  return true;
}

export async function getCampaignLeads(campaignId: string): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('campaign_leads')
    .select(`
      lead_id,
      status,
      sender_id,
      scheduled_for,
      processed_at,
      leads!lead_id (
        id,
        property_address,
        property_city,
        property_state,
        property_zip,
        status,
        contacts (*)
      )
    `)
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching campaign leads:', error);
    return [];
  }

  // Reformat to return an array of leads with campaign-specific status
  return data.map(item => ({
    ...item.leads,
    campaign_status: item.status,
    sender_id: item.sender_id,
    scheduled_for: item.scheduled_for,
    processed_at: item.processed_at
  })) as Lead[];
}

export async function getLeadsForSender(campaignId: string, senderId: string, status?: string): Promise<CampaignLead[]> {
  let query = supabase
    .from('campaign_leads')
    .select(`
      *,
      leads!lead_id (
        id,
        property_address,
        property_city,
        property_state,
        property_zip,
        status,
        contacts (*)
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('sender_id', senderId);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query.order('scheduled_for', { ascending: true });

  if (error) {
    console.error('Error fetching leads for sender:', error);
    return [];
  }

  return data as unknown as CampaignLead[];
}

export async function assignLeadsToSenders(campaignId: string): Promise<boolean> {
  // Get all pending leads for the campaign
  const { data: pendingLeads, error: pendingError } = await supabase
    .from('campaign_leads')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'PENDING');

  if (pendingError) {
    console.error('Error fetching pending campaign leads:', pendingError);
    return false;
  }

  // Get all active senders for the campaign
  const { data: campaignSenders, error: senderError } = await supabase
    .from('campaign_senders')
    .select(`
      sender_id,
      senders!sender_id (
        id,
        daily_quota,
        emails_sent
      )
    `)
    .eq('campaign_id', campaignId)
    .eq('is_active', true);

  if (senderError) {
    console.error('Error fetching campaign senders:', senderError);
    return false;
  }

  if (campaignSenders.length === 0) {
    console.error('No active senders found for campaign');
    return false;
  }

  // Assign leads evenly among senders
  const now = new Date();
  const today = now.toISOString().substring(0, 10); // YYYY-MM-DD
  
  // Get campaign settings
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .select('leads_per_day, min_interval_minutes, max_interval_minutes, start_time, end_time')
    .eq('id', campaignId)
    .single();

  if (campaignError) {
    console.error('Error fetching campaign:', campaignError);
    return false;
  }

  // Get start and end time for the day
  const startTime = campaign.start_time || '09:00:00';
  const endTime = campaign.end_time || '17:00:00';
  
  const startDate = new Date(`${today}T${startTime}`);
  const endDate = new Date(`${today}T${endTime}`);
  
  // Calculate available time in minutes
  const availableMinutes = (endDate.getTime() - startDate.getTime()) / (60 * 1000);
  
  // Calculate number of leads to assign today
  const leadsToAssign = Math.min(pendingLeads.length, campaign.leads_per_day || 20);
  
  if (leadsToAssign === 0) {
    return true; // No leads to assign
  }
  
  // Calculate interval between emails
  const interval = Math.max(
    campaign.min_interval_minutes || 15,
    Math.min(
      availableMinutes / leadsToAssign,
      campaign.max_interval_minutes || 60
    )
  );
  
  // Sort senders by emails_sent to evenly distribute workload
  const sortedSenders = [...campaignSenders].sort((a, b) => 
    (a.senders?.emails_sent || 0) - (b.senders?.emails_sent || 0)
  );
  
  // Assign leads
  let currentSenderIndex = 0;
  let currentTime = startDate.getTime();
  const assignmentUpdates = [];
  
  for (let i = 0; i < leadsToAssign; i++) {
    const lead = pendingLeads[i];
    const sender = sortedSenders[currentSenderIndex % sortedSenders.length];
    
    assignmentUpdates.push({
      id: lead.id,
      sender_id: sender.sender_id,
      status: 'ASSIGNED',
      scheduled_for: new Date(currentTime).toISOString(),
      updated_at: now.toISOString()
    });
    
    // Move to next sender and increment time
    currentSenderIndex++;
    currentTime += interval * 60 * 1000;
    
    // If we've gone past the end time, reset to start time for next day
    if (currentTime > endDate.getTime()) {
      startDate.setDate(startDate.getDate() + 1);
      endDate.setDate(endDate.getDate() + 1);
      currentTime = startDate.getTime();
    }
  }
  
  // Update assignments in batch
  const { error: updateError } = await supabase
    .from('campaign_leads')
    .upsert(assignmentUpdates);
  
  if (updateError) {
    console.error('Error assigning leads:', updateError);
    return false;
  }
  
  return true;
}

export async function updateCampaignLeadStatus(id: string, status: string, additionalData?: Partial<CampaignLead>): Promise<CampaignLead | null> {
  const updates = {
    status,
    updated_at: new Date().toISOString(),
    ...additionalData
  };

  // If status is SENT, record processing time
  if (status === 'SENT') {
    updates.processed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('campaign_leads')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating campaign lead status:', error);
    return null;
  }

  // If lead was sent, increment the leads_worked count for the campaign
  if (status === 'SENT') {
    await supabase
      .from('campaigns')
      .update({ 
        leads_worked: supabase.rpc('increment', { x: 1 }),
        updated_at: new Date().toISOString()
      })
      .eq('id', data[0].campaign_id);
  }

  return data[0] as CampaignLead;
}

// Campaign Senders operations
export async function addSendersToCampaign(campaignId: string, senderIds: string[]): Promise<number> {
  const now = new Date().toISOString();
  const campaignSenders = senderIds.map(senderId => ({
    campaign_id: campaignId,
    sender_id: senderId,
    is_active: true,
    created_at: now,
    updated_at: now
  }));

  const { data, error } = await supabase
    .from('campaign_senders')
    .insert(campaignSenders)
    .select();

  if (error) {
    console.error('Error adding senders to campaign:', error);
    return 0;
  }

  return data.length;
}

export async function removeSenderFromCampaign(campaignId: string, senderId: string): Promise<boolean> {
  const { error } = await supabase
    .from('campaign_senders')
    .delete()
    .eq('campaign_id', campaignId)
    .eq('sender_id', senderId);

  if (error) {
    console.error('Error removing sender from campaign:', error);
    return false;
  }

  return true;
}

export async function getCampaignSenders(campaignId: string): Promise<Sender[]> {
  const { data, error } = await supabase
    .from('campaign_senders')
    .select(`
      is_active,
      senders:sender_id (*)
    `)
    .eq('campaign_id', campaignId);

  if (error) {
    console.error('Error fetching campaign senders:', error);
    return [];
  }

  return data.map(item => ({
    ...item.senders,
    is_active: item.is_active
  })) as Sender[];
}

export async function updateSenderActiveStatus(campaignId: string, senderId: string, isActive: boolean): Promise<boolean> {
  const { error } = await supabase
    .from('campaign_senders')
    .update({ 
      is_active: isActive,
      updated_at: new Date().toISOString() 
    })
    .eq('campaign_id', campaignId)
    .eq('sender_id', senderId);

  if (error) {
    console.error('Error updating sender active status:', error);
    return false;
  }

  return true;
}

// Token management
export async function saveSenderToken(token: SenderToken): Promise<SenderToken | null> {
  const now = new Date().toISOString();
  const newToken = {
    ...token,
    created_at: now,
    updated_at: now
  };

  const { data, error } = await supabase
    .from('sender_tokens')
    .upsert([newToken], { onConflict: 'sender_id' })
    .select();

  if (error) {
    console.error('Error saving sender token:', error);
    return null;
  }

  return data[0] as SenderToken;
}

export async function getSenderToken(senderId: string): Promise<SenderToken | null> {
  const { data, error } = await supabase
    .from('sender_tokens')
    .select('*')
    .eq('sender_id', senderId)
    .single();

  if (error) {
    console.error('Error fetching sender token:', error);
    return null;
  }

  return data as SenderToken;
}

// Analytics operations
export async function recordEmailStats(emailId: string, campaignId: string, senderId: string, status: string): Promise<boolean> {
  const now = new Date();
  const today = now.toISOString().substring(0, 10); // YYYY-MM-DD
  
  // Update campaign stats
  const { error: campaignError } = await supabase.rpc('increment_campaign_stat', {
    p_campaign_id: campaignId,
    p_date: today,
    p_field: `total_${status.toLowerCase()}`
  });

  if (campaignError) {
    console.error('Error updating campaign stats:', campaignError);
    return false;
  }

  // Update sender stats
  const { error: senderError } = await supabase.rpc('increment_sender_stat', {
    p_sender_id: senderId,
    p_campaign_id: campaignId,
    p_date: today,
    p_field: `emails_${status.toLowerCase()}`
  });

  if (senderError) {
    console.error('Error updating sender stats:', senderError);
    return false;
  }

  return true;
}

export async function getCampaignStatsByDate(campaignId: string, startDate?: string, endDate?: string): Promise<CampaignStats[]> {
  let query = supabase
    .from('campaign_stats')
    .select('*')
    .eq('campaign_id', campaignId);
  
  if (startDate) {
    query = query.gte('date', startDate);
  }
  
  if (endDate) {
    query = query.lte('date', endDate);
  }
  
  const { data, error } = await query.order('date');

  if (error) {
    console.error('Error fetching campaign stats:', error);
    return [];
  }

  return data as CampaignStats[];
}

export async function getSenderStatsByCampaign(campaignId: string, senderId?: string): Promise<SenderStats[]> {
  let query = supabase
    .from('sender_stats')
    .select(`
      *,
      senders:sender_id (name, email)
    `)
    .eq('campaign_id', campaignId);
  
  if (senderId) {
    query = query.eq('sender_id', senderId);
  }
  
  const { data, error } = await query.order('date');

  if (error) {
    console.error('Error fetching sender stats:', error);
    return [];
  }

  return data as SenderStats[];
}