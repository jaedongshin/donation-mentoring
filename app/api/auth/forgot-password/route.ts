import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { email, lang = 'en' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists
    const { data: mentor } = await supabase
      .from('mentors')
      .select('id, name_en, name_ko')
      .eq('email', email)
      .single();

    if (!mentor) {
      // Return success to prevent enumeration, but log for debug
      console.log(`Password reset requested for non-existent email: ${email}`);
      return NextResponse.json({ message: 'If an account exists, a reset link has been sent.' });
    }

    // Generate token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString(); // 1 hour

    // Update mentor with token
    const { error: updateError } = await supabase
      .from('mentors')
      .update({
        reset_token: resetToken,
        reset_token_expires_at: expiresAt
      })
      .eq('id', mentor.id);

    if (updateError) {
      console.error('Error updating reset token:', updateError);
      return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
    }

    // Send email
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      const resetLink = `${origin}/reset-password?token=${resetToken}`;
      
      const name = lang === 'ko' ? mentor.name_ko : (mentor.name_en || mentor.name_ko);
      const subject = lang === 'ko' ? '[Donation Mentoring] 비밀번호 재설정' : '[Donation Mentoring] Reset Password';
      
      const htmlContent = lang === 'ko' 
        ? `<p>안녕하세요 ${name}님,</p>
           <p>비밀번호 재설정 요청을 받았습니다. 아래 링크를 클릭하여 비밀번호를 재설정하세요:</p>
           <p><a href="${resetLink}">비밀번호 재설정하기</a></p>
           <p>이 링크는 1시간 동안 유효합니다.</p>`
        : `<p>Hi ${name},</p>
           <p>We received a request to reset your password. Click the link below to proceed:</p>
           <p><a href="${resetLink}">Reset Password</a></p>
           <p>This link expires in 1 hour.</p>`;

      await resend.emails.send({
        from: 'Donation Mentoring <onboarding@resend.dev>',
        to: email,
        subject: subject,
        html: htmlContent,
      });
      console.log(`Password reset email sent to ${email}`);
    } else {
        console.warn('RESEND_API_KEY is missing. Email not sent.');
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        console.log(`[DEV] Reset Link for ${email}: ${origin}/reset-password?token=${resetToken}`);
    }

    return NextResponse.json({ message: 'Reset link sent' });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
