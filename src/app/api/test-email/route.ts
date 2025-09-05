import { NextRequest, NextResponse } from 'next/server';
import * as nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      to,
      subject,
      message,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      fromName,
      fromEmail
    } = body;

    // Validate required fields
    if (!to || !subject || !message || !smtpHost || !smtpPort || !smtpUser) {
      return NextResponse.json({
        error: 'Missing required fields',
        required: ['to', 'subject', 'message', 'smtpHost', 'smtpPort', 'smtpUser']
      }, { status: 400 });
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: smtpSecure === 'true' || smtpPort === '465',
      auth: smtpPassword ? {
        user: smtpUser,
        pass: smtpPassword,
      } : undefined,
      // Add connection timeout
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    // Verify connection
    await transporter.verify();

    // Email options
    const mailOptions = {
      from: fromEmail ? `"${fromName || 'Test'}" <${fromEmail}>` : smtpUser,
      to: to,
      subject: subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email test</h2>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #666; margin-top: 0;">Message:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          <div style="background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="color: #1976d2; margin-top: 0;">Test Information:</h4>
            <p><strong>From:</strong> ${fromName || 'Test'} (${fromEmail || smtpUser})</p>
            <p><strong>To:</strong> ${to}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>SMTP Host:</strong> ${smtpHost}</p>
            <p><strong>SMTP Port:</strong> ${smtpPort}</p>
            <p><strong>Secure:</strong> ${smtpSecure === 'true' || smtpPort === '465' ? 'Yes' : 'No'}</p>
            <p><strong>Sent at:</strong> ${new Date().toLocaleString('th-TH')}</p>
            <p><strong>Outbound IP:</strong> ${process.env.OUTBOUND_IP || 'Unknown'}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
          <p style="color: #666; font-size: 12px; text-align: center;">
            This email was sent from Thailand Penthouses CMS Email Test POC
          </p>
        </div>
      `,
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      response: info.response,
      timestamp: new Date().toISOString(),
      outboundIp: process.env.OUTBOUND_IP || 'Unknown',
      smtpConfig: {
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure === 'true' || smtpPort === '465',
        user: smtpUser,
        fromName: fromName,
        fromEmail: fromEmail
      }
    });

  } catch (error) {
    console.error('Email sending failed:', error);
    
    return NextResponse.json({
      error: 'Failed to send email',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      outboundIp: process.env.OUTBOUND_IP || 'Unknown'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Email Test API is ready',
    timestamp: new Date().toISOString(),
    outboundIp: process.env.OUTBOUND_IP || 'Unknown',
    endpoints: {
      POST: '/api/test-email - Send test email'
    }
  });
}
