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

const STATUS_LABELS: Record<string, string> = {
  high_school_student: 'High School Student',
  university_student: 'University Student',
  industry: 'Industry Professional',
  sponsor_partner: 'Sponsor/Partner',
  other: 'Other',
};

/**
 * Sends a Slack notification for a new volunteer/ambassador application.
 * Non-blocking: failures are logged but don't throw.
 */
export async function sendVolunteerSlackNotification(data: VolunteerNotificationData): Promise<void> {
  const webhookUrl = process.env.SLACK_VOLUNTEER_WEBHOOK_URL?.trim();
  if (!webhookUrl) {
    console.warn('SLACK_VOLUNTEER_WEBHOOK_URL not configured, skipping notification');
    return;
  }

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
