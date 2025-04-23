// Supabase database models
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

export interface LeadSource {
    id: string;
    name: string;
    file_name: string;
    last_imported: Date;
    record_count: number;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}

export interface Sender {
    id: string;
    name: string;
    email: string;
    oauth_token: string;
    refresh_token: string;
    emails_sent: number;
    daily_quota: number;
    last_sent_at?: Date;
    created_at: Date;
    updated_at: Date;
}

export interface EmailRecord {
    id: string;
    lead_id: string;
    sender_id: string;
    subject: string;
    body: string;
    loi_path?: string;
    status: string;
    opened_at?: Date;
    replied_at?: Date;
    bounced_at?: Date;
    bounce_reason?: string;
    sent_at?: Date;
    tracking_id: string;
    created_at: Date;
    updated_at: Date;
}

export interface Template {
    id: string;
    name: string;
    subject?: string;
    content: string;
    type: string;
    created_at: Date;
    updated_at: Date;
}

export interface TemplateVariable {
    id: string;
    template_id: string;
    name: string;
    created_at: Date;
    updated_at: Date;
}