/**
 * How many marketing emails **this repository** has recorded this month —
 * counted across every skill in it that can send one.
 *
 * READ THE FIRST SENTENCE AGAIN. The number this module produces is what the
 * repo can see, and it is NOT the number of marketing emails the subscriber
 * list actually received. Mailchimp stopped sending the newsletter on
 * 2026-08-31 but went on sending event campaigns to the same people, and
 * nothing it sends touches these ledgers. In August 2026 this counter said **0** for a
 * month in which the same people received **five** marketing emails. Every
 * caller therefore renders {@link BLIND_SPOT_NOTICE} beside the figure, and
 * `FrequencyVerdict` carries it so that dropping it takes an edit rather than
 * an omission.
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
 * WHAT IT READS — and this is the whole of it. Two state files, both read-only,
 * both parsed defensively:
 *
 *   - `.claude/skills/email-the-community/state/broadcasts.json` — that skill's
 *     own ledger, in ITS format. This module adapts to that shape; it does not
 *     ask that skill to change. A broadcast counts once, at the month of the
 *     first date it has (sent, else scheduled, else created).
 *   - the newsletter's own issue ledger, passed in by the caller rather than
 *     read here, so `issue-ledger.ts` can import this module without a cycle.
 *
 * WHAT IT DOES NOT READ. Anything sent from outside this repository — today
 * that means Mailchimp. See {@link BLIND_SPOT_NOTICE} for the worked example
 * and the condition under which that notice gets deleted.
 *
 * IT STAYS OFFLINE. No network call, no API key, no environment variable. This
 * is a pre-send gate, and the repo's own precedent is `check-facts.ts`, kept
 * out of CI because a network-dependent check is red on a good day and people
 * stop running it. A gate that sometimes cannot answer is worse than one whose
 * limits are printed next to its answer.
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
 * Marketing emails one subscriber may receive in a calendar month.
 *
 * The gate refuses at this number, but it refuses on what it has *recorded* —
 * the cap is a statement about the subscriber's inbox and the count is not, so
 * the two only line up while every send goes through this repo. Today they do
 * not; see {@link BLIND_SPOT_NOTICE}.
 *
 * Three is a judgement, not a measurement: it allows the monthly newsletter
 * plus two event touches, which is the busiest month the organisation has
 * actually run. Raising it is a deliverability decision and belongs in
 * `docs/deployment/EMAIL_AUTHENTICATION.md`, not in a flag someone reaches for
 * on the day.
 */
export const DEFAULT_MONTHLY_CAP = 3;

/**
 * How the figure must be described wherever it is printed.
 *
 * Never "sends this month" and never "what the list received" — both read as a
 * measurement of the subscriber's inbox, which this gate has no way to take.
 */
export const COUNT_LABEL = "recorded in this repo";

/**
 * The condition for deleting {@link BLIND_SPOT_NOTICE}, written out so that
 * whoever finds it in six months does not have to guess whether it still
 * applies.
 *
 * Both halves, not either: promotion moving to `/promote-event` is what makes
 * the count complete going forward, and "no further campaign from Mailchimp" is
 * what makes it complete for the month in hand.
 */
export const BLIND_SPOT_DELETE_WHEN =
  "DELETE THIS NOTICE when both hold: event promotion runs through " +
  "/promote-event, and no further campaign has been sent from Mailchimp.";

/**
 * {@link BLIND_SPOT_NOTICE} as one whitespace-normalised string.
 *
 * The notice is hand-wrapped for an 80-column terminal, so an assertion on the
 * printed output cannot match the lines as written. Tests compare against this.
 */
export function blindSpotProse(lines: readonly string[] = BLIND_SPOT_NOTICE): string {
  return lines.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * The uncounted pipeline, named, with the month that proved it.
 *
 * THIS IS MEANT TO BE DELETED — see {@link BLIND_SPOT_DELETE_WHEN}. It is a
 * note about a migration in progress, not permanent furniture, and leaving it
 * in place after Mailchimp has stopped sending would train readers to skip it.
 *
 * Why a printed notice rather than a Mailchimp reader in the gate: three
 * reasons, all decided rather than defaulted. A network call would make an
 * offline pre-send gate fail on a bad DNS day. An opt-in `--include-mailchimp`
 * flag would be a safety control that is off by default, which is exactly what
 * `normalize-recipients.ts --for-import` had just been caught doing — it
 * "looked correct and gated nothing". And it would be code with a known death
 * date, since Mailchimp is leaving every She Sharp process.
 *
 * Fabricating the four August campaigns into the ledgers was considered and
 * refused: `broadcast-ledger.ts record` requires `--html-sha256`, "sha256 of
 * the exact broadcast-mode HTML that was uploaded", and there is no honest
 * value for a send this repo did not make.
 */
export const BLIND_SPOT_NOTICE: readonly string[] = [
  "NOT COUNTED: Mailchimp. It stopped being the NEWSLETTER's sender on",
  "  2026-08-31, but it went on sending EVENT campaigns to the same list, and",
  "  nothing it sends reaches these ledgers. This figure is what THIS REPO has",
  "  recorded — it is",
  "  not what the subscriber list received, and a 0 does not mean a quiet month.",
  "  August 2026 is the worked example: this counter read 0/3 while the same",
  "  list took four Mailchimp event campaigns (18, 22 and twice on 27 August)",
  "  plus the monthly newsletter — five marketing emails against a cap of three.",
  "  Before trusting a low number, ask the marketing team what has gone out.",
  "  DELETE THIS NOTICE when both hold: event promotion runs through",
  "  /promote-event, and no further campaign has been sent from Mailchimp.",
];

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
  /**
   * Campaigns already on the record for this month, excluding the one in hand.
   *
   * On the record **here**. Read `blindSpots` before treating the length of
   * this array as the number of emails the list has had.
   */
  existing: MarketingSend[];
  /** Whether adding the campaign in hand would exceed the cap. */
  exceeded: boolean;
  /**
   * What this count cannot see, in the words every caller must print.
   *
   * Carried on the verdict rather than left for each renderer to remember, so
   * that a new command gets the caveat by construction and dropping it from an
   * existing one is a visible edit rather than a silent omission.
   */
  blindSpots: readonly string[];
}

/**
 * Decides whether one more campaign this month is within the cap **as recorded
 * in this repo**.
 *
 * The verdict is a floor, not a measurement: `exceeded: false` means nothing in
 * these ledgers objects, not that the list has had a quiet month. The returned
 * `blindSpots` say so, and are meant to be printed.
 *
 * @param sends Every send this repo knows about, from every source it reads.
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
  return {
    month,
    cap,
    existing,
    exceeded: existing.length + 1 > cap,
    blindSpots: BLIND_SPOT_NOTICE,
  };
}
