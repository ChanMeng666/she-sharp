/**
 * Who is allowed to see a newsletter issue before it reaches the mailing list.
 *
 * WHY THIS FILE EXISTS. Until 2026-08-30 the monthly-newsletter skill named one
 * address in its prose — the developer's personal Gmail — and called it "the
 * single approved test mailbox". The newsletter is not run by the developer; it
 * is run by She Sharp's newsletter department. So the skill as written told a
 * newsletter-department person to send their proof copy to somebody else's
 * inbox, and offered no way to say who the *reviewers* were. A roster in prose
 * is not a roster: it cannot be diffed, cross-checked, or read by a script.
 *
 * The approval chain this list serves has three stages, and they are ordered:
 *
 *   1. the caller's OWN test mailbox — whoever is running the skill, named by
 *      them at the command line, one address;
 *   2. the review round — the founder together with the internal staff below,
 *      each getting their own copy;
 *   3. the founder's approval, which gates the real broadcast.
 *
 * Stage 2 is HOW the founder sees the issue, so it cannot be gated on her
 * having already approved it. That inversion was the bug in the old Step 6b.
 *
 * THIS LIST IS DELIBERATELY INCOMPLETE. Only the founder is populated, because
 * she is the one reviewer whose mailbox this repository already records —
 * `scripts/email/own-mailboxes.ts` carries `mahsa` as "the founder's own
 * mailbox", verified by the 2026-08-23 delivery probe. The newsletter,
 * marketing and events staff who make up the rest of the review round have not
 * been supplied yet. Inventing addresses for them would be worse than leaving
 * them out: a guessed local part either bounces or, worse, reaches a mailbox
 * nobody reads while looking like it worked.
 *
 * WHAT COMPLETES IT. The maintainer adds one entry per reviewer below, each
 * with the local part of their `@shesharp.org.nz` mailbox, their role, and
 * `reviewer: true`. Until then {@link requireReviewRoundRecipients} refuses to
 * fall back to "just the founder" and demands an explicit `--reviewers`
 * argument — a review round of one person is not a review round, and silently
 * shrinking to one is exactly the failure this file was written to stop.
 *
 * EVERY ENTRY IS CROSS-CHECKED against `OWN_MAILBOXES`. Seven addresses this
 * project published for a year had never been created in Workspace; sending as
 * a non-existent address works fine, so the mistake only surfaces when a human
 * presses Reply. `newsletter-reviewers.test.ts` fails the moment a reviewer's
 * local part is one of the ones the probe found `missing`, and
 * `scripts/email/published-addresses.test.ts` is the wider version of the same
 * guard.
 *
 * This file lives in `lib/` rather than `scripts/` so that both the skill
 * scripts under `.claude/` and the tests can import it; nothing under `app/`
 * reads it, and nothing here sends mail.
 */

/** The only domain She Sharp owns. Reviewers are always on it. */
export const REVIEWER_DOMAIN = "shesharp.org.nz";

/**
 * Which part of the organisation the person speaks for in a review round.
 *
 * The role is not decoration: it says what their sign-off covers. `founder`
 * owns the decision to send at all; `newsletter` owns the copy; `marketing`
 * owns the voice and the CTA; `events` owns whether the events named in the
 * issue are described correctly.
 */
export type ReviewerRole = "founder" | "newsletter" | "marketing" | "events";

export interface NewsletterReviewer {
  /** Local part; the domain is always {@link REVIEWER_DOMAIN}. */
  local: string;
  /** What their sign-off covers. */
  role: ReviewerRole;
  /**
   * Whether they are on the stage-2 review round.
   *
   * Separate from `role` on purpose: somebody can be on this roster as a
   * record of who holds a role without being copied on every issue.
   */
  reviewer: boolean;
  /** Why they are on the list, in a sentence. */
  note: string;
}

/**
 * The review-round roster.
 *
 * See the file header before adding to this: the incompleteness is recorded,
 * not accidental, and the guard in {@link requireReviewRoundRecipients} exists
 * because of it.
 */
export const NEWSLETTER_REVIEWERS: NewsletterReviewer[] = [
  {
    local: "mahsa",
    role: "founder",
    reviewer: true,
    note: "Dr. Mahsa McCauley — founder and chair; her approval is stage 3 and gates the send",
  },

  // --- The rest of the review round: SUPPLIED BY THE MAINTAINER -------------
  //
  // One entry per person, e.g.
  //   { local: "newsletter", role: "newsletter", reviewer: true, note: "…" },
  //
  // Before adding one, check the local part against `OWN_MAILBOXES` in
  // scripts/email/own-mailboxes.ts. If it is marked `expected: "missing"` the
  // mailbox does not exist and must not go here — `marketing@` and
  // `newsletter@` are marked `exists` but have had no owner on record since
  // 2025, so a shared mailbox is a worse reviewer than a named person.
];

