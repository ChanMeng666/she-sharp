/**
 * Posts the weekly mentorship statistics snapshot to a dedicated Slack channel
 * via Incoming Webhook (SLACK_MENTORSHIP_STATS_WEBHOOK_URL → #mentorships).
 */

import { getBaseUrl } from '@/lib/email/service';
import type {
  FollowupList,
  FormFunnelCounts,
  MentorshipStatsSnapshot,
} from '@/lib/mentorship/stats-service';

type SlackBlock = Record<string, unknown>;

function getStatsWebhookUrl(): string | null {
  return process.env.SLACK_MENTORSHIP_STATS_WEBHOOK_URL?.trim() || null;
}

function formatDateNzdt(d: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

function formatDateTimeNzdt(d: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Pacific/Auckland',
  }).format(d);
}

function warn(value: number): string {
  return value > 0 ? `${value} ⚠️` : `${value}`;
}

function buildFunnelField(label: string, counts: FormFunnelCounts): string {
  return [
    `*${label}*`,
    `Total submissions: ${counts.total}`,
    `Awaiting admin review: ${warn(counts.awaitingReview)}`,
    `Approved: ${counts.approved}`,
    `  • Registered: ${counts.approvedRegistered}`,
    `  • Not yet registered: ${warn(counts.approvedNotRegistered)}`,
    `Rejected: ${counts.rejected}`,
    `Drafts (in progress): ${counts.drafts}`,
  ].join('\n');
}

function buildFollowupSection(
  emoji: string,
  title: string,
  list: FollowupList,
  unitLabel: 'waiting' | 'approved',
  reviewLink: { label: string; url: string },
): SlackBlock | null {
  if (list.total === 0) return null;

  const lines = list.entries.map((e) => {
    const tail = unitLabel === 'waiting' ? `waiting ${e.waitingDays}d` : `approved ${e.waitingDays}d ago`;
    return `• ${e.fullName} — ${e.email} — ${tail}`;
  });

  if (list.truncated) {
    const more = list.total - list.entries.length;
    lines.push(`… (${more} more — oldest first)`);
  }

  lines.push(`→ ${reviewLink.label}: <${reviewLink.url}|Open admin dashboard>`);

  return {
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${emoji} *${title} (${list.total})*\n${lines.join('\n')}`,
    },
  };
}

function buildBlocks(snapshot: MentorshipStatsSnapshot): SlackBlock[] {
  const baseUrl = getBaseUrl();
  const mentorAppsUrl = `${baseUrl}/dashboard/admin/mentors/applications`;
  const menteeAppsUrl = `${baseUrl}/dashboard/admin/mentees/applications`;
  const usersUrl = `${baseUrl}/dashboard/admin/users`;

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `She Sharp Weekly Mentorship Stats — ${formatDateNzdt(snapshot.generatedAt)}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: buildFunnelField('Mentors', snapshot.mentors) },
        { type: 'mrkdwn', text: buildFunnelField('Mentees', snapshot.mentees) },
      ],
    },
    { type: 'divider' },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*Active mentorship relationships:* ${snapshot.activeRelationships}`,
          `*Mentees in waiting queue:* ${snapshot.waitingQueueLength}`,
        ].join('\n'),
      },
    },
  ];

  const followups: Array<SlackBlock | null> = [
    buildFollowupSection(':hourglass:', 'Mentors awaiting admin review', snapshot.mentorAwaitingReview, 'waiting', { label: 'Review', url: mentorAppsUrl }),
    buildFollowupSection(':hourglass:', 'Mentees awaiting admin review', snapshot.menteeAwaitingReview, 'waiting', { label: 'Review', url: menteeAppsUrl }),
    buildFollowupSection(':envelope:', 'Mentors approved but not registered', snapshot.mentorApprovedNotRegistered, 'approved', { label: 'Re-send invite', url: usersUrl }),
    buildFollowupSection(':envelope:', 'Mentees approved but not registered', snapshot.menteeApprovedNotRegistered, 'approved', { label: 'Re-send invite', url: usersUrl }),
  ];

  const nonEmpty = followups.filter((b): b is SlackBlock => b !== null);
  if (nonEmpty.length > 0) {
    blocks.push({ type: 'divider' });
    blocks.push(...nonEmpty);
  }

  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `_Excludes test accounts. Generated ${formatDateTimeNzdt(snapshot.generatedAt)} NZ time._`,
      },
    ],
  });

  return blocks;
}

/**
 * Sends the snapshot to the configured Slack channel. Logs and returns silently
 * if the webhook URL is missing (mirrors the existing notification helpers in
 * lib/slack/service.ts).
 */
export async function sendMentorshipStatsNotification(snapshot: MentorshipStatsSnapshot): Promise<void> {
  const webhookUrl = getStatsWebhookUrl();
  if (!webhookUrl) {
    console.warn('SLACK_MENTORSHIP_STATS_WEBHOOK_URL not configured, skipping weekly stats notification');
    return;
  }

  const blocks = buildBlocks(snapshot);

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blocks }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mentorship stats webhook ${response.status}: ${body}`);
  }
}
