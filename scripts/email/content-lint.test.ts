/**
 * Checks for the pre-send newsletter content linter (`content-lint.ts`).
 *
 * Run: `npx tsx scripts/email/content-lint.test.ts`
 *
 * A guard is not verified until you have broken the thing it guards, and this
 * guard has two things it was built to catch — both of which already happened,
 * to the whole list:
 *
 * - `Newsletter - April 2026 v0.2` (2026-04-13, 1,657 recipients, 32
 *   unsubscribes at 1.93%);
 * - a June issue whose subject said "May 2026" (2026-06-23, apology required).
 *
 * So those two subject lines are fed to the linter verbatim, and the merge tag
 * that would render as literal `*|FNAME|*` with them. The other half of the job
 * matters as much: the three committed issues must come back clean, because a
 * linter that refuses everything is a linter somebody switches off before the
 * next send rather than after it.
 *
 * No database, no network — the fixtures are the real 2026-08 issue with one
 * field changed at a time, so every failure below is attributable to that field.
 */

import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { errorCount, lintIssue, lintSubjectLine, type Finding } from "./content-lint";

let failures = 0;

/**
 * Runs one named check.
 *
 * @param name What is being asserted.
 * @param fn The assertion body.
 */
function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL - ${name}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
  }
}

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");

/** The real August 2026 issue, re-read for each fixture so mutations cannot leak. */
function realIssue(id = "2026-08"): Record<string, unknown> {
  return JSON.parse(readFileSync(join(ISSUE_DIR, `${id}.json`), "utf8")) as Record<string, unknown>;
}

/** The real issue with `editorial` patched — one deliberate defect at a time. */
function withEditorial(patch: Record<string, unknown>): Record<string, unknown> {
  const issue = realIssue();
  issue.editorial = { ...(issue.editorial as Record<string, unknown>), ...patch };
  return issue;
}

/** Whether any finding of that rule and severity is present. */
function has(findings: Finding[], rule: string, severity: Finding["severity"] = "error"): boolean {
  return findings.some((finding) => finding.rule === rule && finding.severity === severity);
}

/** Everything found, as one string, for a readable assertion failure. */
function describe(findings: Finding[]): string {
  return findings.map((f) => `${f.severity} ${f.rule} @ ${f.where} (${f.excerpt})`).join("; ") || "(none)";
}

/* -------------------------------------------------------------------------- */
/* The two historical failures                                                */
/* -------------------------------------------------------------------------- */

check("rule 1 catches the real 2026-04-13 subject line, `Newsletter - April 2026 v0.2`", () => {
  const findings = lintSubjectLine("Newsletter - April 2026 v0.2", "2026-04");
  assert.ok(
    has(findings, "subject/version-marker"),
    `the v0.2 draft label must block the send — got: ${describe(findings)}`
  );
});

check("rule 2 catches the real 2026-06-23 subject line, `She Sharp Newsletter - May 2026`", () => {
  const findings = lintSubjectLine("She Sharp Newsletter - May 2026", "2026-06");
  assert.ok(
    has(findings, "subject/month-mismatch"),
    `a June issue naming May must block the send — got: ${describe(findings)}`
  );
});

check("rule 5 catches an unreplaced `*|FNAME|*` merge tag in body copy", () => {
  const issue = withEditorial({
    founderNote: {
      heading: "A note from our founder",
      bodyMd: "Kia ora *|FNAME|*,\n\nThank you for being part of the She Sharp community.",
      signature: "Dr. Mahsa McCauley, Founder & Chair, She Sharp",
      photoUrl: null,
    },
  });
  const findings = lintIssue("2026-08", issue).findings;
  assert.ok(has(findings, "body/merge-tag"), `merge tag must block — got: ${describe(findings)}`);
  const tag = findings.find((f) => f.rule === "body/merge-tag");
  assert.strictEqual(tag?.where, "editorial.founderNote.bodyMd", "it must say where it found it");
});

/* -------------------------------------------------------------------------- */
/* The clean issues — the half that proves it is not refusing everything      */
/* -------------------------------------------------------------------------- */

check("every committed issue on disk passes with no errors", () => {
  const ids = readdirSync(ISSUE_DIR)
    .filter((name) => /^\d{4}-(0[1-9]|1[0-2])\.json$/.test(name))
    .map((name) => name.replace(/\.json$/, ""));
  assert.ok(ids.length >= 3, "expected the committed issue fixtures to be on disk");
  for (const id of ids) {
    const findings = lintIssue(id, realIssue(id)).findings;
    assert.strictEqual(
      errorCount(findings),
      0,
      `${id} must pass the content linter — got: ${describe(findings)}`
    );
  }
});

check("a real subject naming its own month is accepted", () => {
  assert.strictEqual(errorCount(lintSubjectLine("She Sharp - August Newsletter", "2026-08")), 0);
  assert.strictEqual(errorCount(lintSubjectLine("June wins: branding & young makers", "2026-06")), 0);
});

