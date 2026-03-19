/**
 * Send all email templates with mock data to a test address for visual preview.
 *
 * Usage:
 *   BASE_URL=https://she-sharp.vercel.app npx tsx scripts/preview-all-emails.ts <email>
 *
 * Requires RESEND_API_KEY in .env / .env.local.
 */

import 'dotenv/config';

// ---------- validate inputs ----------

const targetEmail = process.argv[2];
if (!targetEmail || !targetEmail.includes('@')) {
  console.error('Usage: npx tsx scripts/preview-all-emails.ts <email>');
  process.exit(1);
}

if (!process.env.RESEND_API_KEY) {
  console.error('ERROR: RESEND_API_KEY is not set. Add it to .env or .env.local');
  process.exit(1);
}

// Force NODE_ENV to production so sendEmail uses Resend instead of console logging
process.env.NODE_ENV = 'production';

// ---------- imports (after env setup) ----------

import { sendVerificationEmail, sendPasswordResetEmail, sendInvitationEmail, sendPaymentConfirmationEmail, sendInvitationCodeEmail } from '../lib/email/service';
import { sendApplicationConfirmationEmail, sendInterviewInvitationEmail, sendApplicationApprovedEmail, sendApplicationRejectedEmail, sendOnboardingEmail, sendNDAReminderEmail } from '../lib/email/recruitment-emails';
import { sendMentorApplicationConfirmationEmail, sendMenteeApplicationConfirmationEmail } from '../lib/email/mentorship-emails';
import { sendMatchApprovalNotifications, sendQueueUpdateNotification, sendAddedToQueueNotification, sendQueueExpiredNotification, sendBatchMatchingSummaryToAdmin } from '../lib/matching/email-service';

// ---------- helpers ----------

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

type EmailTask = { name: string; fn: () => Promise<boolean | { mentorSent: boolean; menteeSent: boolean }> };

// ---------- define all templates ----------

