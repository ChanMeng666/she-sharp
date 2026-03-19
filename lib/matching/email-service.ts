/**
 * Email Service for AI Matching System
 * Handles notifications for match approvals, queue updates, and status changes
 */

import { sendEmail, getBaseUrl } from '@/lib/email/service';
import { brandedEmailLayout, brandButton, infoBox, detailsCard, scoreBadge, warningBox, BRAND } from '@/lib/email/layout';
import type { MatchApprovalEmailData } from './types';

/**
 * Send match approval notifications to both mentor and mentee
 */
export async function sendMatchApprovalNotifications(
  data: MatchApprovalEmailData
): Promise<{ mentorSent: boolean; menteeSent: boolean }> {
  const [mentorSent, menteeSent] = await Promise.all([
    sendMatchApprovalToMentor(data),
    sendMatchApprovalToMentee(data),
  ]);

  return { mentorSent, menteeSent };
}

/**
 * Send match approval notification to mentor
 */
async function sendMatchApprovalToMentor(data: MatchApprovalEmailData): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard/mentorship`;

  const focusAreasHtml = data.focusAreas.length > 0
    ? `<ul style="margin: 10px 0; padding-left: 20px;">${data.focusAreas.map(area => `<li>${area}</li>`).join('')}</ul>`
    : '<p style="color: #666;">To be discussed in your first meeting</p>';

  const html = brandedEmailLayout({
    title: 'You Have a New Mentee!',
    preheader: `You've been matched with ${data.menteeName} in the She Sharp Mentorship Programme.`,
    bodyHtml: `
      <p>Dear ${data.mentorName},</p>
      <p>Great news! You have been matched with a new mentee in the She Sharp Mentorship Programme.</p>

      ${detailsCard(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Your New Mentee</h3>
        <p><strong>Name:</strong> ${data.menteeName}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.menteeEmail}" style="color: ${BRAND.purpleDark};">${data.menteeEmail}</a></p>
        <p><strong>Compatibility Score:</strong> ${scoreBadge(`${data.matchScore}%`)}</p>
      `)}

      ${data.aiRecommendation ? `
        ${infoBox(`
          <strong>AI Recommendation:</strong>
          <p style="margin: 10px 0 0 0;">${data.aiRecommendation}</p>
        `)}
      ` : ''}

      <h4 style="color: ${BRAND.purpleDark};">Suggested Focus Areas:</h4>
      ${focusAreasHtml}

      <h4 style="color: ${BRAND.purpleDark};">Next Steps:</h4>
      <ol>
        <li>Review your mentee's profile in your dashboard</li>
        <li>Reach out to schedule your first meeting</li>
        <li>Discuss goals and expectations together</li>
      </ol>

      ${brandButton('View in Dashboard', dashboardUrl)}

      <p style="color: #666; font-size: 14px;">
        Thank you for being a mentor with She Sharp. Your guidance helps shape the future of women in STEM!
      </p>
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
New Mentee Match - She Sharp

Dear ${data.mentorName},

Great news! You have been matched with a new mentee in the She Sharp Mentorship Programme.

YOUR NEW MENTEE
Name: ${data.menteeName}
Email: ${data.menteeEmail}
Compatibility Score: ${data.matchScore}%

${data.aiRecommendation ? `AI Recommendation:\n${data.aiRecommendation}\n` : ''}

Suggested Focus Areas:
${data.focusAreas.length > 0 ? data.focusAreas.map(area => `- ${area}`).join('\n') : '- To be discussed in your first meeting'}

Next Steps:
1. Review your mentee's profile in your dashboard
2. Reach out to schedule your first meeting
3. Discuss goals and expectations together

View in Dashboard: ${dashboardUrl}

Thank you for being a mentor with She Sharp. Your guidance helps shape the future of women in STEM!

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: data.mentorEmail,
    subject: `New Mentee Match: ${data.menteeName} - She Sharp`,
    html,
    text,
  });
}

/**
 * Send match approval notification to mentee
 */
