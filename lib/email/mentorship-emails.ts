/**
 * Email templates for mentorship application confirmations.
 * Uses Resend via the shared sendEmail utility.
 */

import { sendEmail, getBaseUrl } from '@/lib/email/service';

function emailLayout(title: string, headerColor: string, bodyHtml: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title} - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${headerColor}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #9b2e83; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; border-radius: 0 0 10px 10px; }
        .step-list { margin: 15px 0; padding-left: 20px; }
        .step-list li { margin: 8px 0; }
        .info-box { background: #fff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        ${bodyHtml}
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} She Sharp. Empowering women in STEM.</p>
          <p>Questions? Contact us at <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ============================================================================
// 1. Mentor Application Confirmation Email
// ============================================================================

export async function sendMentorApplicationConfirmationEmail(
  email: string,
  data: { applicantName: string }
): Promise<boolean> {
  const html = emailLayout('Application Received', 'linear-gradient(135deg, #9b2e83, #6b1d5e)', `
    <div class="header">
      <h1>Thank You for Applying!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>Mentor</strong> application for the She Sharp Mentorship Programme and we're excited to learn more about you!</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <ol class="step-list">
          <li>Our team will review your application within <strong>5-7 business days</strong></li>
          <li>Once approved, you'll receive an email with an invitation code to complete your registration</li>
          <li>If you have questions, contact <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a></li>
        </ol>
      </div>

      <p>In the meantime, check out our upcoming events and connect with us!</p>

      <div style="text-align: center;">
        <a href="${getBaseUrl()}/events" class="button" style="color: white;">Browse Events</a>
      </div>
    </div>
  `);

  const text = `
Hi ${data.applicantName},

We've received your Mentor application for the She Sharp Mentorship Programme and we're excited to learn more about you!

What Happens Next:
1. Our team will review your application within 5-7 business days
2. Once approved, you'll receive an email with an invitation code to complete your registration
3. If you have questions, contact people@shesharp.org.nz

Browse our events: ${getBaseUrl()}/events
  `;

  return sendEmail({
    to: email,
    subject: 'Application Received — She Sharp Mentor Programme',
    html,
    text,
  });
}

// ============================================================================
// 2. Mentee Application Confirmation Email
// ============================================================================

export async function sendMenteeApplicationConfirmationEmail(
  email: string,
  data: { applicantName: string; programmeName?: string; requiresPayment: boolean }
): Promise<boolean> {
  const isProgramme = !!data.programmeName;

  const nextStepsHtml = isProgramme
    ? `
      <div class="info-box">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <ol class="step-list">
          <li>Your application to the <strong>${data.programmeName}</strong> programme is now under review</li>
          <li>Our team will get back to you within <strong>5-7 business days</strong></li>
          <li>If you have questions, contact <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a></li>
        </ol>
      </div>
    `
    : `
      <div class="info-box">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <ol class="step-list">
          <li>Our team will review your application within <strong>5-7 business days</strong></li>
          ${data.requiresPayment ? '<li>Please complete the membership payment to finalise your application</li>' : ''}
          <li>Once approved, you'll receive an email with next steps to get started</li>
          <li>If you have questions, contact <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a></li>
        </ol>
      </div>
    `;

  const subjectSuffix = isProgramme ? ` (${data.programmeName})` : '';

  const html = emailLayout('Application Received', 'linear-gradient(135deg, #9b2e83, #6b1d5e)', `
    <div class="header">
      <h1>Thank You for Applying!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>Mentee</strong> application${isProgramme ? ` for the <strong>${data.programmeName}</strong> programme` : ''} and we're thrilled you want to be part of the She Sharp community!</p>

      ${nextStepsHtml}

      <p>In the meantime, check out our upcoming events and connect with us!</p>

      <div style="text-align: center;">
        <a href="${getBaseUrl()}/events" class="button" style="color: white;">Browse Events</a>
      </div>
    </div>
  `);

  const nextStepsText = isProgramme
    ? `What Happens Next:
1. Your application to the ${data.programmeName} programme is now under review
2. Our team will get back to you within 5-7 business days
3. If you have questions, contact people@shesharp.org.nz`
    : `What Happens Next:
1. Our team will review your application within 5-7 business days
${data.requiresPayment ? '2. Please complete the membership payment to finalise your application\n3.' : '2.'} Once approved, you'll receive an email with next steps to get started
${data.requiresPayment ? '4.' : '3.'} If you have questions, contact people@shesharp.org.nz`;

  const text = `
Hi ${data.applicantName},

We've received your Mentee application${isProgramme ? ` for the ${data.programmeName} programme` : ''} and we're thrilled you want to be part of the She Sharp community!

${nextStepsText}

Browse our events: ${getBaseUrl()}/events
  `;

  return sendEmail({
    to: email,
    subject: `Application Received — She Sharp Mentee Programme${subjectSuffix}`,
    html,
    text,
  });
}