const templates: EmailTask[] = [
  // --- service.ts (5) ---
  {
    name: '1/16  Verification Email',
    fn: () => sendVerificationEmail(targetEmail, 'mock-verification-token-abc123'),
  },
  {
    name: '2/16  Password Reset Email',
    fn: () => sendPasswordResetEmail(targetEmail, 'mock-reset-token-xyz789'),
  },
  {
    name: '3/16  Team Invitation Email',
    fn: () => sendInvitationEmail(targetEmail, 'She Sharp Engineering', 'admin', 42),
  },
  {
    name: '4/16  Payment Confirmation Email',
    fn: () => sendPaymentConfirmationEmail(targetEmail, {
      invitationCode: 'SHESHARP-2026-ABCD',
      membershipTier: 'annual',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      amount: '49.00',
    }),
  },
  {
    name: '5/16  Invitation Code Email (Mentor Approved)',
    fn: () => sendInvitationCodeEmail(targetEmail, {
      invitationCode: 'MENTOR-WELCOME-1234',
      codeType: 'mentor_approved',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      message: 'We look forward to having you as a mentor!',
    }),
  },

  // --- recruitment-emails.ts (6) ---
  {
    name: '6/16  Application Confirmation (Ambassador)',
    fn: () => sendApplicationConfirmationEmail(targetEmail, {
      applicantName: 'Jane Doe',
      applicantEmail: targetEmail,
      applicationType: 'ambassador',
      submittedAt: new Date(),
    }),
  },
  {
    name: '7/16  Interview Invitation',
    fn: () => sendInterviewInvitationEmail(targetEmail, {
      applicantName: 'Jane Doe',
      applicationType: 'ambassador',
      interviewDate: 'Friday 28 March 2026, 2:00 PM NZDT',
      interviewNotes: 'The interview will be via Google Meet. A link will be sent separately.',
      contactEmail: 'people@shesharp.org.nz',
    }),
  },
  {
    name: '8/16  Application Approved',
    fn: () => sendApplicationApprovedEmail(targetEmail, {
      applicantName: 'Jane Doe',
      applicationType: 'ambassador',
      welcomeMessage: 'Your enthusiasm for empowering women in tech really stood out!',
    }),
  },
  {
    name: '9/16  Application Rejected',
    fn: () => sendApplicationRejectedEmail(targetEmail, {
      applicantName: 'Jane Doe',
      applicationType: 'volunteer',
      feedbackMessage: 'We were impressed with your background. Unfortunately all volunteer positions are currently filled. We encourage you to apply again next quarter!',
    }),
  },
  {
    name: '10/16 Onboarding Email',
    fn: () => sendOnboardingEmail(targetEmail, {
      applicantName: 'Jane Doe',
      applicationType: 'ambassador',
      slackInviteLink: 'https://join.slack.com/t/shesharp/shared_invite/example',
      ndaLink: 'https://docs.google.com/document/d/example',
      nextEventDate: 'Saturday 5 April 2026',
      mondayMeetingInfo: 'Every Monday at 6:00 PM NZDT via Google Meet',
    }),
  },
  {
    name: '11/16 NDA Reminder',
    fn: () => sendNDAReminderEmail(targetEmail, {
      applicantName: 'Jane Doe',
      ndaLink: 'https://docs.google.com/document/d/example-nda',
    }),
  },

  // --- mentorship-emails.ts (2) ---
  {
    name: '12/16 Mentor Application Confirmation',
    fn: () => sendMentorApplicationConfirmationEmail(targetEmail, {
      applicantName: 'Alice Smith',
    }),
  },
  {
    name: '13/16 Mentee Application Confirmation',
    fn: () => sendMenteeApplicationConfirmationEmail(targetEmail, {
      applicantName: 'Bob Chen',
      programmeName: 'HER WAKA',
      requiresPayment: true,
    }),
  },

  // --- matching/email-service.ts (4+1 = 5, but match sends 2 emails to same address) ---
  {
    name: '14/16 Match Approval (Mentor + Mentee)',
    fn: () => sendMatchApprovalNotifications({
      mentorName: 'Dr. Sarah Johnson',
      mentorEmail: targetEmail,
      menteeName: 'Emily Wang',
      menteeEmail: targetEmail,
      matchScore: 92,
      focusAreas: ['Backend Development', 'Career Transition', 'Leadership Skills'],
      aiRecommendation: 'Strong alignment in technical background and career goals. Sarah\'s 10+ years in backend engineering complements Emily\'s desire to transition from frontend to full-stack roles.',
    }),
  },
  {
    name: '15/16 Queue Update Notification',
    fn: () => sendQueueUpdateNotification(targetEmail, 'Emily Wang', 3, '2-3 weeks'),
  },
  {
    name: '16/16 Added to Queue Notification',
    fn: () => sendAddedToQueueNotification(targetEmail, 'Emily Wang', 7, '4-6 weeks'),
  },
];

// Bonus: queue expired + admin summary (18 total sends)
const bonusTemplates: EmailTask[] = [
  {
    name: '17/18 Queue Expired Notification',
    fn: () => sendQueueExpiredNotification(targetEmail, 'Emily Wang'),
  },
  {
    name: '18/18 Batch Matching Admin Summary',
    fn: () => sendBatchMatchingSummaryToAdmin(targetEmail, {
      totalProcessed: 24,
      matchesGenerated: 8,
      queueUpdates: 5,
      averageScore: 78.4,
      errors: ['Mentor #12 profile incomplete — skipped', 'Mentee #45 preferences missing — used defaults'],
      runId: 1042,
    }),
  },
];

// ---------- send all ----------

async function main() {
  const allTemplates = [...templates, ...bonusTemplates];
  console.log(`\nSending ${allTemplates.length} email templates to: ${targetEmail}\n`);

  let sent = 0;
  let failed = 0;

  for (const t of allTemplates) {
    try {
      console.log(`  Sending ${t.name} ...`);
      const result = await t.fn();

      const ok = typeof result === 'boolean' ? result : (result.mentorSent && result.menteeSent);
      if (ok) {
        sent++;
        console.log(`  ✓ ${t.name}`);
      } else {
        failed++;
        console.log(`  ✗ ${t.name} — sendEmail returned false`);
      }
    } catch (err) {
      failed++;
      console.error(`  ✗ ${t.name} — ${err}`);
    }

    // Resend free tier rate limit: 2 emails/second
    await sleep(600);
  }

  // Match approval sends 2 emails (mentor + mentee), so actual sends = allTemplates.length + 1
  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}`);
  console.log(`(Note: "Match Approval" sends 2 separate emails, so total inbox count is ${allTemplates.length + 1})`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