check("`meta.status: \"draft\"` does not read as a draft marker", () => {
  const issue = realIssue();
  issue.meta = { ...(issue.meta as Record<string, unknown>), status: "draft" };
  const findings = lintIssue("2026-08", issue).findings;
  assert.strictEqual(
    findings.length,
    0,
    `an unsent issue must lint clean — got: ${describe(findings)}`
  );
});

check("ordinary prose is not mistaken for a placeholder or a month", () => {
  // Lower-case "may" is the English verb; a month in a subject is capitalised.
  assert.strictEqual(errorCount(lintSubjectLine("Whatever you may be building", "2026-08")), 0);
  // A markdown link's text is bracketed too, and `[AWS]` is not `[NAME]`.
  const issue = withEditorial({
    sponsorThanks: "Thank you to [AWS](https://aws.amazon.com) and to everyone who helped.",
  });
  assert.strictEqual(errorCount(lintIssue("2026-08", issue).findings), 0);
});

/* -------------------------------------------------------------------------- */
/* The rest of the rule set                                                   */
/* -------------------------------------------------------------------------- */

check("rule 1 catches DRAFT, WIP, rev2 and a trailing `- copy`", () => {
  for (const subject of [
    "DRAFT - She Sharp August Newsletter",
    "She Sharp newsletter (WIP)",
    "She Sharp August Newsletter rev2",
    "She Sharp August Newsletter - copy",
    "She Sharp August Newsletter v3",
  ]) {
    const findings = lintSubjectLine(subject, "2026-08");
    assert.ok(
      has(findings, "subject/version-marker"),
      `"${subject}" must be blocked — got: ${describe(findings)}`
    );
  }
});

check("rule 2 warns rather than blocks when the subject leads on next month", () => {
  // The August 2026 issue really does lead on a 3 September event.
  const findings = lintSubjectLine("Les Mills, 3 September", "2026-08");
  assert.strictEqual(errorCount(findings), 0, `got: ${describe(findings)}`);
  assert.ok(has(findings, "subject/month-mismatch", "warning"), describe(findings));
});

check("rule 2 blocks a wrong year even when the month is right", () => {
  const findings = lintSubjectLine("She Sharp - August 2025 Newsletter", "2026-08");
  assert.ok(has(findings, "subject/year-mismatch"), describe(findings));
});

check("rule 3 blocks TODO and TBC in a subject line", () => {
  assert.ok(has(lintSubjectLine("She Sharp - TODO Newsletter", "2026-08"), "subject/placeholder"));
  assert.ok(has(lintSubjectLine("She Sharp - venue TBC", "2026-08"), "subject/placeholder"));
  assert.ok(
    has(lintSubjectLine("Lorem ipsum dolor sit amet", "2026-08"), "subject/placeholder"),
    "lorem ipsum must block"
  );
});

check("rule 4 blocks an empty subject and an absurd one, and warns past the schema cap", () => {
  assert.ok(has(lintSubjectLine("", "2026-08"), "subject/empty"));
  assert.ok(has(lintIssue("2026-08", withEditorial({ subjectLine: "" })).findings, "subject/empty"));
  assert.ok(has(lintSubjectLine("x".repeat(130), "2026-08"), "subject/length"));
  const long = lintSubjectLine("She Sharp August Newsletter, and a great deal more besides", "2026-08");
  assert.strictEqual(errorCount(long), 0, describe(long));
  assert.ok(has(long, "subject/length", "warning"), describe(long));
});

check("rule 6 catches handlebars, ${} and bracketed stubs anywhere in the issue", () => {
  for (const copy of [
    "Kia ora {{ first_name }}, here is the August issue.",
    "Register at ${registrationUrl} before Friday.",
    "The evening is at [INSERT VENUE] from 5pm.",
    "Kia ora [NAME], see you there.",
  ]) {
    const findings = lintIssue("2026-08", withEditorial({ recapIntro: copy })).findings;
    assert.ok(
      has(findings, "body/template-variable"),
      `"${copy}" must be blocked — got: ${describe(findings)}`
    );
  }
});

check("rule 7 blocks TODO in body copy and only warns on TBC", () => {
  const todo = lintIssue("2026-08", withEditorial({ recapIntro: "TODO: write the recap." })).findings;
  assert.ok(has(todo, "body/placeholder"), describe(todo));

  const tbc = lintIssue("2026-08", withEditorial({ recapIntro: "The October venue is TBC." })).findings;
  assert.strictEqual(errorCount(tbc), 0, `"venue TBC" is legitimate copy — got: ${describe(tbc)}`);
  assert.ok(has(tbc, "body/placeholder", "warning"), describe(tbc));
});

