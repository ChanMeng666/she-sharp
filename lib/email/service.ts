import { Resend } from 'resend';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Initialize Resend client if API key is provided
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send email using Resend or log to console in development
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // Development mode - log email to console and save to file
  if (process.env.NODE_ENV === 'development' && !resend) {
    console.log('\n=====================================');
    console.log('📧 EMAIL PREVIEW (Development Mode)');
    console.log('=====================================');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('From: She Sharp <noreply@shesharp.org.nz>');
    console.log('Time:', new Date().toISOString());
    console.log('-------------------------------------');
    
    // Extract important links from HTML
    const linkRegex = /href="([^"]*token=[^"]*)"/g;
    const matches = html.match(linkRegex);
    if (matches) {
      console.log('🔗 IMPORTANT LINKS:');
      matches.forEach(match => {
        const url = match.replace('href="', '').replace('"', '');
        console.log(`   ${url}`);
      });
      console.log('-------------------------------------');
    }
    
    console.log('EMAIL CONTENT:');
    console.log(text || 'See HTML version below');
    console.log('=====================================\n');

    // Save to a temporary file for easier access
    if (typeof window === 'undefined') {
      const fs = await import('fs');
      const path = await import('path');
      const emailDir = path.join(process.cwd(), 'tmp', 'emails');
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(emailDir)) {
        fs.mkdirSync(emailDir, { recursive: true });
      }
      
      // Save email as HTML file
      const filename = `${Date.now()}-${to.replace('@', '_at_')}.html`;
      const filepath = path.join(emailDir, filename);
      fs.writeFileSync(filepath, html);
      
      console.log(`📁 Email saved to: tmp/emails/${filename}`);
      console.log(`🌐 Open in browser: file://${filepath}\n`);
    }

    return true;
  }

  // Production mode - use Resend
  if (resend) {
    try {
      console.log('Attempting to send email via Resend...');
      console.log('To:', to);
      console.log('From:', process.env.EMAIL_FROM || 'She Sharp <noreply@shesharp.org.nz>');
      
      const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM || 'She Sharp <noreply@shesharp.org.nz>',
        to,
        subject,
        html,
        text,
      });

      if (error) {
        console.error('Resend error:', error);
        return false;
      }

      console.log('Email sent successfully via Resend!');
      console.log('Email ID:', data?.id);
      console.log('Response:', data);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      
      // Fallback to console in case of error
      if (process.env.NODE_ENV === 'development') {
        console.log('\n⚠️ Resend failed, showing email in console:');
        console.log('To:', to);
        console.log('Subject:', subject);
        const linkRegex = /href="([^"]*token=[^"]*)"/g;
        const matches = html.match(linkRegex);
        if (matches) {
          console.log('Links:', matches.map(m => m.replace('href="', '').replace('"', '')));
        }
      }
      
      return false;
    }
  }

  // No email service configured
  console.warn('⚠️ No email service configured. Set RESEND_API_KEY in .env');
  console.log('Email would be sent to:', to);
  console.log('Subject:', subject);
  
  return true;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(email: string, token: string) {
  // Use localhost in development mode when BASE_URL is production
  const baseUrl = process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app') 
    ? 'http://localhost:3000' 
    : (process.env.BASE_URL || 'http://localhost:3000');
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Verify Your Email - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #000000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .link-box { background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to She Sharp!</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for joining She Sharp! Please verify your email address to complete your registration.</p>
          <p>Click the button below to verify your email:</p>
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="button" style="color: white;">Verify Email</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <code style="font-size: 12px;">${verificationUrl}</code>
          </div>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>© 2025 She Sharp. Empowering women in STEM.</p>
          <p>If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Welcome to She Sharp!

Please verify your email address to complete your registration.

Click this link to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - She Sharp',
    html,
    text,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #000000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; color: #856404; padding: 10px; border-radius: 5px; margin: 20px 0; }
        .link-box { background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password for your She Sharp account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button" style="color: white;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <div class="link-box">
            <code style="font-size: 12px;">${resetUrl}</code>
          </div>
          <div class="warning">
            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.
          </div>
        </div>
        <div class="footer">
          <p>© 2025 She Sharp. Empowering women in STEM.</p>
          <p>For security reasons, this link will expire in 1 hour.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Password Reset Request

We received a request to reset your password for your She Sharp account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - She Sharp',
    html,
    text,
  });
}

