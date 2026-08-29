/**
 * Runnable checks for the NZ Tech Pulse house style.
 * No live network and no OpenAI calls are made.
 * Run with: `npx tsx lib/newsletter/pulse-copy.test.ts`
 *
 * The most important checks in this file are the two at the top of section 1.
 * They are a REGRESSION against measured behaviour, not a hypothesis: running
 * the generator three times against August 2026 produced two bites whose titles
 * were the publisher's own headline, character for character. If either of
 * those ever passes again, this module has stopped doing the one job it was
 * built for.
 *
 * The second most important is section 8, which asserts that the approved
 * issues — the copy every rule here was DERIVED from — still pass. A style rule
 * that fails the copy it was derived from is a rule that gets turned off.
 */

import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  checkBiteSummary,
  hollowClosers,
  checkBiteTitle,
  checkHeroStat,
  checkNewsBite,
  checkNewsBiteSet,
  countSentences,
  countWords,
  describeIssuesForModel,
  hasCopyErrors,
  headlineSimilarity,
  lintPulseCopy,
  PULSE_COPY_LIMITS,
  PULSE_HOUSE_STYLE_RULES,
  sourceTitleFromUrl,
  styleTokens,
  type PulseCopyIssue,
} from "./pulse-copy";

// --- The two real failures, verbatim ----------------------------------------
//
// Copied from the founder's three-run comparison of the August 2026 generator.
// Source title and bite title are identical strings on purpose; do not "tidy"
// the punctuation, the quote marks and the "+" are part of what has to be
// caught.

const COPIED_SHADOWTECH =
  "ShadowTech26 opens the door to tech careers for 1,500+ girls across Aotearoa";
const COPIED_UNDERREPRESENTED =
  "Women 'remain underrepresented' in AI roles despite jobs boom";

/** The one headline the generator did write itself, in its two observed forms. */
const SEEK_ATTRIBUTED = "Job ads fell 0.8% in July, SEEK report shows";
const SEEK_PLAIN = "Job ads fell 0.8% in July as hiring slows";

/**
 * The three hand-written 2026-07 summaries, verbatim.
 *
 * They are the quality bar the house style was derived from, so any new rule
 * has to leave them alone. Held as literals rather than read from the fixture:
 * a rule must be checked against the copy as it was when the rule was written,
 * and a future edit to that issue should not silently redefine the standard.
 */
const GOLD_STANDARD_SUMMARIES: readonly string[] = [
  "Tech job ads are up 9.9% on a year ago and Auckland is up 5.0%, while ads nationally rose just 0.2% in June. Tech is growing faster than the market around it.",
  "Telco One NZ surveyed 1,001 people: 45% are worried about the environmental impact of businesses using AI, rising to 63% among 18 to 24 year olds. Electricity use topped the list at 66%.",
  "Norton surveyed 1,000 New Zealand adults with children under 18. 44% weren't confident their child could tell AI-generated content from the real thing, and 37% doubted their child knew AI can be wrong. That gap is what schools outreach exists to close.",
];

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");

function readIssuePulse(id: string) {
  const raw = JSON.parse(readFileSync(join(ISSUE_DIR, `${id}.json`), "utf8")) as {
    editorial?: {
      pulse?: {
        heroStat?: { label: string; context: string } | null;
        newsBites?: { title: string; summary: string; url: string; sourceLabel?: string }[] | null;
      } | null;
    };
  };
  return raw.editorial?.pulse ?? null;
}

function rules(issues: readonly PulseCopyIssue[]): string[] {
  return issues.map((entry) => entry.rule);
}

function errorsOnly(issues: readonly PulseCopyIssue[]): PulseCopyIssue[] {
  return issues.filter((entry) => entry.severity === "error");
}

let passed = 0;
function check(label: string, fn: () => void): void {
  fn();
  passed++;
  console.log(`  ok - ${label}`);
}

