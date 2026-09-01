/**
 * Pre-send content linter for a monthly newsletter issue.
 *
 * Usage:
 *   npx tsx scripts/email/content-lint.ts                    # the newest issue on disk
 *   npx tsx scripts/email/content-lint.ts --issue 2026-08    # one issue
 *   npx tsx scripts/email/content-lint.ts --all              # every issue on disk (CI)
 *   npx tsx scripts/email/content-lint.ts --file <path>      # an uncommitted draft
 *   npx tsx scripts/email/content-lint.ts --issue 2026-08 --json
 *
 * WHY THIS EXISTS
 * ---------------
 * Two subject lines have reached the whole list wrong, and nothing in this repo
 * could have seen either of them:
 *
 * - **2026-04-13** — `Newsletter - April 2026 v0.2`, an internal draft version
 *   label, went to 1,657 people. The corrected send followed 5.2 hours later.
 *   That first send is still the worst campaign in the account's history: 32
 *   unsubscribes, 1.93%, 14.5x the non-profit benchmark.
 * - **2026-06-23** — the June issue went out saying "May 2026" in the subject.
 *   The correction, 4.6 hours later, had to open with an apology.
 *
 * Every protection around the newsletter before this was procedural — the
 * three-stage approval ledger, the idempotency key, the monthly frequency cap.
 * All of them answer "may this go?", none of them reads the words. A human
 * proof-read is what failed on both of those days, and a second human
 * proof-reading the same file is not a different check.
 *
 * So this reads the file. It is deliberately mechanical: it knows the issue's
 * own month from its id rather than from the clock, and it looks for the marks
 * a draft leaves behind — version labels, merge tags, template variables,
 * placeholder text, dead links.
 *
 * WHAT IT DOES NOT DO
 * -------------------
 * It lints the ISSUE FILE, not the rendered HTML. A merge tag or a placeholder
 * that a React email component introduces on its own would not be seen here.
 * That has never happened; every failure so far arrived as authored copy, which
 * is what this file holds. `lib/newsletter/render.test.ts` is where a render-side
 * check would belong.
 *
 * It also does not re-check the schema (`lib/newsletter/schema.ts`) — the send
 * path parses the issue and refuses on its own. This reads the raw JSON on
 * purpose, so that a file the schema would reject can still be told WHY in
 * words a writer can act on.
 *
 * Exit 1 when any error is found; exit 0 when only warnings remain.
 */

import { readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ISSUE_DIR = join(process.cwd(), "lib", "data", "json", "newsletter-issues");
const ISSUE_ID = /^\d{4}-(0[1-9]|1[0-2])$/;

/** A blocking error stops the send; a warning is printed and does not. */
export type Severity = "error" | "warning";

/** One thing the linter found, in one place, under one rule. */
export interface Finding {
  /** Stable rule id, e.g. `subject/version-marker`. Safe to grep for. */
  rule: string;
  severity: Severity;
  /** JSON path into the issue file, e.g. `editorial.founderNote.bodyMd`. */
  where: string;
  /** What is wrong, in the words of somebody who has to fix it. */
  message: string;
  /** The offending text, trimmed to something readable in a terminal. */
  excerpt: string;
}

/** The verdict on one issue. */
export interface LintResult {
  issueId: string;
  findings: Finding[];
  /**
   * Rules that could not run on this issue, and why.
   *
   * A rule that silently did not run reads exactly like a rule that passed —
   * the same argument `scripts/newsletter/lint-pulse.ts` makes about its
   * headline check. The month/year rule is the one that goes quiet here: a
   * subject naming no month has nothing to disagree with.
   */
  notes: string[];
}

/** Number of blocking findings in a list. */
export function errorCount(findings: Finding[]): number {
  return findings.filter((finding) => finding.severity === "error").length;
}

/* -------------------------------------------------------------------------- */
/* Rule 1 — version and draft markers in the subject                          */
/* -------------------------------------------------------------------------- */

/**
 * Markers that are never prose. `v0.2` is the April 2026 subject exactly.
 *
 * Split into two tiers on purpose. A version number, a `rev`, the words DRAFT
 * and WIP, an ALL-CAPS marker and a trailing "- copy" cannot be anything but a
 * working label, so they block. But "final", "test" and "copy" written as
 * ordinary Title-case words are real English a newsletter might use — "Final
 * call for the hackathon" is a subject somebody would legitimately write — so
 * those only warn. A linter that blocks good copy gets routed around, and a
 * routed-around linter guards nothing.
 */
const HARD_VERSION_MARKERS: { re: RegExp; label: string }[] = [
  { re: /\bv\.?\s?\d+(?:\.\d+)+\b/i, label: "a version number" },
  { re: /\bv\.?\s?\d+\s*(?:[)\]])?\s*$/i, label: "a trailing version number" },
  { re: /\brev\.?\s?\d+\b/i, label: "a revision number" },
  { re: /\b(?:draft|wip)\b/i, label: "a draft marker" },
  { re: /\b(?:TEST|COPY|FINAL|PROOF|DRAFT|WIP)\b/, label: "an all-caps working label" },
  { re: /[-–—([|/]\s*(?:copy|test|final|proof)\s*[)\]]?\s*$/i, label: "a trailing working label" },
];

