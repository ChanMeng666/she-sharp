/**
 * Tests for the evergreen fact-pool health check.
 *
 * No network, ever. The point of this file is the JUDGEMENT — when a page counts
 * as unreadable, when a fact falls due, and above all that "could not check" and
 * "failed" stay two different answers. Every one of those is decidable from a
 * fixed input, and a test that reached the real Stats NZ page would fail on a
 * Tuesday for reasons that have nothing to do with the code.
 *
 * The one exception is the last block, which asserts against the REAL pool. That
 * is a data test, not a network test, and it is the one that stops the next fact
 * being added without a review date — the exact omission that let a false pay-gap
 * figure sit in live rotation for a year.
 *
 * Run: npx tsx scripts/newsletter/check-facts.test.ts
 */

import assert from "node:assert";

import { NZ_TECH_FACTS, type NzTechFact } from "../../lib/data/nz-tech-facts";
import {
  REVIEW_INTERVAL_DAYS,
  checkFact,
  classifyResponse,
  numberSearchCorpus,
  reviewStatus,
  toIsoDay,
  visibleText,
  type PageOutcome,
} from "./check-facts";

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

const TODAY = new Date("2026-08-30T09:00:00Z");

/** A fact with only the fields the check reads; the rest is scaffolding. */
function fixture(over: Partial<NzTechFact> = {}): NzTechFact {
  return {
    id: "fixture",
    text: "Some measured thing is 42% of the total.",
    sourceLabel: "Fixture Source",
    sourceUrl: "https://example.test/page",
    verifiedAt: "2026-01-01",
    refresh: "annual",
    ...over,
  };
}

/** A readable page carrying whatever text the test wants checked against. */
function okPage(text: string): PageOutcome {
  return { kind: "ok", status: 200, finalUrl: "https://example.test/page", text };
}

// --- 1. The overdue calculation, per cadence ---------------------------------

check("a quarterly fact falls due 92 days after it was last read", () => {
  const onTime = reviewStatus(fixture({ refresh: "quarterly", verifiedAt: "2026-08-29" }), TODAY);
  assert.equal(onTime.dueOn, "2026-11-29");
  assert.equal(onTime.overdue, false);
  assert.equal(onTime.daysOverdue, -91);

  // One day past due is overdue; the day it falls due counts as due.
  const due = reviewStatus(fixture({ refresh: "quarterly", verifiedAt: "2026-05-30" }), TODAY);
  assert.equal(due.dueOn, "2026-08-30");
  assert.equal(due.overdue, true);
  assert.equal(due.daysOverdue, 0);
});

check("an annual fact falls due 366 days after it was last read", () => {
  const status = reviewStatus(fixture({ refresh: "annual", verifiedAt: "2026-07-01" }), TODAY);
  assert.equal(status.dueOn, "2027-07-02");
  assert.equal(status.overdue, false);

  const stale = reviewStatus(fixture({ refresh: "annual", verifiedAt: "2025-01-01" }), TODAY);
  assert.equal(stale.overdue, true);
  assert.ok(stale.daysOverdue !== null && stale.daysOverdue > 200);
});

check("a multi-year fact falls due three years after it was last read", () => {
  const status = reviewStatus(fixture({ refresh: "multi-year", verifiedAt: "2026-07-01" }), TODAY);
  assert.equal(status.dueOn?.slice(0, 4), "2029");
  assert.equal(status.overdue, false);
});

check('a "none" fact is NEVER overdue, however old', () => {
  // The load-bearing case. Nothing publishes an update to these, so a flag on
  // them could never be cleared — and a permanently red row is how a pre-send
  // check stops being run. It still gets its URL and numbers checked.
  const ancient = reviewStatus(fixture({ refresh: "none", verifiedAt: "2014-01-01" }), TODAY);
  assert.equal(ancient.overdue, false);
  assert.equal(ancient.dueOn, null);
  assert.equal(ancient.daysOverdue, null);
  assert.equal(REVIEW_INTERVAL_DAYS.none, null);

  const report = checkFact(
    fixture({ refresh: "none", verifiedAt: "2014-01-01" }),
    okPage("a".repeat(500) + " 42% "),
    TODAY
  );
  assert.equal(report.review.verdict, "n/a");
  assert.equal(report.overall, "OK");
  // ...but the numbers were still checked, not skipped.
  assert.equal(report.numbers.verdict, "ok");
});

check("verifiedAt must be a real ISO day", () => {
  assert.throws(() => reviewStatus(fixture({ verifiedAt: "July 2026" }), TODAY), /YYYY-MM-DD/);
  assert.throws(() => reviewStatus(fixture({ verifiedAt: "2026-13-01" }), TODAY), /YYYY-MM-DD/);
});

// --- 2. Numbers that are not in the source -----------------------------------

