/**
 * Newsletter issue content model.
 *
 * Each monthly issue is a JSON file at `lib/data/json/newsletter-issues/YYYY-MM.json`
 * validated against `newsletterIssueSchema`. The file has two content blocks with
 * different ownership rules:
 *
 * - `editorial`: AI-drafted once, then human-edited. Regeneration must NEVER
 *   overwrite this block (only an explicit `force` regeneration may).
 * - `auto`: snapshot of site data (events, stats) taken by `assemble.ts` at
 *   generation time. Regeneration refreshes this block freely.
 */

import { z } from "zod";

/** "YYYY-MM" issue id, e.g. "2026-07". */
export const issueIdSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const issueMetaSchema = z.object({
  status: z.enum(["draft", "approved", "scheduled", "sent"]),
  /** ISO timestamp of when the AI draft was generated. */
  generatedAt: z.string(),
  /** Resend broadcast id once scheduled. */
  broadcastId: z.string().nullable().default(null),
  /** UTC ISO instant the broadcast is scheduled for. */
  scheduledAt: z.string().nullable().default(null),
});

const qaSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

/**
 * Human-owned copy. Nullable sections are omitted from the rendered email
 * when null (e.g. no spotlight person picked yet).
 */
export const editorialSchema = z.object({
  /** Email subject, ≤50 chars per open-rate research. */
  subjectLine: z.string().min(1).max(50),
  /** Hand-written preheader shown next to the subject in inboxes. */
  previewText: z.string().min(1).max(120),
  founderNote: z.object({
    heading: z.string().min(1),
    /** Short markdown (paragraphs + links only). */
    bodyMd: z.string().min(1),
    signature: z.string().min(1),
  }),
  /** Member/mentor spotlight — human picks the person; AI leaves a stub. */
  spotlight: z
    .object({
      name: z.string().min(1),
      role: z.string().min(1),
      /** Absolute URL (email clients need absolute image URLs). */
      photoUrl: z.string().url(),
      qa: z.array(qaSchema).min(1).max(4),
    })
    .nullable(),
  photoOfTheMonth: z
    .object({
      /** Absolute URL. */
      src: z.string().url(),
      caption: z.string().min(1),
      eventSlug: z.string().optional(),
    })
    .nullable(),
  /** 1-2 sentences framing last month's recap section. */
  recapIntro: z.string().min(1),
  /** Optional per-event one-liners overriding auto shortDescription, keyed by slug. */
  eventBlurbs: z.record(z.string()).default({}),
  /** THE one primary CTA of the issue (research: single CTA lifts clicks). */
  primaryCta: z.object({
    label: z.string().min(1).max(40),
    /** Absolute URL. */
    href: z.string().url(),
  }),
  opportunities: z
    .array(
      z.object({
        title: z.string().min(1),
        body: z.string().min(1),
        /** Absolute URL. */
        href: z.string().url(),
      })
    )
    .default([]),
  /** Short sponsor thank-you paragraph; null omits the section. */
  sponsorThanks: z.string().nullable(),
});

/** An event as snapshotted for the email (all URLs absolute). */
export const autoEventSchema = z.object({
  slug: z.string(),
  title: z.string(),
  /** Display label, e.g. "Thursday, July 30". */
  dateLabel: z.string(),
  /** ISO 8601 start (UTC or with offset) for calendar links; null if unparsable. */
  startIso: z.string().nullable(),
  timeLabel: z.string().nullable(),
  /** e.g. "AUT City Campus, Auckland" or "Online". */
  locationLabel: z.string().nullable(),
  coverImageUrl: z.string().url().nullable(),
  /** Absolute link to the event page on shesharp.org.nz. */
  url: z.string().url(),
  registrationUrl: z.string().url().nullable(),
  shortDescription: z.string().nullable(),
});

/** Machine-owned snapshot, refreshed on every (re)generation. */
export const autoSchema = z.object({
  recapEvents: z.array(autoEventSchema),
  upcomingEvents: z.array(autoEventSchema),
  stats: z.object({
    members: z.string(),
    sponsors: z.string(),
    events: z.string(),
  }),
});

export const newsletterIssueSchema = z.object({
  id: issueIdSchema,
  meta: issueMetaSchema,
  editorial: editorialSchema,
  auto: autoSchema,
});

export type IssueMeta = z.infer<typeof issueMetaSchema>;
export type IssueEditorial = z.infer<typeof editorialSchema>;
export type IssueAuto = z.infer<typeof autoSchema>;
export type AutoEvent = z.infer<typeof autoEventSchema>;
/** Named to avoid clashing with `NewsletterIssue` in `types/newsletter.ts` (archive grid). */
export type NewsletterIssueData = z.infer<typeof newsletterIssueSchema>;
