/**
 * Who reviews a newsletter issue before it reaches the mailing list, split into
 * the half that is committed and the half that is not.
 *
 * WHY THIS FILE EXISTS. Until 2026-08-30 the monthly-newsletter skill named one
 * address in its prose — the developer's personal Gmail — and called it "the
 * single approved test mailbox". The newsletter is not run by the developer; it
 * is run by She Sharp's newsletter department. So the skill told a
 * newsletter-department person to send their proof copy to somebody else's
 * inbox, and offered no way to say who the *reviewers* were. A roster in prose
 * is not a roster: it cannot be diffed, cross-checked, or refuse.
 *
 * The approval chain this serves has three stages, and they are ordered:
 *
 *   1. the caller's OWN test mailbox — whoever is running the skill, named by
 *      them at the command line, one address;
 *   2. the review round — the founder together with the newsletter team, each
 *      getting their own copy;
 *   3. the founder's approval, which gates the real broadcast.
 *
 * Stage 2 is HOW the founder sees the issue, so it cannot be gated on her
 * having already approved it. That inversion was the bug in the old Step 6b.
 *
 * ── THE SPLIT ──────────────────────────────────────────────────────────────
 *
 * COMMITTED, here: each reviewer's name, role and whether they are on the
 * default newsletter round. **No addresses.** This is what a colleague reads in
 * a diff, and it is identical on every machine.
 *
 * NOT COMMITTED: the addresses, in `state/reviewers.local.json` under the
 * monthly-newsletter skill, gitignored by `**\/*.local.json`. See
 * `reviewers.local.example.json` beside it for the shape.
 *
 * Why split rather than commit the lot. The repository is private, so this is
 * not an exposure emergency — but an address in git is permanent, and a
 * volunteer who leaves stays in the history forever. The repo's own rule
 * (`update-mailing-list/references/consent-rules.md`, "Handling the files") is
 * that addresses do not go into committed files. Committing the *names* keeps
 * the who auditable, which is the property an addresses-in-an-env-var approach
 * throws away: with only a `REVIEWERS=` variable, nobody can see in a diff that
 * a person was added to or dropped from the round.
 *
 * Most reviewers hold **personal, off-domain** addresses (a Gmail, a Hotmail, a
 * university address). Only the founder is on `@shesharp.org.nz`, and she holds
 * two — one organisational, one academic — which is why one person maps to a
 * LIST of addresses rather than appearing twice as two people.
 *
 * ── THE FAILURE THIS PREVENTS ──────────────────────────────────────────────
 *
 * A stale local file must fail LOUDLY. {@link resolveReviewRound} throws and
 * NAMES anyone on the committed roster who has no address, rather than quietly
 * sending the round to whoever it could resolve. The specific thing being
 * guarded against is the founder silently not receiving the review round
 * because somebody's local file is a month old — the one omission nobody would
 * notice, on the one send where it matters.
 *
 * ── THE OWN_MAILBOXES CROSS-CHECK, AND ITS LIMIT ───────────────────────────
 *
 * Seven `@shesharp.org.nz` addresses this project published for a year had
 * never been created in Workspace. Sending *as* a non-existent address works
 * fine, so the mistake only surfaces when a human presses Reply — a review
 * round posted to a dead mailbox looks, from the sender's side, exactly like
 * one that worked. So every ON-DOMAIN address is checked against
 * `OWN_MAILBOXES` and refused if the delivery probe found it missing.
 *
 * That check is **deliberately skipped for off-domain addresses**, and the
 * distinction is the point rather than an oversight: `OWN_MAILBOXES` is a
 * register of She Sharp's own mailboxes, so a Gmail's absence from it proves
 * nothing at all. Applying the check to everyone would reject every real
 * reviewer; applying it to nobody would let a dead `@shesharp.org.nz` mailbox
 * become a reviewer. It applies to exactly the addresses it can speak about.
 *
 * ── SCOPE ──────────────────────────────────────────────────────────────────
 *
 * This module is offline tooling for the skill scripts and their tests. It
 * imports from `scripts/` and reads a file under `.claude/`; **nothing under
 * `app/` may import it**, and nothing here sends mail.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { OWN_MAILBOXES } from "../../scripts/email/own-mailboxes";

/** The only domain She Sharp owns. */
export const OWN_DOMAIN = "shesharp.org.nz";

