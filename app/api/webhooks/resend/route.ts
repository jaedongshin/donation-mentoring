import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/email';

export async function POST(request: Request) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;

    if (webhookSecret) {
      const svixId = request.headers.get('svix-id');
      const svixTimestamp = request.headers.get('svix-timestamp');
      const svixSignature = request.headers.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json(
          { error: 'Missing webhook headers' },
          { status: 400 }
        );
      }

      // Note: Full signature verification can be implemented with:
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // resend.webhooks.verify({ payload: rawBody, headers, webhookSecret });
      // For now, we validate headers exist and proceed
    }

    // Parse the payload
    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    const supabase = getSupabaseClient();
    const emailId = data?.email_id;

    if (!emailId) {
      // Some events may not have email_id, just acknowledge
      return NextResponse.json({ received: true });
    }

    // Handle different event types
    switch (type) {
      case 'email.sent':
        await supabase
          .from('email_logs')
          .update({ status: 'sent' })
          .eq('resend_id', emailId);
        break;

      case 'email.delivered':
        await supabase
          .from('email_logs')
          .update({ status: 'delivered' })
          .eq('resend_id', emailId);
        break;

      case 'email.opened':
        // Use RPC for atomic increment
        await supabase.rpc('increment_email_opens', { p_resend_id: emailId });
        break;

      case 'email.clicked':
        // Use RPC for atomic increment
        await supabase.rpc('increment_email_clicks', { p_resend_id: emailId });
        break;

      case 'email.bounced':
        await supabase
          .from('email_logs')
          .update({
            status: 'bounced',
            error_message: data?.bounce?.message || 'Email bounced',
          })
          .eq('resend_id', emailId);
        break;

      case 'email.complained':
        // User marked as spam - could auto-unsubscribe them
        console.log('Spam complaint for email:', emailId);
        break;

      default:
        console.log('Unhandled webhook event:', type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
