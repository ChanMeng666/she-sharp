/**
 * Email templates for the recruitment lifecycle.
 * Uses Resend via the shared sendEmail utility and branded layout.
 */

import { sendEmail, getBaseUrl } from '@/lib/email/service';
import { brandedEmailLayout, brandButton, infoBox, warningBox, BRAND } from '@/lib/email/layout';

const TYPE_LABELS: Record<string, string> = {
  ambassador: 'Ambassador',
  volunteer: 'Event Volunteer',
  ex_ambassador: 'Ex-Ambassador',
};

// ============================================================================
// 1. Application Confirmation Email
// ============================================================================

export interface ApplicationConfirmationData {
  applicantName: string;
  applicantEmail: string;
  applicationType: 'ambassador' | 'volunteer' | 'ex_ambassador';
  submittedAt: Date;
}

export async function sendApplicationConfirmationEmail(
  email: string,
  data: ApplicationConfirmationData
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[data.applicationType] || data.applicationType;

  const html = brandedEmailLayout({
    title: 'Thank You for Your Application!',
    preheader: `We've received your ${typeLabel} application.`,
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>${typeLabel}</strong> application and we're excited to learn more about you!</p>

      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">What Happens Next?</h3>
        <ol style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Our team will review your application</li>
          <li style="margin: 8px 0;">We'll be in touch within 5-7 business days</li>
          <li style="margin: 8px 0;">If you have questions, contact <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.purpleDark};">mentoring@shesharp.org.nz</a></li>
        </ol>
      `)}

      <p>In the meantime, check out our upcoming events and connect with us on social media!</p>
      ${brandButton('Browse Events', `${getBaseUrl()}/events`)}
    `,
  });

  const text = `
Hi ${data.applicantName},

We've received your ${typeLabel} application and we're excited to learn more about you!

What Happens Next:
1. Our team will review your application
2. We'll be in touch within 5-7 business days
3. If you have questions, contact mentoring@shesharp.org.nz

Browse our events: ${getBaseUrl()}/events
  `;

  return sendEmail({
    to: email,
    subject: `Application Received - She Sharp ${typeLabel}`,
    html,
    text,
  });
}

// ============================================================================
// 2. Interview Invitation Email
// ============================================================================

export interface InterviewInvitationData {
  applicantName: string;
  applicationType: string;
  interviewDate?: string;
  interviewNotes?: string;
  contactEmail?: string;
}

export async function sendInterviewInvitationEmail(
  email: string,
  data: InterviewInvitationData
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[data.applicationType] || data.applicationType;
  const contactEmail = data.contactEmail || 'mentoring@shesharp.org.nz';

  const interviewDetailsHtml = data.interviewDate
    ? `<div style="background: #ffffff; border: 1px solid #e0e0e0; padding: 15px; border-radius: 5px; margin: 15px 0;">
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Interview Details</h3>
        <p><strong>Date:</strong> ${data.interviewDate}</p>
        ${data.interviewNotes ? `<p><strong>Notes:</strong> ${data.interviewNotes}</p>` : ''}
      </div>`
    : `<p>We'll follow up with available times shortly.</p>`;

  const html = brandedEmailLayout({
    title: 'Great News! Interview Invitation',
    preheader: `We were impressed with your ${typeLabel} application!`,
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>We were impressed with your <strong>${typeLabel}</strong> application and would love to chat!</p>

      ${interviewDetailsHtml}

      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Preparation Tips</h3>
        <ul style="margin: 15px 0; padding-left: 20px;">
          <li style="margin: 8px 0;">Be yourself! We want to get to know the real you</li>
          <li style="margin: 8px 0;">Think about what you'd like to contribute to She Sharp</li>
          <li style="margin: 8px 0;">Prepare any questions you have for us</li>
        </ul>
      `)}

      <p>If you need to reschedule, please reply to this email or contact <a href="mailto:${contactEmail}" style="color: ${BRAND.purpleDark};">${contactEmail}</a>.</p>
    `,
  });

  const text = `
Hi ${data.applicantName},

Great news! We were impressed with your ${typeLabel} application and would love to chat!

${data.interviewDate ? `Interview Date: ${data.interviewDate}` : "We'll follow up with available times shortly."}
${data.interviewNotes ? `Notes: ${data.interviewNotes}` : ''}

Preparation Tips:
- Be yourself! We want to get to know the real you
- Think about what you'd like to contribute to She Sharp
- Prepare any questions you have for us

Contact: ${contactEmail}
  `;

  return sendEmail({
    to: email,
    subject: 'Interview Invitation - She Sharp',
    html,
    text,
  });
}

