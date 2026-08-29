/**
 * Health check for the newsletter's evergreen fact pool (`lib/data/nz-tech-facts.ts`).
 *
 * WHY THIS EXISTS
 * ---------------
 * The pool is the anti-hallucination safety net under "NZ Tech Pulse": when the
 * live source fetch fails, the hero stat and the "did you know" line are built
 * from the thirteen human-verified facts it holds instead of from a
 * model-invented number. It goes out to ~1,545 subscribers.
 *
 * On 2026-08-29 one of those facts was found to be false. It read "New Zealand's
 * gender pay gap fell to 5.2% in the June 2025 quarter — the lowest on record",
 * and the label `pulse.ts` printed beside it carried no date at all. Stats NZ had
 * published the June 2026 quarter three days earlier: 5.3%, up from 5.2%. The gap
 * had widened, the superlative was no longer true, and the fact was in live
 * rotation. It was caught by accident, during unrelated research.
 *
 * The failure was NOT that the fact was static — the pool is supposed to be
 * static. The failure was that nothing recorded when a fact was last checked, or
 * how often its source publishes a new figure. A quarterly statistic goes stale
 * on a schedule; nothing in the file knew that, so nobody could know which facts
 * were due. `verifiedAt` and `refresh` now record it, and this script reads them.
 *
 * WHAT IT CHECKS, PER FACT
 * ------------------------
 *   1. Does the source URL still resolve? A fact whose source has gone is
 *      unciteable whatever it says.
 *   2. Do the fact's own numbers still appear VERBATIM in the fetched page?
 *      This reuses `extractNumberTokens` / `assertNumbersVerbatim` from
 *      `lib/newsletter/pulse.ts` — the repo's one definition of "is this number
 *      really in the source", and deliberately not a second implementation of it.
 *   3. Is the fact overdue for human review? `verifiedAt` plus the cadence in
 *      `refresh`. A `"none"` fact is never overdue: nothing exists to update it
 *      with, and a flag that can never be cleared is a flag people learn to skip.
 *   4. Could the page be checked at all?
 *
 * "COULD NOT CHECK" IS NOT "FAILED"
 * ---------------------------------
 * Check 4 is the one that needs care, and it is the lesson this repo has now
 * learned on three separate surfaces. Several of these sources cannot be read by
 * a plain fetch: MBIE answers HTTP 200 with an 851-byte Incapsula challenge
 * (even for a `.pdf` URL, and with `Content-Type: text/html`), Stats NZ answers
 * 200 with 115 KB of HTML that renders to ZERO visible characters because the
 * release is filled in client-side, Te Ara and Education Counts serve a 403.
 * A page that returns 200 and
 * no readable text has confirmed NOTHING. Reporting that as a pass would be a
 * lie; reporting it as a failure would be a different lie, and would train the
 * operator to ignore red. So it is reported as UNCHECKED, with the reason.
 *
 * The same distinction applies to HTTP status: 404/410 is the server saying the
 * page is gone (FAIL), while 403/429/5xx and a network timeout are the server
 * saying nothing useful about the page at all (UNCHECKED).
 *
 * REPORT ONLY. IT NEVER EDITS A FACT.
 * -----------------------------------
 * A number in that file changes when a human has read the source. The whole
 * point of the incident above is that a machine deciding what the new figure
 * should be would have been worse than the stale one.
 *
 * EXIT CODE
 * ---------
 * Non-zero ONLY when something genuinely failed: a dead URL, or a number the
 * fetched page positively contradicts. UNCHECKED and OVERDUE exit 0.
 *
 *   - UNCHECKED is a permanent property of some of these sources, not a defect
 *     in the pool. Three of them will be bot-walled on every run forever. Making
 *     that red means the check is red on a good day, which is how a pre-send
 *     check stops being run.
 *   - OVERDUE is deliberate too, and it is the harder call. An overdue fact is
 *     the check WORKING: a quarterly statistic becomes due four times a year by
 *     design. It is also still true as written, because the rule now is that a
 *     fact carries its own period ("in the June 2026 quarter") — so shipping an
 *     overdue fact is publishing a correctly-dated older figure, not a false
 *     one. A dead URL or a contradicted number is different in kind: that fact
 *     is unciteable today. Only the second kind blocks.
 *
 * Overdue facts are printed first, before the failures, precisely because they
 * do not stop the exit code — the display carries the urgency instead.
 *
 * NOT IN CI. It makes live network calls and several sources are flaky or
 * bot-walled, so it would be an unreliable gate. Run it locally before a send.
 *
 * Usage:
 *   npx tsx scripts/newsletter/check-facts.ts
 *   npx tsx scripts/newsletter/check-facts.ts --json
 */

