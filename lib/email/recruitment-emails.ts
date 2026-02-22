/**
 * Email templates for the recruitment lifecycle.
 * Uses Resend via the shared sendEmail utility.
 */

import { sendEmail } from '@/lib/email/service';

function getBaseUrl(): string {
  if (process.env.NODE_ENV === 'development' && process.env.BASE_URL?.includes('vercel.app')) {
    return 'http://localhost:3000';
  }
  return process.env.BASE_URL || 'http://localhost:3000';
}

const TYPE_LABELS: Record<string, string> = {
  ambassador: 'Ambassador',
  volunteer: 'Event Volunteer',
  ex_ambassador: 'Ex-Ambassador',
};

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

  const html = emailLayout('Thank You for Your Application', 'linear-gradient(135deg, #9b2e83, #6b1d5e)', `
    <div class="header">
      <h1>Thank You for Your Application!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>We've received your <strong>${typeLabel}</strong> application and we're excited to learn more about you!</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">What Happens Next?</h3>
        <ol class="step-list">
          <li>Our team will review your application</li>
          <li>We'll be in touch within 5-7 business days</li>
          <li>If you have questions, contact <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a></li>
        </ol>
      </div>

      <p>In the meantime, check out our upcoming events and connect with us on social media!</p>

      <div style="text-align: center;">
        <a href="${getBaseUrl()}/events" class="button" style="color: white;">Browse Events</a>
      </div>
    </div>
  `);

  const text = `
Hi ${data.applicantName},

We've received your ${typeLabel} application and we're excited to learn more about you!

What Happens Next:
1. Our team will review your application
2. We'll be in touch within 5-7 business days
3. If you have questions, contact people@shesharp.org.nz

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
  const contactEmail = data.contactEmail || 'people@shesharp.org.nz';

  const interviewDetailsHtml = data.interviewDate
    ? `<div class="info-box"><h3 style="margin-top:0;">Interview Details</h3><p><strong>Date:</strong> ${data.interviewDate}</p>${data.interviewNotes ? `<p><strong>Notes:</strong> ${data.interviewNotes}</p>` : ''}</div>`
    : `<p>We'll follow up with available times shortly.</p>`;

  const html = emailLayout('Interview Invitation', 'linear-gradient(135deg, #2e7d32, #1b5e20)', `
    <div class="header" style="background: linear-gradient(135deg, #2e7d32, #1b5e20);">
      <h1>Great News! Interview Invitation</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>We were impressed with your <strong>${typeLabel}</strong> application and would love to chat!</p>

      ${interviewDetailsHtml}

      <div class="info-box">
        <h3 style="margin-top: 0;">Preparation Tips</h3>
        <ul class="step-list">
          <li>Be yourself! We want to get to know the real you</li>
          <li>Think about what you'd like to contribute to She Sharp</li>
          <li>Prepare any questions you have for us</li>
        </ul>
      </div>

      <p>If you need to reschedule, please reply to this email or contact <a href="mailto:${contactEmail}">${contactEmail}</a>.</p>
    </div>
  `);

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
    ? `<ul class="step-list">${nextSteps.map(s => `<li>${s}</li>`).join('')}</ul>`
    : '';

  const html = emailLayout('Welcome to She Sharp', 'linear-gradient(135deg, #9b2e83, #6b1d5e)', `
    <div class="header">
      <h1>Welcome to She Sharp!</h1>
    </div>
    <div class="content">
      <div style="text-align: center; margin-bottom: 20px;">
        <span style="background: #4caf50; color: white; padding: 8px 20px; border-radius: 20px; display: inline-block; font-size: 14px;">Application Approved</span>
      </div>

      <p>Hi ${data.applicantName},</p>
      <p>Congratulations! Your <strong>${typeLabel}</strong> application has been approved. We're thrilled to have you on board!</p>

      ${data.welcomeMessage ? `<p>${data.welcomeMessage}</p>` : ''}

      ${nextSteps.length > 0 ? `
        <div class="info-box">
          <h3 style="margin-top: 0;">Next Steps</h3>
          ${nextStepsHtml}
        </div>
      ` : ''}

      <div style="text-align: center;">
        <a href="${getBaseUrl()}" class="button" style="color: white;">Visit She Sharp</a>
      </div>
    </div>
  `);

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

  const html = emailLayout('Application Update', '#333333', `
    <div class="header" style="background: #333333;">
      <h1>Application Update</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>Thank you for your interest in the <strong>${typeLabel}</strong> role at She Sharp. After careful review, we're unable to move forward with your application at this time.</p>

      ${data.feedbackMessage ? `
        <div class="info-box">
          <h3 style="margin-top: 0;">Feedback</h3>
          <p>${data.feedbackMessage}</p>
        </div>
      ` : ''}

      <p>We encourage you to attend our events and stay connected with the She Sharp community. You're always welcome to apply again in the future!</p>

      <div style="text-align: center;">
        <a href="${getBaseUrl()}/events" class="button" style="color: white;">Browse Our Events</a>
      </div>
    </div>
  `);

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
    data.ndaLink ? `<li>Sign NDA - <a href="${data.ndaLink}">Review & Sign</a></li>` : '<li>Sign NDA (link coming soon)</li>',
    data.slackInviteLink ? `<li>Join Slack workspace - <a href="${data.slackInviteLink}">Join Here</a></li>` : '<li>Join Slack workspace (invite coming soon)</li>',
    '<li>Attend next Monday meeting</li>',
    `<li>Review our <a href="${getBaseUrl()}/volunteers/code-of-conduct">Code of Conduct</a></li>`,
  ];

  const html = emailLayout("Let's Get Started", 'linear-gradient(135deg, #9b2e83, #8982ff)', `
    <div class="header" style="background: linear-gradient(135deg, #9b2e83, #8982ff);">
      <h1>Let's Get Started!</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>Welcome to the She Sharp team as a <strong>${typeLabel}</strong>! Here's everything you need to get started:</p>

      <div class="info-box">
        <h3 style="margin-top: 0;">Onboarding Checklist</h3>
        <ul class="step-list">
          ${checklist.join('\n          ')}
        </ul>
      </div>

      ${data.mondayMeetingInfo ? `<p><strong>Monday Meeting:</strong> ${data.mondayMeetingInfo}</p>` : ''}
      ${data.nextEventDate ? `<p><strong>Next Event:</strong> ${data.nextEventDate}</p>` : ''}

      <p>If you have any questions, don't hesitate to reach out to <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a>.</p>
    </div>
  `);

  const text = `
Hi ${data.applicantName},

Welcome to the She Sharp team as a ${typeLabel}! Here's your onboarding checklist:

- Sign NDA ${data.ndaLink ? `(${data.ndaLink})` : '(link coming soon)'}
- Join Slack workspace ${data.slackInviteLink ? `(${data.slackInviteLink})` : '(invite coming soon)'}
- Attend next Monday meeting
- Review Code of Conduct: ${getBaseUrl()}/volunteers/code-of-conduct

${data.mondayMeetingInfo ? `Monday Meeting: ${data.mondayMeetingInfo}` : ''}
${data.nextEventDate ? `Next Event: ${data.nextEventDate}` : ''}

Questions? Contact people@shesharp.org.nz
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
  const html = emailLayout('NDA - Action Required', 'linear-gradient(135deg, #e65100, #bf360c)', `
    <div class="header" style="background: linear-gradient(135deg, #e65100, #bf360c);">
      <h1>NDA - Action Required</h1>
    </div>
    <div class="content">
      <p>Hi ${data.applicantName},</p>
      <p>Please review and sign the Non-Disclosure Agreement (NDA) to complete your onboarding with She Sharp.</p>

      ${data.ndaLink ? `
        <div style="text-align: center;">
          <a href="${data.ndaLink}" class="button" style="color: white;">Review & Sign NDA</a>
        </div>
      ` : '<p>The NDA document will be shared with you shortly.</p>'}

      <div class="info-box">
        <p style="margin: 0;"><strong>Note:</strong> The NDA must be signed before you can start participating in team activities. If you have questions about the agreement, please contact <a href="mailto:people@shesharp.org.nz">people@shesharp.org.nz</a>.</p>
      </div>
    </div>
  `);

  const text = `
Hi ${data.applicantName},

Please review and sign the Non-Disclosure Agreement (NDA) to complete your onboarding with She Sharp.

${data.ndaLink ? `Sign here: ${data.ndaLink}` : 'The NDA document will be shared with you shortly.'}

The NDA must be signed before you can start participating in team activities.

Questions? Contact people@shesharp.org.nz
  `;

  return sendEmail({
    to: email,
    subject: 'NDA - Action Required - She Sharp',
    html,
    text,
  });
}