// ============================================================================
// 3. Application Approved Email
// ============================================================================

export interface ApplicationApprovedData {
  applicantName: string;
  applicationType: string;
  welcomeMessage?: string;
  nextSteps?: string[];
}

export async function sendApplicationApprovedEmail(
  email: string,
  data: ApplicationApprovedData
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[data.applicationType] || data.applicationType;

  const defaultNextSteps: Record<string, string[]> = {
    ambassador: [
      "You'll receive an NDA to review and sign",
      'Join our Slack workspace (invite coming soon)',
      'Attend the next Monday meeting',
    ],
    volunteer: [
      "We'll invite you to upcoming events",
      'Join our Slack workspace (invite coming soon)',
    ],
    ex_ambassador: [
      'Thank you for sharing your experience with us',
    ],
  };

  const nextSteps = data.nextSteps || defaultNextSteps[data.applicationType] || [];

  const nextStepsHtml = nextSteps.length > 0
    ? `<ul style="margin: 15px 0; padding-left: 20px;">${nextSteps.map(s => `<li style="margin: 8px 0;">${s}</li>`).join('')}</ul>`
    : '';

  const html = brandedEmailLayout({
    title: 'Welcome to She Sharp!',
    preheader: `Your ${typeLabel} application has been approved!`,
    bodyHtml: `
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: ${BRAND.successGreen}; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px; font-weight: bold;">Application Approved</span>
      </div>

      <p>Hi ${data.applicantName},</p>
      <p>Congratulations! Your <strong>${typeLabel}</strong> application has been approved. We're thrilled to have you on board!</p>

      ${data.welcomeMessage ? `<p>${data.welcomeMessage}</p>` : ''}

      ${nextSteps.length > 0 ? infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Next Steps</h3>
        ${nextStepsHtml}
      `) : ''}

      ${brandButton('Visit She Sharp', getBaseUrl())}
    `,
  });

  const text = `
Hi ${data.applicantName},

Congratulations! Your ${typeLabel} application has been approved. We're thrilled to have you on board!

${data.welcomeMessage || ''}

${nextSteps.length > 0 ? 'Next Steps:\n' + nextSteps.map(s => `- ${s}`).join('\n') : ''}
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to She Sharp!',
    html,
    text,
  });
}

// ============================================================================
// 4. Application Rejected Email
// ============================================================================

export interface ApplicationRejectedData {
  applicantName: string;
  applicationType: string;
  feedbackMessage?: string;
}

