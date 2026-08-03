/**
 * Slack Incoming Webhook notification service.
 * Sends formatted messages to a designated Slack channel.
 */

import type { FeedbackSummary } from '@/lib/forms/event-feedback-summary';

interface VolunteerNotificationData {
  type: 'ambassador' | 'volunteer';
  firstName: string;
  lastName: string;
  email: string;
  currentStatus: string;
  organisation?: string | null;
  howHeardAbout: string;
  skillSets: string;
  // Ambassador-only
  linkedinUrl?: string | null;
  itIndustryInterest?: string | null;
  volunteerHoursPerWeek?: string | null;
  cvUrl?: string | null;
  // Volunteer-only
  eventsPerYear?: string | null;
}

interface ExAmbassadorNotificationData {
  firstName: string;
  lastName: string;
  email: string;
  currentRoleTitle?: string;
  joinedSheSharpYear: number;
  stillAmbassador: boolean;
  experienceRating: string;
  wouldRecommend: boolean;
}

interface RecruitmentStageNotificationData {
  applicantName: string;
  applicationType: string;
  oldStage: string;
  newStage: string;
  updatedBy: string;
}

interface AIScreeningNotificationData {
  applicantName: string;
  applicationType: string;
  recommendation: string;
  confidence: number;
  summary: string;
}

const STATUS_LABELS: Record<string, string> = {
  high_school_student: 'High School Student',
  university_student: 'University Student',
  industry: 'Industry Professional',
  sponsor_partner: 'Sponsor/Partner',
  other: 'Other',
};

const STAGE_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  screening: 'Screening',
  interview_requested: 'Interview Requested',
  interview_scheduled: 'Interview Scheduled',
  approved: 'Approved',
  rejected: 'Rejected',
  onboarding: 'Onboarding',
  nda_sent: 'NDA Sent',
  nda_signed: 'NDA Signed',
  active: 'Active',
};

// Read as a sentence fragment in the context line: "… · scanned from the deck · …".
const FEEDBACK_SOURCE_LABELS: Record<string, string> = {
  deck_qr: 'scanned from the deck',
  event_page: 'from the event page',
  direct_link: 'direct link',
  email: 'from an email',
};

const INTEREST_LABELS: Record<string, string> = {
  mentorship: 'Mentorship',
  volunteering: 'Volunteering',
  newsletter: 'Newsletter',
};

interface ContactNotificationData {
  fullName: string;
  email: string;
  organisation?: string | null;
  message: string;
  /** Primary key of the `contact_form_submissions` row this notification is about. */
  submissionId?: number;
  /** Which public form produced the submission. Defaults to the general contact form. */
  source?: 'contact' | 'sponsor-inquiry';
}

interface EventFeedbackNotificationData {
  /** Primary key of the `event_feedback_submissions` row this notification is about. */
  submissionId: number;
  eventSlug: string;
  eventTitle: string;
  overallRating: number;
  recommendScore?: number | null;
  wouldAttendAgain?: 'yes' | 'maybe' | 'no' | null;
  whatWorked?: string | null;
  whatToImprove?: string | null;
  interests: ('mentorship' | 'volunteering' | 'newsletter')[];
  name?: string | null;
  email?: string | null;
  source: 'deck_qr' | 'event_page' | 'direct_link' | 'email';
  /** True when this replaced an answer the same person gave earlier today. */
  isUpdate?: boolean;
}

interface DonationNotificationData {
  amount: string;
  currency: string;
  donorName?: string | null;
  donorEmail?: string | null;
  transactionId: string;
  date: Date;
}

function getWebhookUrl(): string | null {
  return process.env.SLACK_VOLUNTEER_WEBHOOK_URL?.trim() || null;
}

function getContactWebhookUrl(): string | null {
  return process.env.SLACK_CONTACT_WEBHOOK_URL?.trim() || null;
}

// Donations post to their own channel if configured, otherwise reuse the contact channel.
function getDonationWebhookUrl(): string | null {
  return (
    process.env.SLACK_DONATION_WEBHOOK_URL?.trim() ||
    process.env.SLACK_CONTACT_WEBHOOK_URL?.trim() ||
    null
  );
}

