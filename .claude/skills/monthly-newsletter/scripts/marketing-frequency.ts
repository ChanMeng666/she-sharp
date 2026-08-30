/**
 * How many marketing emails She Sharp has already sent this month — counted
 * across every skill that can send one.
 *
 * WHY THIS EXISTS. Three skills send marketing mail to the same ~1,549 people:
 * `/monthly-newsletter`, `/email-the-community`, and `/promote-event` (which
 * hands over to `/email-the-community` and therefore lands in its ledger). None
 * of them could see what the other two had done. Multi-stage event promotion is
 * coming — a save-the-date, a programme announcement, a last-call — so one
 * subscriber could plausibly receive four or five marketing emails in a month
 * without any single skill noticing.
 *
 * The reason that matters is not politeness. The Resend account complaint
 * ceiling is **0.08%** — about 1.25 complaints on a full send — and the account
 * is shared: breaching it takes password resets and donation receipts down with
 * the newsletter (`docs/deployment/EMAIL_AUTHENTICATION.md`). Send frequency is
 * the main driver of complaints. So the cap is a deliverability control, not a
 * style rule, which is why it refuses rather than warns.
 *
 * WHAT IT READS. Two state files, both read-only, both parsed defensively:
 *
 *   - `.claude/skills/email-the-community/state/broadcasts.json` — that skill's
 *     own ledger, in ITS format. This module adapts to that shape; it does not
 *     ask that skill to change. A broadcast counts once, at the month of the
 *     first date it has (sent, else scheduled, else created).
 *   - the newsletter's own issue ledger, passed in by the caller rather than
 *     read here, so `issue-ledger.ts` can import this module without a cycle.
 *
 * WHAT COUNTS AS ONE SEND. One *campaign*, not one API call. A newsletter
 * ramped across five chunks of 100 is one send, dated at its first chunk — the
 * cap is about how often a person's inbox is touched, and a ramp touches each
 * inbox once. A `draft` broadcast has touched nobody and counts as nothing.
 *
 * MONTH BOUNDARIES ARE NEW ZEALAND ONES. The organisation, its sends and its
 * "last Thursday, 10am" slot are all in Pacific/Auckland; a UTC month boundary
 * would put a send made on the 1st at 9am NZ into the previous month, which is
 * the kind of off-by-one nobody would ever look for.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

/** …/.claude/skills/monthly-newsletter */
export const SKILL_ROOT = resolve(SCRIPT_DIR, "..");

/**
 * The community skill's ledger, read where it lives.
 *
 * Resolved from this file rather than from cwd so the count is the same
 * whichever directory the operator ran the command from.
 */
export const COMMUNITY_LEDGER_PATH = resolve(
  SKILL_ROOT,
  "..",
  "email-the-community",
  "state",
  "broadcasts.json"
);

/**
 * Marketing emails one subscriber may receive in a calendar month before this
 * gate refuses.
 *
 * Three is a judgement, not a measurement: it allows the monthly newsletter
 * plus two event touches, which is the busiest month the organisation has
 * actually run. Raising it is a deliverability decision and belongs in
 * `docs/deployment/EMAIL_AUTHENTICATION.md`, not in a flag someone reaches for
 * on the day.
 */
export const DEFAULT_MONTHLY_CAP = 3;

/** Which skill put a send on the record. */
export type SendSource = "monthly-newsletter" | "email-the-community";

/** One marketing campaign that reached, or is scheduled to reach, the list. */
export interface MarketingSend {
  source: SendSource;
  /** The key the owning skill files it under (issue id, or broadcast key). */
  key: string;
  /** ISO timestamp the send is dated at. */
  at: string;
  /** NZ calendar month, `YYYY-MM`. */
  month: string;
  /** One line a human can read in a refusal message. */
  what: string;
}

const NZ_MONTH = new Intl.DateTimeFormat("en-NZ", {
  timeZone: "Pacific/Auckland",
  year: "numeric",
  month: "2-digit",
});

/**
 * The New Zealand calendar month an instant falls in.
 *
 * @param iso Any string `Date` can parse.
 * @returns `YYYY-MM` in Pacific/Auckland, or `"unknown"` for an unparseable
 *   input — a bad timestamp must not throw inside a gate whose whole job is to
 *   answer a yes/no question.
 */