/**
 * Send team invitation email
 */
export async function sendInvitationEmail(
  email: string, 
  teamName: string, 
  role: string,
  invitationId: number
) {
  // Use localhost in development mode when BASE_URL is production
  const baseUrl = process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app') 
    ? 'http://localhost:3000' 
    : (process.env.BASE_URL || 'http://localhost:3000');
  const inviteUrl = `${baseUrl}/sign-up?inviteId=${invitationId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Team Invitation - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #000000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .team-badge { background: #f0f0f0; padding: 10px 15px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .role-badge { background: #e8f4f8; color: #1a73e8; padding: 5px 10px; border-radius: 3px; display: inline-block; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're Invited to Join a Team!</h1>
        </div>
        <div class="content">
          <h2>Team Invitation</h2>
          <p>You've been invited to join <strong>${teamName}</strong> on She Sharp as a <span class="role-badge">${role.toUpperCase()}</span>.</p>
          
          <div class="team-badge">
            <strong>Team:</strong> ${teamName}<br>
            <strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}<br>
            <strong>Platform:</strong> She Sharp
          </div>
          
          <p>Click the button below to accept this invitation and create your account:</p>
          
          <div style="text-align: center;">
            <a href="${inviteUrl}" class="button" style="color: white;">Accept Invitation</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; margin: 10px 0;">
            <code style="font-size: 12px;">${inviteUrl}</code>
          </div>
          
          <p style="color: #666; font-size: 14px;">This invitation link will expire in 7 days.</p>
        </div>
        <div class="footer">
          <p>© 2025 She Sharp. Empowering women in STEM.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Team Invitation - She Sharp

You've been invited to join ${teamName} on She Sharp as a ${role}.

Click this link to accept the invitation and create your account:
${inviteUrl}

This invitation link will expire in 7 days.

If you didn't expect this invitation, you can safely ignore this email.

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: `Invitation to join ${teamName} - She Sharp`,
    html,
    text,
  });
}

/**
 * Send payment confirmation email with invitation code
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  details: {
    invitationCode: string;
    membershipTier: string;
    expiresAt: Date;
    amount: string;
  }
) {
  const baseUrl = process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app')
    ? 'http://localhost:3000'
    : (process.env.BASE_URL || 'http://localhost:3000');
  const signUpUrl = `${baseUrl}/sign-up?code=${details.invitationCode}`;
  const expiryDate = new Date(details.expiresAt).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Payment Confirmation - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #000000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .code-box { background: #e8f5e9; border: 2px dashed #4caf50; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .code { font-size: 24px; font-weight: bold; color: #2e7d32; letter-spacing: 2px; font-family: monospace; }
        .details-box { background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .success-badge { background: #4caf50; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Payment Successful!</h1>
        </div>
        <div class="content">
          <div style="text-align: center;">
            <span class="success-badge">✓ Payment Confirmed</span>
          </div>

          <h2>Welcome to She Sharp Mentorship Programme!</h2>
          <p>Thank you for your payment of <strong>$${details.amount} NZD</strong> for the ${details.membershipTier.charAt(0).toUpperCase() + details.membershipTier.slice(1)} Membership.</p>

          <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #666;">Your Invitation Code:</p>
            <div class="code">${details.invitationCode}</div>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Use this code to complete your registration</p>
          </div>

          <div class="details-box">
            <h3 style="margin-top: 0;">Membership Details</h3>
            <p><strong>Tier:</strong> ${details.membershipTier.charAt(0).toUpperCase() + details.membershipTier.slice(1)}</p>
            <p><strong>Valid Until:</strong> ${expiryDate}</p>
            <p><strong>Benefits:</strong></p>
            <ul style="margin: 0; padding-left: 20px;">
              <li>Priority access to mentorship matching</li>
              <li>Exclusive networking events</li>
              <li>Premium learning resources</li>
              <li>1-on-1 mentor sessions</li>
            </ul>
          </div>

          <p>Click the button below to complete your registration:</p>
          <div style="text-align: center;">
            <a href="${signUpUrl}" class="button" style="color: white;">Complete Registration</a>
          </div>

          <p style="color: #666; font-size: 14px;">Or copy your invitation code and use it during sign-up at:</p>
          <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; margin: 10px 0;">
            <code style="font-size: 12px;">${baseUrl}/sign-up</code>
          </div>

          <p style="color: #999; font-size: 12px;">Note: This invitation code is valid for 30 days and can only be used once.</p>
        </div>
        <div class="footer">
          <p>© 2025 She Sharp. Empowering women in STEM.</p>
          <p>Questions? Contact us at support@shesharp.org.nz</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Payment Confirmation - She Sharp

🎉 Payment Successful!

Thank you for your payment of $${details.amount} NZD for the ${details.membershipTier} Membership.

YOUR INVITATION CODE: ${details.invitationCode}

Membership Details:
- Tier: ${details.membershipTier}
- Valid Until: ${expiryDate}

Benefits include:
- Priority access to mentorship matching
- Exclusive networking events
- Premium learning resources
- 1-on-1 mentor sessions

Complete your registration at:
${signUpUrl}

Or use your invitation code during sign-up at:
${baseUrl}/sign-up

Note: This invitation code is valid for 30 days and can only be used once.

© 2025 She Sharp. Empowering women in STEM.
Questions? Contact us at support@shesharp.org.nz
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Payment Confirmed - Your She Sharp Invitation Code',
    html,
    text,
  });
}

/**
 * Send invitation code email (for mentor approval or admin-generated codes)
 */
export async function sendInvitationCodeEmail(
  email: string,
  details: {
    invitationCode: string;
    codeType: 'mentor_approved' | 'admin_generated';
    expiresAt?: Date;
    message?: string;
  }
) {
  const baseUrl = process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app')
    ? 'http://localhost:3000'
    : (process.env.BASE_URL || 'http://localhost:3000');
  const signUpUrl = `${baseUrl}/sign-up?code=${details.invitationCode}`;

  const isApproval = details.codeType === 'mentor_approved';
  const title = isApproval ? 'Your Mentor Application is Approved!' : 'Your She Sharp Invitation';
  const greeting = isApproval
    ? 'Congratulations! Your application to become a mentor at She Sharp has been approved.'
    : 'You have been invited to join She Sharp!';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #000000; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #000000; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .code-box { background: #e3f2fd; border: 2px dashed #2196f3; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0; }
        .code { font-size: 24px; font-weight: bold; color: #1565c0; letter-spacing: 2px; font-family: monospace; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isApproval ? '🎉' : '✉️'} ${title}</h1>
        </div>
        <div class="content">
          <p>${greeting}</p>
          ${details.message ? `<p>${details.message}</p>` : ''}

          <div class="code-box">
            <p style="margin: 0 0 10px 0; color: #666;">Your Invitation Code:</p>
            <div class="code">${details.invitationCode}</div>
          </div>

          <p>Click the button below to complete your registration:</p>
          <div style="text-align: center;">
            <a href="${signUpUrl}" class="button" style="color: white;">Complete Registration</a>
          </div>

          <p style="color: #666; font-size: 14px;">Or use your invitation code at: ${baseUrl}/sign-up</p>
          ${details.expiresAt ? `<p style="color: #999; font-size: 12px;">This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.</p>` : ''}
        </div>
        <div class="footer">
          <p>© 2025 She Sharp. Empowering women in STEM.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
${title}

${greeting}
${details.message || ''}

YOUR INVITATION CODE: ${details.invitationCode}

Complete your registration at:
${signUpUrl}

Or use your invitation code at: ${baseUrl}/sign-up
${details.expiresAt ? `This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.` : ''}

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: `${isApproval ? '🎉 ' : ''}${title} - She Sharp`,
    html,
    text,
  });
}