// Event feedback posts to its own channel if configured, otherwise reuse the
// contact channel — feedback arriving in the wrong channel beats it not arriving.
function getEventFeedbackWebhookUrl(): string | null {
  return (
    process.env.SLACK_EVENT_FEEDBACK_WEBHOOK_URL?.trim() ||
    process.env.SLACK_CONTACT_WEBHOOK_URL?.trim() ||
    null
  );
}

async function sendSlackMessage(blocks: Record<string, unknown>[]): Promise<void> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn('SLACK_VOLUNTEER_WEBHOOK_URL not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

async function sendContactSlackMessage(blocks: Record<string, unknown>[]): Promise<void> {
  const webhookUrl = getContactWebhookUrl();
  if (!webhookUrl) {
    console.warn('SLACK_CONTACT_WEBHOOK_URL not configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack contact webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack contact notification:', error);
  }
}

/**
 * Sends a Slack notification for a new volunteer/ambassador application.
 */
export async function sendVolunteerSlackNotification(data: VolunteerNotificationData): Promise<void> {
  const isAmbassador = data.type === 'ambassador';
  const typeLabel = isAmbassador ? 'Ambassador' : 'Event Volunteer';
  const statusLabel = STATUS_LABELS[data.currentStatus] || data.currentStatus;

  const fields = [
    { type: 'mrkdwn', text: `*Name:*\n${data.firstName} ${data.lastName}` },
    { type: 'mrkdwn', text: `*Email:*\n${data.email}` },
    { type: 'mrkdwn', text: `*Status:*\n${statusLabel}` },
    { type: 'mrkdwn', text: `*Organisation:*\n${data.organisation || 'N/A'}` },
  ];

  if (isAmbassador && data.volunteerHoursPerWeek) {
    fields.push({ type: 'mrkdwn', text: `*Hours/Week:*\n${data.volunteerHoursPerWeek}` });
  }
  if (!isAmbassador && data.eventsPerYear) {
    fields.push({ type: 'mrkdwn', text: `*Events/Year:*\n${data.eventsPerYear}` });
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `New ${typeLabel} Application`, emoji: true },
    },
    {
      type: 'section',
      fields,
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*How they heard about She#:*\n${data.howHeardAbout}` },
    },
  ];

  if (isAmbassador && data.itIndustryInterest) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*IT Industry Interest:*\n${data.itIndustryInterest}` },
    });
  }

  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: `*Skills:*\n${data.skillSets}` },
  });

  if (isAmbassador && data.linkedinUrl) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*LinkedIn:* <${data.linkedinUrl}|View Profile>` },
    });
  }

  if (isAmbassador && data.cvUrl) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*CV:* <${data.cvUrl}|Download CV>` },
    });
  }

  blocks.push({ type: 'divider' });

  await sendSlackMessage(blocks);
}

/**
 * Sends a Slack notification for a new ex-ambassador feedback submission.
 */
export async function sendExAmbassadorSlackNotification(data: ExAmbassadorNotificationData): Promise<void> {
  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Ex-Ambassador Feedback', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Name:*\n${data.firstName} ${data.lastName}` },
        { type: 'mrkdwn', text: `*Email:*\n${data.email}` },
        { type: 'mrkdwn', text: `*Current Role:*\n${data.currentRoleTitle || 'N/A'}` },
        { type: 'mrkdwn', text: `*Joined Year:*\n${data.joinedSheSharpYear}` },
        { type: 'mrkdwn', text: `*Still Ambassador:*\n${data.stillAmbassador ? 'Yes' : 'No'}` },
        { type: 'mrkdwn', text: `*Experience Rating:*\n${data.experienceRating}` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Would Recommend:* ${data.wouldRecommend ? 'Yes' : 'No'}` },
    },
    { type: 'divider' },
  ];

  await sendSlackMessage(blocks);
}

/**
 * Sends a Slack notification when a recruitment pipeline stage changes.
 */
export async function sendRecruitmentStageNotification(data: RecruitmentStageNotificationData): Promise<void> {
  const oldLabel = STAGE_LABELS[data.oldStage] || data.oldStage;
  const newLabel = STAGE_LABELS[data.newStage] || data.newStage;

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Recruitment Stage Update', emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${data.applicantName}* (${data.applicationType}) moved from *${oldLabel}* to *${newLabel}* by ${data.updatedBy}`,
      },
    },
    { type: 'divider' },
  ];

  await sendSlackMessage(blocks);
}

