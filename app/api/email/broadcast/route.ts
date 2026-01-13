import { NextResponse } from 'next/server';
import {
  getSupabaseClient,
  getRecipientsByFilter,
  filterSubscribedRecipients,
  generateBodyPreview,
  sendEmailBatches,
} from '@/utils/email';
import type { BroadcastRequest, EmailType, RecipientFilter } from '@/types/email';

export async function POST(request: Request) {
  try {
    const body: BroadcastRequest = await request.json();
    const { subject, body: emailBody, recipientFilter, customRecipients, testMode, testEmail } = body;

    // Validate required fields
    if (!subject || !emailBody || !recipientFilter) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: subject, body, recipientFilter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Get current user from session (simplified - you may need to adjust based on your auth)
    // For now, we'll check if the request has admin context
    // In production, implement proper session verification

    // Get recipients based on filter
    let recipients = await getRecipientsByFilter(
      recipientFilter as RecipientFilter,
      customRecipients
    );

    // Filter out unsubscribed users
    recipients = filterSubscribedRecipients(recipients);

    if (recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No subscribed recipients found' },
        { status: 400 }
      );
    }

    // Test mode: send to logged-in user's email
    const recipientEmails = testMode && testEmail
      ? [testEmail]
      : recipients.map(r => r.email);

    // Get base URL for unsubscribe links
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://donation-mentoring.org';
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@donation-mentoring.org';

    // Add unsubscribe footer to email body
    const emailHtmlWithFooter = `
      ${emailBody}
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
      <p style="color: #6b7280; font-size: 12px; text-align: center;">
        You are receiving this email because you are a member of Donation Mentoring.<br />
        <a href="${baseUrl}/unsubscribe?token=UNSUBSCRIBE_TOKEN" style="color: #3b82f6;">Unsubscribe</a> from future emails.
      </p>
    `;

    // Send emails
    const { success, resendId, error } = await sendEmailBatches(
      recipientEmails,
      subject,
      emailHtmlWithFooter,
      fromEmail
    );

    if (!success) {
      return NextResponse.json(
        { success: false, error: error || 'Failed to send emails' },
        { status: 500 }
      );
    }

    // Log the email in database
    const { data: emailLog, error: logError } = await supabase
      .from('email_logs')
      .insert({
        subject,
        body_html: emailBody,
        body_preview: generateBodyPreview(emailBody),
        email_type: 'announcement' as EmailType,
        recipient_filter: recipientFilter,
        recipient_emails: recipientEmails,
        recipient_count: recipientEmails.length,
        resend_id: resendId,
        status: 'sent',
      })
      .select('id')
      .single();

    if (logError) {
      console.error('Error logging email:', logError);
    }

    return NextResponse.json({
      success: true,
      emailLogId: emailLog?.id,
      recipientCount: recipientEmails.length,
      resendId,
    });
  } catch (error) {
    console.error('Broadcast error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