check("a fact whose number is missing from a readable source FAILS", () => {
  // This is the pay-gap incident in miniature: the page now says 5.3%, the fact
  // still says 5.2%. The page is readable, so the disagreement is real evidence.
  const fact = fixture({
    text: "New Zealand's gender pay gap was 5.2% in the June 2026 quarter.",
  });
  const page = okPage(
    "Labour market statistics: the gender pay gap was 5.3% in the June 2026 quarter. " +
      "x".repeat(500)
  );
  const report = checkFact(fact, page, TODAY);
  assert.equal(report.overall, "FAIL");
  assert.equal(report.numbers.verdict, "fail");
  // Only the pay-gap figure is offending; "2026" is in the page, so the report
  // names the number that actually disagrees rather than the whole sentence.
  assert.deepEqual(report.numbers.missing, ["5.2%"]);
  // The URL itself was fine — the failure is attributed to the number, not the page.
  assert.equal(report.url.verdict, "ok");
});

check("a fact carrying no number reports n/a rather than a pass it did not earn", () => {
  const fact = fixture({ text: "Women remain under-represented in engineering and physics." });
  const report = checkFact(fact, okPage("y".repeat(600)), TODAY);
  assert.equal(report.numbers.verdict, "n/a");
  assert.equal(report.overall, "OK");
});

check("single digits are not policed, so '1 in 20' checks only the 20", () => {
  const fact = fixture({ text: "Fewer than 1 in 20 girls, versus 1 in 5 boys." });
  const report = checkFact(fact, okPage("z".repeat(500) + " 20 per cent "), TODAY);
  assert.deepEqual(report.numbers.tokens, ["20"]);
  assert.equal(report.numbers.verdict, "ok");
});

// --- 3. Unreadable and unreachable pages -------------------------------------

check("a 200 with no readable text is UNCHECKED, not FAIL", () => {
  // Stats NZ's own pages render a few dozen visible characters and fill in
  // client-side. Nothing was confirmed; nothing was refuted either.
  const page = classifyResponse({
    status: 200,
    finalUrl: "https://www.stats.govt.nz/x",
    contentType: "text/html",
    body: "<html><body><div id='root'></div></body></html>",
  });
  assert.equal(page.kind, "opaque");

  const report = checkFact(fixture(), page, TODAY);
  assert.equal(report.overall, "UNCHECKED");
  assert.notEqual(report.overall, "FAIL");
  assert.equal(report.numbers.verdict, "unchecked");
  // A 200 still proves the URL resolves, so check 1 passes on its own terms.
  assert.equal(report.url.verdict, "ok");
});

check("a script-only bot challenge is UNCHECKED even when the byte count is large", () => {
  // MBIE answers 200 with a JS challenge. Measuring raw bytes would score this
  // as a substantial page, which is why the text is extracted first.
  const body = `<html><body><script>${"var a=1;".repeat(400)}</script></body></html>`;
  assert.ok(body.length > 2000);
  assert.equal(visibleText(body).length, 0);
  const page = classifyResponse({
    status: 200,
    finalUrl: "https://www.mbie.govt.nz/x",
    contentType: "text/html",
    body,
  });
  assert.equal(page.kind, "opaque");
});

check("a Cloudflare 403 is UNCHECKED — a bot wall says nothing about the page", () => {
  const page = classifyResponse({
    status: 403,
    finalUrl: "https://www.educationcounts.govt.nz/x",
    contentType: "text/html",
    body: "<html><body>Attention Required!</body></html>",
  });
  assert.equal(page.kind, "unreachable");
  const report = checkFact(fixture(), page, TODAY);
  assert.equal(report.overall, "UNCHECKED");
  assert.equal(report.url.verdict, "unchecked");
});

check("a 404 IS a failure — the server said the page is gone", () => {
  const page = classifyResponse({
    status: 404,
    finalUrl: "https://example.test/page",
    contentType: "text/html",
    body: "<html><body>Not found</body></html>",
  });
  assert.equal(page.kind, "gone");
  const report = checkFact(fixture(), page, TODAY);
  assert.equal(report.overall, "FAIL");
  assert.equal(report.url.verdict, "fail");
});

check("a 5xx is UNCHECKED, not a dead source", () => {
  const page = classifyResponse({
    status: 503,
    finalUrl: "https://example.test/page",
    contentType: "text/html",
    body: "",
  });
  assert.equal(page.kind, "unreachable");
});

check("a named bot wall is reported by name, not as an empty page", () => {
  // MBIE's `.pdf` URL answers 200 with `Content-Type: text/html` and an 851-byte
  // Incapsula iframe. The marker lives in an attribute, which `visibleText`
  // strips, so the raw body has to be searched too — "Incapsula bot challenge"
  // is a reason an operator can act on; "0 characters" is not.
  const page = classifyResponse({
    status: 200,
    finalUrl: "https://www.mbie.govt.nz/assets/plan.pdf",
    contentType: "text/html",
    body: '<html><body><iframe src="/_Incapsula_Resource?SWUDNSAI=31"></iframe></body></html>',
  });
  assert.equal(page.kind, "opaque");
  assert.ok(page.kind === "opaque" && /Incapsula/.test(page.reason), page.kind);
});

