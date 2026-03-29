import { Resend } from 'resend';
import { brandedEmailLayout, brandButton, infoBox, linkBox, codeBox, warningBox, successBadge, detailsCard, BRAND } from './layout';

/**
 * Get the base URL for email links
 */
export function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app')) {
    return 'http://localhost:3000';
  }
  return process.env.BASE_URL || 'http://localhost:3000';
}

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
  const baseUrl = getBaseUrl();
  const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

  const html = brandedEmailLayout({
    title: 'Welcome to She Sharp!',
    preheader: 'Please verify your email address to complete your registration.',
    bodyHtml: `
      <h2 style="color: ${BRAND.purpleDark}; margin-top: 0;">Verify Your Email Address</h2>
      <p>Thank you for joining She Sharp! Please verify your email address to complete your registration.</p>
      <p>Click the button below to verify your email:</p>
      ${brandButton('Verify Email', verificationUrl)}
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      ${linkBox(verificationUrl)}
      <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
    `,
    footerExtra: '<p style="margin: 0; font-size: 12px;">If you didn\'t create an account, please ignore this email.</p>',
  });

  const text = `
Welcome to She Sharp!

Please verify your email address to complete your registration.

Click this link to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create an account, please ignore this email.

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
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
  const resetUrl = `${getBaseUrl()}/reset-password?token=${token}`;

  const html = brandedEmailLayout({
    title: 'Password Reset Request',
    preheader: 'We received a request to reset your password.',
    bodyHtml: `
      <h2 style="color: ${BRAND.purpleDark}; margin-top: 0;">Reset Your Password</h2>
      <p>We received a request to reset your password for your She Sharp account.</p>
      <p>Click the button below to reset your password:</p>
      ${brandButton('Reset Password', resetUrl)}
      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser:</p>
      ${linkBox(resetUrl)}
      ${warningBox(`<strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request this password reset, please ignore this email and your password will remain unchanged.`)}
    `,
    footerExtra: '<p style="margin: 0; font-size: 12px;">For security reasons, this link will expire in 1 hour.</p>',
  });

  const text = `
Password Reset Request

We received a request to reset your password for your She Sharp account.

Click this link to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email and your password will remain unchanged.

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - She Sharp',
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
  const baseUrl = getBaseUrl();
  const signUpUrl = `${baseUrl}/sign-up?code=${details.invitationCode}`;
  const expiryDate = new Date(details.expiresAt).toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const tierLabel = details.membershipTier.charAt(0).toUpperCase() + details.membershipTier.slice(1);

  const html = brandedEmailLayout({
    title: 'Payment Successful!',
    preheader: 'Your payment has been confirmed. Here is your invitation code.',
    bodyHtml: `
      ${successBadge('✓ Payment Confirmed')}

      <h2 style="color: ${BRAND.purpleDark}; margin-top: 0; text-align: center;">Welcome to She Sharp Mentorship Programme!</h2>
      <p>Thank you for your payment of <strong>$${details.amount} NZD</strong> for the ${tierLabel} Membership.</p>

      ${codeBox(details.invitationCode, 'Your Invitation Code:')}

      ${detailsCard(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Membership Details</h3>
        <p><strong>Tier:</strong> ${tierLabel}</p>
        <p><strong>Valid Until:</strong> ${expiryDate}</p>
        <p><strong>Benefits:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>Priority access to mentorship matching</li>
          <li>Exclusive networking events</li>
          <li>Premium learning resources</li>
          <li>1-on-1 mentor sessions</li>
        </ul>
      `)}

      <p>Click the button below to complete your registration:</p>
      ${brandButton('Complete Registration', signUpUrl)}

      <p style="color: #666; font-size: 14px;">Or copy your invitation code and use it during sign-up at:</p>
      ${linkBox(`${baseUrl}/sign-up`)}

      <p style="color: #999; font-size: 12px;">Note: This invitation code is valid for 30 days and can only be used once.</p>
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
Payment Confirmation - She Sharp

Payment Successful!

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

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
Questions? Contact us at mentoring@shesharp.org.nz
  `;

  return sendEmail({
    to: email,
    subject: 'Payment Confirmed - Your She Sharp Invitation Code',
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
    codeType: 'mentor_approved' | 'mentee_approved' | 'admin_generated';
    expiresAt?: Date;
    message?: string;
  }
) {
  const baseUrl = getBaseUrl();
  const signUpUrl = `${baseUrl}/sign-up?code=${details.invitationCode}`;

  const isApproval = details.codeType === 'mentor_approved' || details.codeType === 'mentee_approved';
  const title = details.codeType === 'mentor_approved'
    ? 'Your Mentor Application is Approved!'
    : details.codeType === 'mentee_approved'
    ? 'Your Mentee Application is Approved!'
    : 'Your She Sharp Invitation';
  const greeting = details.codeType === 'mentor_approved'
    ? 'Congratulations! Your application to become a mentor at She Sharp has been approved.'
    : details.codeType === 'mentee_approved'
    ? 'Your application to join the She Sharp Mentorship Program as a mentee has been approved.'
    : 'You have been invited to join She Sharp!';

  const html = brandedEmailLayout({
    title,
    preheader: greeting,
    bodyHtml: `
      ${isApproval ? successBadge('Application Approved') : ''}
      <p>${greeting}</p>
      ${details.message ? `<p>${details.message}</p>` : ''}

      ${codeBox(details.invitationCode, 'Your Invitation Code:')}

      <p>Click the button below to complete your registration:</p>
      ${brandButton('Complete Registration', signUpUrl)}

      <p style="color: #666; font-size: 14px;">Or use your invitation code at: ${baseUrl}/sign-up</p>
      ${details.expiresAt ? `<p style="color: #999; font-size: 12px;">This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.</p>` : ''}
    `,
  });

  const text = `
