// Email system types

export type EmailType = 'announcement' | 'newsletter' | 'notification' | 'welcome';
export type RecipientFilter = 'all' | 'admins' | 'mentors' | 'custom';
export type EmailStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'bounced';

export interface EmailLog {
  id: string;
  subject: string;
  body_html: string;
  body_preview: string | null;
  email_type: EmailType;
  recipient_filter: RecipientFilter;
  recipient_emails: string[];
  recipient_count: number;
  attachment_names: string[] | null;
  sent_by: string | null;
  sent_at: string;
  resend_id: string | null;
  status: EmailStatus;
  opens: number;
  clicks: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmailRecipient {
  id: string;
  email: string;
  name_en: string | null;
  name_ko: string | null;
  role: 'admin' | 'mentor';
  email_subscribed: boolean;
  unsubscribed_at: string | null;
}

export interface BroadcastRequest {
  subject: string;
  body: string;
  recipientFilter: RecipientFilter;
  customRecipients?: string[];
  testMode?: boolean;
  testEmail?: string; // Email to send test to (logged-in user's email)
}

export interface BroadcastResponse {
  success: boolean;
  emailLogId?: string;
  recipientCount?: number;
  resendId?: string;
  error?: string;
}

// Resend webhook event types
export type ResendEventType =
  | 'email.sent'
  | 'email.delivered'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained';

export interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    // Additional fields vary by event type
  };
}
