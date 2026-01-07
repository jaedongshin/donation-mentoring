import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { type = 'application', name_ko, name_en, email, position_ko, company_ko, changes } = body;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch admin emails
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('email');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
    }

    const adminEmails = admins?.map(admin => admin.email) || [];
    
    if (adminEmails.length === 0) {
        console.warn('No admins found in database. Using fallback email.');
        adminEmails.push('mulli2@gmail.com');
    }

    let emailSubject = '';
    let emailContent = '';

    if (type === 'application') {
        emailSubject = `[Donation Mentoring] New Mentor Application: ${name_ko} (${name_en})`;
        emailContent = `
            New Mentor Application Received:
            
            Name: ${name_ko} / ${name_en}
            Email: ${email}
            Position: ${position_ko}
            Company: ${company_ko}
            
            Please check the admin panel to review and approve.
        `;
    } else if (type === 'profile_update') {
        emailSubject = `[Donation Mentoring] Mentor Profile Updated: ${name_ko} (${name_en})`;
        emailContent = `
            Mentor Profile Updated:
            
            Name: ${name_ko} / ${name_en}
            Email: ${email}
            
            Changes:
            ${changes || 'No specific changes provided.'}
            
            View full profile in the app.
        `;
    }

    // Only attempt to send if API key is present, otherwise log it
    if (process.env.RESEND_API_KEY) {
        const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: adminEmails,
            subject: emailSubject,
            text: emailContent,
        });

        if (error) {
            console.error('Error sending email with Resend:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ message: 'Email sent successfully', data }, { status: 200 });
    } else {
        console.log('RESEND_API_KEY missing. Simulating email send:', {
            to: adminEmails,
            subject: emailSubject,
            text: emailContent
        });
        return NextResponse.json({ message: 'Email simulated (API key missing)' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