async function sendMatchApprovalToMentee(data: MatchApprovalEmailData): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard/mentorship`;

  const focusAreasHtml = data.focusAreas.length > 0
    ? `<ul style="margin: 10px 0; padding-left: 20px;">${data.focusAreas.map(area => `<li>${area}</li>`).join('')}</ul>`
    : '<p style="color: #666;">To be discussed in your first meeting</p>';

  const html = brandedEmailLayout({
    title: 'Congratulations!',
    preheader: `You've been matched with a mentor in the She Sharp Mentorship Programme!`,
    bodyHtml: `
      <p style="text-align: center; font-size: 48px; margin: 0 0 10px 0;">🎉</p>

      <p>Dear ${data.menteeName},</p>
      <p>Exciting news! We've found a mentor who is a great match for your goals and interests in the She Sharp Mentorship Programme.</p>

      ${detailsCard(`
        <h3 style="margin-top: 0; color: ${BRAND.purpleDark};">Your Mentor</h3>
        <p><strong>Name:</strong> ${data.mentorName}</p>
        <p><strong>Email:</strong> <a href="mailto:${data.mentorEmail}" style="color: ${BRAND.purpleDark};">${data.mentorEmail}</a></p>
        <p><strong>Compatibility Score:</strong> ${scoreBadge(`${data.matchScore}%`)}</p>
      `)}

      <h4 style="color: ${BRAND.purpleDark};">Areas to Explore Together:</h4>
      ${focusAreasHtml}

      <h4 style="color: ${BRAND.purpleDark};">Getting Started:</h4>
      <ol>
        <li>Review your mentor's profile in your dashboard</li>
        <li>Your mentor will reach out to schedule your first meeting</li>
        <li>Prepare some questions and goals to discuss</li>
      </ol>

      ${brandButton('View in Dashboard', dashboardUrl)}

      <p style="color: #666; font-size: 14px;">
        We're excited to see you grow with the support of your mentor. Make the most of this opportunity!
      </p>
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
Congratulations! You've Been Matched with a Mentor - She Sharp

Dear ${data.menteeName},

Exciting news! We've found a mentor who is a great match for your goals and interests in the She Sharp Mentorship Programme.

YOUR MENTOR
Name: ${data.mentorName}
Email: ${data.mentorEmail}
Compatibility Score: ${data.matchScore}%

Areas to Explore Together:
${data.focusAreas.length > 0 ? data.focusAreas.map(area => `- ${area}`).join('\n') : '- To be discussed in your first meeting'}

Getting Started:
1. Review your mentor's profile in your dashboard
2. Your mentor will reach out to schedule your first meeting
3. Prepare some questions and goals to discuss

View in Dashboard: ${dashboardUrl}

We're excited to see you grow with the support of your mentor. Make the most of this opportunity!

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: data.menteeEmail,
    subject: `You've Been Matched with a Mentor! - She Sharp`,
    html,
    text,
  });
}

/**
 * Send queue position update notification to mentee
 */
export async function sendQueueUpdateNotification(
  menteeEmail: string,
  menteeName: string,
  queuePosition: number,
  estimatedWait: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;

  const html = brandedEmailLayout({
    title: 'Queue Status Update',
    preheader: `Your mentorship queue position: #${queuePosition}.`,
    bodyHtml: `
      <p>Dear ${menteeName},</p>
      <p>Here's an update on your position in the mentorship queue:</p>

      <div style="background: #ffffff; border: 2px solid ${BRAND.periwinkle}; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: #666;">Your Queue Position</p>
        <div style="font-size: 48px; font-weight: bold; color: ${BRAND.periwinkle};">#${queuePosition}</div>
        <p style="margin: 10px 0 0 0; color: #666;">Estimated wait: ${estimatedWait}</p>
      </div>

      <p>We're actively working to match you with a mentor who aligns with your goals and interests. Thank you for your patience!</p>

      <h4 style="color: ${BRAND.purpleDark};">What happens next?</h4>
      <ul>
        <li>Our AI system analyses mentor availability</li>
        <li>We match based on skills, goals, and compatibility</li>
        <li>You'll be notified immediately when matched</li>
      </ul>

      ${brandButton('Check Your Status', dashboardUrl)}
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
Queue Status Update - She Sharp Mentorship Program

Dear ${menteeName},

Here's an update on your position in the mentorship queue:

YOUR QUEUE POSITION: #${queuePosition}
Estimated wait: ${estimatedWait}

We're actively working to match you with a mentor who aligns with your goals and interests. Thank you for your patience!

What happens next?
- Our AI system analyses mentor availability
- We match based on skills, goals, and compatibility
- You'll be notified immediately when matched

Check Your Status: ${dashboardUrl}

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: menteeEmail,
    subject: `Queue Update: Position #${queuePosition} - She Sharp`,
    html,
    text,
  });
}