import { fileURLToPath } from "node:url";
import path from "node:path";

import * as cheerio from "cheerio";

import { NZ_TECH_FACTS } from "../../lib/data/nz-tech-facts";
import type { FactRefresh, NzTechFact } from "../../lib/data/nz-tech-facts";
import {
  assertNumbersVerbatim,
  extractNumberTokens,
} from "../../lib/newsletter/pulse";

// --- Review cadence ----------------------------------------------------------

/**
 * Days after `verifiedAt` at which a fact becomes due for human review, by
 * cadence. The interval is the PUBLICATION interval, not a padded version of it:
 * a fact verified just after a release is overtaken by roughly one interval
 * later, so that is when someone should look. `null` means never due.
 *
 * 92 / 366 / 1098 rather than 90 / 365 / 1095 so that a leap day or a quarter
 * with 92 days cannot make a fact "due" a day before the next release could
 * possibly exist.
 */
export const REVIEW_INTERVAL_DAYS: Record<FactRefresh, number | null> = {
  quarterly: 92,
  annual: 366,
  "multi-year": 1098,
  none: null,
};

const MS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD`, the only shape `verifiedAt` may take. */
const ISO_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export interface ReviewStatus {
  refresh: FactRefresh;
  verifiedAt: string;
  /** `YYYY-MM-DD` the next human review falls due, or null when it never does. */
  dueOn: string | null;
  /** Positive when overdue, negative when still in date, null when never due. */
  daysOverdue: number | null;
  overdue: boolean;
}

/**
 * Decides whether a fact is due for human review.
 *
 * Dates are compared as whole calendar days — the operator's, via `toIsoDay`.
 * The pool is reviewed by a person on a day, not to the hour, so an
 * hours-precision answer would be false
 * precision — and it would make the result depend on when in the day the check
 * was run, which is exactly the kind of instability that makes people distrust
 * a report.
 */
export function reviewStatus(fact: NzTechFact, today: Date): ReviewStatus {
  const interval = REVIEW_INTERVAL_DAYS[fact.refresh];
  if (!ISO_DATE.test(fact.verifiedAt)) {
    throw new Error(`${fact.id}: verifiedAt "${fact.verifiedAt}" is not YYYY-MM-DD`);
  }
  if (interval === null) {
    return {
      refresh: fact.refresh,
      verifiedAt: fact.verifiedAt,
      dueOn: null,
      daysOverdue: null,
      overdue: false,
    };
  }

  const verified = Date.parse(`${fact.verifiedAt}T00:00:00Z`);
  const due = verified + interval * MS_PER_DAY;
  const now = Date.parse(`${toIsoDay(today)}T00:00:00Z`);
  const daysOverdue = Math.round((now - due) / MS_PER_DAY);

  return {
    refresh: fact.refresh,
    verifiedAt: fact.verifiedAt,
    dueOn: new Date(due).toISOString().slice(0, 10),
    daysOverdue,
    overdue: daysOverdue >= 0,
  };
}

/**
 * The LOCAL calendar day of a Date, as `YYYY-MM-DD`.
 *
 * Deliberately not `toISOString().slice(0, 10)`, which is the UTC day. New
 * Zealand runs 12–13 hours ahead of UTC, so for half of every local day the two
 * disagree — the first live run of this check printed "2026-08-29" on the
 * morning of the 30th, and a fact would have been reported in date for a day
 * after it fell due. The repo has been bitten by exactly this before, in event
 * JSON-LD (`docs/development/CONTENT_RULES.md`); the rule is the same here.
 */
export function toIsoDay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// --- Fetching ----------------------------------------------------------------

/** Generous, because this is a one-off run of ~11 URLs, not a cron. */
const FETCH_TIMEOUT_MS = 20_000;

/** Some of these sites 403 the default fetch UA, so present a browser one. */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/**
 * Below this many characters of visible text, a 200 response has told us
 * nothing. A JS-only page and a bot challenge both land here — Stats NZ renders
 * a few dozen characters before hydration, MBIE's challenge page is ~200 bytes
 * of script. A genuine article or landing page clears this by an order of
 * magnitude, so the threshold does not need to be tuned finely.
 */
const MIN_READABLE_CHARS = 400;

/**
 * Phrases in the VISIBLE TEXT that identify a challenge page even when it is
 * wordy enough to clear the length threshold.
 */
const CHALLENGE_TEXT_MARKERS = [
  "enable javascript",
  "just a moment",
  "checking your browser",
  "verify you are human",
  "attention required",
  "ddos protection",
];

/**
 * Markers in the RAW body that name the bot wall itself. These live in script
 * srcs and iframe attributes, which `visibleText` strips by design, so they have
 * to be looked for separately — and they are worth looking for, because naming
 * the wall ("Incapsula") is a far more useful reason for an operator than
 * "0 characters of visible text".
 */
const CHALLENGE_BODY_MARKERS: readonly [string, string][] = [
  ["_Incapsula_Resource", "Imperva/Incapsula"],
  ["cf-browser-verification", "Cloudflare"],
  ["/cdn-cgi/challenge-platform", "Cloudflare"],
];

/**
 * The four things a source page can turn out to be. The split between `gone`
 * and `unreachable` is the whole point: only one of them is evidence about the
 * page, and conflating them is what makes a check untrustworthy.
 */
export type PageOutcome =
  | { kind: "ok"; status: number; finalUrl: string; text: string }
  /** The server answered definitively that there is nothing here. */
  | { kind: "gone"; status: number; reason: string }
  /** We were blocked, timed out, or the server erred — no conclusion possible. */
  | { kind: "unreachable"; reason: string }
  /** 200, but nothing a reader (or this check) could read. */
  | { kind: "opaque"; status: number; finalUrl: string; reason: string };

/**
 * Reduces an HTML document to its visible text.
 *
 * Scripts, styles and templates are removed first: a bot-challenge page is
 * almost entirely `<script>`, so measuring raw byte length would score it as
 * substantial. What is left is what a reader would see, which is the only thing
 * a "the number is in the source" claim can honestly rest on.
 */
export function visibleText(html: string): string {
  const $ = cheerio.load(html);
  $("script, style, noscript, template, svg").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

/**
 * Turns a fetched page into a `PageOutcome`, without doing any fetching — so
 * every branch below is testable, including the ones that only occur behind a
 * bot wall we cannot reproduce on demand.
 */
export function classifyResponse(input: {
  status: number;
  finalUrl: string;
  contentType: string;
  body: string;
}): PageOutcome {
  const { status, finalUrl, contentType, body } = input;

  if (status === 404 || status === 410) {
    return { kind: "gone", status, reason: `HTTP ${status} — the page is gone` };
  }
  if (status === 401 || status === 403 || status === 429) {
    // A bot wall, not a dead page. Education Counts serves a Cloudflare 403 to
    // every non-browser client while the page itself is perfectly alive.
    return {
      kind: "unreachable",
      reason: `HTTP ${status} — blocked (bot wall or auth), which says nothing about the page`,
    };
  }
  if (status >= 500) {
    return { kind: "unreachable", reason: `HTTP ${status} — server error, try again later` };
  }
  if (status < 200 || status >= 300) {
    return { kind: "gone", status, reason: `HTTP ${status}` };
  }

  if (contentType.includes("application/pdf")) {
    // Honest about the limit rather than silently scoring a PDF as unreadable
    // HTML: the file may be perfectly fine, this check just cannot read it.
    return {
      kind: "opaque",
      status,
      finalUrl,
      reason: "PDF source — this check does not extract PDF text",
    };
  }

  const text = visibleText(body);
  const lower = text.toLowerCase();

  // A wordy interstitial can clear the length threshold, so the human-readable
  // markers are checked before the length.
  const marker = CHALLENGE_TEXT_MARKERS.find((m) => lower.includes(m));
  if (marker) {
    return {
      kind: "opaque",
      status,
      finalUrl,
      reason: `HTTP ${status} but the page is an interstitial ("${marker}")`,
    };
  }

  if (text.length >= MIN_READABLE_CHARS) {
    return { kind: "ok", status, finalUrl, text };
  }

  // Unreadable. The infrastructure markers are consulted only NOW, to name the
  // reason — never to overrule a page that read fine. Stats NZ serves 115 KB of
  // genuine HTML through Incapsula, so its `_Incapsula_Resource` script tag is
  // present on a good response too; treating that marker as proof of a challenge
  // labelled a real page a bot wall on the first run. A marker is a clue about
  // WHY a page came back empty, not evidence that it did.
  const wall = CHALLENGE_BODY_MARKERS.find(([needle]) => body.includes(needle));
  return {
    kind: "opaque",
    status,
    finalUrl,
    reason:
      `HTTP ${status} but only ${text.length} characters of visible text ` +
      `(threshold ${MIN_READABLE_CHARS}) — JS-rendered or a bot challenge` +
      (wall ? `; served behind ${wall[1]}` : ""),
  };
}

/** Fetches one URL and classifies it. Never throws. */
export async function fetchPage(url: string): Promise<PageOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-NZ,en;q=0.9",
      },
    });
    const contentType = response.headers.get("content-type") ?? "";
    // A PDF body is binary; reading it as text is harmless because
    // `classifyResponse` short-circuits on the content type before looking.
    const body = contentType.includes("application/pdf") ? "" : await response.text();
    return classifyResponse({
      status: response.status,
      finalUrl: response.url || url,
      contentType,
      body,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // A thrown fetch is NOT proof the URL is dead — DNS hiccups, TLS quirks and
    // our own 20s budget all land here. Unreachable, never gone.
    return {
      kind: "unreachable",
      reason: message.includes("abort")
        ? `no response within ${FETCH_TIMEOUT_MS / 1000}s`
        : `network error: ${message}`,
    };
  } finally {
    clearTimeout(timer);
  }
}

// --- Per-fact judgement ------------------------------------------------------

export type Verdict = "ok" | "fail" | "unchecked" | "n/a";

export interface FactReport {
  id: string;
  sourceLabel: string;
  sourceUrl: string;
  url: { verdict: Verdict; detail: string };
  numbers: { verdict: Verdict; tokens: string[]; missing: string[]; detail: string };
  review: ReviewStatus & { verdict: "ok" | "overdue" | "n/a"; detail: string };
  /** The worst of the three, for grouping. */
  overall: "OK" | "OVERDUE" | "UNCHECKED" | "FAIL";
}

/**
 * The minimum token length policed, matching `assertNumbersVerbatim`'s default.
 * Single digits ("1 in 5") are ordinary English and too noisy to check.
 */
const MIN_TOKEN_LEN = 2;

/**
 * Normalises a fetched page before the numbers are looked for in it.
 *
 * `assertNumbersVerbatim` was written to compare model output against the SAME
 * source text the model was shown, where the surface form of a number is
 * necessarily identical. Here the two sides come from different authors years
 * apart, and the first live run produced a false failure because of exactly
 * that: the Auckland Unlimited article says "59 per cent ($6.8 billion)" where
 * the fact says "59%". The figure is present — the percent sign is spelled out.
 *
 * A false failure is worse than no check, because it is the thing that teaches
 * an operator to skim past red. So the SOURCE side is normalised: house-style
 * variants of the percent sign are folded, and the non-breaking and thin spaces
 * that publishers put inside numbers become ordinary ones. Nothing on the FACT
 * side is touched, and nothing here can make a number match a page that does not
 * contain it — every rewrite maps a spelling of the same quantity onto another.
 *
 * A known limit this does NOT fix, recorded so nobody mistakes it for rigour:
 * the match is a substring, so "50" is satisfied by "3500" appearing anywhere on
 * the page. That is inherited from the one shared implementation of the rule and
 * is not worth forking it over — read a pass as "nothing contradicts this",
 * not as proof.
 */
export function numberSearchCorpus(text: string): string {
  return text
    .replace(/[    ]/g, " ")
    .replace(/(\d)\s*(?:per\s*cent|percent|pct)\b/gi, "$1%");
}

/**
 * Judges one fact against one already-fetched page. Pure, so the tests can feed
 * it the pages that are hard to produce on demand.
 */
export function checkFact(fact: NzTechFact, page: PageOutcome, today: Date): FactReport {
  const review = reviewStatus(fact, today);
  const tokens = [...new Set(extractNumberTokens(fact.text).filter((t) => t.length >= MIN_TOKEN_LEN))];

  const url: FactReport["url"] =
    page.kind === "ok"
      ? {
          verdict: "ok",
          detail:
            page.finalUrl !== fact.sourceUrl
              ? `HTTP ${page.status}, redirected to ${page.finalUrl}`
              : `HTTP ${page.status}`,
        }
      : page.kind === "gone"
        ? { verdict: "fail", detail: page.reason }
        : page.kind === "opaque"
          ? // The URL DID resolve — 200 with an unreadable body still proves the
            // page exists. Only the number check is blinded by it.
            { verdict: "ok", detail: `HTTP ${page.status} (body unreadable)` }
          : { verdict: "unchecked", detail: page.reason };

  let numbers: FactReport["numbers"];
  if (tokens.length === 0) {
    numbers = {
      verdict: "n/a",
      tokens,
      missing: [],
      detail: "no numbers in this fact to verify",
    };
  } else if (page.kind !== "ok") {
    numbers = {
      verdict: "unchecked",
      tokens,
      missing: [],
      detail: `${tokens.join(", ")} — ${page.kind === "gone" ? "source gone" : page.reason}`,
    };
  } else {
    const result = assertNumbersVerbatim(fact.text, numberSearchCorpus(page.text), {
      minLen: MIN_TOKEN_LEN,
    });
    numbers = result.ok
      ? { verdict: "ok", tokens, missing: [], detail: `${tokens.join(", ")} verbatim in source` }
      : {
          verdict: "fail",
          tokens,
          missing: result.offending,
          detail: `${result.offending.join(", ")} NOT found in the fetched page`,
        };
  }

  const reviewVerdict = review.dueOn === null ? "n/a" : review.overdue ? "overdue" : "ok";
  const reviewDetail =
    review.dueOn === null
      ? `no refresh path — never due (last read ${review.verifiedAt})`
      : review.overdue
        ? `${review.daysOverdue} day(s) overdue — ${review.refresh} source, last read ${review.verifiedAt}, due ${review.dueOn}`
        : `due ${review.dueOn} (in ${-(review.daysOverdue ?? 0)} days) — ${review.refresh} source`;

  const overall: FactReport["overall"] =
    url.verdict === "fail" || numbers.verdict === "fail"
      ? "FAIL"
      : url.verdict === "unchecked" || numbers.verdict === "unchecked"
        ? "UNCHECKED"
        : reviewVerdict === "overdue"
          ? "OVERDUE"
          : "OK";

  return {
    id: fact.id,
    sourceLabel: fact.sourceLabel,
    sourceUrl: fact.sourceUrl,
    url,
    numbers,
    review: { ...review, verdict: reviewVerdict, detail: reviewDetail },
    overall,
  };
}

// --- Runner ------------------------------------------------------------------

/**
 * Fetches every DISTINCT source URL once and judges all facts against the
 * result. Three URLs back two facts each; hitting them twice would be rude to
 * the publisher and could produce two different answers for one page.
 */
export async function checkAllFacts(
  facts: readonly NzTechFact[],
  today: Date
): Promise<FactReport[]> {
  const pages = new Map<string, PageOutcome>();
  for (const url of new Set(facts.map((f) => f.sourceUrl))) {
    pages.set(url, await fetchPage(url));
  }
  return facts.map((fact) => checkFact(fact, pages.get(fact.sourceUrl)!, today));
}

const BADGE: Record<FactReport["overall"], string> = {
  OK: "OK       ",
  OVERDUE: "OVERDUE  ",
  UNCHECKED: "UNCHECKED",
  FAIL: "FAIL     ",
};

function printReport(reports: FactReport[], today: Date): void {
  const pad = Math.max(...reports.map((r) => r.id.length));

  console.log(`\nEvergreen fact pool — health check`);
  console.log(`${reports.length} facts, ${new Set(reports.map((r) => r.sourceUrl)).size} distinct sources, ${toIsoDay(today)}\n`);

  for (const r of reports) {
    console.log(`  ${BADGE[r.overall]}  ${r.id.padEnd(pad)}  ${r.sourceLabel}`);
  }

  const section = (title: string, rows: FactReport[], line: (r: FactReport) => string) => {
    if (rows.length === 0) return;
    console.log(`\n${title}`);
    for (const r of rows) console.log(`  ${r.id}\n    ${line(r)}\n    ${r.sourceUrl}`);
  };

  // Review first: it does not affect the exit code, so the display has to carry
  // the weight instead.
  section(
    "REVIEW DUE — a human must re-read the source before this ships",
    reports.filter((r) => r.review.verdict === "overdue"),
    (r) => r.review.detail
  );
  section(
    "FAILED — unciteable as it stands",
    reports.filter((r) => r.overall === "FAIL"),
    (r) => (r.url.verdict === "fail" ? r.url.detail : r.numbers.detail)
  );
  section(
    "COULD NOT BE CHECKED — no conclusion either way, NOT a failure",
    reports.filter((r) => r.overall === "UNCHECKED"),
    (r) => (r.url.verdict === "unchecked" ? r.url.detail : r.numbers.detail)
  );

  const count = (v: FactReport["overall"]) => reports.filter((r) => r.overall === v).length;
  const overdue = reports.filter((r) => r.review.verdict === "overdue").length;
  console.log(
    `\nSummary: ${count("OK")} ok · ${overdue} review due · ` +
      `${count("UNCHECKED")} could not be checked · ${count("FAIL")} failed`
  );
  if (count("FAIL") === 0) {
    console.log(
      "Exit 0. Only a dead URL or a contradicted number fails this check — " +
        "review-due and could-not-check are reported, not blocked."
    );
  }
  console.log("");
}

async function main(): Promise<void> {
  const asJson = process.argv.includes("--json");
  const today = new Date();
  const reports = await checkAllFacts(NZ_TECH_FACTS, today);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          checkedAt: today.toISOString(),
          facts: reports,
          summary: {
            total: reports.length,
            ok: reports.filter((r) => r.overall === "OK").length,
            overdue: reports.filter((r) => r.review.verdict === "overdue").length,
            unchecked: reports.filter((r) => r.overall === "UNCHECKED").length,
            failed: reports.filter((r) => r.overall === "FAIL").length,
          },
        },
        null,
        2
      )
    );
  } else {
    printReport(reports, today);
  }

  process.exitCode = reports.some((r) => r.overall === "FAIL") ? 1 : 0;
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === path.resolve(fileURLToPath(import.meta.url))) {
  void main();
}
