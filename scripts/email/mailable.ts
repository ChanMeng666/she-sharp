/**
 * One answer to "who may actually receive this send?", shared by the recipient
 * builder and by `suppression.ts reconcile`.
 *
 * Three stores have to agree before an address is mailed, and they are written
 * by different code at different times: `newsletter_subscribers` says who
 * consented, `email_optouts` records what the Resend webhook and the one-click
 * endpoint saw, and `lib/data/json/email-suppression-hashes.json` carries the
 * 2,138 addresses inherited from Mailchimp that must never be contacted again.
 * If the builder and the drift report implemented that agreement separately they
 * would eventually disagree, and the disagreement would surface as either a
 * silent no-op report or a mailed suppression — so it is implemented once, here.
 *
 * **The subtle rule is re-subscription.** `consent-rules.md` says the one way
 * back onto the list is the person themselves, through the website form. So an
 * address in a suppression register is not automatically excluded: if they
 * confirmed a new subscription *after* the suppression was recorded, the newer
 * deliberate act wins and they are mailable. Without that, someone who
 * unsubscribed in 2024 and signed up again this morning would get a confirmation
 * email, see themselves on the list, and never receive anything — the worst of
 * both worlds, and invisible from the outside.
 *
 * **A spam complaint is the exception and is never reversed**, whatever the
 * timestamps say. The account-wide complaint ceiling is 0.08%, and a second
 * complaint from an address that already filed one is the most expensive email
 * She Sharp can send.
 */

import { hashEmail, readSuppressionFile } from "./suppression";

/** A subscriber as the database holds them, before suppression is applied. */
export interface SubscriberCandidate {
  email: string;
  firstName: string | null;
  lastName: string | null;
  emailHash: string;
  /** Null for rows imported with external provenance rather than confirmed here. */
  confirmedAt: Date | null;
}

/** One runtime opt-out row, as `listOptouts()` returns it. */
export interface OptoutRow {
  emailHash: string;
  stream: string;
  reason: string;
  createdAt: Date;
}

/** Why an address was held back from a send. */
export interface MailableExclusion {
  /** sha256 of the address. Never the address itself — this ends up in reports. */
  emailHash: string;
  reason: string;
}

export interface MailableResult {
  mailable: SubscriberCandidate[];
  excluded: MailableExclusion[];
  /** Suppressed addresses that a later confirmation legitimately brought back. */
  returned: MailableExclusion[];
}

/** Reasons that no later act can reverse. */
const TERMINAL_REASONS = new Set(["complaint", "complained"]);

/**
 * Reads a suppression timestamp, tolerating the two shapes these stores use.
 *
 * @param value An ISO string or a Date.
 * @returns The date, or null when it cannot be read — which is treated as
 *   "unknown", and unknown never beats a confirmation.
 */
function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** One entry of the committed, hash-only suppression register. */
export interface CommittedEntry {
  hash: string;
  reason: string;
  at: string;
}

/**
 * Splits consented subscribers into those who may be mailed and those who may not.
 *
 * @param candidates Every subscriber the database considers subscribed.
 * @param optouts The runtime `email_optouts` rows.
 * @param committedEntries The committed register. Defaults to the real file;
 *   injectable so the rules below can be tested against fixtures rather than
 *   against 2,138 live hashes.
 * @returns The mailable list, the exclusions, and the re-subscribed addresses
 *   that were suppressed but came back — reported separately so a reviewer can
 *   see the rule firing rather than having to trust it.
 */
export function selectMailable(
  candidates: SubscriberCandidate[],
  optouts: OptoutRow[],
  committedEntries: CommittedEntry[] = readSuppressionFile().entries
): MailableResult {
  const runtime = new Map<string, OptoutRow>();
  for (const row of optouts) runtime.set(row.emailHash.toLowerCase(), row);

  const committed = new Map<string, { reason: string; at: string }>();
  for (const entry of committedEntries) {
    committed.set(entry.hash.toLowerCase(), { reason: entry.reason, at: entry.at });
  }

  const mailable: SubscriberCandidate[] = [];
  const excluded: MailableExclusion[] = [];
  const returned: MailableExclusion[] = [];

  for (const candidate of candidates) {
    const hash = candidate.emailHash.toLowerCase();
    const runtimeHit = runtime.get(hash);
    const committedHit = committed.get(hash);

    if (!runtimeHit && !committedHit) {
      mailable.push(candidate);
      continue;
    }

    const reason = runtimeHit?.reason ?? committedHit?.reason ?? "unknown";

    // Nothing reverses a complaint — not a newer confirmation, not a newer
    // anything. Checked before the timestamp comparison so no ordering of
    // events can route around it.
    if (isTerminal(reason)) {
      excluded.push({ emailHash: hash, reason: `${reason} (terminal)` });
      continue;
    }

    const suppressedAt = runtimeHit
      ? toDate(runtimeHit.createdAt)
      : toDate(committedHit?.at);
    const confirmedAt = toDate(candidate.confirmedAt);

    // An import (confirmedAt null) never outranks a suppression: its consent
    // predates the register by construction, so it cannot be the newer act.
    if (confirmedAt && suppressedAt && confirmedAt > suppressedAt) {
      returned.push({ emailHash: hash, reason: `re-subscribed after ${reason}` });
      mailable.push(candidate);
      continue;
    }

    excluded.push({ emailHash: hash, reason });
  }

  return { mailable, excluded, returned };
}

/**
 * Reports whether a suppression reason can never be reversed.
 *
 * Matches on substring because the committed register's reasons are free text
 * written by whoever ran the import (`mailchimp-unsubscribed`, `complaint`,
 * `complained`), and a reason that merely *mentions* a complaint must be treated
 * as one. Erring towards not sending is the correct direction here.
 *
 * @param reason The recorded reason.
 * @returns True when the address must never be mailed again.
 */
export function isTerminal(reason: string): boolean {
  const normalized = reason.toLowerCase();
  for (const terminal of TERMINAL_REASONS) {
    if (normalized.includes(terminal)) return true;
  }
  return false;
}

/**
 * Formats the count block that `suppression.ts reconcile` prints.
 *
 * It lives here, next to the rule, because the numbers are the rule's output
 * and the report is the one place anybody reads them. Until 2026-08-30 the
 * report printed `listMailableCandidates().length` under the label "Mailable
 * subscribers" — the count *before* `selectMailable()` strips the two
 * registers. With zero drift the two agree, which is why nobody noticed; with
 * drift, the figure quoted everywhere as the size of the list was larger than
 * the number of people a send would actually reach. Both figures are printed
 * now, and the arithmetic between them is pinned by a test.
 *
 * @param result What `selectMailable()` returned.
 * @param optoutCount Rows in the runtime `email_optouts` table.
 * @param registerCount Entries in the committed suppression register.
 * @returns The lines to print, in order, without a trailing blank.
 */
export function formatMailableCounts(
  result: MailableResult,
  optoutCount: number,
  registerCount: number
): string[] {
  // Every candidate lands in exactly one of the two lists, so their sum is the
  // pre-suppression total and nothing has to be passed in twice to disagree.
  const subscribed = result.mailable.length + result.excluded.length;
  const line = (label: string, value: number): string => `${`${label}:`.padEnd(28)}${value}`;

  return [
    line("Subscribed rows", subscribed),
    line("Runtime opt-outs", optoutCount),
    line("Committed register", registerCount),
    line("Mailable after suppression", result.mailable.length),
  ];
}

export { hashEmail };