/**
 * Which part of the organisation the person speaks for in a review round.
 *
 * The role is not decoration: it says what their sign-off covers. `founder`
 * owns the decision to send at all; `newsletter` owns the copy; `marketing`
 * owns the voice and the CTA; `events` owns whether the events named in the
 * issue are described correctly.
 */
export type ReviewerRole = "founder" | "newsletter" | "marketing" | "events";

export interface Reviewer {
  /**
   * Stable slug, and the key this person's addresses are filed under in the
   * local file. Never reuse one for a different person — the local files on
   * other machines are keyed by it.
   */
  id: string;
  /** The person's name, as the team knows them. */
  name: string;
  /** What their sign-off covers. */
  role: ReviewerRole;
  /**
   * Whether they are on the DEFAULT newsletter review round.
   *
   * Separate from `role` because the roster records who holds a role whether or
   * not they are copied on every issue. The default round is the founder plus
   * the newsletter team; marketing and events are recorded here with their
   * roles but are not on it, and `--reviewers` can add anyone for one issue.
   */
  newsletterReviewer: boolean;
  /** Why they are on the list, in a sentence. */
  note: string;
}

/**
 * The people. Addresses live in the local file, keyed by `id`.
 *
 * Adding somebody is two edits on two machines: a line here, which is
 * reviewed and committed, and their addresses in every operator's local file.
 * Forgetting the second half is caught at resolve time by name, which is the
 * whole design.
 */
export const NEWSLETTER_REVIEWERS: Reviewer[] = [
  {
    id: "mahsa",
    name: "Dr. Mahsa McCauley",
    role: "founder",
    newsletterReviewer: true,
    note: "founder and chair; her approval is stage 3 and gates the send. Two addresses — one organisational, one academic — and the round goes to both",
  },

  // --- The newsletter, marketing and events reviewers ------------------------
  //
  // NAMES STILL NEEDED. The maintainer has the roster; the names and roles are
  // committed (they are not addresses), the addresses are not. One line each:
  //
  //   { id: "<slug>", name: "<their name>", role: "newsletter",
  //     newsletterReviewer: true, note: "…" },
  //
  // `role: "marketing"` and `role: "events"` entries are recorded the same way
  // with `newsletterReviewer: false` — on the roster, off the default round.
];

/** The default round: the founder plus the newsletter team. */
export function defaultReviewRound(
  roster: readonly Reviewer[] = NEWSLETTER_REVIEWERS
): Reviewer[] {
  const round = roster.filter((r) => r.newsletterReviewer);
  // Founder first, so the person whose approval is stage 3 heads every list a
  // human reads back before sending.
  return [
    ...round.filter((r) => r.role === "founder"),
    ...round.filter((r) => r.role !== "founder"),
  ];
}

/**
 * The founder's entry, which every review round must contain.
 *
 * @throws Error when the roster has no founder, or more than one — either is a
 *   roster edit gone wrong, and stage 3 has no owner without it.
 */
export function founderEntry(roster: readonly Reviewer[] = NEWSLETTER_REVIEWERS): Reviewer {
  const founders = roster.filter((r) => r.role === "founder");
  if (founders.length !== 1) {
    throw new Error(
      `The reviewer roster must name exactly one founder; found ${founders.length}. ` +
        "Stage 3 of the approval chain is the founder's approval — without a single " +
        "unambiguous founder entry there is nobody to record it against."
    );
  }
  return founders[0];
}

// ---------------------------------------------------------------------------
// The local address file
// ---------------------------------------------------------------------------

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
/** Repo root, resolved from this file rather than from cwd. */
const REPO_ROOT = resolve(MODULE_DIR, "..", "..");

/** Gitignored. Real addresses. Never commit it. */
export const REVIEWER_ADDRESSES_PATH = resolve(
  REPO_ROOT,
  ".claude",
  "skills",
  "monthly-newsletter",
  "state",
  "reviewers.local.json"
);

/** Committed, with obviously-fake addresses, so the shape is discoverable. */
export const REVIEWER_ADDRESSES_EXAMPLE_PATH = resolve(
  REPO_ROOT,
  ".claude",
  "skills",
  "monthly-newsletter",
  "state",
  "reviewers.local.example.json"
);

