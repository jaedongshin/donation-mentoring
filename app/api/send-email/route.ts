import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name_ko, name_en, email, position_ko, company_ko } = body;

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
      to: 'mulli2@gmail.com',
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