export async function sendApplicationRejectedEmail(
  email: string,
  data: ApplicationRejectedData
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[data.applicationType] || data.applicationType;

  const html = brandedEmailLayout({
    title: 'Application Update',
    preheader: `Update on your ${typeLabel} application at She Sharp.`,
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>Thank you for your interest in the <strong>${typeLabel}</strong> role at She Sharp. After careful review, we're unable to move forward with your application at this time.</p>

      ${data.feedbackMessage ? infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Feedback</h3>
        <p style="margin-bottom: 0;">${data.feedbackMessage}</p>
      `) : ''}

      <p>We encourage you to attend our events and stay connected with the She Sharp community. You're always welcome to apply again in the future!</p>

      ${brandButton('Browse Our Events', `${getBaseUrl()}/events`)}
    `,
  });

  const text = `
Hi ${data.applicantName},

Thank you for your interest in the ${typeLabel} role at She Sharp. After careful review, we're unable to move forward with your application at this time.

${data.feedbackMessage ? `Feedback: ${data.feedbackMessage}` : ''}

We encourage you to attend our events and stay connected. You're always welcome to apply again!

Events: ${getBaseUrl()}/events
  `;

  return sendEmail({
    to: email,
    subject: 'Application Update - She Sharp',
    html,
    text,
  });
}

// ============================================================================
// 5. Onboarding Welcome Email
// ============================================================================

export interface OnboardingData {
  applicantName: string;
  applicationType: string;
  slackInviteLink?: string;
  ndaLink?: string;
  nextEventDate?: string;
  mondayMeetingInfo?: string;
}

export async function sendOnboardingEmail(
  email: string,
  data: OnboardingData
): Promise<boolean> {
  const typeLabel = TYPE_LABELS[data.applicationType] || data.applicationType;

  const checklist = [
    data.ndaLink ? `<li style="margin: 8px 0;">Sign NDA - <a href="${data.ndaLink}" style="color: ${BRAND.purpleDark};">Review & Sign</a></li>` : '<li style="margin: 8px 0;">Sign NDA (link coming soon)</li>',
    data.slackInviteLink ? `<li style="margin: 8px 0;">Join Slack workspace - <a href="${data.slackInviteLink}" style="color: ${BRAND.purpleDark};">Join Here</a></li>` : '<li style="margin: 8px 0;">Join Slack workspace (invite coming soon)</li>',
    '<li style="margin: 8px 0;">Attend next Monday meeting</li>',
    `<li style="margin: 8px 0;">Review our <a href="${getBaseUrl()}/volunteers/code-of-conduct" style="color: ${BRAND.purpleDark};">Code of Conduct</a></li>`,
  ];

  const html = brandedEmailLayout({
    title: "Let's Get Started!",
    preheader: `Welcome to the She Sharp team as a ${typeLabel}!`,
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>Welcome to the She Sharp team as a <strong>${typeLabel}</strong>! Here's everything you need to get started:</p>

      ${infoBox(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Onboarding Checklist</h3>
        <ul style="margin: 15px 0; padding-left: 20px;">
          ${checklist.join('\n          ')}
        </ul>
      `)}

      ${data.mondayMeetingInfo ? `<p><strong>Monday Meeting:</strong> ${data.mondayMeetingInfo}</p>` : ''}
      ${data.nextEventDate ? `<p><strong>Next Event:</strong> ${data.nextEventDate}</p>` : ''}

      <p>If you have any questions, don't hesitate to reach out to <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.purpleDark};">mentoring@shesharp.org.nz</a>.</p>
    `,
  });

  const text = `
Hi ${data.applicantName},

Welcome to the She Sharp team as a ${typeLabel}! Here's your onboarding checklist:

- Sign NDA ${data.ndaLink ? `(${data.ndaLink})` : '(link coming soon)'}
- Join Slack workspace ${data.slackInviteLink ? `(${data.slackInviteLink})` : '(invite coming soon)'}
- Attend next Monday meeting
- Review Code of Conduct: ${getBaseUrl()}/volunteers/code-of-conduct

${data.mondayMeetingInfo ? `Monday Meeting: ${data.mondayMeetingInfo}` : ''}
${data.nextEventDate ? `Next Event: ${data.nextEventDate}` : ''}

Questions? Contact mentoring@shesharp.org.nz
  `;

  return sendEmail({
    to: email,
    subject: "Let's Get Started - She Sharp Onboarding",
    html,
    text,
  });
}

// ============================================================================
// 6. NDA Reminder Email
// ============================================================================

export interface NDAReminderData {
  applicantName: string;
  ndaLink?: string;
}

export async function sendNDAReminderEmail(
  email: string,
  data: NDAReminderData
): Promise<boolean> {
  const html = brandedEmailLayout({
    title: 'NDA - Action Required',
    preheader: 'Please review and sign the NDA to complete your onboarding.',
    bodyHtml: `
      <p>Hi ${data.applicantName},</p>
      <p>Please review and sign the Non-Disclosure Agreement (NDA) to complete your onboarding with She Sharp.</p>

      ${data.ndaLink ? brandButton('Review & Sign NDA', data.ndaLink) : '<p>The NDA document will be shared with you shortly.</p>'}

      ${warningBox(`<strong>Note:</strong> The NDA must be signed before you can start participating in team activities. If you have questions about the agreement, please contact <a href="mailto:mentoring@shesharp.org.nz" style="color: ${BRAND.warningOrange};">mentoring@shesharp.org.nz</a>.`)}
    `,
  });

  const text = `
Hi ${data.applicantName},

Please review and sign the Non-Disclosure Agreement (NDA) to complete your onboarding with She Sharp.

${data.ndaLink ? `Sign here: ${data.ndaLink}` : 'The NDA document will be shared with you shortly.'}

The NDA must be signed before you can start participating in team activities.

Questions? Contact mentoring@shesharp.org.nz
  `;

  return sendEmail({
    to: email,
    subject: 'NDA - Action Required - She Sharp',
    html,
    text,
  });
}