/** The softer tier — real words that also happen to be how drafts get labelled. */
const SOFT_VERSION_MARKERS: { re: RegExp; label: string }[] = [
  { re: /\b(?:test|final|proof|copy)\b/i, label: "a word that also reads as a draft label" },
];

/* -------------------------------------------------------------------------- */
/* Rules 3 and 7 — placeholder text                                           */
/* -------------------------------------------------------------------------- */

/**
 * Placeholders that are unambiguously unfinished work, wherever they appear.
 */
const HARD_PLACEHOLDERS: RegExp[] = [
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bXXX+\b/,
  /\blorem(?:\s+ipsum)?\b/i,
  /<\s*placeholder[^>]*>/i,
  /\[\s*placeholder[^\]]*\]/i,
  /\bPLACEHOLDER\b/i,
];

/**
 * `TBC` and `TBD` get their own tier for the body only.
 *
 * "Venue TBC" is a sentence a real newsletter writes on purpose when a venue is
 * genuinely not confirmed, so in body copy this warns. In a SUBJECT LINE it is
 * never deliberate — the subject is the one string that has to be finished
 * before anything is sent — so `lintSubjectLine` promotes it to an error.
 */
const SOFT_PLACEHOLDERS: RegExp[] = [/\bTBC\b/i, /\bTBD\b/i];

/* -------------------------------------------------------------------------- */
/* Rules 5 and 6 — merge tags and template variables                          */
/* -------------------------------------------------------------------------- */

/**
 * Mailchimp merge tags. She Sharp's newsletter moved off Mailchimp on
 * 2026-08-31 and the Resend path has no merge-tag substitution at all, so a tag
 * carried over from an old campaign renders to the reader as the literal
 * characters `*|FNAME|*`.
 */
const MERGE_TAG = /\*\|[^|*]{0,60}\|\*/;

/** Template syntaxes that never survive to a reader with meaning. */
const TEMPLATE_VARIABLES: { re: RegExp; label: string }[] = [
  { re: /\{\{[^{}]{0,80}\}\}/, label: "a handlebars variable" },
  { re: /\$\{[^{}]{0,80}\}/, label: "a JavaScript template variable" },
  { re: /\[\s*INSERT\b[^\]]{0,60}\]/i, label: "an [INSERT …] stub" },
  {
    // Deliberately a closed list rather than "any bracketed capitals". Markdown
    // link text is bracketed too, and `[AWS]` or `[AI]` in prose is not a
    // placeholder — an over-eager pattern here would fire on real copy.
    re: /\[\s*(?:NAME|FNAME|LNAME|FIRST NAME|LAST NAME|EMAIL|DATE|TIME|VENUE|LINK|URL|EVENT|MONTH|YEAR|SPEAKER|SPONSOR)\s*\](?!\()/i,
    label: "a bracketed placeholder",
  },
];

/* -------------------------------------------------------------------------- */
/* Rule 8 — broken and placeholder links                                      */
/* -------------------------------------------------------------------------- */