check("rule 8 blocks dead, example.com and localhost links, and warns on http://", () => {
  const dead = lintIssue(
    "2026-08",
    withEditorial({ sponsorThanks: 'Read more <a href="#">here</a>.' })
  ).findings;
  assert.ok(has(dead, "body/link"), describe(dead));

  const example = lintIssue(
    "2026-08",
    withEditorial({ primaryCta: { label: "Register", href: "https://example.com/register" } })
  ).findings;
  assert.ok(has(example, "body/link"), describe(example));

  // The 2026-03-19 incident's shape: a localhost URL in a real send.
  const local = lintIssue(
    "2026-08",
    withEditorial({ primaryCta: { label: "Register", href: "http://localhost:3000/events" } })
  ).findings;
  assert.ok(has(local, "body/link"), describe(local));

  const insecure = lintIssue(
    "2026-08",
    withEditorial({ primaryCta: { label: "Register", href: "http://www.shesharp.org.nz/events" } })
  ).findings;
  assert.strictEqual(errorCount(insecure), 0, describe(insecure));
  assert.ok(has(insecure, "body/link", "warning"), describe(insecure));
});

check("the `auto` snapshot is scanned too, not just hand-written editorial copy", () => {
  const issue = realIssue();
  const auto = issue.auto as { upcomingEvents: { url: string }[] };
  auto.upcomingEvents[0].url = "http://localhost:3000/events/event-lesmills-03-september-2026";
  const findings = lintIssue("2026-08", issue).findings;
  assert.ok(has(findings, "body/link"), `got: ${describe(findings)}`);
  assert.ok(
    findings.some((f) => f.where === "auto.upcomingEvents[0].url"),
    `the path must name the array index — got: ${describe(findings)}`
  );
});

check("the month rule reads the issue id, never the clock", () => {
  // Whatever month this test runs in, a January issue naming January is fine
  // and one naming July is not.
  assert.strictEqual(errorCount(lintSubjectLine("January highlights", "2027-01")), 0);
  assert.ok(has(lintSubjectLine("July highlights", "2027-01"), "subject/month-mismatch"));
  // December rolls over: the next month is January of the following year.
  const rollover = lintSubjectLine("January kick-off", "2026-12");
  assert.strictEqual(errorCount(rollover), 0, describe(rollover));
});

/* -------------------------------------------------------------------------- */
/* The CLI contract — exit codes are the whole point                          */
/* -------------------------------------------------------------------------- */

/**
 * The TypeScript loader flags this test is itself running under.
 *
 * Reused for the child process rather than hard-coding `--import=tsx`, because
 * `tsx` may be installed globally and not resolvable from the repo's own
 * `node_modules`. Whatever loader ran this file can run the child.
 */
function loaderArgs(): string[] {
  const args: string[] = [];
  for (let index = 0; index < process.execArgv.length; index += 1) {
    const arg = process.execArgv[index];
    if (arg === "--require" || arg === "--import") {
      args.push(arg, process.execArgv[index + 1]);
      index += 1;
    } else if (arg.startsWith("--require=") || arg.startsWith("--import=")) {
      args.push(arg);
    }
  }
  return args.length > 0 ? args : ["--import=tsx"];
}

const CLI = fileURLToPath(new URL("content-lint.ts", import.meta.url));

/** Runs the CLI and returns its exit status and combined output. */
function runCli(args: string[]): { status: number; output: string } {
  try {
    const stdout = execFileSync(process.execPath, [...loaderArgs(), CLI, ...args], {
      stdio: "pipe",
      encoding: "utf8",
    });
    return { status: 0, output: stdout };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return { status: failure.status ?? -1, output: `${failure.stdout ?? ""}${failure.stderr ?? ""}` };
  }
}

check("the CLI exits 0 on a clean issue and 1 on a defective one", () => {
  const clean = runCli(["--issue", "2026-08"]);
  assert.strictEqual(clean.status, 0, `a clean issue must exit 0 — got:\n${clean.output}`);
  assert.match(clean.output, /All checks passed/);

  const dir = mkdtempSync(join(tmpdir(), "content-lint-"));
  try {
    const path = join(dir, "2026-04.json");
    const issue = withEditorial({ subjectLine: "Newsletter - April 2026 v0.2" });
    issue.id = "2026-04";
    writeFileSync(path, JSON.stringify(issue, null, 2));

    const bad = runCli(["--file", path]);
    assert.strictEqual(bad.status, 1, `a blocked issue must exit 1 — got:\n${bad.output}`);
    assert.match(bad.output, /MUST FIX/);
    assert.match(bad.output, /v0\.2/, "the report must show the offending text");

    const asJson = runCli(["--file", path, "--json"]);
    assert.strictEqual(asJson.status, 1, "--json must still exit 1");
    const parsed = JSON.parse(asJson.output) as {
      ok: boolean;
      errors: number;
      issues: { issueId: string; findings: Finding[] }[];
    };
    assert.strictEqual(parsed.ok, false);
    assert.ok(parsed.errors >= 1);
    assert.strictEqual(parsed.issues[0].issueId, "2026-04");
    assert.ok(parsed.issues[0].findings.some((f) => f.rule === "subject/version-marker"));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("the CLI checks every issue on disk under --all", () => {
  const all = runCli(["--all"]);
  assert.strictEqual(all.status, 0, `the committed issues must all pass — got:\n${all.output}`);
  assert.match(all.output, /2026-06/);
  assert.match(all.output, /2026-08/);
});

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All content-lint checks passed.");
