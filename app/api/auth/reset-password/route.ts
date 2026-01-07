import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find user with valid token
    const { data: mentors, error: findError } = await supabase
      .from('mentors')
      .select('id')
      .eq('reset_token', token)
      .gt('reset_token_expires_at', new Date().toISOString());

    if (findError) {
      console.error('Error finding mentor by token:', findError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!mentors || mentors.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const mentorId = mentors[0].id;

    // Update password and clear token
    const { error: updateError } = await supabase
      .from('mentors')
      .update({
        password: password,
        reset_token: null,
        reset_token_expires_at: null
      })
      .eq('id', mentorId);

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Password updated successfully' });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