/** There is exactly one founder, and stage 3 is hers. */
export const FOUNDER_ROLE: ReviewerRole = "founder";

/**
 * Builds the address for one roster entry.
 *
 * @param reviewer The roster entry.
 * @param domain Override only in tests.
 * @returns The full `local@domain` address.
 */
export function reviewerAddress(
  reviewer: NewsletterReviewer,
  domain: string = REVIEWER_DOMAIN
): string {
  return `${reviewer.local}@${domain}`;
}

/**
 * The founder's entry, which every review round must contain.
 *
 * @returns The single `founder`-role entry.
 * @throws Error when the roster has no founder, or more than one — either is a
 *   roster edit that has gone wrong, and stage 3 has no owner without it.
 */
export function founderEntry(
  roster: readonly NewsletterReviewer[] = NEWSLETTER_REVIEWERS
): NewsletterReviewer {
  const founders = roster.filter((r) => r.role === FOUNDER_ROLE);
  if (founders.length !== 1) {
    throw new Error(
      `The reviewer roster must name exactly one founder; found ${founders.length}. ` +
        "Stage 3 of the approval chain is the founder's approval — without a single " +
        "unambiguous founder entry there is nobody to record it against."
    );
  }
  return founders[0];
}

/** Everyone marked `reviewer: true`, founder included. */
export function reviewRoundEntries(
  roster: readonly NewsletterReviewer[] = NEWSLETTER_REVIEWERS
): NewsletterReviewer[] {
  return roster.filter((r) => r.reviewer);
}

/**
 * Whether the roster names anybody besides the founder.
 *
 * A stage-2 round drawn from a roster that is only the founder is not a joint
 * review: it is the founder reading her own issue alone, which is stage 3 with
 * extra steps.
 */
export function rosterIsComplete(
  roster: readonly NewsletterReviewer[] = NEWSLETTER_REVIEWERS
): boolean {
  return reviewRoundEntries(roster).some((r) => r.role !== FOUNDER_ROLE);
}

/** Thrown when the roster cannot supply a review round on its own. */
export class RosterIncompleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RosterIncompleteError";
  }
}

/**
 * Resolves the stage-2 recipient list, refusing rather than guessing.
 *
 * The rule this encodes: while the roster is incomplete, the caller MUST name
 * the review round explicitly. Falling back to whoever happens to be on the
 * roster would send a "the whole team has reviewed this" round to one mailbox
 * and report success, which is the shape of every guard in this repository
 * that passed all year while gating nothing.
 *
 * @param explicit Addresses the caller supplied (`--reviewers`), or null.
 * @param roster Override only in tests.
 * @returns The addresses for the review round, deduplicated, founder first.
 * @throws RosterIncompleteError when nothing was supplied and the roster
 *   cannot stand in for it.
 */
export function requireReviewRoundRecipients(
  explicit: readonly string[] | null,
  roster: readonly NewsletterReviewer[] = NEWSLETTER_REVIEWERS
): string[] {
  if (explicit && explicit.length > 0) {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of explicit) {
      const address = raw.trim().toLowerCase();
      if (!address) continue;
      if (seen.has(address)) continue;
      seen.add(address);
      out.push(address);
    }
    if (out.length === 0) {
      throw new RosterIncompleteError(
        "--reviewers was given but contained no addresses."
      );
    }
    return out;
  }

  if (!rosterIsComplete(roster)) {
    throw new RosterIncompleteError(
      [
        "The newsletter reviewer roster names only the founder, so it cannot supply a",
        "review round on its own. Pass the round explicitly:",
        "",
        '  --reviewers "first@shesharp.org.nz,second@shesharp.org.nz"',
        "",
        "and then add those people to NEWSLETTER_REVIEWERS in",
        "lib/email/newsletter-reviewers.ts so the next issue does not have to be told",
        "again. Sending a 'the team has reviewed this' round to one mailbox is not a",
        "review round, so this refuses instead of shrinking silently.",
      ].join("\n")
    );
  }

  const entries = reviewRoundEntries(roster);
  const founderFirst = [
    ...entries.filter((r) => r.role === FOUNDER_ROLE),
    ...entries.filter((r) => r.role !== FOUNDER_ROLE),
  ];
  return founderFirst.map((r) => reviewerAddress(r));
}
