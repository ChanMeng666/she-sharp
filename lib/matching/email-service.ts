/**
 * Email Service for AI Matching System
 * Handles notifications for match approvals, queue updates, and status changes
 */

import { sendEmail, getBaseUrl } from '@/lib/email/service';
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Mentee Match - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, hsl(var(--brand)) 0%, #6b1d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .match-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .score-badge { background: #4caf50; color: white; padding: 5px 12px; border-radius: 15px; font-weight: bold; display: inline-block; }
        .highlight { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You Have a New Mentee!</h1>
          <p style="margin: 0; opacity: 0.9;">She Sharp Mentorship Programme</p>
        </div>
        <div class="content">
          <p>Dear ${data.mentorName},</p>

          <p>Great news! You have been matched with a new mentee in the She Sharp Mentorship Programme.</p>

          <div class="match-card">
            <h3 style="margin-top: 0; color: hsl(var(--brand));">Your New Mentee</h3>
            <p><strong>Name:</strong> ${data.menteeName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.menteeEmail}">${data.menteeEmail}</a></p>
            <p><strong>Compatibility Score:</strong> <span class="score-badge">${data.matchScore}%</span></p>
          </div>

          ${data.aiRecommendation ? `
          <div class="highlight">
            <strong>AI Recommendation:</strong>
            <p style="margin: 10px 0 0 0;">${data.aiRecommendation}</p>
          </div>
          ` : ''}

          <h4>Suggested Focus Areas:</h4>
          ${focusAreasHtml}

          <h4>Next Steps:</h4>
          <ol>
            <li>Review your mentee's profile in your dashboard</li>
            <li>Reach out to schedule your first meeting</li>
            <li>Discuss goals and expectations together</li>
          </ol>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button" style="color: white;">View in Dashboard</a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Thank you for being a mentor with She Sharp. Your guidance helps shape the future of women in STEM!
          </p>
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

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: data.mentorEmail,
    subject: `🎉 New Mentee Match: ${data.menteeName} - She Sharp`,
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You've Been Matched with a Mentor! - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, hsl(var(--brand)) 0%, #6b1d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .match-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .score-badge { background: #4caf50; color: white; padding: 5px 12px; border-radius: 15px; font-weight: bold; display: inline-block; }
        .celebration { font-size: 48px; text-align: center; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Congratulations!</h1>
          <p style="margin: 0; opacity: 0.9;">You've Been Matched with a Mentor</p>
        </div>
        <div class="content">
          <div class="celebration">🎉</div>

          <p>Dear ${data.menteeName},</p>

          <p>Exciting news! We've found a mentor who is a great match for your goals and interests in the She Sharp Mentorship Programme.</p>

          <div class="match-card">
            <h3 style="margin-top: 0; color: hsl(var(--brand));">Your Mentor</h3>
            <p><strong>Name:</strong> ${data.mentorName}</p>
            <p><strong>Email:</strong> <a href="mailto:${data.mentorEmail}">${data.mentorEmail}</a></p>
            <p><strong>Compatibility Score:</strong> <span class="score-badge">${data.matchScore}%</span></p>
          </div>

          <h4>Areas to Explore Together:</h4>
          ${focusAreasHtml}

          <h4>Getting Started:</h4>
          <ol>
            <li>Review your mentor's profile in your dashboard</li>
            <li>Your mentor will reach out to schedule your first meeting</li>
            <li>Prepare some questions and goals to discuss</li>
          </ol>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button" style="color: white;">View in Dashboard</a>
          </div>

          <p style="color: #666; font-size: 14px;">
            We're excited to see you grow with the support of your mentor. Make the most of this opportunity!
          </p>
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

© 2025 She Sharp. Empowering women in STEM.
  `;

  return sendEmail({
    to: data.menteeEmail,
    subject: `🎉 You've Been Matched with a Mentor! - She Sharp`,
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Mentorship Queue Update - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2196f3; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .position-card { background: white; border: 2px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center; }
        .position-number { font-size: 48px; font-weight: bold; color: #2196f3; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Queue Status Update</h1>
          <p style="margin: 0; opacity: 0.9;">She Sharp Mentorship Programme</p>
        </div>
        <div class="content">
          <p>Dear ${menteeName},</p>

          <p>Here's an update on your position in the mentorship queue:</p>

          <div class="position-card">
            <p style="margin: 0; color: #666;">Your Queue Position</p>
            <div class="position-number">#${queuePosition}</div>
            <p style="margin: 10px 0 0 0; color: #666;">Estimated wait: ${estimatedWait}</p>
          </div>

          <p>We're actively working to match you with a mentor who aligns with your goals and interests. Thank you for your patience!</p>

          <h4>What happens next?</h4>
          <ul>
            <li>Our AI system analyses mentor availability</li>
            <li>We match based on skills, goals, and compatibility</li>
            <li>You'll be notified immediately when matched</li>
          </ul>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button" style="color: white;">Check Your Status</a>
          </div>
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

© 2025 She Sharp. Empowering women in STEM.
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Added to Mentorship Queue - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, hsl(var(--brand)) 0%, #6b1d5a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .info-box { background: #e3f2fd; border: 1px solid #2196f3; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .position-badge { background: #2196f3; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>You're in the Queue!</h1>
          <p style="margin: 0; opacity: 0.9;">She Sharp Mentorship Programme</p>
        </div>
        <div class="content">
          <p>Dear ${menteeName},</p>

          <p>Thank you for your interest in the She Sharp Mentorship Programme! We've added you to our matching queue.</p>

          <div class="info-box">
            <p style="margin: 0;"><strong>Your Position:</strong> <span class="position-badge">#${queuePosition}</span></p>
            <p style="margin: 10px 0 0 0;"><strong>Estimated Wait:</strong> ${estimatedWait}</p>
          </div>

          <h4>What does this mean?</h4>
          <p>All our mentors are currently at capacity, but don't worry! Our AI-powered matching system is continuously analyzing mentor availability and will find the best match for you as soon as a spot opens up.</p>

          <h4>While you wait:</h4>
          <ul>
            <li>Complete your profile to improve match quality</li>
            <li>Explore our resources and events</li>
            <li>Connect with the She Sharp community</li>
          </ul>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button" style="color: white;">View Your Dashboard</a>
          </div>

          <p style="color: #666; font-size: 14px;">
            You'll receive an email notification as soon as we find a matching mentor for you.
          </p>
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

© 2025 She Sharp. Empowering women in STEM.
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

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Queue Entry Expired - She Sharp</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ff9800; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Queue Entry Expired</h1>
        </div>
        <div class="content">
          <p>Dear ${menteeName},</p>

          <p>Your position in the She Sharp mentorship queue has expired after 90 days.</p>

          <p>We understand that finding the right mentor takes time, and we appreciate your patience. If you're still interested in being matched with a mentor, you can rejoin the queue at any time.</p>

          <div style="text-align: center;">
            <a href="${mentorshipUrl}" class="button" style="color: white;">Rejoin the Queue</a>
          </div>

          <p style="color: #666; font-size: 14px;">
            If you have any questions or need assistance, please don't hesitate to contact us.
          </p>
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
Queue Entry Expired - She Sharp

Dear ${menteeName},

Your position in the She Sharp mentorship queue has expired after 90 days.

We understand that finding the right mentor takes time, and we appreciate your patience. If you're still interested in being matched with a mentor, you can rejoin the queue at any time.

Rejoin the Queue: ${mentorshipUrl}

If you have any questions or need assistance, please don't hesitate to contact us.

© 2025 She Sharp. Empowering women in STEM.
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
    ? `<div style="background: #ffebee; border: 1px solid #f44336; border-radius: 5px; padding: 15px; margin: 15px 0;">
        <strong style="color: #c62828;">Errors (${summary.errors.length}):</strong>
        <ul style="margin: 10px 0 0 0; padding-left: 20px;">${summary.errors.slice(0, 5).map(e => `<li>${e}</li>`).join('')}</ul>
        ${summary.errors.length > 5 ? `<p style="color: #666; font-size: 12px;">...and ${summary.errors.length - 5} more</p>` : ''}
      </div>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Batch Matching Summary - She Sharp Admin</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #333; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: hsl(var(--brand)); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
        .stat-card { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; text-align: center; }
        .stat-number { font-size: 32px; font-weight: bold; color: hsl(var(--brand)); }
        .stat-label { color: #666; font-size: 12px; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Batch Matching Complete</h1>
          <p style="margin: 0; opacity: 0.9;">Run ID: ${summary.runId}</p>
        </div>
        <div class="content">
          <p>The automated batch matching process has completed. Here's a summary:</p>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${summary.totalProcessed}</div>
              <div class="stat-label">Pairs Processed</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${summary.matchesGenerated}</div>
              <div class="stat-label">Matches Generated</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${summary.queueUpdates}</div>
              <div class="stat-label">Queue Updates</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${summary.averageScore.toFixed(1)}%</div>
              <div class="stat-label">Average Score</div>
            </div>
          </div>

          ${errorsHtml}

          <div style="text-align: center;">
            <a href="${adminUrl}" class="button" style="color: white;">Review Matches</a>
          </div>
        </div>
        <div class="footer">
          <p>© 2025 She Sharp Admin Panel</p>
        </div>
      </div>
    </body>
    </html>
  `;

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

© 2025 She Sharp Admin Panel
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Admin] Batch Matching Complete - ${summary.matchesGenerated} matches generated`,
    html,
    text,
  });
}