export function nzCalendarMonth(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "unknown";
  const parts = NZ_MONTH.formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "00";
  return `${year}-${month}`;
}

/** The NZ calendar month right now. */
export function currentNzMonth(now: Date = new Date()): string {
  return nzCalendarMonth(now.toISOString());
}

/** The subset of the community ledger's entry shape this module needs. */
interface CommunityEntry {
  status?: unknown;
  segment?: unknown;
  digest?: unknown;
  createdAt?: unknown;
  scheduledAt?: unknown;
  sentAt?: unknown;
}

/** Narrows an unknown to a non-empty string. */
function str(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * Reads the community skill's ledger and returns the sends that touched inboxes.
 *
 * A missing or corrupt file yields an empty list rather than throwing. That is
 * the one place this module is deliberately lenient: the newsletter must stay
 * runnable when the other skill's state file is absent, and the cost of
 * under-counting is a send that should have been questioned, while the cost of
 * throwing is a newsletter that cannot be sent at all. The `check` command
 * reports which sources it managed to read, so an empty read is visible rather
 * than silent.
 *
 * @param path Override only in tests.
 * @returns One {@link MarketingSend} per non-draft broadcast.
 */
export function readCommunitySends(path: string = COMMUNITY_LEDGER_PATH): MarketingSend[] {
  if (!existsSync(path)) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return [];
  }

  const broadcasts =
    parsed && typeof parsed === "object" && "broadcasts" in parsed
      ? (parsed as { broadcasts?: unknown }).broadcasts
      : null;
  if (!broadcasts || typeof broadcasts !== "object") return [];

  const sends: MarketingSend[] = [];
  for (const [key, raw] of Object.entries(broadcasts as Record<string, unknown>)) {
    if (!raw || typeof raw !== "object") continue;
    const entry = raw as CommunityEntry;
    const status = str(entry.status);
    // A draft has reached nobody. Only `sent` and `scheduled` touch an inbox.
    if (status !== "sent" && status !== "scheduled") continue;

    const at = str(entry.sentAt) ?? str(entry.scheduledAt) ?? str(entry.createdAt);
    if (!at) continue;

    const segment = str(entry.segment) ?? "the subscriber list";
    sends.push({
      source: "email-the-community",
      key,
      at,
      month: nzCalendarMonth(at),
      what: `${status} to ${segment} — ${str(entry.digest) ?? "no digest recorded"}`,
    });
  }
  return sends;
}

/**
 * The sends that fall in one NZ month, excluding the campaign being checked.
 *
 * The exclusion matters for a resumed send: an issue that already has chunk 1
 * on the record must not count itself as a competing campaign when chunk 2 is
 * built, or a ramp would lock itself out halfway through.
 *
 * @param sends Every known send.
 * @param month `YYYY-MM` in NZ time.
 * @param exclude Optional `{ source, key }` identifying the campaign in hand.
 */
export function sendsInMonth(
  sends: readonly MarketingSend[],
  month: string,
  exclude?: { source: SendSource; key: string }
): MarketingSend[] {
  return sends.filter(
    (s) =>
      s.month === month &&
      !(exclude && s.source === exclude.source && s.key === exclude.key)
  );
}

export interface FrequencyVerdict {
  month: string;
  cap: number;
  /** Campaigns already on the record for this month, excluding the one in hand. */
  existing: MarketingSend[];
  /** Whether adding the campaign in hand would exceed the cap. */
  exceeded: boolean;
}

/**
 * Decides whether one more campaign this month is within the cap.
 *
 * @param sends Every known send, from every source.
 * @param month The NZ month the new campaign would land in.
 * @param cap Sends per month allowed.
 * @param exclude The campaign in hand, so it does not count against itself.
 */
export function assessFrequency(
  sends: readonly MarketingSend[],
  month: string,
  cap: number = DEFAULT_MONTHLY_CAP,
  exclude?: { source: SendSource; key: string }
): FrequencyVerdict {
  const existing = sendsInMonth(sends, month, exclude);
  return { month, cap, existing, exceeded: existing.length + 1 > cap };
}
