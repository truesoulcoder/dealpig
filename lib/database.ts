import { supabase, createAdminClient } from './supabase';
import { UUID, Sender, Lead, Campaign, Template, CampaignSender, CampaignLead, Email } from '@/helpers/types';

// ==========================================
// USER AND AUTH RELATED FUNCTIONS
// ==========================================

/**
 * Get user profile by ID
 */
export async function getUserProfile(userId: UUID) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId: UUID, updates: any) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  
  if (error) throw error;
  return data;
}

// ==========================================
// SENDER RELATED FUNCTIONS
// ==========================================

/**
 * Fetch all email senders for the current user
 */
export async function getSenders(userId?: UUID): Promise<Sender[]> {
  try {
    const { data, error } = await supabase
      .from('senders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching senders:', error);
    throw error;
  }
}

/**
 * Get a single sender by ID
 */
export async function getSenderById(senderId: UUID): Promise<Sender | null> {
  try {
    const { data, error } = await supabase
      .from('senders')
      .select('*')
      .eq('id', senderId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching sender:', error);
    throw error;
  }
}

/**
 * Create a new sender
 */
export async function createSender(senderData: {
  name: string;
  email: string;
  title?: string;
  daily_quota: number;
}): Promise<UUID> {
  try {
    // Use admin client for better permissions in production
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('senders')
      .insert({
        name: senderData.name,
        email: senderData.email.toLowerCase(),
        title: senderData.title || '',
        daily_quota: senderData.daily_quota || 100,
        emails_sent: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating sender:', error, 'with data:', senderData);
    throw error;
  }
}

/**
 * Update an existing sender's OAuth tokens
 */
export async function updateSenderTokens(
  senderId: UUID, 
  tokens: { 
    access_token: string; 
    refresh_token: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('senders')
      .update({
        oauth_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq('id', senderId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating sender tokens:', error);
    throw error;
  }
}

/**
 * Delete a sender by ID
 */
export async function deleteSender(senderId: UUID): Promise<void> {
  try {
    const { error } = await supabase
      .from('senders')
      .delete()
      .eq('id', senderId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting sender:', error);
    throw error;
  }
}

/**
 * Update sender's email count after sending an email
 */
export async function incrementSenderEmailCount(senderId: UUID): Promise<void> {
  try {
    // First get the current emails_sent count
    const { data: sender, error: fetchError } = await supabase
      .from('senders')
      .select('emails_sent')
      .eq('id', senderId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // Then increment it by one
    const { error: updateError } = await supabase
      .from('senders')
      .update({ 
        emails_sent: (sender.emails_sent || 0) + 1,
        last_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', senderId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error updating sender email count:', error);
    throw error;
  }
}

// ==========================================
// LEAD RELATED FUNCTIONS
// ==========================================

/**
 * Get all leads with optional filtering
 */
export async function getLeads(filters?: {
  status?: string;
  sourceId?: UUID;
}): Promise<Lead[]> {
  try {
    let query = supabase.from('leads').select('*');
    
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    
    if (filters?.sourceId) {
      query = query.eq('source_id', filters.sourceId);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

/**
 * Get lead by ID
 */
export async function getLeadById(leadId: UUID): Promise<Lead | null> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching lead:', error);
    throw error;
  }
}

/**
 * Create a new lead
 */
export async function createLead(leadData: Partial<Lead>): Promise<UUID> {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert({
        ...leadData,
        status: leadData.status || 'NEW',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating lead:', error);
    throw error;
  }
}

/**
 * Update a lead
 */
export async function updateLead(leadId: UUID, updates: Partial<Lead>): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating lead:', error);
    throw error;
  }
}

/**
 * Delete a lead
 */
export async function deleteLead(leadId: UUID): Promise<void> {
  try {
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', leadId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting lead:', error);
    throw error;
  }
}

/**
 * Get emails for a specific lead
 */
export async function getEmailsByLeadId(leadId: UUID): Promise<Email[]> {
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching lead emails:', error);
    throw error;
  }
}

// ==========================================
// TEMPLATE RELATED FUNCTIONS
// ==========================================

/**
 * Get all templates
 */
export async function getTemplates(type?: string): Promise<Template[]> {
  try {
    let query = supabase.from('templates').select('*');
    
    if (type) {
      query = query.eq('type', type);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching templates:', error);
    throw error;
  }
}

/**
 * Get template by ID
 */
export async function getTemplateById(templateId: UUID): Promise<Template | null> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', templateId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching template:', error);
    throw error;
  }
}

/**
 * Create a template
 */
export async function createTemplate(templateData: Partial<Template>): Promise<UUID> {
  try {
    const { data, error } = await supabase
      .from('templates')
      .insert({
        ...templateData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating template:', error);
    throw error;
  }
}

/**
 * Update a template
 */
export async function updateTemplate(templateId: UUID, updates: Partial<Template>): Promise<void> {
  try {
    const { error } = await supabase
      .from('templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating template:', error);
    throw error;
  }
}

/**
 * Delete a template
 */
export async function deleteTemplate(templateId: UUID): Promise<void> {
  try {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', templateId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting template:', error);
    throw error;
  }
}

// ==========================================
// CAMPAIGN RELATED FUNCTIONS
// ==========================================

/**
 * Get all campaigns
 */
export async function getCampaigns(status?: string): Promise<Campaign[]> {
  try {
    let query = supabase.from('campaigns').select('*');
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

/**
 * Get a campaign by ID
 */
export async function getCampaignById(campaignId: UUID): Promise<Campaign | null> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching campaign:', error);
    throw error;
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData: Partial<Campaign>): Promise<UUID> {
  try {
    const { data, error } = await supabase
      .from('campaigns')
      .insert({
        ...campaignData,
        status: campaignData.status || 'DRAFT',
        leads_per_day: campaignData.leads_per_day || 10,
        start_time: campaignData.start_time || '09:00',
        end_time: campaignData.end_time || '17:00',
        min_interval_minutes: campaignData.min_interval_minutes || 15,
        max_interval_minutes: campaignData.max_interval_minutes || 45,
        attachment_type: campaignData.attachment_type || 'PDF',
        tracking_enabled: campaignData.tracking_enabled !== false,
        total_leads: campaignData.total_leads || 0,
        leads_worked: campaignData.leads_worked || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

/**
 * Update campaign details
 */
export async function updateCampaign(campaignId: UUID, updates: Partial<Campaign>): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: UUID): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', campaignId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}

/**
 * Add senders to a campaign
 */
export async function addSendersToCampaign(campaignId: UUID, senderIds: UUID[]): Promise<void> {
  try {
    const campaignSenders = senderIds.map(senderId => ({
      campaign_id: campaignId,
      sender_id: senderId,
      emails_sent_today: 0,
      total_emails_sent: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    const { error } = await supabase
      .from('campaign_senders')
      .insert(campaignSenders);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error adding senders to campaign:', error);
    throw error;
  }
}

/**
 * Remove a sender from a campaign
 */
export async function removeSenderFromCampaign(campaignId: UUID, senderId: UUID): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaign_senders')
      .delete()
      .match({ campaign_id: campaignId, sender_id: senderId });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error removing sender from campaign:', error);
    throw error;
  }
}

/**
 * Get senders for a campaign
 */
export async function getCampaignSenders(campaignId: UUID): Promise<CampaignSender[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_senders')
      .select(`
        *,
        sender:sender_id(*)
      `)
      .eq('campaign_id', campaignId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaign senders:', error);
    throw error;
  }
}

/**
 * Add leads to a campaign
 */
export async function addLeadsToCampaign(campaignId: UUID, leadIds: UUID[]): Promise<void> {
  try {
    const campaignLeads = leadIds.map(leadId => ({
      campaign_id: campaignId,
      lead_id: leadId,
      status: 'PENDING',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    const { error } = await supabase
      .from('campaign_leads')
      .insert(campaignLeads);
    
    if (error) throw error;
    
    // Update the total_leads count in the campaign
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ 
        total_leads: leadIds.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    if (updateError) throw updateError;
  } catch (error) {
    console.error('Error adding leads to campaign:', error);
    throw error;
  }
}

/**
 * Get leads for a campaign
 */
export async function getCampaignLeads(campaignId: UUID): Promise<CampaignLead[]> {
  try {
    const { data, error } = await supabase
      .from('campaign_leads')
      .select(`
        *,
        lead:lead_id(*)
      `)
      .eq('campaign_id', campaignId);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching campaign leads:', error);
    throw error;
  }
}

/**
 * Change campaign status (start/pause/complete)
 */
export async function updateCampaignStatus(campaignId: UUID, status: 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'): Promise<void> {
  try {
    const { error } = await supabase
      .from('campaigns')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    if (error) throw error;
  } catch (error) {
    console.error(`Error updating campaign status to ${status}:`, error);
    throw error;
  }
}

// Convenience functions for campaign status changes
export const startCampaign = (campaignId: UUID) => updateCampaignStatus(campaignId, 'ACTIVE');
export const pauseCampaign = (campaignId: UUID) => updateCampaignStatus(campaignId, 'PAUSED');
export const completeCampaign = (campaignId: UUID) => updateCampaignStatus(campaignId, 'COMPLETED');

// ==========================================
// EMAIL RELATED FUNCTIONS
// ==========================================

/**
 * Create a new email record
 */
export async function createEmail(emailData: Partial<Email>): Promise<UUID> {
  try {
    const { data, error } = await supabase
      .from('emails')
      .insert({
        ...emailData,
        status: emailData.status || 'PENDING',
        tracking_id: emailData.tracking_id || crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating email:', error);
    throw error;
  }
}

/**
 * Update email status
 */
export async function updateEmailStatus(
  emailId: UUID, 
  status: 'PENDING' | 'SENT' | 'OPENED' | 'REPLIED' | 'BOUNCED',
  additionalData?: {
    opened_at?: string;
    replied_at?: string;
    bounced_at?: string;
    bounce_reason?: string;
    sent_at?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('emails')
      .update({
        status,
        ...additionalData,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error updating email status:', error);
    throw error;
  }
}

/**
 * Track email event (open, click, etc.)
 */
export async function trackEmailEvent(
  emailId: UUID,
  event: {
    event_type: string;
    recipient_email: string;
    campaign_id?: UUID;
    metadata?: any;
    user_agent?: string;
    ip_address?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('email_events')
      .insert({
        email_id: emailId,
        event_type: event.event_type,
        recipient_email: event.recipient_email,
        campaign_id: event.campaign_id,
        metadata: event.metadata,
        user_agent: event.user_agent,
        ip_address: event.ip_address,
        created_at: new Date().toISOString()
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error tracking email event:', error);
    throw error;
  }
}

/**
 * Find email by tracking ID
 */
export async function getEmailByTrackingId(trackingId: UUID): Promise<Email | null> {
  try {
    const { data, error } = await supabase
      .from('emails')
      .select('*')
      .eq('tracking_id', trackingId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error finding email by tracking ID:', error);
    throw error;
  }
}

// ==========================================
// LEAD IMPORT FUNCTIONS FOR DYNAMIC TABLES
// ==========================================

/**
 * Create a new dynamic lead table for a specific region/campaign
 * @param tableName The name to use for the table (sanitized from file name)
 * @param columns Array of column definitions for the table
 */
export async function createDynamicLeadTable(tableName: string, columns: Array<{name: string, type: string}>): Promise<boolean> {
  try {
    // Create a sanitized table name (lowercase, alphanumeric with underscores)
    const sanitizedTableName = `${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_leads`;
    
    // Use raw SQL via the Supabase client to create the table
    const adminClient = createAdminClient();
    
    // Build column definitions
    const columnDefs = columns.map(col => `"${col.name}" ${col.type}`).join(', ');
    
    // Execute the CREATE TABLE statement
    const { error } = await adminClient.rpc('execute_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.${sanitizedTableName} (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          ${columnDefs},
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });
    
    if (error) throw error;
    
    // Add the appropriate RLS policies
    await adminClient.rpc('execute_sql', {
      sql: `
        -- Enable RLS on the new table
        ALTER TABLE public.${sanitizedTableName} ENABLE ROW LEVEL SECURITY;
        
        -- Create policies for the new table
        CREATE POLICY "Enable read access for authenticated users on ${sanitizedTableName}" 
          ON public.${sanitizedTableName} FOR SELECT 
          USING (auth.role() IN ('authenticated', 'service_role'));
          
        CREATE POLICY "Enable insert for authenticated users on ${sanitizedTableName}" 
          ON public.${sanitizedTableName} FOR INSERT 
          WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
          
        CREATE POLICY "Enable update for authenticated users on ${sanitizedTableName}" 
          ON public.${sanitizedTableName} FOR UPDATE 
          USING (auth.role() IN ('authenticated', 'service_role'));
          
        CREATE POLICY "Enable delete for authenticated users on ${sanitizedTableName}" 
          ON public.${sanitizedTableName} FOR DELETE 
          USING (auth.role() IN ('authenticated', 'service_role'));
      `
    });
    
    return true;
  } catch (error) {
    console.error('Error creating dynamic lead table:', error);
    throw error;
  }
}

/**
 * Insert records into a dynamic lead table
 * @param tableName The name of the table to insert into
 * @param records Array of record objects to insert
 */
export async function insertLeadsIntoDynamicTable(tableName: string, records: Record<string, any>[]): Promise<number> {
  try {
    if (records.length === 0) return 0;
    
    // Create a sanitized table name
    const sanitizedTableName = `${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_leads`;
    
    const adminClient = createAdminClient();
    
    // Extract column names from the first record
    const columns = Object.keys(records[0]);
    
    // Batch inserts in chunks to avoid request size limits
    const chunkSize = 100;
    let insertedCount = 0;
    
    for (let i = 0; i < records.length; i += chunkSize) {
      const chunk = records.slice(i, i + chunkSize);
      
      // Execute the insert
      const { error, data } = await adminClient
        .from(sanitizedTableName)
        .insert(chunk)
        .select('id');
      
      if (error) throw error;
      
      insertedCount += data.length;
    }
    
    return insertedCount;
  } catch (error) {
    console.error(`Error inserting into dynamic table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Register a new lead source with its dynamic table
 * @param sourceData Information about the imported lead source
 */
export async function createLeadSource(sourceData: {
  name: string;
  fileName: string;
  tableName: string;
  recordCount: number;
  columnMap: Record<string, string>; // Maps CSV columns to standard fields
  storagePath?: string; // Path to the original file in storage
}): Promise<UUID> {
  try {
    // Store the column mapping as JSON metadata
    const { data, error } = await supabase
      .from('lead_sources')
      .insert({
        name: sourceData.name,
        file_name: sourceData.fileName,
        last_imported: new Date().toISOString(),
        record_count: sourceData.recordCount,
        is_active: true,
        metadata: { 
          tableName: sourceData.tableName,
          columnMap: sourceData.columnMap
        },
        storage_path: sourceData.storagePath,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();
    
    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error creating lead source:', error);
    throw error;
  }
}

/**
 * Get leads from a specific dynamic table
 * @param tableName The name of the table to query
 * @param limit Maximum number of records to return
 * @param offset Pagination offset
 */
export async function getLeadsFromDynamicTable(tableName: string, limit = 100, offset = 0): Promise<any[]> {
  try {
    // Create a sanitized table name
    const sanitizedTableName = `${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_leads`;
    
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient
      .from(sanitizedTableName)
      .select('*')
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching leads from dynamic table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get all dynamic lead tables in the database
 */
export async function getAllDynamicLeadTables(): Promise<string[]> {
  try {
    const adminClient = createAdminClient();
    
    const { data, error } = await adminClient.rpc('execute_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%_leads'
        AND table_name != 'leads'
      `
    });
    
    if (error) throw error;
    return data.map((row: any) => row.table_name) || [];
  } catch (error) {
    console.error('Error fetching dynamic lead tables:', error);
    throw error;
  }
}

/**
 * Process leads from a dynamic table and normalize them to the leads table
 * This function extracts leads and their multiple contacts from the imported table
 * @param tableName The name of the dynamic table containing imported leads 
 * @param leadSourceId The ID of the lead source
 */
export async function processLeadsFromDynamicTable(tableName: string, leadSourceId: UUID): Promise<{ 
  processed: number, 
  contactsCreated: number 
}> {
  try {
    const adminClient = createAdminClient();
    const sanitizedTableName = `${tableName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_leads`;
    let processed = 0;
    let contactsCreated = 0;
    
    // Get all records from the dynamic table
    const { data, error } = await adminClient
      .from(sanitizedTableName)
      .select('*')
      .limit(1000); // Process in chunks
    
    if (error) throw error;
    if (!data || data.length === 0) return { processed: 0, contactsCreated: 0 };
    
    // Process each lead record
    for (const record of data) {
      try {
        // Map standard property fields to our leads table
        const leadData: Partial<Lead> = {
          property_address: record.property_address || '',
          property_city: record.property_city || '',
          property_state: record.property_state || '',
          property_zip: record.property_zip || '',
          owner_name: record.owner_name || '',
          mailing_address: record.mailing_address || '',
          mailing_city: record.mailing_city || '',
          mailing_state: record.mailing_state || '',
          mailing_zip: record.mailing_zip || '',
          wholesale_value: record.wholesale_value ? parseFloat(record.wholesale_value) : null,
          market_value: record.market_value ? parseFloat(record.market_value) : null,
          days_on_market: record.days_on_market ? parseInt(record.days_on_market) : null,
          mls_status: record.mls_status || '',
          mls_list_date: record.mls_list_date || '',
          mls_list_price: record.mls_list_price ? parseFloat(record.mls_list_price) : null,
          status: 'NEW',
          source_id: leadSourceId,
          owner_type: record.owner_type || '',
          property_type: record.property_type || '',
          beds: record.beds || '',
          baths: record.baths || '',
          square_footage: record.square_footage || '',
          year_built: record.year_built || '',
          assessed_total: record.assessed_total ? parseFloat(record.assessed_total) : null,
        };

        // Create the lead record
        const leadId = await createLead(leadData);
        processed++;
        
        // Process contacts for this lead
        const contactsForLead = await processLeadContacts(leadId, record);
        contactsCreated += contactsForLead;
      } catch (err) {
        console.error(`Error processing lead record:`, err);
        // Continue with next record
      }
    }
    
    return { processed, contactsCreated };
  } catch (error) {
    console.error(`Error processing leads from dynamic table ${tableName}:`, error);
    throw error;
  }
}

/**
 * Process and create contact records from a lead record
 * @param leadId The ID of the lead these contacts belong to
 * @param leadRecord The lead record containing contact information
 * @returns Number of contacts created
 */
async function processLeadContacts(leadId: UUID, leadRecord: any): Promise<number> {
  try {
    let contactsCreated = 0;
    
    // Process each potential contact (1-5)
    for (let i = 1; i <= 5; i++) {
      const nameField = `contact${i}name`;
      const emailFields = [
        `contact${i}email_1`,
        `contact${i}email_2`,
        `contact${i}email_3`
      ];
      
      // Find valid email addresses for this contact
      const validEmails = emailFields
        .map(field => leadRecord[field])
        .filter(email => email && typeof email === 'string' && email.includes('@') && email.length > 5);
      
      // Only proceed if we have at least one valid email
      if (validEmails.length > 0) {
        // Get the contact name - this is the only name field we care about
        let name = '';
        
        if (leadRecord[nameField] && typeof leadRecord[nameField] === 'string' && leadRecord[nameField].trim()) {
          name = leadRecord[nameField].trim();
        }
        // If no name but we have an email, use the email prefix as name
        else if (validEmails.length > 0) {
          const emailParts = validEmails[0].split('@');
          name = emailParts[0].replace(/[.]/g, ' ').replace(/[_-]/g, ' ');
          // Capitalize first letter of each word
          name = name.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
        
        // If we still don't have a name, use a placeholder
        if (!name || name.trim() === '') {
          name = `Contact ${i}`;
        }
        
        // Create a contact record for each valid email
        for (const email of validEmails) {
          const { data, error } = await supabase
            .from('contacts')
            .insert({
              name,
              email,
              lead_id: leadId,
              is_primary: i === 1, // First contact is primary
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select('id');
          
          if (!error) {
            contactsCreated++;
          } else {
            console.error(`Error creating contact with email ${email}:`, error);
          }
        }
      }
    }
    
    return contactsCreated;
  } catch (error) {
    console.error(`Error processing contacts for lead ${leadId}:`, error);
    return 0; // Return 0 to indicate no contacts were created
  }
}