/** `{ id: [address, …] }`. One person, one or more mailboxes. */
export interface ReviewerAddressBook {
  version: number;
  addresses: Record<string, string[]>;
}

/** Anything that stops a review round being resolved. */
export class ReviewerAddressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReviewerAddressError";
  }
}

const EMAIL_REGEX = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

const MISSING_LOCALS = new Set(
  OWN_MAILBOXES.filter((m) => m.expected === "missing").map((m) => m.local)
);
const KNOWN_LOCALS = new Set(OWN_MAILBOXES.map((m) => m.local));

/**
 * Reads the local address file.
 *
 * A missing file is an ERROR, not an empty book. Returning `{}` would make
 * every reviewer look unaddressed in a way a caller might be tempted to skip
 * past; a named file that does not exist is a setup step somebody has not done,
 * and saying so is more useful than any fallback.
 *
 * @param path Override only in tests.
 * @throws ReviewerAddressError when the file is absent, unparseable, or the
 *   wrong shape.
 */
export function loadReviewerAddresses(
  path: string = REVIEWER_ADDRESSES_PATH
): ReviewerAddressBook {
  if (!existsSync(path)) {
    throw new ReviewerAddressError(
      [
        `No reviewer address file at ${path}.`,
        "",
        "The names of the reviewers are committed in lib/email/newsletter-reviewers.ts;",
        "their addresses are not, and never will be. Copy the example beside it and fill",
        "it in:",
        "",
        `  cp "${REVIEWER_ADDRESSES_EXAMPLE_PATH}" "${path}"`,
        "",
        "The file is gitignored (`**/*.local.json`). Do not commit it, and do not paste",
        "its contents into a PR, a commit message or a Slack thread.",
      ].join("\n")
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new ReviewerAddressError(
      `${path} is not valid JSON (${error instanceof Error ? error.message : String(error)}).`
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ReviewerAddressError(`${path} must be a JSON object.`);
  }

  const raw = parsed as { version?: unknown; addresses?: unknown };
  if (!raw.addresses || typeof raw.addresses !== "object" || Array.isArray(raw.addresses)) {
    throw new ReviewerAddressError(
      `${path} must have an "addresses" object keyed by reviewer id. See ` +
        `${REVIEWER_ADDRESSES_EXAMPLE_PATH}.`
    );
  }

  const addresses: Record<string, string[]> = {};
  for (const [id, value] of Object.entries(raw.addresses as Record<string, unknown>)) {
    const list = Array.isArray(value) ? value : [value];
    addresses[id] = list
      .filter((v): v is string => typeof v === "string")
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
  }

  return { version: typeof raw.version === "number" ? raw.version : 1, addresses };
}

/**
 * Checks one address, applying the on-domain registry check only where it means
 * something.
 *
 * @param address A trimmed, lowercased address.
 * @param who Whose address it is, for the error message.
 * @throws ReviewerAddressError for a malformed address, or an
 *   `@shesharp.org.nz` one the delivery probe could not reach.
 */
export function assertAddressUsable(address: string, who: string): void {
  if (!EMAIL_REGEX.test(address)) {
    throw new ReviewerAddressError(`${who}: "${address}" is not a valid email address.`);
  }

  const domain = address.slice(address.indexOf("@") + 1);
  if (domain !== OWN_DOMAIN) {
    // Off-domain — a personal Gmail, Hotmail or university address. OWN_MAILBOXES
    // is a register of SHE SHARP's mailboxes, so it has nothing to say about
    // this address and its absence there proves nothing. Deliberately unchecked.
    return;
  }

  const local = address.slice(0, address.indexOf("@"));
  if (MISSING_LOCALS.has(local)) {
    throw new ReviewerAddressError(
      `${who}: ${address} is marked \`expected: "missing"\` in scripts/email/own-mailboxes.ts. ` +
        "That mailbox does not exist and hard-bounces, so mail to it is not a review — " +
        "sending as it works fine, which is why this has to be caught here rather than " +
        "noticed later."
    );
  }
  if (!KNOWN_LOCALS.has(local)) {
    throw new ReviewerAddressError(
      `${who}: ${address} is not recorded in OWN_MAILBOXES at all, so nobody knows whether ` +
        "it accepts mail. Add it there and probe it (scripts/email/probe-mailboxes.ts) " +
        "before using it as a reviewer address."
    );
  }
}

/** One reviewer, with the mailboxes the round should reach them at. */
export interface ResolvedReviewer {
  reviewer: Reviewer;
  addresses: string[];
}

export interface ResolvedRound {
  people: ResolvedReviewer[];
  /** Every address, founder first, deduplicated. */
  addresses: string[];
  /** Distinct PEOPLE. Not the same as `addresses.length`. */
  peopleCount: number;
}

/**
 * Resolves the default review round from the committed roster and the local
 * address file.
 *
 * @param book The loaded address file.
 * @param roster Override only in tests.
 * @throws ReviewerAddressError naming every committed reviewer who has no
 *   address, or whose address cannot be used. It NEVER returns a partial round:
 *   silently dropping the founder because a local file was stale is the exact
 *   failure this whole mechanism exists to make impossible.
 */
export function resolveReviewRound(
  book: ReviewerAddressBook,
  roster: readonly Reviewer[] = NEWSLETTER_REVIEWERS
): ResolvedRound {
  const round = defaultReviewRound(roster);
  if (round.length === 0) {
    throw new ReviewerAddressError(
      "No reviewer on the committed roster is marked `newsletterReviewer: true`, so there " +
        "is no default review round. Fix the roster in lib/email/newsletter-reviewers.ts, " +
        "or name the round explicitly with --reviewers."
    );
  }

  const people: ResolvedReviewer[] = [];
  const unaddressed: Reviewer[] = [];

  for (const reviewer of round) {
    const addresses = book.addresses[reviewer.id] ?? [];
    if (addresses.length === 0) {
      unaddressed.push(reviewer);
      continue;
    }
    for (const address of addresses) {
      assertAddressUsable(address, `${reviewer.name} (${reviewer.id})`);
    }
    people.push({ reviewer, addresses });
  }

  if (unaddressed.length > 0) {
    throw new ReviewerAddressError(
      [
        "These reviewers are on the committed roster but have no address in",
        `${REVIEWER_ADDRESSES_PATH}:`,
        "",
        ...unaddressed.map((r) => `  ${r.id.padEnd(16)} ${r.name} (${r.role})`),
        "",
        "Refusing to send a partial round. A round that quietly leaves somebody out looks",
        "exactly like one that reached everybody, and the person most likely to be missing",
        "from a stale local file is the founder — whose approval is the next stage.",
        "",
        "Add them to the local file, or, if they should not be on the round at all, set",
        "`newsletterReviewer: false` in the committed roster so the omission is reviewed.",
      ].join("\n")
    );
  }

  const seen = new Set<string>();
  const addresses: string[] = [];
  for (const person of people) {
    for (const address of person.addresses) {
      if (seen.has(address)) continue;
      seen.add(address);
      addresses.push(address);
    }
  }

  return { people, addresses, peopleCount: people.length };
}

/**
 * Resolves the round the caller asked for: an explicit `--reviewers` list when
 * one is given, otherwise the roster plus the local file.
 *
 * An explicit list is checked the same way — a dead `@shesharp.org.nz` address
 * typed by hand is exactly as undeliverable as one read from a file.
 *
 * @param explicit Addresses from `--reviewers`, or null.
 * @param book The address book, or null to load the default one.
 * @param roster Override only in tests.
 */
export function resolveRequestedRound(
  explicit: readonly string[] | null,
  book: ReviewerAddressBook | null = null,
  roster: readonly Reviewer[] = NEWSLETTER_REVIEWERS
): ResolvedRound {
  if (explicit && explicit.some((raw) => raw.trim().length > 0)) {
    const seen = new Set<string>();
    const addresses: string[] = [];
    for (const raw of explicit) {
      const address = raw.trim().toLowerCase();
      if (!address) continue;
      assertAddressUsable(address, "--reviewers");
      if (seen.has(address)) continue;
      seen.add(address);
      addresses.push(address);
    }
    // One address is assumed to be one person here: the caller typed the list,
    // so nothing maps addresses back to people. The count is reported as such.
    return { people: [], addresses, peopleCount: addresses.length };
  }

  if (explicit) {
    throw new ReviewerAddressError("--reviewers was given but contained no addresses.");
  }

  return resolveReviewRound(book ?? loadReviewerAddresses(), roster);
}
