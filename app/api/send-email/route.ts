import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const body = await request.json();
    const { name_ko, name_en, email, position_ko, company_ko } = body;

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch admin emails
    const { data: admins, error: adminError } = await supabase
      .from('admins')
      .select('email');

    if (adminError) {
      console.error('Error fetching admins:', adminError);
      // Fallback or handle error? For now, we continue but maybe with empty list or default
    }

    const adminEmails = admins?.map(admin => admin.email) || [];
    
    // Fallback if no admins found in DB
    if (adminEmails.length === 0) {
        console.warn('No admins found in database. Using fallback email.');
        adminEmails.push('mulli2@gmail.com');
    }

    const emailSubject = `[Donation Mentoring] New Mentor Application: ${name_ko} (${name_en})`;
    const emailContent = `
        New Mentor Application Received:
        
        Name: ${name_ko} / ${name_en}
        Email: ${email}
        Position: ${position_ko}
        Company: ${company_ko}
        
        Please check the admin panel to review and approve.
      `;

    // Only attempt to send if API key is present, otherwise log it
    if (process.env.RESEND_API_KEY) {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
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