/**
 * Send notification when mentee is added to queue
 */
export async function sendAddedToQueueNotification(
  menteeEmail: string,
  menteeName: string,
  queuePosition: number,
  estimatedWait: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const dashboardUrl = `${baseUrl}/dashboard`;

  const html = brandedEmailLayout({
    title: "You're in the Queue!",
    preheader: `You've been added to the mentorship matching queue at position #${queuePosition}.`,
    bodyHtml: `
      <p>Dear ${menteeName},</p>
      <p>Thank you for your interest in the She Sharp Mentorship Programme! We've added you to our matching queue.</p>

      ${infoBox(`
        <p style="margin: 0;"><strong>Your Position:</strong> <span style="background: ${BRAND.periwinkle}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: bold; display: inline-block;">#${queuePosition}</span></p>
        <p style="margin: 10px 0 0 0;"><strong>Estimated Wait:</strong> ${estimatedWait}</p>
      `)}

      <h4 style="color: ${BRAND.purpleDark};">What does this mean?</h4>
      <p>All our mentors are currently at capacity, but don't worry! Our AI-powered matching system is continuously analyzing mentor availability and will find the best match for you as soon as a spot opens up.</p>

      <h4 style="color: ${BRAND.purpleDark};">While you wait:</h4>
      <ul>
        <li>Complete your profile to improve match quality</li>
        <li>Explore our resources and events</li>
        <li>Connect with the She Sharp community</li>
      </ul>

      ${brandButton('View Your Dashboard', dashboardUrl)}

      <p style="color: #666; font-size: 14px;">
        You'll receive an email notification as soon as we find a matching mentor for you.
      </p>
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
You're in the Queue! - She Sharp Mentorship Program

Dear ${menteeName},

Thank you for your interest in the She Sharp Mentorship Programme! We've added you to our matching queue.

Your Position: #${queuePosition}
Estimated Wait: ${estimatedWait}

What does this mean?
All our mentors are currently at capacity, but don't worry! Our AI-powered matching system is continuously analyzing mentor availability and will find the best match for you as soon as a spot opens up.

While you wait:
- Complete your profile to improve match quality
- Explore our resources and events
- Connect with the She Sharp community

View Your Dashboard: ${dashboardUrl}

You'll receive an email notification as soon as we find a matching mentor for you.

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: menteeEmail,
    subject: `You're in the Mentorship Queue (#${queuePosition}) - She Sharp`,
    html,
    text,
  });
}

/**
 * Send notification when queue entry expires
 */
export async function sendQueueExpiredNotification(
  menteeEmail: string,
  menteeName: string
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const mentorshipUrl = `${baseUrl}/mentorship`;

  const html = brandedEmailLayout({
    title: 'Queue Entry Expired',
    preheader: 'Your position in the mentorship queue has expired.',
    bodyHtml: `
      <p>Dear ${menteeName},</p>
      <p>Your position in the She Sharp mentorship queue has expired after 90 days.</p>

      <p>We understand that finding the right mentor takes time, and we appreciate your patience. If you're still interested in being matched with a mentor, you can rejoin the queue at any time.</p>

      ${brandButton('Rejoin the Queue', mentorshipUrl)}

      <p style="color: #666; font-size: 14px;">
        If you have any questions or need assistance, please don't hesitate to contact us.
      </p>
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
  });

  const text = `
Queue Entry Expired - She Sharp

Dear ${menteeName},

Your position in the She Sharp mentorship queue has expired after 90 days.

We understand that finding the right mentor takes time, and we appreciate your patience. If you're still interested in being matched with a mentor, you can rejoin the queue at any time.

Rejoin the Queue: ${mentorshipUrl}

If you have any questions or need assistance, please don't hesitate to contact us.

© ${new Date().getFullYear()} She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: menteeEmail,
    subject: 'Your Mentorship Queue Entry Has Expired - She Sharp',
    html,
    text,
  });
}

