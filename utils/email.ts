import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import type { RecipientFilter, EmailRecipient } from '@/types/email';

// Initialize Resend client
export function getResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

// Initialize Supabase client for server-side operations (uses service role to bypass RLS)
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Chunk array into smaller batches (for Resend's 100 email limit)
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Sleep utility for rate limiting
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get recipients based on filter
export async function getRecipientsByFilter(
  filter: RecipientFilter,
  customEmails?: string[]
): Promise<EmailRecipient[]> {
  const supabase = getSupabaseClient();

  if (filter === 'custom' && customEmails) {
    const { data } = await supabase
      .from('mentors')
      .select('id, email, name_en, name_ko, role, email_subscribed, unsubscribed_at')
      .in('email', customEmails)
      .eq('is_active', true);
    return (data || []) as EmailRecipient[];
  }

  let query = supabase
    .from('mentors')
    .select('id, email, name_en, name_ko, role, email_subscribed, unsubscribed_at')
    .eq('is_active', true);

  // Only 'admins' filters specifically - 'mentors' and 'all' return everyone
  // (admins are a subset of mentors)
  if (filter === 'admins') {
    query = query.eq('role', 'admin');
  }

  const { data } = await query;
  return (data || []) as EmailRecipient[];
}

// Filter out unsubscribed recipients
export function filterSubscribedRecipients(recipients: EmailRecipient[]): EmailRecipient[] {
  return recipients.filter(r => r.email_subscribed && r.email);
}

// Generate preview text from HTML body (first 200 chars)
export function generateBodyPreview(body: string): string {
  // Strip HTML tags and get plain text
  const plainText = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText.slice(0, 200);
}

// Generate unsubscribe token (simple UUID-based approach)
export function generateUnsubscribeToken(mentorId: string): string {
  // Base64 encode mentor ID with timestamp for expiry check
  const payload = JSON.stringify({
    id: mentorId,
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  return Buffer.from(payload).toString('base64url');
}

// Verify and decode unsubscribe token
export function verifyUnsubscribeToken(token: string): { id: string; valid: boolean } {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64url').toString());
    const isValid = payload.exp > Date.now();
    return { id: payload.id, valid: isValid };
  } catch {
    return { id: '', valid: false };
  }
}

// Get unsubscribe URL
export function getUnsubscribeUrl(mentorId: string, baseUrl: string): string {
  const token = generateUnsubscribeToken(mentorId);
  return `${baseUrl}/unsubscribe?token=${token}`;
}

// Send emails in batches with rate limiting
export async function sendEmailBatches(
  recipients: string[],
  subject: string,
  html: string,
  fromEmail: string
): Promise<{ success: boolean; resendId?: string; error?: string }> {
  const resend = getResendClient();
  const BATCH_SIZE = 100;
  const DELAY_MS = 600; // Stay under 2 req/sec limit

  const batches = chunkArray(recipients, BATCH_SIZE);
  let lastResendId: string | undefined;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    try {
      const { data, error } = await resend.emails.send({
        from: fromEmail,
        to: batch,
        subject,
        html,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      lastResendId = data?.id;

      // Rate limit delay between batches
      if (i < batches.length - 1) {
        await sleep(DELAY_MS);
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  return { success: true, resendId: lastResendId };
}
