/**
 * Detects the thing nobody notices until the event is over: somebody forgot to
 * turn the Humanitix checkout opt-in on.
 *
 * The switch is a per-event setting that **defaults OFF**, and it is the only
 * place She Sharp collects a consent record that is per person, timestamped and
 * made by the person themselves. Four years of events were run without it: 224
 * `Yes` and 3,921 `No` in the orders export, with **zero** ticks between
 * 2022-05-30 and 2026-08-26. Every one of those events is a mailing list that
 * could have grown honestly and did not. It costs one click, before the event.
 *
 * ---------------------------------------------------------------------------
 * THE API CANNOT READ THE SWITCH, SO THIS INFERS IT FROM AN INDEPENDENT FACT
 * ---------------------------------------------------------------------------
 *
 * Humanitix exposes no per-event record of the setting on any endpoint. What it
 * does expose is every order's `organiserMailListOptIn`, and the evidence those
 * give is **asymmetric**:
 *
 *   * **One tick PROVES the switch is on.** Nobody can tick a box that is not
 *     rendered. So any tick at all is `OK`, however few.
 *   * **Zero ticks proves nothing on its own.** A genuinely-on switch collects
 *     zero ticks by chance more often than people expect. Observed per-event
 *     rates on this account run 2020 ≈23%, 2021 ≈16%, 2022 ≈6%, 2026 ≈40%; at a
 *     pessimistic true rate of 10%, `P(zero | on) = 0.9^N` is 35% at N=10, 12%
 *     at N=20 and 4% at N=30.
 *
 * That asymmetry is the entire reason for tiers rather than a single test, and
 * it is why `NO EVIDENCE YET` is a **third state** that is counted separately
 * and never allowed to make the summary look green. An event with four orders
 * and no ticks has not passed anything; it has not been asked yet.
 *
 * ---------------------------------------------------------------------------
 * THE MOST USEFUL LINE IN THE REPORT IS THE LATE-SWITCH ONE
 * ---------------------------------------------------------------------------
 *
 * A zero-tick test cannot see a switch that was turned on **partway through
 * selling**: ticks on orders 30–40 of a 40-order event make it `OK` while
 * orders 1–29 were never asked the question, and those people cannot be added
 * to the list and cannot be asked again. So alongside the count this prints the
 * **first ticked order's `completedAt`** and flags it when it is materially
 * later than the event's first order. That is exactly the 2026-08-26 signature
 * on the live account.
 *
 * ---------------------------------------------------------------------------
 * WHERE THE EVENT LIST COMES FROM, AND WHY IT IS NOT THE SITE'S
 * ---------------------------------------------------------------------------
 *
 * Enumeration is from **`listEvents({ inFutureOnly: true })`** — the live
 * account — and NOT from `lib/data/json/humanitix/events.json`, NOT from
 * `crosswalk.json`, and NOT from `getAllEvents()`.
 *
 * **This is the opposite choice from `verify-live-events.ts`, deliberately.**
 * That script is *about* the site's records — whether what we publish matches
 * the account — so the site is rightly its spine. This one is about a setting
 * on the Humanitix listing, and `docs/development/TESTING.md` names the failure
 * mode it would otherwise inherit: *a check keyed on an annotation inherits the
 * annotating pass's blind spot and exits 0*. **The event whose switch nobody
 * set is precisely the one nobody has added to the site yet** — a listing built
 * this morning, selling this afternoon, with no site record and no crosswalk
 * row. Keying on the site's list would make this check structurally unable to
 * find its own most important case.
 *
 * Scope is upcoming-only by default because the switch is only *fixable* before
 * the event. `--recent-days <n>` adds recently-ended events so a close-out can
 * record a missed opportunity — a WARN there is a **lesson, not an action**,
 * and the report says so. It never scans the whole archive by default: 59
 * events of four-year zeros would produce ~50 findings, and a check that cries
 * fifty times is a check people mute.
 *
 * **It writes nothing to disk, ever**, and reads two fields per order —
 * `status` and `organiserMailListOptIn`, plus `completedAt` for the late-switch
 * line. Names, addresses, mobiles and access codes never enter the process; see
 * `./orders-api.ts` for how.
 *
 * Usage:
 *   npx tsx scripts/humanitix/check-optin-switch.ts
 *   npx tsx scripts/humanitix/check-optin-switch.ts --recent-days 30
 *   npx tsx scripts/humanitix/check-optin-switch.ts --event-id <24hex>
 *   npx tsx scripts/humanitix/check-optin-switch.ts --strict --json
 *   npx tsx scripts/humanitix/check-optin-switch.ts --self-test   # offline
 *
 * NOT IN CI, and it cannot be: it needs `HUMANITIX_API_KEY` and a network
 * round-trip to a third party, while `.github/workflows/verify.yml` is one
 * offline job with no secrets. There is no pre-push hook in this repo either
 * (`.githooks/` holds only `install.sh` and a `pre-commit` secrets grep), so it
 * is documented rather than wired — run it when an event goes on sale.
 */
