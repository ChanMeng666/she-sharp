/**
 * Email templates for mentorship application confirmations.
 * Uses Resend via the shared sendEmail utility and branded layout.
 */

import { sendEmail, getBaseUrl } from '@/lib/email/service';
import { brandedEmailLayout, brandButton, infoBox, BRAND } from '@/lib/email/layout';

// ============================================================================
// 1. Mentor Application Confirmation Email
// ============================================================================

export async function sendMentorApplicationConfirmationEmail(
  email: string,
  data: { applicantName: string }
): Promise<boolean> {
  const html = brandedEmailLayout({
    title: 'Thank You for Applying!',
    preheader: "We've received your Mentor application for the She Sharp Mentorship Programme.",
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>Mentor</strong> application for the She Sharp Mentorship Programme and we're excited to learn more about you!</p>

      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">What Happens Next?</h3>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Our team will review your application within <strong>5-7 business days</strong></li>
          <li style="margin: 8px 0;">Once approved, you'll receive an email with an invitation code to complete your registration</li>
          <li style="margin: 8px 0;">If you have questions, contact <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.purpleDark};">mentoring@shesharp.org.nz</a></li>
        </ol>
      `)}

      <p>In the meantime, check out our upcoming events and connect with us!</p>
      ${brandButton('Browse Events', `${getBaseUrl()}/events`)}
    `,
  });

  const text = `
Hi ${data.applicantName},

We've received your Mentor application for the She Sharp Mentorship Programme and we're excited to learn more about you!

What Happens Next:
1. Our team will review your application within 5-7 business days
2. Once approved, you'll receive an email with an invitation code to complete your registration
3. If you have questions, contact mentoring@shesharp.org.nz

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
      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">What Happens Next?</h3>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Your application to the <strong>${data.programmeName}</strong> programme is now under review</li>
          <li style="margin: 8px 0;">Our team will get back to you within <strong>5-7 business days</strong></li>
          <li style="margin: 8px 0;">If you have questions, contact <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.purpleDark};">mentoring@shesharp.org.nz</a></li>
        </ol>
      `)}
    `
    : `
      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">What Happens Next?</h3>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Our team will review your application within <strong>5-7 business days</strong></li>
          ${data.requiresPayment ? '<li style="margin: 8px 0;">Please complete the membership payment to finalise your application</li>' : ''}
          <li style="margin: 8px 0;">Once approved, you'll receive an email with next steps to get started</li>
          <li style="margin: 8px 0;">If you have questions, contact <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.purpleDark};">mentoring@shesharp.org.nz</a></li>
        </ol>
      `)}
    `;

  const subjectSuffix = isProgramme ? ` (${data.programmeName})` : '';

  const html = brandedEmailLayout({
    title: 'Thank You for Applying!',
    preheader: `We've received your Mentee application${isProgramme ? ` for the ${data.programmeName} programme` : ''}.`,
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>Mentee</strong> application${isProgramme ? ` for the <strong>${data.programmeName}</strong> programme` : ''} and we're thrilled you want to be part of the She Sharp community!</p>

      ${nextStepsHtml}

      <p>In the meantime, check out our upcoming events and connect with us!</p>
      ${brandButton('Browse Events', `${getBaseUrl()}/events`)}
    `,
  });

  const nextStepsText = isProgramme
    ? `What Happens Next:
1. Your application to the ${data.programmeName} programme is now under review
2. Our team will get back to you within 5-7 business days
3. If you have questions, contact mentoring@shesharp.org.nz`
    : `What Happens Next:
1. Our team will review your application within 5-7 business days
${data.requiresPayment ? '2. Please complete the membership payment to finalise your application\n3.' : '2.'} Once approved, you'll receive an email with next steps to get started
${data.requiresPayment ? '4.' : '3.'} If you have questions, contact mentoring@shesharp.org.nz`;

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