/**
 * Sends a Slack notification when AI screening completes.
 */
export async function sendAIScreeningNotification(data: AIScreeningNotificationData): Promise<void> {
  const recommendLabel = data.recommendation === 'accept' ? 'Accept' : data.recommendation === 'interview' ? 'Interview' : 'Reject';

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'AI Screening Complete', emoji: true },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Applicant:*\n${data.applicantName}` },
        { type: 'mrkdwn', text: `*Type:*\n${data.applicationType}` },
        { type: 'mrkdwn', text: `*Recommendation:*\n${recommendLabel}` },
        { type: 'mrkdwn', text: `*Confidence:*\n${data.confidence}%` },
      ],
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary:*\n${data.summary}` },
    },
    { type: 'divider' },
  ];

  await sendSlackMessage(blocks);
}

/**
 * Sends a Slack notification for a new contact form submission.
 */
export async function sendContactSlackNotification(data: ContactNotificationData): Promise<void> {
  const fields = [
    { type: 'mrkdwn', text: `*Name:*\n${data.fullName}` },
    { type: 'mrkdwn', text: `*Email:*\n${data.email}` },
  ];

  if (data.organisation) {
    fields.push({ type: 'mrkdwn', text: `*Organisation:*\n${data.organisation}` });
  }

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Contact Form Submission', emoji: true },
    },
    {
      type: 'section',
      fields,
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Message:*\n${data.message}` },
    },
  ];

  // Machine-readable footer so reply tooling can join this message back to the
  // exact database row instead of guessing from email + timestamp.
  if (data.submissionId !== undefined) {
    const sourceLabel =
      data.source === 'sponsor-inquiry' ? 'sponsor enquiry' : 'contact form';
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Submission #${data.submissionId} · ${sourceLabel}`,
        },
      ],
    });
  }

  blocks.push({ type: 'divider' });

  await sendContactSlackMessage(blocks);
}

async function sendDonationSlackMessage(blocks: Record<string, unknown>[]): Promise<void> {
  const webhookUrl = getDonationWebhookUrl();
  if (!webhookUrl) {
    console.warn('No donation/contact Slack webhook configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack donation webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack donation notification:', error);
  }
}

/**
 * Sends a Slack notification when a new donation is received.
 */
export async function sendDonationSlackNotification(data: DonationNotificationData): Promise<void> {
  const dateLabel = data.date.toLocaleDateString('en-NZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const fields = [
    { type: 'mrkdwn', text: `*Amount:*\n$${data.amount} ${data.currency}` },
    { type: 'mrkdwn', text: `*Donor:*\n${data.donorName || 'N/A'}` },
    { type: 'mrkdwn', text: `*Email:*\n${data.donorEmail || 'N/A'}` },
    { type: 'mrkdwn', text: `*Date:*\n${dateLabel}` },
  ];

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: '💜 New Donation Received', emoji: true },
    },
    {
      type: 'section',
      fields,
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: `Transaction ID: ${data.transactionId}` }],
    },
    { type: 'divider' },
  ];

  await sendDonationSlackMessage(blocks);
}

async function sendEventFeedbackSlackMessage(blocks: Record<string, unknown>[]): Promise<void> {
  const webhookUrl = getEventFeedbackWebhookUrl();
  if (!webhookUrl) {
    console.warn('No event-feedback/contact Slack webhook configured, skipping notification');
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });

    if (!response.ok) {
      console.error('Slack event feedback webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack event feedback notification:', error);
  }
}

/** Filled/empty stars out of five, e.g. 4 -> `★★★★☆`. */
function stars(n: number): string {
  const filled = Math.max(0, Math.min(5, Math.round(n)));
  return '★'.repeat(filled) + '☆'.repeat(5 - filled);
}

/**
 * Slack rejects the ENTIRE message when any single `section` text exceeds 3000
 * characters, and `sendEventFeedbackSlackMessage` swallows that error by design
 * — so one long answer would leave the database row saved and the notification
 * silently gone, which reads in Slack as "nobody submitted anything". The two
 * free-text answers therefore live in separate blocks and each is clamped well
 * under the limit.
 */
const SECTION_TEXT_LIMIT = 2800;