import "dotenv/config";

import { TZDate } from "@date-fns/tz";

import { listEvents, type HumanitixEvent } from "../../lib/humanitix/client";
import { judgeOptinSwitch, type SwitchVerdict } from "./optin-orders";
import { fetchOrders, OPTIN_COUNT_FIELDS, parseOrdersForTest } from "./orders-api";

const NZ_TIME_ZONE = "Pacific/Auckland";
const INDENT = "  ";

/** Default: below this many complete orders, a zero is `NO EVIDENCE YET`. */
const DEFAULT_MIN_ORDERS = 10;
/** Default: at or above this many complete orders, a zero is a `PROBLEM`. */
const DEFAULT_PROBLEM_AT = 25;

/** A usage or configuration problem — reported as one line, never a stack. */
class CheckError extends Error {}

const USAGE = `Detects Humanitix events whose checkout opt-in switch was never turned on.

Usage:
  npx tsx scripts/humanitix/check-optin-switch.ts [options]

Scope (default: every upcoming event in the live account):
  --event-id <24hex>   check one listing
  --recent-days <n>    also include events that ended within the last n days.
                       A finding there is a LESSON, not an action — the switch
                       cannot be turned on for an event that has happened.

Options:
  --min-orders <n>     below this, a zero is NO EVIDENCE YET (default ${DEFAULT_MIN_ORDERS})
  --problem-at <n>     at or above this, a zero is a PROBLEM (default ${DEFAULT_PROBLEM_AT})
  --json               machine-readable dump
  --strict             exit 2 when any PROBLEM is reported
  --self-test          run the offline field-allowlist assertions and exit
  --help               this message

Exit codes:
  0  ran, and either no PROBLEM or no --strict
  1  could NOT run — missing key, bad flag, API failure
  2  --strict and at least one PROBLEM

Prints; never writes. Reads two fields per order and no address.`;

interface Options {
  eventId: string | null;
  recentDays: number | null;
  minOrders: number;
  problemAt: number;
  json: boolean;
  strict: boolean;
}

/**
 * Parses argv.
 *
 * @param argv - Arguments after the script name.
 * @returns The parsed options.
 * @throws {CheckError} On an unknown flag or an unusable number.
 */
function parseArgs(argv: string[]): Options {
  const options: Options = {
    eventId: null,
    recentDays: null,
    minOrders: DEFAULT_MIN_ORDERS,
    problemAt: DEFAULT_PROBLEM_AT,
    json: false,
    strict: false,
  };

  const number = (raw: string | undefined, flag: string): number => {
    const value = Number(raw);
    if (!raw || !Number.isInteger(value) || value < 0) {
      throw new CheckError(`${flag} needs a non-negative whole number (got "${raw ?? ""}").`);
    }
    return value;
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case "--event-id":
        options.eventId = argv[index + 1] ?? "";
        index += 1;
        break;
      case "--recent-days":
        options.recentDays = number(argv[index + 1], "--recent-days");
        index += 1;
        break;
      case "--min-orders":
        options.minOrders = number(argv[index + 1], "--min-orders");
        index += 1;
        break;
      case "--problem-at":
        options.problemAt = number(argv[index + 1], "--problem-at");
        index += 1;
        break;
      case "--json":
        options.json = true;
        break;
      case "--strict":
        options.strict = true;
        break;
      default:
        throw new CheckError(`Unknown flag: ${arg}\n\n${USAGE}`);
    }
  }

  if (options.problemAt < options.minOrders) {
    throw new CheckError(
      `--problem-at (${options.problemAt}) cannot be below --min-orders (${options.minOrders}): ` +
        "an event would be a PROBLEM before there was any evidence to judge it on."
    );
  }
  if (options.eventId && !/^[0-9a-f]{24}$/.test(options.eventId)) {
    throw new CheckError(
      `--event-id must be 24 lowercase hex characters (got "${options.eventId}").` +
        (/^[A-Z0-9]{8}$/.test(options.eventId)
          ? "\n  That looks like the 8-character humanitixEventId from the CSV archive, which" +
            "\n  is a different identifier — see scripts/humanitix/listing-slug.ts."
          : "")
    );
  }

  return options;
}

// ---------------------------------------------------------------------------
// One event
// ---------------------------------------------------------------------------