/**
 * Link problems, with the severity each one earns.
 *
 * `#`, `example.com` and `localhost` block: all three are a link that cannot
 * work for a reader, and `localhost` is the 2026-03-19 incident exactly — 25
 * real mentor invitations went out pointing at a machine nobody else has.
 *
 * Bare `http://` only warns. In a She Sharp link it would be a defect, but the
 * Pulse cites third-party sources and a publisher who has not got round to TLS
 * is not a reason to block the month's send. Say it, do not stop on it.
 */
const LINK_RULES: { re: RegExp; severity: Severity; label: string }[] = [
  { re: /href\s*=\s*["']#["']/i, severity: "error", label: 'a dead `href="#"`' },
  { re: /\]\(\s*#\s*\)/, severity: "error", label: "a markdown link pointing at `#`" },
  { re: /\bexample\.(?:com|org|net)\b/i, severity: "error", label: "the example.com placeholder domain" },
  { re: /\blocalhost\b|\b127\.0\.0\.1\b/i, severity: "error", label: "a localhost URL" },
  { re: /http:\/\//i, severity: "warning", label: "a plain http:// link" },
];

/* -------------------------------------------------------------------------- */
/* Rule 2 — the month the subject names                                       */
/* -------------------------------------------------------------------------- */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Full names first so "June" is never matched as the abbreviation "Jun". */
const MONTH_PATTERN = new RegExp(
  `\\b(${[...MONTH_NAMES, "Sept", "Jan", "Feb", "Mar", "Apr", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].join("|")})\\b`,
  "g"
);

/** 1-12 for a month name or three/four-letter abbreviation, else 0. */
function monthNumber(word: string): number {
  const lower = word.toLowerCase();
  const index = MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === lower || name.toLowerCase().startsWith(lower)
  );
  return index + 1;
}

/**
 * Every month name written in a subject, as it would be written on purpose.
 *
 * Only Capitalised or ALL-CAPS spellings count. Lower-case "may" and "march"
 * are ordinary English words and matching them would make the rule fire on
 * sentences like "however you may join us"; a month written as a date never
 * appears in lower case in a subject line.
 */
function namedMonths(subject: string): { word: string; month: number }[] {
  const found: { word: string; month: number }[] = [];
  for (const match of subject.matchAll(MONTH_PATTERN)) {
    const word = match[1];
    const proper = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    if (word !== proper && word !== word.toUpperCase()) continue;
    found.push({ word, month: monthNumber(word) });
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/* The subject-line rules                                                     */
/* -------------------------------------------------------------------------- */

/** Trims a long string to something a terminal line can hold. */
function excerpt(value: string, around?: string): string {
  const flat = value.replace(/\s+/g, " ").trim();
  if (around) {
    const at = flat.indexOf(around);
    if (at >= 0) {
      const start = Math.max(0, at - 30);
      const end = Math.min(flat.length, at + around.length + 30);
      return `${start > 0 ? "…" : ""}${flat.slice(start, end)}${end < flat.length ? "…" : ""}`;
    }
  }
  return flat.length > 110 ? `${flat.slice(0, 110)}…` : flat;
}

/** The literal text a pattern matched, for the report. */
function matched(re: RegExp, value: string): string {
  const hit = value.match(re);
  return hit ? hit[0] : "";
}

/**
 * Rules 1-4: everything that applies to the subject line alone.
 *
 * The subject is separated from the body because it is the string with the
 * worst failure mode in the whole pipeline. It is the only copy every recipient
 * reads, it is the only copy that cannot be corrected after the fact, and both
 * historical incidents were subject lines and nothing else.
 *
 * @param subject The issue's `editorial.subjectLine`, exactly as written.
 * @param issueId The issue's own id, `YYYY-MM` — the month rule's authority.
 *   Taken from the id and never from `new Date()`: a linter run in July on a
 *   June issue must judge it as a June issue.
 * @param notes Collects rules that could not run on this subject.
 */
export function lintSubjectLine(subject: string, issueId: string, notes: string[] = []): Finding[] {
  const findings: Finding[] = [];
  const where = "editorial.subjectLine";
  const add = (rule: string, severity: Severity, message: string, hit: string): void => {
    findings.push({ rule, severity, where, message, excerpt: excerpt(subject, hit) });
  };

  // Rule 4 first: there is nothing to say about the wording of a subject that
  // is not there.
  if (subject.trim().length === 0) {
    findings.push({
      rule: "subject/empty",
      severity: "error",
      where,
      message: "The subject line is empty. Every recipient would see a blank subject.",
      excerpt: "",
    });
    notes.push("Subject is empty, so the wording rules did not run.");
    return findings;
  }

  // Rule 1 — version and draft markers.
  let markerFound = false;
  for (const marker of HARD_VERSION_MARKERS) {
    if (marker.re.test(subject)) {
      markerFound = true;
      add(
        "subject/version-marker",
        "error",
        `The subject carries ${marker.label}. This is the 2026-04-13 failure: ` +
          "`Newsletter - April 2026 v0.2` reached 1,657 inboxes and cost 32 unsubscribes.",
        matched(marker.re, subject)
      );
      break;
    }
  }
  if (!markerFound) {
    for (const marker of SOFT_VERSION_MARKERS) {
      if (marker.re.test(subject)) {
        add(
          "subject/draft-word",
          "warning",
          `The subject contains ${marker.label}. Fine if it is deliberate copy — ` +
            "check it is not a working label that was never taken out.",
          matched(marker.re, subject)
        );
        break;
      }
    }
  }

  // Rule 2 — the month and year the subject names must be this issue's own.
  const [issueYearText, issueMonthText] = issueId.split("-");
  const issueYear = Number(issueYearText);
  const issueMonth = Number(issueMonthText);
  const months = namedMonths(subject);
  const years = [...subject.matchAll(/\b(20\d{2})\b/g)].map((match) => Number(match[1]));
  const wrongYears = years.filter((year) => year !== issueYear);

  // The month after this one, which is legitimately promoted in a subject: the
  // August 2026 issue leads on a 3 September event. Everything else — a month
  // already past, or one further ahead — is the June failure's shape.
  const nextMonth = issueMonth === 12 ? 1 : issueMonth + 1;

  for (const named of months) {
    if (named.month === issueMonth) continue;
    if (named.month === nextMonth) {
      add(
        "subject/month-mismatch",
        "warning",
        `The subject names ${named.word}, the month AFTER this ${MONTH_NAMES[issueMonth - 1]} ` +
          "issue. That is normal when the issue leads on next month's event — confirm it is that.",
        named.word
      );
      continue;
    }
    add(
      "subject/month-mismatch",
      "error",
      `The subject names ${named.word} but this is the ${MONTH_NAMES[issueMonth - 1]} ${issueYear} ` +
        "issue. This is the 2026-06-23 failure: the June issue went out saying \"May 2026\" and " +
        "the correction had to open with an apology.",
      named.word
    );
  }

  for (const year of wrongYears) {
    add(
      "subject/year-mismatch",
      "error",
      `The subject says ${year} but this is the ${issueYear} issue.`,
      String(year)
    );
  }

  if (months.length === 0 && years.length === 0) {
    notes.push(
      "The subject names no month or year, so the month-agreement rule had nothing to check."
    );
  }

  // Rules 3 — placeholder text. Both tiers block in a subject.
  for (const pattern of [...HARD_PLACEHOLDERS, ...SOFT_PLACEHOLDERS]) {
    if (pattern.test(subject)) {
      add(
        "subject/placeholder",
        "error",
        "The subject still contains placeholder text.",
        matched(pattern, subject)
      );
      break;
    }
  }

  // Rule 4 — length. The schema caps this at 50 characters, so anything past
  // that never reaches a validated send; it is a warning here because this
  // linter reads raw JSON and is expected to run on a file mid-edit. Past ~120
  // the subject is not merely long, it is truncated in every client and can
  // only be a paste accident, so that blocks.
  if (subject.length > 120) {
    add(
      "subject/length",
      "error",
      `The subject is ${subject.length} characters. Every mail client truncates long before this.`,
      subject.slice(0, 40)
    );
  } else if (subject.length > 50) {
    add(
      "subject/length",
      "warning",
      `The subject is ${subject.length} characters; the schema caps it at 50 and the send will ` +
        "refuse the file until it fits.",
      subject.slice(0, 40)
    );
  }

  return findings;
}

/* -------------------------------------------------------------------------- */
/* The body rules                                                             */
/* -------------------------------------------------------------------------- */

/** One string in the issue file, with the JSON path it was found at. */
interface LocatedString {
  where: string;
  value: string;
}

/**
 * Every string in the issue, depth-first, with its JSON path.
 *
 * `meta` is skipped deliberately and is the only exclusion: it is bookkeeping,
 * not copy, and `meta.status` is legitimately the literal word `"draft"` —
 * scanning it would make the draft-marker rule fire on every unsent issue and
 * teach everybody to ignore this tool. Everything else is scanned, `auto`
 * included: the machine snapshot's event titles, descriptions and alt text are
 * rendered into the email exactly like hand-written copy, and a localhost URL
 * that arrived in the snapshot reaches a reader the same way one typed by hand
 * does.
 */
function collectStrings(node: unknown, path: string, into: LocatedString[]): void {
  if (typeof node === "string") {
    into.push({ where: path, value: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((item, index) => collectStrings(item, `${path}[${index}]`, into));
    return;
  }
  if (node && typeof node === "object") {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (path === "" && key === "meta") continue;
      collectStrings(value, path === "" ? key : `${path}.${key}`, into);
    }
  }
}

/**
 * Rules 5-8 over every string in the issue except the subject line.
 *
 * The subject has already been through `lintSubjectLine` by the time this runs,
 * so it is excluded here to avoid reporting the same placeholder twice under
 * two rule ids.
 *
 * @param issue The raw parsed issue JSON — not schema-validated, on purpose.
 */
export function lintBody(issue: unknown): Finding[] {
  const strings: LocatedString[] = [];
  collectStrings(issue, "", strings);

  const findings: Finding[] = [];
  for (const { where, value } of strings) {
    if (where === "editorial.subjectLine") continue;
    const add = (rule: string, severity: Severity, message: string, hit: string): void => {
      findings.push({ rule, severity, where, message, excerpt: excerpt(value, hit) });
    };

    // Rule 5 — Mailchimp merge tags.
    if (MERGE_TAG.test(value)) {
      add(
        "body/merge-tag",
        "error",
        "A Mailchimp merge tag is still in the copy. Nothing in the Resend send path " +
          "substitutes these, so the reader sees the tag itself.",
        matched(MERGE_TAG, value)
      );
    }

    // Rule 6 — template variables.
    for (const variable of TEMPLATE_VARIABLES) {
      if (variable.re.test(value)) {
        add(
          "body/template-variable",
          "error",
          `The copy still contains ${variable.label}. It renders literally.`,
          matched(variable.re, value)
        );
        break;
      }
    }

    // Rule 7 — placeholder text.
    let placeholderFound = false;
    for (const pattern of HARD_PLACEHOLDERS) {
      if (pattern.test(value)) {
        placeholderFound = true;
        add("body/placeholder", "error", "The copy still contains placeholder text.", matched(pattern, value));
        break;
      }
    }
    if (!placeholderFound) {
      for (const pattern of SOFT_PLACEHOLDERS) {
        if (pattern.test(value)) {
          add(
            "body/placeholder",
            "warning",
            "The copy says TBC/TBD. Fine when something genuinely is not confirmed — " +
              "make sure it is not a slot nobody filled in.",
            matched(pattern, value)
          );
          break;
        }
      }
    }

    // Rule 8 — broken and placeholder links.
    for (const link of LINK_RULES) {
      if (link.re.test(value)) {
        add("body/link", link.severity, `This field contains ${link.label}.`, matched(link.re, value));
      }
    }
  }

  return findings;
}

/**
 * Lints one issue: the subject line, then everything else in the file.
 *
 * @param issueId The `YYYY-MM` id, which is the month rule's only authority.
 * @param issue The raw parsed JSON of the issue file.
 */
export function lintIssue(issueId: string, issue: unknown): LintResult {
  const notes: string[] = [];
  const editorial = (issue as { editorial?: { subjectLine?: unknown } }).editorial;
  const subject = editorial?.subjectLine;

  const findings: Finding[] = [];
  if (typeof subject === "string") {
    findings.push(...lintSubjectLine(subject, issueId, notes));
  } else {
    findings.push({
      rule: "subject/empty",
      severity: "error",
      where: "editorial.subjectLine",
      message: "The issue has no subject line at all.",
      excerpt: "",
    });
  }
  findings.push(...lintBody(issue));

  return { issueId, findings, notes };
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

/** Every `YYYY-MM` issue on disk, oldest first. */
function issueIdsOnDisk(): string[] {
  return readdirSync(ISSUE_DIR)
    .filter((name) => name.endsWith(".json"))
    .map((name) => name.replace(/\.json$/, ""))
    .filter((name) => ISSUE_ID.test(name))
    .sort();
}

/** Reads and parses one issue file, failing with a usable message. */
function readIssue(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as unknown;
  } catch (error) {
    console.error(`Error: could not read ${path}`);
    console.error(`       ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

/** Prints one issue's report for a human. Returns its error count. */
function report(result: LintResult): number {
  const errors = result.findings.filter((finding) => finding.severity === "error");
  const warnings = result.findings.filter((finding) => finding.severity === "warning");

  console.log("");
  console.log(result.issueId);

  for (const finding of [...errors, ...warnings]) {
    const tag = finding.severity === "error" ? "MUST FIX" : "look at ";
    console.log(`  ${tag}  [${finding.rule}]  ${finding.where}`);
    console.log(`            ${finding.message}`);
    if (finding.excerpt) console.log(`            found: ${finding.excerpt}`);
  }

  for (const note of result.notes) console.log(`  note      ${note}`);

  if (result.findings.length === 0) {
    console.log("  Nothing to fix. Nothing in this issue reads as an unfinished draft.");
  } else {
    console.log(`  ${errors.length} must fix, ${warnings.length} to look at.`);
  }

  return errors.length;
}

function main(): void {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const all = argv.includes("--all");

  const issueFlag = argv.indexOf("--issue");
  const fileFlag = argv.indexOf("--file");

  const targets: { issueId: string; path: string }[] = [];

  if (fileFlag >= 0) {
    const path = argv[fileFlag + 1];
    if (!path) {
      console.error("Error: --file needs a path to an issue JSON file.");
      process.exit(1);
    }
    // A draft file may be named anything; take its id from the filename when it
    // looks like one, and from the file's own `id` otherwise.
    const stem = basename(path).replace(/\.json$/, "");
    const raw = readIssue(resolve(path)) as { id?: unknown };
    const fromFile = typeof raw.id === "string" && ISSUE_ID.test(raw.id) ? raw.id : "";
    const issueId = ISSUE_ID.test(stem) ? stem : fromFile;
    if (!issueId) {
      console.error(
        `Error: cannot tell which month ${path} is for. Name it YYYY-MM.json or give it an "id".`
      );
      process.exit(1);
    }
    targets.push({ issueId, path: resolve(path) });
  } else if (issueFlag >= 0) {
    const issueId = argv[issueFlag + 1];
    if (!issueId || !ISSUE_ID.test(issueId)) {
      console.error(`Error: "${issueId ?? ""}" is not an issue id. Use YYYY-MM, e.g. 2026-08.`);
      process.exit(1);
    }
    targets.push({ issueId, path: join(ISSUE_DIR, `${issueId}.json`) });
  } else {
    const ids = issueIdsOnDisk();
    if (ids.length === 0) {
      console.error(`Error: no issue files found in ${ISSUE_DIR}.`);
      process.exit(1);
    }
    // Default to the newest issue: the one somebody is about to send.
    const chosen = all ? ids : [ids[ids.length - 1]];
    for (const id of chosen) targets.push({ issueId: id, path: join(ISSUE_DIR, `${id}.json`) });
  }

  const results = targets.map(({ issueId, path }) => lintIssue(issueId, readIssue(path)));
  const errors = results.reduce((count, result) => count + errorCount(result.findings), 0);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          ok: errors === 0,
          errors,
          warnings: results.reduce(
            (count, result) => count + (result.findings.length - errorCount(result.findings)),
            0
          ),
          issues: results,
        },
        null,
        2
      )
    );
  } else {
    console.log("She Sharp — newsletter content check (subject line and copy)");
    results.forEach(report);
    console.log("");
    if (errors > 0) {
      console.log(
        `${errors} thing${errors === 1 ? "" : "s"} must be fixed before this issue can be sent.`
      );
      console.log("Why each rule exists: the header of scripts/email/content-lint.ts");
    } else {
      console.log("All checks passed.");
    }
  }

  if (errors > 0) process.exit(1);
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main();
}