function clampSectionText(value: string, limit = SECTION_TEXT_LIMIT): string {
  return value.length <= limit ? value : `${value.slice(0, limit - 1)}…`;
}

/** Slack caps `plain_text` in a header at 150 characters and 400s over it. */
function clampHeaderText(value: string): string {
  return value.length <= 150 ? value : `${value.slice(0, 149)}…`;
}

/**
 * Sends a Slack notification for a new post-event feedback submission.
 */
export async function sendEventFeedbackSlackNotification(
  data: EventFeedbackNotificationData
): Promise<void> {
  // The score goes in the HEADER, not a field, so a week of feedback is
  // scannable straight off the Slack message list — the team can see the shape
  // of an event's reception without opening a single card.
  const headline = `${stars(data.overallRating)} ${data.overallRating}/5 — ${data.eventTitle}`;
  const headerText = clampHeaderText(data.isUpdate ? `Updated · ${headline}` : headline);

  const attendAgainLabels: Record<string, string> = {
    yes: 'Yes',
    maybe: 'Maybe',
    no: 'No',
  };

  const fields = [
    { type: 'mrkdwn', text: `*Rating:*\n${stars(data.overallRating)} ${data.overallRating}/5` },
    {
      type: 'mrkdwn',
      text: `*Recommend:*\n${
        data.recommendScore === undefined || data.recommendScore === null
          ? '—'
          : `${data.recommendScore}/10`
      }`,
    },
    {
      type: 'mrkdwn',
      text: `*Coming again:*\n${
        data.wouldAttendAgain ? attendAgainLabels[data.wouldAttendAgain] : '—'
      }`,
    },
    {
      type: 'mrkdwn',
      // Spelled out rather than echoing the raw enum keys — this card is read
      // by people deciding who to follow up with, not by a machine.
      text: `*Interested in:*\n${
        data.interests.length > 0
          ? data.interests.map((i) => INTEREST_LABELS[i] ?? i).join(', ')
          : '—'
      }`,
    },
  ];

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: headerText, emoji: true },
    },
    {
      type: 'section',
      fields,
    },
  ];

  if (data.whatWorked) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*What worked:*\n${clampSectionText(data.whatWorked)}` },
    });
  }

  if (data.whatToImprove) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*What to improve:*\n${clampSectionText(data.whatToImprove)}` },
    });
  }

  // Name and address are printed in full, on their own lines.
  //
  // This block used to render the name as a mailto link with the address
  // hidden inside it, plus a separate pre-filled "Reply" link. Both are gone.
  // The team follows up by composing a mail themselves, so what they actually
  // need is the address legible on screen — readable at a glance, selectable,
  // and searchable in Slack. An address you have to hover or tap to discover
  // is an address nobody reads out to a colleague.
  //
  // Slack still auto-links a bare address, so tapping it opens a mail client
  // for anyone who wants that; the difference is that the text is the address.
  //
  // The anonymous branch is kept even though name and email are required on the
  // form as of 2026-08-03: rows submitted before that exist, and a notification
  // that silently omits the sender would be worse than one that says so.
  if (data.email || data.name) {
    const lines = [
      `*Name:*\n${data.name || '—'}`,
      `*Email:*\n${data.email || '—'}`,
    ];
    blocks.push({
      type: 'section',
      fields: lines.map((text) => ({ type: 'mrkdwn', text })),
    });
  } else {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: '*From:* Anonymous — no name or email given' },
    });
  }

  const sourceLabel = FEEDBACK_SOURCE_LABELS[data.source] || data.source;
  // The time zone is pinned rather than left to the server locale: Vercel runs
  // in UTC, so an unpinned timestamp reports a Thursday evening event as Friday
  // morning and makes a run of feedback impossible to line up with the night.
  const timestamp = new Date().toLocaleString('en-NZ', {
    timeZone: 'Pacific/Auckland',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        // `Feedback #<id>` mirrors the `Submission #<id>` convention above so
        // tooling can join a Slack message back to the exact database row
        // instead of guessing from email + timestamp.
        text: `Feedback #${data.submissionId} · ${data.eventSlug} · ${sourceLabel} · ${timestamp}`,
      },
    ],
  });

  blocks.push({ type: 'divider' });

  await sendEventFeedbackSlackMessage(blocks);
}

