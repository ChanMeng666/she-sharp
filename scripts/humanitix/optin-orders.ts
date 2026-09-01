/**
 * The rules for turning Humanitix order rows into the opt-in CSV the existing
 * import chain already reads, and for judging whether an event's checkout
 * opt-in switch was ever turned on.
 *
 * **Pure.** No `fs`, no `fetch`, no `process.env`, no clock. Everything here is
 * a function of its arguments, which is what lets `optin-orders.test.ts` run
 * offline in CI against the one thing that must not drift: the column contract.
 *
 * ---------------------------------------------------------------------------
 * THE COLUMN CONTRACT, AND WHY THESE EXACT SIX HEADERS
 * ---------------------------------------------------------------------------
 *
 * The whole point of this exporter is that the downstream chain needs ZERO
 * changes:
 *
 *   this CSV → normalize-recipients.ts (detect) → --map --for-import
 *            → tmp/emails/recipients-<key>.json → import-optin-subscribers.ts
 *
 * Every header below was chosen against that chain's code, not against what
 * reads nicely:
 *
 * | Header | Value | Why that and not something else |
 * |---|---|---|
 * | `Email` | `email`, trimmed | `ALIASES.email` in `normalize-recipients.ts` contains `"email"` |
 * | `First name` / `Last name` | verbatim | both are present, so `FULL_NAME_ALIASES` splitting never engages and nobody is greeted by their surname |
 * | `Order status` | **`financialStatus`** | `CANCELLED_STATUS_MARKERS = ["cancel","refund","declin","void"]` is `includes()`-matched against this column, so `"refunded"` is excluded downstream. Writing `status` here instead would put `"complete"` in every cell — zero information, and it would let refunds through |
 * | `Marketing opt-in` | `"Yes"` | `compact("Marketing opt-in") === "marketingoptin"`, which `isOptInHeader()` matches; `"Yes"` is in both `OPT_IN_VALUES` and `optin-rows.ts`'s `AFFIRMATIVE`. Rows that did not tick are not written at all, so the column is constant by construction |
 * | `Order completed` | `completedAt`, **verbatim ISO with zone** | `ORDER_DATE_ALIASES` in `optin-rows.ts` contains `"order completed"`; `parseOrderDate()`'s `ISO_DATE` accepts the zoned form and its `SLASHED_DATE` refusal cannot match one |
 *
 * **Two invariants the tests lock, because breaking either is silent:**
 *
 * 1. **Exactly one column may match `isOptInHeader()`.** That predicate takes
 *    the FIRST header it matches (`headers.find(isOptInHeader)`), so adding a
 *    well-meant "Opt-in source" column would make which column is read as the
 *    consent answer depend on column order.
 * 2. **Exactly one column may match an `ORDER_DATE_ALIASES` entry.**
 *    `findOrderDateColumn()` also uses `headers.find(...)`, and both
 *    `"created at"` and `"order created"` are aliases — so a helpful extra
 *    `Created at` column would make the recorded consent date order-dependent,
 *    and a consent date is the one field that must never be a coin toss.
 *
 * ---------------------------------------------------------------------------
 * WHAT THIS DELIBERATELY DOES NOT DO
 * ---------------------------------------------------------------------------
 *
 * **It does not drop refunds.** A refunded order that carries a tick is written
 * out with `financialStatus: "refunded"` in `Order status`, and
 * `normalize-recipients.ts` excludes it — where the exclusion is *reported*, in
 * the Excluded breakdown a colleague reads. Dropping it here would make the
 * same person disappear between two counts with nothing naming why, and the
 * repo would have two answers to "which rows may be imported". `selectOptinOrders`
 * reports `refundedAmongOptedIn` precisely so the two numbers reconcile.
 *
 * **It does not dedupe.** `normalize-recipients.ts` dedupes keeping the FIRST
 * occurrence, so rows are ordered **ascending by `completedAt`** and the
 * recorded `consentDate` is the person's EARLIEST tick — when consent was
 * given, not the latest time they re-affirmed it. Deduping here would take that
 * decision away from the tool that reports it; `duplicateOrders` is reported
 * instead.
 */
import { toCsv } from "../../lib/export/csv";

// ---------------------------------------------------------------------------
// The columns
// ---------------------------------------------------------------------------

