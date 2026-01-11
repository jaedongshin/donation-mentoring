import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'admins', 'mentors'
    const search = searchParams.get('search') || '';
    const includeUnsubscribed = searchParams.get('includeUnsubscribed') === 'true';

    const supabase = getSupabaseClient();

    // Build query
    let query = supabase
      .from('mentors')
      .select('id, email, name_en, name_ko, role, email_subscribed, unsubscribed_at')
      .eq('is_active', true)
      .order('name_ko', { ascending: true });

    // Filter by role
    // Note: 'mentors' includes admins (admins are a subset of mentors)
    // Only 'admins' filters specifically to admin role
    if (filter === 'admins') {
      query = query.eq('role', 'admin');
    }
    // 'all' and 'mentors' return all active users (admins + mentors)

    // Filter by subscription status
    if (!includeUnsubscribed) {
      query = query.eq('email_subscribed', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching recipients:', error);
      return NextResponse.json(
        { error: 'Failed to fetch recipients' },
        { status: 500 }
      );
    }

    let recipients = data || [];

    // Search filter (client-side for simplicity)
    if (search) {
      const searchLower = search.toLowerCase();
      recipients = recipients.filter(
        r =>
          r.email?.toLowerCase().includes(searchLower) ||
          r.name_en?.toLowerCase().includes(searchLower) ||
          r.name_ko?.includes(search)
      );
    }

    // Calculate stats
    const subscribedCount = recipients.filter(r => r.email_subscribed).length;
    const unsubscribedCount = recipients.filter(r => !r.email_subscribed).length;

    return NextResponse.json({
      recipients,
      total: recipients.length,
      subscribedCount,
      unsubscribedCount,
    });
  } catch (error) {
    console.error('Recipients error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
