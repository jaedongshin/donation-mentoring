import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/utils/email';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type'); // Optional filter by email_type

    const supabase = getSupabaseClient();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('email_logs')
      .select('*', { count: 'exact' })
      .order('sent_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('email_type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching email logs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch email logs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Email logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