check("a bot-wall marker never overrules a page that read perfectly well", () => {
  // Stats NZ serves 115 KB of genuine HTML through Incapsula, so the marker is
  // in the body of a GOOD response too. Reading it as proof of a challenge would
  // condemn every page behind that CDN.
  const page = classifyResponse({
    status: 200,
    finalUrl: "https://example.test/page",
    contentType: "text/html",
    body:
      '<html><body><script src="/_Incapsula_Resource?x=1"></script>' +
      `<p>${"real article text ".repeat(60)}</p></body></html>`,
  });
  assert.equal(page.kind, "ok");
});

check('"59 per cent" in a source satisfies a fact that says "59%"', () => {
  // The first live run failed this fact. The Auckland Unlimited article spells
  // the percent sign out; the figure is present and the fact is correct. A false
  // failure is what teaches an operator to skim past red, so the SOURCE side is
  // normalised — never the fact side.
  assert.equal(numberSearchCorpus("59 per cent ($6.8 billion)"), "59% ($6.8 billion)");
  assert.equal(numberSearchCorpus("29 percent"), "29%");
  assert.equal(numberSearchCorpus("68 000 workers"), "68 000 workers");

  const fact = fixture({ text: "Auckland accounts for 59% ($6.8 billion) of TIN200 exports." });
  const page = okPage(
    "Auckland is accounting for 59 per cent ($6.8 billion) of total TIN200 exports. " +
      "w".repeat(500)
  );
  assert.equal(checkFact(fact, page, TODAY).overall, "OK");
});

check("normalising the source cannot invent a number that is not there", () => {
  const fact = fixture({ text: "The figure is 61%." });
  const page = okPage("The figure is 59 per cent. " + "w".repeat(500));
  const report = checkFact(fact, page, TODAY);
  assert.equal(report.overall, "FAIL");
  assert.deepEqual(report.numbers.missing, ["61%"]);
});

check("today is the operator's calendar day, not the UTC one", () => {
  // NZ runs 12–13 hours ahead of UTC, so for half of every local day
  // `toISOString()` names yesterday. The first live run printed 2026-08-29 on
  // the morning of the 30th; a fact would have read as in-date for a day after
  // it fell due.
  const localNoon = new Date(2026, 7, 30, 12, 0, 0);
  assert.equal(toIsoDay(localNoon), "2026-08-30");
  const localEarly = new Date(2026, 7, 30, 0, 30, 0);
  assert.equal(toIsoDay(localEarly), "2026-08-30");
});

check("a PDF is UNCHECKED with the reason, not silently scored as empty", () => {
  const page = classifyResponse({
    status: 200,
    finalUrl: "https://www.mbie.govt.nz/assets/plan.pdf",
    contentType: "application/pdf",
    body: "",
  });
  assert.equal(page.kind, "opaque");
  assert.ok(page.kind === "opaque" && /PDF/.test(page.reason));
});

check("an unreadable page never masks an overdue review", () => {
  // Both facts are true at once, and the operator needs to see both: the source
  // could not be read AND a human owes it a look.
  const report = checkFact(
    fixture({ refresh: "quarterly", verifiedAt: "2025-01-01" }),
    { kind: "unreachable", reason: "no response within 20s" },
    TODAY
  );
  assert.equal(report.overall, "UNCHECKED");
  assert.equal(report.review.verdict, "overdue");
});

// --- 4. The real pool --------------------------------------------------------

check("every fact in the live pool carries verifiedAt and refresh", () => {
  assert.ok(NZ_TECH_FACTS.length > 0, "the pool is empty");
  const today = new Date();
  for (const fact of NZ_TECH_FACTS) {
    // `reviewStatus` throws on a malformed date, which is the shape check.
    const status = reviewStatus(fact, today);
    assert.ok(
      Object.keys(REVIEW_INTERVAL_DAYS).includes(fact.refresh),
      `${fact.id}: unknown refresh cadence "${fact.refresh}"`
    );
    assert.ok(
      Date.parse(`${fact.verifiedAt}T00:00:00Z`) <= today.getTime(),
      `${fact.id}: verifiedAt ${fact.verifiedAt} is in the future — nobody checked it yet`
    );
    assert.equal(status.refresh, fact.refresh);
  }
});

check("every fact has a distinct id and an https source", () => {
  const ids = new Set<string>();
  for (const fact of NZ_TECH_FACTS) {
    assert.ok(!ids.has(fact.id), `duplicate fact id ${fact.id}`);
    ids.add(fact.id);
    assert.ok(
      fact.sourceUrl.startsWith("https://"),
      `${fact.id}: sourceUrl must be https so the check can fetch it`
    );
  }
});

console.log(`\n${passed} checks passed.`);
