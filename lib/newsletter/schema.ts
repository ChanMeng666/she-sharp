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
  /**
   * Vestigial. Held the Resend broadcast id while the newsletter went out as a
   * broadcast; nothing writes it now that the send is a batch built by
   * `scripts/newsletter/build-newsletter-batch.ts`. Kept, rather than removed,
   * because the committed issue fixtures still carry the field and dropping it
   * would fail their schema parse — a later cleanup can migrate them together.
   */
  broadcastId: z.string().nullable().default(null),
  /** UTC ISO instant the issue is approved to send at. */
  scheduledAt: z.string().nullable().default(null),
});

/** One NZ Tech Pulse news item (source-attributed; never model-invented). */
export const pulseNewsItemSchema = z.object({
  title: z.string().min(1),
  /** At most two sentences — up to three of these stack in the rendered list. */
  summary: z.string().min(1),
  sourceLabel: z.string().min(1),
  url: z.string().url(),
  /** Optional short dateline shown before the source, e.g. "28 Jul". */
  dateLabel: z.string().min(1).max(24).optional(),
});

/**
 * Human-owned copy. Nullable sections are omitted from the rendered email
 * when null (e.g. no photo of the month picked yet).
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
    /** Optional headshot shown beside the signature (absolute email-safe JPEG). */
    photoUrl: z.string().url().nullable().default(null),
  }),
  /**
   * Optional "headline event" — ONE marquee upcoming event promoted to the top
   * of the issue, directly under the founder note.
   *
   * `eventSlug` must match an entry in `auto.upcomingEvents`; every hard fact
   * (title, date, time, location, links) is read from that snapshot so the
   * block can never drift from the event data — only the framing copy lives
   * here. The promoted event is dropped from the "What's next" list so it is
   * never shown twice. Null omits the block entirely.
   */
  headline: z
    .object({
      /** Slug of the promoted event; must exist in `auto.upcomingEvents`. */
      eventSlug: z.string().min(1),
      /** Small all-caps label above the title, e.g. "Next up · 7-8 August". */
      eyebrow: z.string().min(1).max(40),
      /**
       * Large two-part date treatment on the left rail, e.g. day "7-8",
       * month "AUG". Free text rather than derived, so multi-day events and
       * ranges read naturally.
       */
      dateBadge: z.object({
        day: z.string().min(1).max(8),
        month: z.string().min(1).max(4),
      }),
      /** 1-2 sentence pitch, used here instead of the event's shortDescription. */
      blurb: z.string().min(1),
      /** Button label; null falls back to "Register". */
      ctaLabel: z.string().min(1).max(40).nullable().default(null),
      /** Button target; null falls back to the event's registrationUrl, then its page. */
      ctaHref: z.string().url().nullable().default(null),
    })
    .nullable()
    .default(null),
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
  /**
   * Optional REAL photo (absolute URL, email-safe JPEG) used as the cover under
   * the masthead — e.g. the best shot from last month. Null = no cover photo.
   */
  heroImageUrl: z.string().url().nullable().default(null),
  /**
   * "NZ Tech Pulse" — monthly NZ tech-industry data section. Numbers must
   * come verbatim from fetched sources (never model-invented); every item
   * carries its source attribution. Null omits the section.
   */
  pulse: z
    .object({
      heroStat: z.object({
        /** The number itself, verbatim from the source, e.g. "5.2%". */
        value: z.string().min(1),
        /** What the number measures, e.g. "NZ gender pay gap". */
        label: z.string().min(1),
        /** One context sentence around the number. */
        context: z.string().min(1),
        sourceLabel: z.string().min(1),
        sourceUrl: z.string().url(),
      }),
      /**
       * Legacy single news bite. KEPT: issues generated before the list
       * existed (e.g. 2026-06) carry this key explicitly set to null, and
       * `pulse.ts` still produces it. Rendered only when `newsBites` is
       * absent or empty.
       */
      newsBite: pulseNewsItemSchema.nullable(),
      /**
       * Multi-item news list (max 3) — the successor to `newsBite`. Optional
       * rather than `.default([])` on purpose: a default would make the key
       * required in the inferred OUTPUT type, breaking the `Pulse` object
       * literals in `pulse.ts` and the `deepStrictEqual` comparisons in
       * `pulse.test.ts`.
       */
      newsBites: z.array(pulseNewsItemSchema).max(3).optional(),
      didYouKnow: z
        .object({
          text: z.string().min(1),
          sourceLabel: z.string().min(1),
          sourceUrl: z.string().url(),
        })
        .nullable(),
    })
    .nullable()
    .default(null),
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

/** One photo in the monthly highlights strip (email-safe JPEG on Vercel Blob). */
export const stripPhotoSchema = z.object({
  /** Absolute URL of an email-optimized JPEG (never WebP — Outlook breaks). */
  src: z.string().url(),
  alt: z.string().min(1),
  eventSlug: z.string().optional(),
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
  /**
   * Photo highlights of the month. Populated by the local photo pipeline
   * (`scripts/newsletter/photos.ts`) during the review loop — the serverless
   * cron leaves it empty (it cannot run ffmpeg/harvesting).
   *
   * The ceiling is 13 rather than a round number because `PhotoStrip` leads
   * with one full-width photo and pairs the rest into rows of two: only an ODD
   * count fills every row, and 13 is `1 + 2×6`. An even count leaves a visible
   * gap in the final row. Raised from 6 for the August 2026 hackathon issue —
   * the event photography is what the newsletter recruits on, so the section
   * was deliberately given room to be the body of the email rather than a
   * garnish.
   */
  photoStrip: z.array(stripPhotoSchema).max(13).default([]),
  /** "View all photos" link — the month's Google Photos album, if any. */
  photoAlbumUrl: z.string().url().nullable().default(null),
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
