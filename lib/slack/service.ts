/**
 * Slack Incoming Webhook notification service.
 * Sends formatted messages to a designated Slack channel.
 */

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

function getWebhookUrl(): string | null {
  return process.env.SLACK_VOLUNTEER_WEBHOOK_URL?.trim() || null;
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