/**
 * Posts the aggregate for one event a few days after it ran.
 *
 * Separate from the per-response card on purpose: those answer "who should we
 * reply to", this answers "how did it go", and the second question is the one
 * that otherwise never gets asked because answering it meant scrolling a
 * channel or writing SQL.
 */
export async function sendEventFeedbackDigest(
  summary: FeedbackSummary,
): Promise<void> {
  const {
    eventTitle,
    responses,
    attendees,
    responseRate,
    averageRating,
    ratingCounts,
    nps,
    promoters,
    passives,
    detractors,
    npsResponses,
    attendAgain,
    interests,
    whatWorked,
    whatToImprove,
  } = summary;

  if (responses === 0) {
    // Silence would be indistinguishable from the digest failing, and "nobody
    // filled it in" is itself a result worth seeing — it usually means the QR
    // never went up, not that the event went badly.
    await sendEventFeedbackSlackMessage([
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: clampHeaderText(`No feedback yet — ${eventTitle}`),
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text:
            'Nothing has come in for this event. If the QR slide went up, worth checking the link on a phone; ' +
            'the form stays open, so late responses will still land here.',
        },
      },
      { type: 'divider' },
    ]);
    return;
  }

  const rateText =
    responseRate !== null && attendees
      ? `${responses} of ${attendees} attendees (${Math.round(responseRate * 100)}%)`
      : `${responses}`;

  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: clampHeaderText(`Feedback summary — ${eventTitle}`),
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Responses:*\n${rateText}` },
        {
          type: 'mrkdwn',
          text: `*Average rating:*\n${
            averageRating !== null
              ? `${stars(Math.round(averageRating))} ${averageRating.toFixed(1)}/5`
              : '—'
          }`,
        },
        {
          type: 'mrkdwn',
          // NPS is quoted with its own denominator because it is computed only
          // over the people who moved the slider, which is fewer than the
          // people who answered.
          text: `*NPS:*\n${
            nps !== null ? `${nps > 0 ? '+' : ''}${nps} (from ${npsResponses})` : '—'
          }`,
        },
        {
          type: 'mrkdwn',
          text: `*Would come again:*\n${attendAgain.yes} yes · ${attendAgain.maybe} maybe · ${attendAgain.no} no`,
        },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*Ratings:* ` +
          [5, 4, 3, 2, 1]
            .map((n) => `${n}★ ${ratingCounts[n - 1]}`)
            .join(' · '),
      },
    },
  ];

  if (nps !== null) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Recommend split:* ${promoters} promoters (9–10) · ${passives} passives (7–8) · ${detractors} detractors (0–6)`,
      },
    });
  }

  // The interest counts are the actionable part of this digest. Nothing
  // subscribes anybody automatically — the live newsletter goes out through
  // Mailchimp and a ticked box is not consent under the mailing-list rules —
  // so this line is the prompt for a human to do it properly, and without it
  // the checkboxes on the form quietly promise something nobody delivers.
  const interestTotal =
    interests.mentorship + interests.volunteering + interests.newsletter;
  if (interestTotal > 0) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*Asked to hear more:* ${interests.mentorship} mentorship · ` +
          `${interests.volunteering} volunteering · ${interests.newsletter} newsletter\n` +
          `_Nobody is subscribed automatically. Run_ \`npx tsx scripts/events/feedback-interests.ts ${summary.eventSlug}\` _for the list._`,
      },
    });
  }

  const quoteList = (items: string[], label: string) => {
    if (items.length === 0) return;
    // Three per block keeps each one well under Slack's 3,000-character
    // section limit, which the sender would otherwise swallow whole.
    const shown = items.slice(0, 12);
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*${label}* (${items.length})\n` +
          shown.map((t) => `> ${clampSectionText(t, 260)}`).join('\n') +
          (items.length > shown.length
            ? `\n_…and ${items.length - shown.length} more._`
            : ''),
      },
    });
  };

  quoteList(whatWorked, 'What worked');
  quoteList(whatToImprove, 'What to do differently');

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Digest · ${summary.eventSlug} · ${summary.eventDate}`,
      },
    ],
  });
  blocks.push({ type: 'divider' });

  await sendEventFeedbackSlackMessage(blocks);
}