function main(): void {
  // 1. The regression: a copied headline is rejected.
  console.log("1. Copied headlines (the regression this module exists for):");

  check("the ShadowTech26 headline copied verbatim is rejected", () => {
    const issues = checkBiteTitle(COPIED_SHADOWTECH, {
      index: 0,
      sourceTitle: COPIED_SHADOWTECH,
    });
    assert.ok(
      rules(issues).includes("title-copies-source"),
      `expected title-copies-source, got: ${rules(issues).join(", ") || "(nothing)"}`,
    );
    assert.ok(hasCopyErrors(issues), "and it must be an error, not an advisory");
  });

  check("the 'Women remain underrepresented' headline copied verbatim is rejected", () => {
    const issues = checkBiteTitle(COPIED_UNDERREPRESENTED, {
      index: 0,
      sourceTitle: COPIED_UNDERREPRESENTED,
    });
    assert.ok(rules(issues).includes("title-copies-source"), "copy rule fires");
    // It also carries the publisher's quote marks, which is its own tell.
    assert.ok(rules(issues).includes("title-quote-marks"), "lifted quote marks fire too");
  });

  check("both are still caught through the URL-slug proxy, with no fetched title", () => {
    const shadow = checkBiteTitle(COPIED_SHADOWTECH, {
      index: 0,
      sourceTitle: sourceTitleFromUrl(
        "https://techwomen.nz/2026/08/05/shadowtech26-opens-the-door-to-tech-careers-for-1500-girls-across-aotearoa/",
      ),
      sourceTitleOrigin: "url-slug",
    });
    assert.ok(rules(shadow).includes("title-copies-source"), "slug proxy catches ShadowTech26");

    const women = checkBiteTitle(COPIED_UNDERREPRESENTED, {
      index: 0,
      sourceTitle: sourceTitleFromUrl(
        "https://www.hcamag.com/nz/news/general/women-remain-underrepresented-in-ai-roles-despite-jobs-boom/586604",
      ),
      sourceTitleOrigin: "url-slug",
    });
    assert.ok(rules(women).includes("title-copies-source"), "slug proxy catches the AI-roles item");
  });

  check("a source headline with words merely removed is still a copy", () => {
    // The curated 2026-08 item: shorter, Title Case, and still nothing of ours.
    const issues = checkBiteTitle("Women Underrepresented in AI Roles", {
      index: 0,
      sourceTitle: COPIED_UNDERREPRESENTED,
    });
    assert.ok(rules(issues).includes("title-copies-source"), "containment rule fires");
  });

  check("a prefix or suffix bolted onto the source headline does not save it", () => {
    const issues = checkBiteTitle(`NZ: ${COPIED_UNDERREPRESENTED} this year`, {
      index: 0,
      sourceTitle: COPIED_UNDERREPRESENTED,
    });
    assert.ok(rules(issues).includes("title-copies-source"), "still a copy");
  });

  check("a genuinely re-angled headline passes the copy rule", () => {
    // Approved copy, against the source it was written from.
    const issues = checkBiteTitle("Parents aren't sure their kids can spot a fake", {
      index: 0,
      sourceTitle: "New Zealand parents worry kids can't spot AI fakes",
    });
    assert.deepStrictEqual(
      rules(issues),
      [],
      `approved copy must pass, got: ${JSON.stringify(issues, null, 2)}`,
    );
  });

  check("the copy rules are skipped, not failed, when no source title is known", () => {
    const issues = checkBiteTitle(COPIED_SHADOWTECH, { index: 0, sourceTitle: null });
    assert.ok(
      !rules(issues).includes("title-copies-source"),
      "with nothing to compare against, the rule cannot run",
    );
  });

  // 2. Similarity separates the approved copy from the copies by a wide margin.
  console.log("\n2. headlineSimilarity:");

  check("a verbatim copy scores at or above the threshold", () => {
    const same = headlineSimilarity(COPIED_SHADOWTECH, COPIED_SHADOWTECH);
    assert.ok(
      same.dice >= PULSE_COPY_LIMITS.titleCopyDice,
      `expected >= ${PULSE_COPY_LIMITS.titleCopyDice}, got ${same.dice}`,
    );
    assert.strictEqual(same.containment, 1, "and every word of ours is theirs");
  });

  check("the closest legitimate re-angle stays well below it", () => {
    const near = headlineSimilarity(
      "Parents aren't sure their kids can spot a fake",
      "New Zealand parents worry kids can't spot AI fakes",
    );
    assert.ok(
      near.dice < PULSE_COPY_LIMITS.titleCopyDice,
      `expected < ${PULSE_COPY_LIMITS.titleCopyDice}, got ${near.dice}`,
    );
    assert.ok(near.containment < 1, "and it says something the source's title does not");
    // The gap is the whole justification for where the threshold sits.
    assert.ok(near.dice < 0.7, `the measured margin should be large, got ${near.dice}`);
  });

  check("an unrelated headline scores zero", () => {
    const far = headlineSimilarity(
      "If you shelved a job search, take it back off the shelf",
      "SEEK NZ Employment Report - June",
    );
    assert.strictEqual(far.dice, 0);
  });

  check("thousands separators do not split a figure into two tokens", () => {
    assert.ok(styleTokens("1,500 girls").includes("1500"), "1,500 stays one token");
    assert.ok(
      styleTokens("for 1,500+ girls").includes("1500"),
      "a trailing + does not change that",
    );
  });

  check("stemming is symmetric, so door/doors cannot hide a copy", () => {
    assert.deepStrictEqual(styleTokens("doors"), styleTokens("door"));
    assert.deepStrictEqual(styleTokens("roles"), styleTokens("role"));
  });

  // 3. Sentence case.
  console.log("\n3. Sentence case:");

  check("Title Case is rejected", () => {
    for (const title of [
      "ShadowTech26 Opens Doors for 1,500 Girls",
      "Women Underrepresented in AI Roles",
    ]) {
      const issues = checkBiteTitle(title, { index: 0 });
      assert.ok(rules(issues).includes("title-case"), `expected title-case for "${title}"`);
    }
  });

  check("a proper noun in a sentence-case headline is not Title Case", () => {
    const issues = checkBiteTitle("Job ads fell for a third month, Auckland included", {
      index: 0,
    });
    assert.ok(!rules(issues).includes("title-case"), "Auckland alone must not trip it");
  });

  check("an acronym is not counted as a capitalised word", () => {
    const issues = checkBiteTitle("The environmental bill for AI is becoming a public question", {
      index: 0,
    });
    assert.deepStrictEqual(rules(issues), [], "approved copy, no issues");
  });

  // 4. Quote marks, attribution and the vendor frame.
  console.log("\n4. Whose voice the headline is in:");

  check("an apostrophe is not a lifted quote mark", () => {
    const issues = checkBiteTitle("Parents aren't sure their kids can spot a fake", { index: 0 });
    assert.ok(!rules(issues).includes("title-quote-marks"), "aren't is fine");
  });

  check("a quoted phrase in a headline is rejected", () => {
    for (const title of [
      "Women 'remain underrepresented' in AI roles",
      'Pay equity "largely unchanged" this year',
    ]) {
      assert.ok(
        rules(checkBiteTitle(title, { index: 0 })).includes("title-quote-marks"),
        `expected title-quote-marks for "${title}"`,
      );
    }
  });

  check("an attribution tail is rejected", () => {
    assert.ok(
      rules(checkBiteTitle(SEEK_ATTRIBUTED, { index: 0 })).includes("title-attribution"),
      "\", SEEK report shows\" is a filing label, not a headline",
    );
    assert.ok(
      rules(checkBiteTitle("Tech hiring slowed, according to SEEK", { index: 0 })).includes(
        "title-attribution",
      ),
      "\", according to X\" too",
    );
  });

  check("the same headline without the attribution tail passes", () => {
    assert.deepStrictEqual(rules(checkBiteTitle(SEEK_PLAIN, { index: 0 })), []);
  });

  check("a vendor doing a press-release verb is rejected", () => {
    assert.ok(
      rules(checkBiteTitle("Datacom launches AI platform for enterprise", { index: 0 })).includes(
        "title-vendor-subject",
      ),
    );
  });

  check("trade-press register is rejected in a headline", () => {
    assert.ok(
      rules(checkBiteTitle("Spark unveils new tools", { index: 0 })).includes("title-register"),
    );
  });

  // 5. Lengths, derived from the approved issues.
  console.log("\n5. Lengths:");

  check("a headline over the word cap is rejected, at the cap is not", () => {
    const atCap = Array.from({ length: PULSE_COPY_LIMITS.titleWords }, () => "word").join(" ");
    assert.ok(!rules(checkBiteTitle(atCap, { index: 0 })).includes("title-length"));
    assert.ok(rules(checkBiteTitle(`${atCap} extra`, { index: 0 })).includes("title-length"));
  });

  check("the cap sits above the longest approved headline", () => {
    const longest = "If you shelved a job search, take it back off the shelf";
    assert.ok(
      countWords(longest) < PULSE_COPY_LIMITS.titleWords,
      "the rule must never fail the copy it was derived from",
    );
  });

  check("a summary over the word cap is rejected", () => {
    const long = Array.from({ length: PULSE_COPY_LIMITS.summaryWords + 1 }, () => "word").join(" ");
    assert.ok(rules(checkBiteSummary(long, { index: 0 })).includes("summary-length"));
  });

  check("three sentences are allowed and four are not", () => {
    // Three is deliberate: the strongest hand-written item the newsletter has
    // published uses three, and the third sentence is the one that makes it ours.
    const three = "One thing happened. Then a second thing happened. That is what it means.";
    assert.ok(!rules(checkBiteSummary(three, { index: 0 })).includes("summary-sentences"));
    const four = `${three} And a fourth.`;
    assert.ok(rules(checkBiteSummary(four, { index: 0 })).includes("summary-sentences"));
  });

  check("countSentences does not invent a sentence after a terminal full stop", () => {
    assert.strictEqual(countSentences("One. Two."), 2);
    assert.strictEqual(countSentences("Only one"), 1);
  });

  check("padding words are advisories, banned register is an error", () => {
    // A padding WORD stays an advisory: "ecosystem" is what people actually
    // call it, and this sentence names Auckland, so it is doing work.
    const padding = checkBiteSummary("Auckland's startup ecosystem grew again.", { index: 0 });
    assert.ok(rules(padding).includes("summary-padding"), "padding is reported");
    assert.ok(!hasCopyErrors(padding), "but a word alone never fails the section");

    const banned = checkBiteSummary("The vendor unveils new solutions for teams.", { index: 0 });
    assert.ok(hasCopyErrors(banned), "trade-press register does fail");
  });

  check("a closing sentence that adds no fact is an ERROR, not an advisory", () => {
    // Promoted from advisory on evidence. THREE of three machine-written 2026-08
    // summaries ended with one of these, and none of the three hand-written
    // 2026-07 summaries — the quality bar — contains one. A rule that fires on
    // every observed failure and no approved copy has earned being an error, and
    // as a warning it relied on every operator noticing it every month.
    const hollow = checkBiteSummary(
      "Women hold 13% of AI leadership roles. This highlights the need for change.",
      { index: 0 },
    );
    assert.ok(rules(hollow).includes("summary-hollow-sentence"), "the closer is caught");
    assert.ok(hasCopyErrors(hollow), "and it fails the section");

    // The two escapes that keep it honest.
    assert.deepStrictEqual(
      hollowClosers("Ads fell 0.8%. This is the third month of decline."),
      [],
      "a closer carrying a number is telling the reader something",
    );
    assert.deepStrictEqual(
      hollowClosers("Ads fell again. This was sharpest in Auckland."),
      [],
      "and so is one naming a place",
    );

    // The gold standard must keep passing, which is what makes this safe.
    for (const summary of GOLD_STANDARD_SUMMARIES) {
      assert.deepStrictEqual(hollowClosers(summary), [], `2026-07 stays clean: ${summary}`);
    }
  });

  // 6. The set.
  console.log("\n6. The news list as a set:");

  check("two items from one publisher are an advisory, not a failure", () => {
    const issues = checkNewsBiteSet([
      { title: "One thing changed", sourceLabel: "TechDay NZ" },
      { title: "Another thing changed", sourceLabel: "TechDay NZ" },
    ]);
    assert.ok(rules(issues).includes("set-one-per-publisher"));
    assert.ok(!hasCopyErrors(issues), "SKILL.md's rule has a stated exception, so it cannot fail");
  });

  check("all three headlines opening with a number is rejected", () => {
    const issues = checkNewsBiteSet([
      { title: "9.9% more tech job ads than a year ago", sourceLabel: "A" },
      { title: "44% of parents are not confident", sourceLabel: "B" },
      { title: "1,500 girls will spend a day in a tech workplace", sourceLabel: "C" },
    ]);
    assert.ok(rules(issues).includes("set-all-open-with-number"));
  });

  check("one number-led headline among three is fine", () => {
    const issues = checkNewsBiteSet([
      { title: "9.9% more tech job ads than a year ago", sourceLabel: "A" },
      { title: "Parents aren't sure their kids can spot a fake", sourceLabel: "B" },
      { title: "The environmental bill for AI is a public question", sourceLabel: "C" },
    ]);
    assert.ok(!rules(issues).includes("set-all-open-with-number"), "often the strongest headline");
  });

  check("two headlines that say the same thing are rejected", () => {
    const issues = checkNewsBiteSet([
      { title: "Tech job ads are climbing again", sourceLabel: "A" },
      { title: "The tech job ads are climbing again", sourceLabel: "B" },
    ]);
    assert.ok(rules(issues).includes("set-duplicate-headline"));
  });

  // 7. The hero stat and sourceTitleFromUrl.
  console.log("\n7. Hero stat and the URL proxy:");

  check("a Title Case hero label is rejected", () => {
    const issues = checkHeroStat({
      label: "Job Ads Referencing AI Skills",
      context: "3.7% of job ads reference AI skills in New Zealand.",
    });
    assert.ok(rules(issues).includes("hero-label-case"));
  });

  check("sourceTitleFromUrl reads a title slug and refuses everything else", () => {
    assert.strictEqual(
      sourceTitleFromUrl(
        "https://www.hcamag.com/nz/news/general/women-remain-underrepresented-in-ai-roles-despite-jobs-boom/586604",
      ),
      "women remain underrepresented in ai roles despite jobs boom",
      "the numeric id segment is skipped",
    );
    assert.strictEqual(sourceTitleFromUrl("https://example.com/news/12345"), null, "an id is not a title");
    assert.strictEqual(sourceTitleFromUrl("https://example.com/a-b-c"), null, "three parts is not a headline");
    assert.strictEqual(sourceTitleFromUrl("not a url"), null, "an unparseable URL returns null");
  });

  // 8. The approved issues still pass. This is the load-bearing test.
  console.log("\n8. The approved issues (what the rules were derived from):");

  for (const id of ["2026-06", "2026-07"]) {
    check(`${id} passes every house-style rule with no errors`, () => {
      const pulse = readIssuePulse(id);
      assert.ok(pulse, `${id} has a pulse`);
      const issues = lintPulseCopy(pulse);
      assert.deepStrictEqual(
        errorsOnly(issues),
        [],
        `${id} must pass; got:\n${errorsOnly(issues)
          .map((entry) => `  ${entry.field}: ${entry.message}`)
          .join("\n")}`,
      );
    });
  }

  check("2026-08 now passes too, having been regenerated under these rules", () => {
    // This check used to assert the OPPOSITE — that 2026-08's Title Case and
    // copied headlines were caught — because when the rules were written that
    // issue was the machine-written counter-example. It has since been
    // regenerated and curated, and the old assertion then failed: a test that
    // requires a fixture to stay BROKEN is a test that blocks fixing it.
    //
    // Nothing was lost by inverting it. The two real copied headlines are held
    // as literals at the top of this file and asserted in section 1, so the
    // regression is pinned to the strings that were actually observed rather
    // than to a file somebody is expected to leave alone.
    const pulse = readIssuePulse("2026-08");
    assert.ok(pulse, "2026-08 has a pulse");
    assert.deepStrictEqual(
      rules(errorsOnly(lintPulseCopy(pulse))),
      [],
      "the shipped issue must satisfy the rules it is checked against",
    );
  });

  // 9. The prompt half of the contract.
  console.log("\n9. The prompt and the checker say the same thing:");

  check("the house-style block carries the worked before/after example", () => {
    assert.ok(PULSE_HOUSE_STYLE_RULES.includes("WORKED EXAMPLE"), "the example is present");
    assert.ok(
      PULSE_HOUSE_STYLE_RULES.includes(COPIED_SHADOWTECH),
      "and it is the real copied headline, not an invented one",
    );
    assert.ok(PULSE_HOUSE_STYLE_RULES.includes("GOOD title:"), "with the after half");
  });

  check("the word cap the model is told matches the one it is checked against", () => {
    assert.ok(
      PULSE_HOUSE_STYLE_RULES.includes(`At most ${PULSE_COPY_LIMITS.titleWords} words`),
      "the limit is interpolated, so the two cannot drift",
    );
  });

  check("describeIssuesForModel names only the errors, one per line", () => {
    const issues = [
      ...checkBiteTitle("Women Underrepresented in AI Roles", {
        index: 0,
        sourceTitle: COPIED_UNDERREPRESENTED,
      }),
      // Advisory-only on purpose: "ecosystem" is a soft-register word, but the
      // sentence names Auckland, so it is not a fact-free closer and does not
      // rise to an error. It used to be "This initiative aims to inspire.",
      // which became an ERROR when fact-free closers were promoted — and the
      // test then failed for the right reason, so the example moved rather than
      // the rule.
      ...checkBiteSummary("Auckland's startup ecosystem grew again.", { index: 1 }),
    ];
    const text = describeIssuesForModel(issues);
    assert.ok(text.includes("newsBites[0].title"), "the failing field is named");
    assert.ok(!text.includes("newsBites[1].summary"), "advisories are not sent back to the model");
    assert.strictEqual(text.split("\n").length, errorsOnly(issues).length);
  });

  check("checkNewsBite runs both halves", () => {
    const issues = checkNewsBite(
      { title: "Spark Unveils New Solutions", summary: "The vendor leverages AI." },
      { index: 0 },
    );
    assert.ok(rules(issues).some((rule) => rule.startsWith("title-")), "title rules ran");
    assert.ok(rules(issues).some((rule) => rule.startsWith("summary-")), "summary rules ran");
  });

  console.log(`\nAll ${passed} checks passed.`);
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exit(1);
}