/**
 * The CSV header row, in order.
 *
 * Read the file header before changing one of these strings, and read
 * `optin-orders.test.ts` before adding a seventh: two of the six are load-
 * bearing for a `headers.find()` in a downstream module, and a new column that
 * happens to match either predicate silently changes which column is read.
 */
export const OPTIN_CSV_COLUMNS = [
  "Email",
  "First name",
  "Last name",
  "Order status",
  "Marketing opt-in",
  "Order completed",
] as const;

/** One row of the exported CSV, keyed by the header it is written under. */
export interface OptinCsvRow {
  Email: string;
  "First name": string;
  "Last name": string;
  /** The order's `financialStatus`, verbatim — see the header's table. */
  "Order status": string;
  /** Constant: a row that did not tick is not written. */
  "Marketing opt-in": "Yes";
  /** `completedAt`, verbatim ISO with zone. */
  "Order completed": string;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/** What a selection pass saw, in the order the rules were applied. */
export interface OptinCounts {
  /** Every row the API returned. */
  ordersSeen: number;
  /** Dropped: `status` is not `"complete"` — an abandoned or cancelled order. */
  notComplete: number;
  /** Dropped: complete, but `organiserMailListOptIn` is not `true`. */
  noOptIn: number;
  /** Complete AND ticked — the population this export is about. */
  optedIn: number;
  /**
   * Among the opted-in, how many carry a refunded/cancelled `financialStatus`.
   * These ARE written to the CSV; `normalize-recipients.ts` excludes them. This
   * count is what makes its Excluded figure reconcile with this one.
   */
  refundedAmongOptedIn: number;
  /** Dropped from the CSV: ticked, but no usable email address. */
  noEmail: number;
  /** Dropped from the CSV: ticked, but no `completedAt` to date the consent. */
  noCompletedAt: number;
  /** Distinct addresses among the written rows. */
  distinctEmails: number;
  /** Written rows minus distinct addresses — one person, several orders. */
  duplicateOrders: number;
}

/** The result of selecting the exportable rows out of an orders pull. */
export interface SelectResult {
  /** The CSV rows, ascending by `Order completed`. */
  rows: OptinCsvRow[];
  counts: OptinCounts;
  /**
   * `hash(email)` for every written row, in row order. The report prints
   * truncations of these, because a count alone cannot be cross-checked and an
   * address must never be printed.
   */
  hashes: string[];
}

/** Reads a string property off an unknown row without asserting a shape. */
function str(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  return typeof value === "string" ? value : "";
}

/**
 * Applies the row rules to one orders pull.
 *
 * The three tests are `status === "complete"`, `organiserMailListOptIn === true`
 * and a present email, in that order, so the counts read as a funnel a person
 * can check by subtraction. `organiserMailListOptIn` is compared with `true`
 * strictly rather than for truthiness: the field is a boolean on the Order
 * schema, and a string `"false"` — which is truthy — is exactly the sort of
 * thing that turns a consent record into a fabrication.
 *
 * A row with no `completedAt` is dropped rather than written with an empty
 * cell. It has no consent date, `parseOrderDate()` would refuse it downstream
 * anyway, and it has no defined position in an ascending sort — so leaving it
 * in would put an undated row at an arbitrary place in the file whose whole
 * ordering rule exists to fix the consent date.
 *
 * @param rows - Filtered order rows from `fetchOrders`, still `unknown`.
 * @param hash - `hashEmail` from `scripts/email/suppression.ts`, injected so
 *   this module stays pure and the test can pass a trivial one.
 * @returns The CSV rows in ascending `completedAt` order, the funnel counts,
 *   and the row hashes.
 */
export function selectOptinOrders(rows: unknown[], hash: (email: string) => string): SelectResult {
  const counts: OptinCounts = {
    ordersSeen: rows.length,
    notComplete: 0,
    noOptIn: 0,
    optedIn: 0,
    refundedAmongOptedIn: 0,
    noEmail: 0,
    noCompletedAt: 0,
    distinctEmails: 0,
    duplicateOrders: 0,
  };

  const selected: OptinCsvRow[] = [];

  for (const raw of rows) {
    if (!raw || typeof raw !== "object") {
      counts.notComplete += 1;
      continue;
    }
    const row = raw as Record<string, unknown>;

    if (str(row, "status") !== "complete") {
      counts.notComplete += 1;
      continue;
    }
    if (row.organiserMailListOptIn !== true) {
      counts.noOptIn += 1;
      continue;
    }

    counts.optedIn += 1;

    const financialStatus = str(row, "financialStatus").trim();
    if (isCancelledFinancialStatus(financialStatus)) counts.refundedAmongOptedIn += 1;

    const email = str(row, "email").trim();
    if (!email) {
      counts.noEmail += 1;
      continue;
    }

    const completedAt = str(row, "completedAt").trim();
    if (!completedAt) {
      counts.noCompletedAt += 1;
      continue;
    }

    selected.push({
      Email: email,
      "First name": str(row, "firstName").trim(),
      "Last name": str(row, "lastName").trim(),
      "Order status": financialStatus,
      "Marketing opt-in": "Yes",
      "Order completed": completedAt,
    });
  }

  // Ascending, so the FIRST occurrence of an address — the one
  // normalize-recipients.ts keeps — is the earliest tick. A stable tie-break on
  // the address keeps two orders stamped the same second in a fixed order, so
  // two runs of this script produce the same file.
  selected.sort((a, b) => {
    const byDate = a["Order completed"].localeCompare(b["Order completed"]);
    return byDate !== 0 ? byDate : a.Email.localeCompare(b.Email);
  });

  const distinct = new Set(selected.map((row) => row.Email.toLowerCase()));
  counts.distinctEmails = distinct.size;
  counts.duplicateOrders = selected.length - distinct.size;

  return { rows: selected, counts, hashes: selected.map((row) => hash(row.Email.toLowerCase())) };
}

/**
 * Whether a `financialStatus` reads as cancelled to the downstream filter.
 *
 * A deliberate restatement of `CANCELLED_STATUS_MARKERS` in
 * `normalize-recipients.ts` rather than an import: that constant is private to
 * that module, and this copy exists only to COUNT what the other will exclude.
 * If the two ever disagree the reconciliation line in the report stops adding
 * up, which is a visible failure rather than a silent one — and the test asserts
 * `"refunded"` matches, which is the case that actually occurs.
 *
 * @param value - The order's `financialStatus`.
 * @returns Whether `normalize-recipients.ts` will exclude the row.
 */
function isCancelledFinancialStatus(value: string): boolean {
  const key = value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  return ["cancel", "refund", "declin", "void"].some((marker) => key.includes(marker));
}

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

/**
 * Serialises the selected rows into the CSV document.
 *
 * `toCsv()` in `lib/export/csv.ts` returns `""` for an empty row list — no
 * header, no newline, nothing. A zero-byte file whose name says `optins-…csv`
 * is indistinguishable from a failed write, and handed to
 * `normalize-recipients.ts` it produces a column-detection error rather than
 * "nobody ticked". So the header row is emitted explicitly in that case. The
 * CLI refuses to write a zero-row file at all — this is the belt to that
 * braces, for any other caller.
 *
 * @param rows - The selected rows, already ordered.
 * @returns The CSV document, always with a header row.
 */
export function toOptinCsv(rows: OptinCsvRow[]): string {
  const columns = [...OPTIN_CSV_COLUMNS];
  if (rows.length === 0) return columns.join(",");
  return toCsv(rows as unknown as Record<string, unknown>[], columns);
}

// ---------------------------------------------------------------------------
// The switch verdict
// ---------------------------------------------------------------------------

/**
 * What one event's order counts say about its checkout opt-in switch.
 *
 * `NO EVIDENCE YET` is a third state, never folded into "clean". An event with
 * four orders and no ticks is not evidence of anything, and counting it as a
 * pass is how a summary goes green over a question nobody has answered.
 */
export type SwitchVerdict = "OK" | "PROBLEM" | "WARN" | "NO EVIDENCE YET";

/** The evidence for one event's verdict. */
export interface SwitchJudgement {
  verdict: SwitchVerdict;
  /**
   * True when the first tick is materially later than the first order — the
   * signature of a switch turned on partway through selling, which the
   * zero-tick test cannot see because the event ends up `OK`.
   */
  lateSwitch: boolean;
  /** Orders sold before the first tick, when `lateSwitch` — nobody asked those. */
  ordersBeforeFirstTick: number | null;
  /** One sentence per line, already written for a reader. */
  lines: string[];
}

/** Inputs to {@link judgeOptinSwitch}. */
export interface SwitchInput {
  /** Orders with `status === "complete"`. */
  completeOrders: number;
  /** Of those, how many carry `organiserMailListOptIn === true`. */
  ticks: number;
  /** ISO instant of the earliest complete order, or null when there are none. */
  firstOrderAt: string | null;
  /** ISO instant of the earliest ticked order, or null when there are none. */
  firstTickAt: string | null;
  /** Complete orders sold before `firstTickAt`; null when there is no tick. */
  ordersBeforeFirstTick: number | null;
  /** Below this many complete orders, a zero is `NO EVIDENCE YET`. */
  minOrders: number;
  /** At or above this many complete orders, a zero is a `PROBLEM`. */
  problemAt: number;
}

/**
 * Judges one event's opt-in switch from its order counts.
 *
 * **The evidence is asymmetric, and the tiers exist because of it.** One tick
 * PROVES the switch is on — nobody can tick a box that is not rendered — so any
 * tick is `OK` regardless of how few. Zero ticks proves nothing on its own,
 * because a genuinely-on switch can collect zero ticks by chance. Observed
 * per-event tick rates on this account are roughly 23% (2020), 16% (2021), 6%
 * (2022) and 40% (2026); at a pessimistic true rate of 10%,
 * `P(zero ticks | switch on) = 0.9^N` is 35% at N=10, 12% at N=20 and 4% at
 * N=30. So a zero is `NO EVIDENCE YET` under `minOrders`, `WARN` between the
 * two thresholds, and `PROBLEM` at `problemAt` or above — where the innocent
 * explanation has become unlikely enough to be worth somebody's click.
 *
 * The late-switch flag is the finding this check exists for that a zero-tick
 * test cannot produce. Ticks on orders 30–40 of a 40-order event make it `OK`
 * while orders 1–29 were never asked the question, and that is exactly the
 * 2026-08-26 signature on the live account.
 *
 * @param input - The counts and the two thresholds.
 * @returns The verdict, the late-switch flag and the lines to print.
 */
export function judgeOptinSwitch(input: SwitchInput): SwitchJudgement {
  const { completeOrders, ticks, minOrders, problemAt } = input;

  const lateSwitch =
    ticks > 0 &&
    input.ordersBeforeFirstTick !== null &&
    input.ordersBeforeFirstTick > 0 &&
    input.firstOrderAt !== null &&
    input.firstTickAt !== null &&
    input.firstOrderAt < input.firstTickAt;

  const lines: string[] = [];

  let verdict: SwitchVerdict;
  if (ticks > 0) {
    verdict = "OK";
    lines.push(
      `${ticks} of ${completeOrders} complete order(s) carry a tick, which proves the ` +
        "switch is on — one tick is proof, where zero ticks never is."
    );
  } else if (completeOrders < minOrders) {
    verdict = "NO EVIDENCE YET";
    lines.push(
      `${completeOrders} complete order(s) and no tick. That is not evidence: at a ` +
        `pessimistic 10% opt-in rate, ${completeOrders} orders produce zero ticks ` +
        `${Math.round(0.9 ** completeOrders * 100)}% of the time with the switch fully on.`
    );
    lines.push(
      `Re-run once the event has passed ${minOrders} orders. Counted apart from the clean ` +
        "events on purpose — an unanswered question is not a pass."
    );
  } else if (completeOrders >= problemAt) {
    verdict = "PROBLEM";
    lines.push(
      `${completeOrders} complete order(s) and not one tick. With the switch on, that is a ` +
        `${(0.9 ** completeOrders * 100).toFixed(1)}% coincidence at a pessimistic 10% rate.`
    );
    lines.push(
      "Open the event in the Humanitix console and turn the checkout opt-in on. It costs " +
        "one click, and four years of She Sharp events were run without it."
    );
  } else {
    verdict = "WARN";
    lines.push(
      `${completeOrders} complete order(s) and no tick — enough to be worth a look, not ` +
        `enough to be sure (${Math.round(0.9 ** completeOrders * 100)}% chance of this with ` +
        "the switch on, at a pessimistic 10% rate)."
    );
  }

  if (lateSwitch) {
    lines.push(
      `LATE SWITCH: the first tick is dated ${input.firstTickAt}, but the first order is ` +
        `${input.firstOrderAt} — ${input.ordersBeforeFirstTick} order(s) were placed before ` +
        "anyone was asked. Those people cannot be added to the list, and cannot be asked again."
    );
  }

  return { verdict, lateSwitch, ordersBeforeFirstTick: input.ordersBeforeFirstTick, lines };
}