${title}

${greeting}
${details.message || ''}

YOUR INVITATION CODE: ${details.invitationCode}

Complete your registration at:
${signUpUrl}

Or use your invitation code at: ${baseUrl}/sign-up
${details.expiresAt ? `This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.` : ''}

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: `${isApproval ? '' : ''}${title} - She Sharp`,
    html,
    text,
  });
}

/**
 * Send a friendly reminder email to mentors who haven't completed registration.
 * Different tone from the original approval email — explains the URL change.
 */
export async function sendMentorReminderEmail(
  email: string,
  details: {
    invitationCode: string;
    expiresAt?: Date;
    mentorName?: string;
  }
) {
  const baseUrl = getBaseUrl();
  const signUpUrl = `${baseUrl}/sign-up?code=${details.invitationCode}`;
  const firstName = details.mentorName?.split(' ')[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

  const html = brandedEmailLayout({
    title: 'Complete Your Mentor Registration',
    preheader: 'Your invitation code is ready — it only takes a few minutes to get started.',
    bodyHtml: `
      ${infoBox('<strong>Registration Reminder</strong>')}
      <p>${greeting}</p>
      <p>We'd love to have you on board as a mentor at She Sharp! Your registration is still pending and we wanted to make sure you have everything you need to get started.</p>
      <p style="color: #666;"><em>Please note: our website address has recently changed. If you previously tried to register using an earlier email, please use the updated link below instead.</em></p>

      ${codeBox(details.invitationCode, 'Your Invitation Code:')}

      <p>Click the button below to complete your registration — it only takes a few minutes:</p>
      ${brandButton('Complete Registration', signUpUrl)}

      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser: ${signUpUrl}</p>
      ${details.expiresAt ? `<p style="color: #999; font-size: 12px;">This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.</p>` : ''}
      <p>If you have any questions, feel free to reach out to us. We look forward to welcoming you to the She Sharp mentorship community!</p>
    `,
  });

  const text = `
Friendly Reminder: Complete Your She Sharp Mentor Registration

${greeting}

We'd love to have you on board as a mentor at She Sharp! Your registration is still pending.

Please note: our website address has recently changed. If you previously tried to register using an earlier email, please use the updated link below instead.

YOUR INVITATION CODE: ${details.invitationCode}

Complete your registration at:
${signUpUrl}

${details.expiresAt ? `This code expires on ${new Date(details.expiresAt).toLocaleDateString('en-NZ')}.` : ''}

If you have any questions, feel free to reach out. We look forward to welcoming you!

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: 'Friendly Reminder: Complete Your She Sharp Mentor Registration',
    html,
    text,
  });
}

/**
 * Send a URL update notification to existing users.
 * Used when the deployment domain changes.
 */
export async function sendUrlUpdateEmail(
  email: string,
  details: {
    userName?: string;
  }
) {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;
  const firstName = details.userName?.split(' ')[0] || '';
  const greeting = firstName ? `Hi ${firstName},` : 'Hi,';

  const html = brandedEmailLayout({
    title: 'She Sharp Has a New Home',
    preheader: 'We have moved to a new web address — update your bookmark!',
    bodyHtml: `
      ${infoBox('<strong>Website Update</strong>')}
      <p>${greeting}</p>
      <p>We wanted to let you know that She Sharp has moved to a new web address. Please update your bookmark to continue accessing your account and dashboard.</p>

      <p style="font-size: 16px; text-align: center; margin: 20px 0;"><strong>${baseUrl}</strong></p>

      ${brandButton('Visit She Sharp', dashboardUrl)}

      <p style="color: #666; font-size: 14px;">Or copy and paste this link into your browser: ${dashboardUrl}</p>
      <p>All your account data and mentor profile remain unchanged. If you have any questions, don't hesitate to reach out.</p>
    `,
  });

  const text = `
She Sharp Has a New Home — Update Your Bookmark

${greeting}

She Sharp has moved to a new web address. Please update your bookmark:

${baseUrl}

Visit your dashboard at:
${dashboardUrl}

All your account data and mentor profile remain unchanged.

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: email,
    subject: 'She Sharp Has a New Home — Update Your Bookmark',
    html,
    text,
  });
}
