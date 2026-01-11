import { NextResponse } from 'next/server';
import { getSupabaseClient, verifyUnsubscribeToken } from '@/utils/email';

// GET: Verify token and show unsubscribe page data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const { id, valid } = verifyUnsubscribeToken(token);

    if (!valid || !id) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Get mentor info
    const supabase = getSupabaseClient();
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, email, name_en, name_ko, email_subscribed')
      .eq('id', id)
      .single();

    if (!mentor) {
      return NextResponse.json(
        { valid: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      mentor: {
        id: mentor.id,
        email: mentor.email,
        name: mentor.name_ko || mentor.name_en,
        alreadyUnsubscribed: !mentor.email_subscribed,
      },
    });
  } catch (error) {
    console.error('Unsubscribe verify error:', error);
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Process unsubscribe request
export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const { id, valid } = verifyUnsubscribeToken(token);

    if (!valid || !id) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Update mentor's subscription status
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('mentors')
      .update({
        email_subscribed: false,
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