/**
 * Send batch matching summary to admin
 */
export async function sendBatchMatchingSummaryToAdmin(
  adminEmail: string,
  summary: {
    totalProcessed: number;
    matchesGenerated: number;
    queueUpdates: number;
    averageScore: number;
    errors: string[];
    runId: number;
  }
): Promise<boolean> {
  const baseUrl = getBaseUrl();
  const adminUrl = `${baseUrl}/dashboard/admin/matching`;

  const errorsHtml = summary.errors.length > 0
    ? `<div style="background: #ffebee; border: 1px solid ${BRAND.errorRed}; border-radius: 5px; padding: 15px; margin: 15px 0;">
        <strong style="color: ${BRAND.errorRed};">Errors (${summary.errors.length}):</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">${summary.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}</ul>
        ${summary.errors.length > 5 ? `<p style="color: #666; font-size: 12px;">...and ${summary.errors.length - 5} more</p>` : ''}
      </div>`
    : '';

  const html = brandedEmailLayout({
    title: 'Batch Matching Complete',
    preheader: `Run #${summary.runId}: ${summary.matchesGenerated} matches generated.`,
    bodyHtml: `
      <p style="color: #666; text-align: center; margin-top: 0;">Run ID: ${summary.runId}</p>
      <p>The automated batch matching process has completed. Here's a summary:</p>

      <div style="margin: 20px 0;">
        <table width="100%" cellpadding="0" cellspacing="10" style="border-collapse: separate;">
          <tr>
            <td width="50%" style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${BRAND.purpleDark};">${summary.totalProcessed}</div>
              <div style="color: #666; font-size: 12px; text-transform: uppercase;">Pairs Processed</div>
            </td>
            <td width="50%" style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${BRAND.purpleDark};">${summary.matchesGenerated}</div>
              <div style="color: #666; font-size: 12px; text-transform: uppercase;">Matches Generated</div>
            </td>
          </tr>
          <tr>
            <td width="50%" style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${BRAND.purpleDark};">${summary.queueUpdates}</div>
              <div style="color: #666; font-size: 12px; text-transform: uppercase;">Queue Updates</div>
            </td>
            <td width="50%" style="background: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; color: ${BRAND.purpleDark};">${summary.averageScore.toFixed(1)}%</div>
              <div style="color: #666; font-size: 12px; text-transform: uppercase;">Average Score</div>
            </td>
          </tr>
        </table>
      </div>

      ${errorsHtml}

      ${brandButton('Review Matches', adminUrl)}
    `,
    contactEmail: 'mentoring@shesharp.org.nz',
    footerExtra: '<p style="margin: 0; font-size: 12px;">She Sharp Admin Panel</p>',
  });

  const text = `
Batch Matching Complete - She Sharp Admin

Run ID: ${summary.runId}

Summary:
- Pairs Processed: ${summary.totalProcessed}
- Matches Generated: ${summary.matchesGenerated}
- Queue Updates: ${summary.queueUpdates}
- Average Score: ${summary.averageScore.toFixed(1)}%

${summary.errors.length > 0 ? `Errors (${summary.errors.length}):\n${summary.errors.slice(0, 5).join('\n')}` : 'No errors'}

Review Matches: ${adminUrl}

© ${new Date().getFullYear()} She Sharp Admin Panel
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Admin] Batch Matching Complete - ${summary.matchesGenerated} matches generated`,
    html,
    text,
  });
}