/** What one event's orders said. */
interface Finding {
  eventId: string;
  name: string;
  slug: string;
  startDateNz: string | null;
  ended: boolean;
  completeOrders: number;
  ticks: number;
  firstOrderAt: string | null;
  firstTickAt: string | null;
  ordersBeforeFirstTick: number | null;
  verdict: SwitchVerdict;
  lateSwitch: boolean;
  lines: string[];
  requests: number;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** The NZ calendar day of an instant; see verify-live-events.ts for why not UTC. */
function nzCalendarDate(instant: string | null): string | null {
  if (!instant) return null;
  const ms = Date.parse(instant);
  if (Number.isNaN(ms)) return null;
  const nz = new TZDate(ms, NZ_TIME_ZONE);
  return `${nz.getFullYear()}-${pad(nz.getMonth() + 1)}-${pad(nz.getDate())}`;
}

/**
 * Counts one listing's complete orders and ticks, and judges the switch.
 *
 * `completedAt` is added to {@link OPTIN_COUNT_FIELDS} for this call because
 * the late-switch line needs a date, and only a date — the allowlist still
 * excludes every name, address, mobile and access code on the row.
 *
 * @param listing - The live listing.
 * @param options - The two thresholds.
 * @param ended - Whether the event is already over, for the report's wording.
 * @returns The finding.
 */
async function checkOne(
  listing: HumanitixEvent,
  options: Options,
  ended: boolean
): Promise<Finding> {
  const pull = await fetchOrders(listing.id, {
    keep: [...OPTIN_COUNT_FIELDS, "completedAt"],
  });

  const complete = pull.rows.filter(
    (row): row is Record<string, unknown> =>
      !!row && typeof row === "object" && (row as Record<string, unknown>).status === "complete"
  );
  const ticked = complete.filter((row) => row.organiserMailListOptIn === true);

  const at = (row: Record<string, unknown>): string =>
    typeof row.completedAt === "string" ? row.completedAt : "";
  const orderDates = complete.map(at).filter(Boolean).sort();
  const tickDates = ticked.map(at).filter(Boolean).sort();

  const firstOrderAt = orderDates[0] ?? null;
  const firstTickAt = tickDates[0] ?? null;
  const ordersBeforeFirstTick =
    firstTickAt === null ? null : orderDates.filter((date) => date < firstTickAt).length;

  const judgement = judgeOptinSwitch({
    completeOrders: complete.length,
    ticks: ticked.length,
    firstOrderAt,
    firstTickAt,
    ordersBeforeFirstTick,
    minOrders: options.minOrders,
    problemAt: options.problemAt,
  });

  return {
    eventId: listing.id,
    name: listing.name,
    slug: listing.slug,
    startDateNz: nzCalendarDate(listing.startDate),
    ended,
    completeOrders: complete.length,
    ticks: ticked.length,
    firstOrderAt,
    firstTickAt,
    ordersBeforeFirstTick,
    verdict: judgement.verdict,
    lateSwitch: judgement.lateSwitch,
    lines: judgement.lines,
    requests: pull.requests,
  };
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * What this check cannot tell you. Printed on EVERY run, clean ones included,
 * in the style of `verify-live-events.ts`'s `STANDING_LIMITS` — a report that
 * looks exhaustive is more dangerous than one that names its blind spots.
 *
 * The first item is the one that has already been got wrong in this repo's own
 * documentation, twice.
 */
const STANDING_LIMITS = [
  'A `false` is written BOTH when the buyer declined AND when the question was never ' +
    'asked. Never quote a non-tick count as "people declined" — the orders export\'s ' +
    "3,921 `No` cells are the same ambiguity, and EVENT_LIFECYCLE_SOP.md says so.",
  "The switch itself is not readable. No Humanitix endpoint exposes the per-event " +
    "setting, so every verdict here is an INFERENCE from order data — one tick proves " +
    "`on`, but no number of zeros ever proves `off`.",
  "An OK verdict says the switch is on NOW, not that it was on for every order. Read " +
    "the late-switch line: ticks on the last ten orders make an event OK while everyone " +
    "before them was never asked.",
  "This does not say who may be emailed. A tick is route-2 evidence that still goes " +
    "through export-optins.ts, normalize-recipients.ts --for-import and " +
    "import-optin-subscribers.ts, and Humanitix's per-event unsubscriber list is " +
    "readable only in its console.",
  "Nothing was written — no file, no vault entry, no database row.",
];

/** Printed order; the states people must act on come first. */
const VERDICT_ORDER: SwitchVerdict[] = ["PROBLEM", "WARN", "NO EVIDENCE YET", "OK"];

function printReport(findings: Finding[], options: Options, scanned: number): void {
  console.log("");
  console.log("Humanitix checkout opt-in switch");
  console.log(`${INDENT}scope         ${options.eventId ? "one event" : "upcoming events"}` +
    (options.recentDays !== null ? ` + those ended within ${options.recentDays} day(s)` : ""));
  console.log(`${INDENT}enumerated    listEvents() — the live account, not the site's records`);
  console.log(`${INDENT}scanned       ${scanned} listing(s)`);
  console.log(`${INDENT}thresholds    WARN at ${options.minOrders} orders, PROBLEM at ${options.problemAt}`);
  console.log(`${INDENT}requests      ${findings.reduce((sum, f) => sum + f.requests, 0)} to /orders (2 fields + completedAt)`);
  console.log("");
  console.log("This check PRINTS and never writes. No address entered the process.");
  console.log("");

  for (const verdict of VERDICT_ORDER) {
    const group = findings.filter((finding) => finding.verdict === verdict);
    if (group.length === 0) continue;
    console.log(`${verdict}  (${group.length})`);
    console.log("");
    for (const finding of group) {
      console.log(
        `${INDENT}${finding.startDateNz ?? "no date"}  ${finding.slug}` +
          (finding.ended ? "  [already ended — a lesson, not an action]" : "")
      );
      for (const line of finding.lines) console.log(`${INDENT}${INDENT}${line}`);
      if (finding.firstTickAt) {
        console.log(`${INDENT}${INDENT}First order ${finding.firstOrderAt}; first tick ${finding.firstTickAt}.`);
      }
      // An ended event gets the lesson, never the instruction. The switch
      // cannot be turned on for an event that has happened, and printing
      // "go and turn it on" next to "[already ended]" is the kind of
      // contradiction that teaches people to skim the report.
      if (verdict !== "OK") {
        console.log(
          finding.ended
            ? `${INDENT}${INDENT}Too late to fix — this is the record of a missed opportunity, ` +
                "not a task. Set the switch on the NEXT event before it goes on sale."
            : `${INDENT}${INDENT}Console: https://console.humanitix.com — event settings → checkout.`
        );
      }
      console.log("");
    }
  }

  const problems = findings.filter((finding) => finding.verdict === "PROBLEM").length;
  const noEvidence = findings.filter((finding) => finding.verdict === "NO EVIDENCE YET").length;
  const late = findings.filter((finding) => finding.lateSwitch).length;

  console.log(
    findings.length === 0
      ? "No events in scope."
      : `${findings.length} event(s): ${problems} problem, ` +
          `${findings.filter((f) => f.verdict === "WARN").length} warn, ` +
          `${noEvidence} no evidence yet, ` +
          `${findings.filter((f) => f.verdict === "OK").length} ok` +
          (late > 0 ? ` — ${late} with a LATE SWITCH` : "")
  );
  if (noEvidence > 0) {
    console.log(
      `${noEvidence} event(s) are counted separately and are NOT a pass: too few orders to ` +
        "judge yet. Re-run when they have sold more."
    );
  }
  console.log("");
  console.log("What this cannot tell you:");
  for (const limit of STANDING_LIMITS) console.log(`${INDENT}- ${limit}`);
  console.log("");
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------

/**
 * Offline proof that the count allowlist drops what it claims to.
 *
 * Runs the reviver over a synthetic orders page carrying an email, a mobile and
 * an access code, and asserts none survives. It is here as well as in
 * `optin-orders.test.ts` because this script is the one that scans EVERY
 * upcoming event, so it is the one whose blast radius a broken allowlist would
 * be largest — and it can be run by someone who is about to trust it, without
 * a key and without CI.
 *
 * @returns 0 when every assertion holds, 1 otherwise.
 */
function selfTest(): number {
  const page = JSON.stringify({
    total: 1,
    page: 1,
    pageSize: 100,
    orders: [
      {
        _id: "order-1",
        email: "ada@example.test",
        firstName: "Ada",
        mobile: "+64 21 555 0100",
        accessCode: "K5SJHRMS",
        additionalFields: [{ name: "Dietary", value: "none" }],
        address: { line1: "1 Somewhere St" },
        status: "complete",
        organiserMailListOptIn: true,
        completedAt: "2026-08-26T02:11:00.000Z",
      },
    ],
  });

  const envelope = parseOrdersForTest(page, [...OPTIN_COUNT_FIELDS, "completedAt"]);
  const failures: string[] = [];

  if (!envelope || !Array.isArray(envelope.orders)) {
    failures.push("the synthetic page did not parse into an envelope with an orders array");
  } else {
    const row = (envelope.orders as Record<string, unknown>[])[0];
    const kept = Object.keys(row).sort();
    if (kept.join(",") !== "completedAt,organiserMailListOptIn,status") {
      failures.push(`kept the wrong fields: ${kept.join(", ")}`);
    }
    const dumped = JSON.stringify(envelope);
    for (const secret of ["ada@example.test", "+64 21 555 0100", "K5SJHRMS", "Somewhere St", "Ada"]) {
      if (dumped.includes(secret)) failures.push(`"${secret}" survived the allowlist`);
    }
    if (envelope.total !== 1) failures.push("the pagination envelope did not survive");
  }

  for (const line of [
    "ok - the synthetic orders page parses",
    "ok - only status, organiserMailListOptIn and completedAt are kept",
    "ok - no email, mobile, access code, address or name survives",
    "ok - the pagination envelope survives, so the page walk can terminate",
  ]) {
    if (failures.length === 0) console.log(line);
  }

  if (failures.length > 0) {
    for (const failure of failures) console.error(`not ok - ${failure}`);
    console.error("");
    console.error("The /orders field allowlist is NOT working. Do not run this check.");
    return 1;
  }
  console.log("");
  console.log("Self-test passed. The allowlist drops every field it claims to.");
  return 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(argv: string[]): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    console.log(USAGE);
    return 0;
  }
  if (argv.includes("--self-test")) return selfTest();

  const options = parseArgs(argv);

  if (!process.env.HUMANITIX_API_KEY?.trim()) {
    throw new CheckError(
      "HUMANITIX_API_KEY is not set — put it in .env (local tooling only, never in Vercel)."
    );
  }

  const now = Date.now();

  // The whole point of this check: enumerate from the live account, never from
  // the site's records. See the header — the event whose switch nobody set is
  // the one nobody has added to the site yet.
  let listings: HumanitixEvent[];
  if (options.eventId) {
    const all = await listEvents();
    const found = all.find((listing) => listing.id === options.eventId);
    if (!found) {
      throw new CheckError(
        `The account listing does not contain an event with id ${options.eventId}.\n` +
          `  ${all.length} listings were returned.`
      );
    }
    listings = [found];
  } else {
    listings = await listEvents({ inFutureOnly: true });

    if (options.recentDays !== null) {
      const cutoff = now - options.recentDays * 86_400_000;
      const upcoming = new Set(listings.map((listing) => listing.id));
      for (const listing of await listEvents()) {
        if (upcoming.has(listing.id)) continue;
        const ends = Date.parse(listing.endDate ?? listing.startDate ?? "");
        if (!Number.isNaN(ends) && ends >= cutoff && ends <= now) listings.push(listing);
      }
    }
  }

  const findings: Finding[] = [];
  for (const listing of listings) {
    const ends = Date.parse(listing.endDate ?? listing.startDate ?? "");
    const ended = !Number.isNaN(ends) && ends < now;
    findings.push(await checkOne(listing, options, ended));
  }

  findings.sort((a, b) => (a.startDateNz ?? "").localeCompare(b.startDateNz ?? ""));

  if (options.json) {
    console.log(
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          timeZone: NZ_TIME_ZONE,
          enumeratedFrom: "listEvents",
          scanned: listings.length,
          thresholds: { minOrders: options.minOrders, problemAt: options.problemAt },
          findings,
          summary: Object.fromEntries(
            VERDICT_ORDER.map((verdict) => [
              verdict,
              findings.filter((finding) => finding.verdict === verdict).length,
            ])
          ),
          lateSwitches: findings.filter((finding) => finding.lateSwitch).length,
          limits: STANDING_LIMITS,
        },
        null,
        2
      )
    );
  } else {
    printReport(findings, options, listings.length);
  }

  // Exit 2, not 1, for a PROBLEM — and the divergence from
  // verify-live-events.ts (which uses 1 for both) is the entire point. This
  // check calls somebody else's API, so "the API is down" and "the switch is
  // off" MUST NOT produce the same exit code: a caller that cannot tell them
  // apart eventually treats both as noise, and the one that matters is the one
  // that is silent. 1 means "could not run"; 2 means "ran, and found the thing".
  if (options.strict && findings.some((finding) => finding.verdict === "PROBLEM")) return 2;
  return 0;
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    if (error instanceof CheckError) {
      console.error(`Error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    if (
      error instanceof Error &&
      (error.name === "HumanitixOrdersError" || error.name === "HumanitixApiError")
    ) {
      // Exit 1: this is "could not run", which must never be confused with the
      // 2 that means a switch is actually off.
      console.error(`Humanitix API error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  });
