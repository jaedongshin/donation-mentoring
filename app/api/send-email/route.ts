import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
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

    // Create a transporter
    // For production, these should be in .env.local
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Sender email
        pass: process.env.EMAIL_PASS, // Sender app password
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmails, // Send to all admins
      subject: `[Donation Mentoring] New Mentor Application: ${name_ko} (${name_en})`,
      text: `
        New Mentor Application Received:
        
        Name: ${name_ko} / ${name_en}
        Email: ${email}
        Position: ${position_ko}
        Company: ${company_ko}
        
        Please check the admin panel to review and approve.
      `,
    };

    // Only attempt to send if credentials are present, otherwise log it
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await transporter.sendMail(mailOptions);
        return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    } else {
        console.log('Email credentials missing. Simulating email send:', mailOptions);
        return NextResponse.json({ message: 'Email simulated (credentials missing)' }, { status: 200 });
    }

  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
