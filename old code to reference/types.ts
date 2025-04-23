export interface Lead {
    id: string;
    propertyAddress: string;
    contacts: Contact[];
    status: 'pending' | 'worked';
    createdAt: Date;
    updatedAt: Date;
}

export interface Contact {
    name: string;
    email: string;
}

export interface Email {
    subject: string;
    body: string;
    attachments?: string[];
    sender: string;
    recipients: string[];
}

export interface SalesMetrics {
    name: string;
    position: number;
    sent: number;
    opens: number;
    replies: number;
    icon: string;
    color: string;
}

export interface TeamMember {
    name: string;
    sent: number;
    opens: number;
    replies: number;
    bounces: number;
    openRate: number;
    replyRate: number;
}

declare global {
    var logHandlers: Map<string, (level: string, message: string) => void>;
}