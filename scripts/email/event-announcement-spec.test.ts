/**
 * Checks for the campaign stages in `event-announcement-spec.ts`.
 *
 * Run: `npx tsx scripts/email/event-announcement-spec.test.ts`
 *
 * CLAUDE.md's rule shapes this file: a guard is not verified until you have
 * broken the thing it guards. The stage window is a new refusal in front of an
 * un-recallable send, so the assertions that matter are the ones that hand it
 * the input it must refuse — a last call three weeks out, a save-the-date the
 * day before — and only then the ones that let a legitimate stage through.
 *
 * The ledger key is checked here too because it is the thing that makes
 * `broadcast-ledger.ts check` able to tell one campaign stage from another. If
 * two stages ever collided on one key, the ledger's `no-op` verdict would stop
 * the SECOND STAGE of a campaign, reading as "already sent" for a message
 * nobody has seen.
 */

import assert from "node:assert";

import {
  assessStageWindow,
  DEFAULT_STAGE,
  parseStageName,
  STAGE_ORDER,
  STAGES,
  stageKey,
  type StageName,
} from "./event-announcement-spec";

let failures = 0;

/** Runs one named check, printing `ok - …` or the failure. */
function test(name: string, body: () => void): void {
  try {
    body();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ---------------------------------------------------------------------------
// The window guard — break it first
// ---------------------------------------------------------------------------

test("a last call three weeks out is refused", () => {
  const verdict = assessStageWindow("last-call", 21);
  assert.strictEqual(verdict.ok, false);
  assert.strictEqual(verdict.problem, "too-early");
  assert.strictEqual(verdict.suggestion, "save-the-date");
  assert.ok(verdict.lines.join("\n").includes("save-the-date"), "must name the fix");
});

test("a save-the-date the day before is refused", () => {
  const verdict = assessStageWindow("save-the-date", 1);
  assert.strictEqual(verdict.ok, false);
  assert.strictEqual(verdict.problem, "too-late");
  assert.strictEqual(verdict.suggestion, "last-call");
});

test("a save-the-date on the day itself is refused", () => {
  assert.strictEqual(assessStageWindow("save-the-date", 0).ok, false);
});

test("the line-up is refused both too early and too late", () => {
  assert.strictEqual(assessStageWindow("line-up", 90).problem, "too-early");
  assert.strictEqual(assessStageWindow("line-up", 2).problem, "too-late");
});

test("every stage refuses at least one distance, so none is a no-op gate", () => {
  for (const stage of STAGE_ORDER) {
    const refusals = [0, 1, 3, 7, 12, 20, 30, 60, 200].filter(
      (days) => !assessStageWindow(stage, days).ok
    );
    assert.ok(refusals.length > 0, `${stage} never refuses anything`);
  }
});

// ---------------------------------------------------------------------------
// …and let the right ones through
// ---------------------------------------------------------------------------

test("each stage is allowed somewhere in the campaign", () => {
  assert.strictEqual(assessStageWindow("save-the-date", 42).ok, true);
  assert.strictEqual(assessStageWindow("save-the-date", 200).ok, true);
  assert.strictEqual(assessStageWindow("line-up", 21).ok, true);
  assert.strictEqual(assessStageWindow("last-call", 4).ok, true);
  assert.strictEqual(assessStageWindow("last-call", 0).ok, true);
});

test("the boundaries themselves are inclusive on both sides", () => {
  assert.strictEqual(assessStageWindow("save-the-date", 14).ok, true, "min is inclusive");
  assert.strictEqual(assessStageWindow("save-the-date", 13).ok, false);
  assert.strictEqual(assessStageWindow("line-up", 42).ok, true, "max is inclusive");
  assert.strictEqual(assessStageWindow("line-up", 43).ok, false);
  assert.strictEqual(assessStageWindow("line-up", 5).ok, true);
  assert.strictEqual(assessStageWindow("line-up", 4).ok, false);
  assert.strictEqual(assessStageWindow("last-call", 10).ok, true);
  assert.strictEqual(assessStageWindow("last-call", 11).ok, false);
});

test("the three windows leave no gap — some stage fits every future day", () => {
  for (let days = 0; days <= 400; days += 1) {
    const fitting = STAGE_ORDER.filter((stage) => assessStageWindow(stage, days).ok);
    assert.ok(fitting.length > 0, `no stage fits ${days} days out`);
  }
});

test("a past event is left to the EXIT_PAST refusal, not double-refused here", () => {
  // Two refusals for one mistake teaches nobody which rule they broke, so this
  // guard deliberately says nothing about an event that has already happened.
  assert.strictEqual(assessStageWindow("save-the-date", -1).ok, true);
  assert.strictEqual(assessStageWindow("last-call", -30).ok, true);
});

// ---------------------------------------------------------------------------
// Ledger keys
// ---------------------------------------------------------------------------

test("every stage of one event gets its own ledger key", () => {
  const keys = STAGE_ORDER.map((stage) => stageKey("code-secure-2026", stage));
  assert.strictEqual(new Set(keys).size, keys.length, "stage keys must not collide");
  for (const key of keys) assert.match(key, /^announce-code-secure-2026-/);
});

test("two events never collide on a key, even when one slug prefixes the other", () => {
  // `her-waka` is a proper prefix of `her-waka-april-2026`; five other slug
  // pairs in this repo collide the same way.
  const a = STAGE_ORDER.map((stage) => stageKey("her-waka", stage));
  const b = STAGE_ORDER.map((stage) => stageKey("her-waka-april-2026", stage));
  assert.strictEqual(new Set([...a, ...b]).size, a.length + b.length);
});

test("a key is safe to use as a filename and a ledger key", () => {
  const key = stageKey("Event: Les Mills / 03 September 2026!", "save-the-date");
  assert.match(key, /^[a-z0-9-]+$/, "no separators, no case, no punctuation");
  assert.ok(!key.startsWith("-") && !key.endsWith("-"));
});

// ---------------------------------------------------------------------------
// The stage table itself
// ---------------------------------------------------------------------------

test("--stage takes exactly the three names, and nothing else", () => {
  for (const stage of STAGE_ORDER) {
    assert.strictEqual(parseStageName(stage), stage);
    assert.strictEqual(parseStageName(stage.toUpperCase()), stage);
    assert.strictEqual(parseStageName(`  ${stage} `), stage);
  }
  for (const bad of ["countdown", "announce", "", "line up", "reminder"]) {
    assert.strictEqual(parseStageName(bad), null, `"${bad}" must not resolve`);
  }
});

test("the default stage is the one the SOP already describes", () => {
  assert.strictEqual(DEFAULT_STAGE, "line-up");
  assert.ok(STAGE_ORDER.includes(DEFAULT_STAGE));
});

test("no two stages produce the same subject and preheader shape", () => {
  // The whole point of stages is that a subscriber receives three MESSAGES, not
  // one message three times. Identical framing would defeat that silently.
  const facts = {
    when: "Thursday 8 October 2026, 5:00pm – 8:00pm NZDT",
    dayOnly: "Thursday 8 October 2026",
    place: "Xero Office",
    weekday: "Thursday",
    daysUntil: 4,
  };
  const framings = STAGE_ORDER.map((stage) => {
    const spec = STAGES[stage];
    return `${spec.subjectPrefix}||${spec.preheader(facts) ?? ""}`;
  });
  assert.strictEqual(
    new Set(framings).size,
    framings.length,
    `two stages frame the message identically: ${framings.join("  /  ")}`
  );
});

test("each stage differs from the others in what it carries, not just in wording", () => {
  const shapes = STAGE_ORDER.map((stage) => {
    const spec = STAGES[stage];
    return [
      spec.ctaTarget,
      spec.includeSpeakers,
      spec.includeDescription,
      spec.detailsFirst,
    ].join("|");
  });
  assert.strictEqual(new Set(shapes).size, shapes.length, "two stages build the same email");
});

test("a stage's subject prefix always leaves room for a real title", () => {
  const SUBJECT_MAX = 50;
  for (const stage of STAGE_ORDER) {
    const budget = SUBJECT_MAX - STAGES[stage].subjectPrefix.length;
    assert.ok(budget >= 30, `"${stage}" leaves only ${budget} chars for the title`);
  }
});

test("only the save-the-date withholds the registration link", () => {
  const pointingAtThePage = STAGE_ORDER.filter(
    (stage: StageName) => STAGES[stage].ctaTarget === "event-page"
  );
  assert.deepStrictEqual(pointingAtThePage, ["save-the-date"]);
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll event-announcement stage checks passed.");
