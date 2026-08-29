/**
 * Checks for the route-2 import rules — `optin-rows.ts`, the decisions behind
 * `import-optin-subscribers.ts`.
 *
 * Run: `npx tsx scripts/email/optin-rows.test.ts`
 *
 * Worth testing at this level because every failure here is silent and lands on
 * real people. A row imported without a tick is somebody mailed who never
 * agreed; a `confirmedAt` that is not null lets a future import outrank a
 * suppression and resurrect somebody who left; a consent sentence missing the
 * event is a row nobody can defend when asked why it exists.
 *
 * No database and no network. The end-to-end check drives the real
 * `normalize-recipients.ts` over a synthetic CSV in a temp directory, because
 * the headline refusal — "no opt-in column" — is only meaningful against a file
 * that script actually produced.
 */

import assert from "node:assert";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  asRecipientsFile,
  composeConsentSource,
  countReasons,
  DEFAULT_FORM_NAME,
  HUMANITIX_OPTIN_QUESTION,
  isAffirmative,
  OPTIN_SOURCE,
  OptinImportError,
  parseOrderDate,
  planOptinImport,
  resolveColumns,
  type RecipientRow,
  type RecipientsFile,
} from "./optin-rows";

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

/** The same digest the real registers use, so hashes line up across fixtures. */
function hashEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/**
 * The TypeScript loader flags this test is itself running under.
 *
 * Reused for the child process rather than hard-coding `--import=tsx`, because
 * `tsx` is installed globally here and is not resolvable from the repo's own
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

/** Absolute path to a sibling script in `scripts/email/`. */
function sibling(name: string): string {
  return fileURLToPath(new URL(name, import.meta.url));
}

/**
 * Runs `normalize-recipients.ts` over a CSV and returns the file it wrote.
 *
 * @param dir The temp directory holding the CSV and receiving the output.
 * @param csv Path to the input CSV.
 * @param map The `--map` argument.
 * @returns The parsed recipients file.
 */
function runNormalize(dir: string, csv: string, map: string): RecipientsFile {
  execFileSync(
    process.execPath,
    [
      ...loaderArgs(),
      sibling("normalize-recipients.ts"),
      csv,
      "--key",
      "optin-test",
      "--map",
      map,
      "--for-import",
      "--consent-source",
      "synthetic fixture",
      "--consent-date",
      "2026-08-27",
      "--out-dir",
      dir,
    ],
    { stdio: "pipe" }
  );
  return asRecipientsFile(JSON.parse(readFileSync(join(dir, "recipients-optin-test.json"), "utf8")));
}

const OPT_IN_COLUMN = "Marketing opt-in";
const DATE_COLUMN = "Order date";

/** Builds one recipient fixture. */
function person(
  email: string,
  optIn: string | null,
  orderDate: string | null = "2026-08-27 21:34:11"
): RecipientRow {
  const fields: Record<string, string> = {};
  // normalize-recipients.ts only records non-empty cells, so a blank answer is
  // an ABSENT key rather than an empty string. The fixtures mirror that.
  if (optIn !== null) fields[OPT_IN_COLUMN] = optIn;
  if (orderDate !== null) fields[DATE_COLUMN] = orderDate;
  return { email, firstName: "Ada", lastName: "Lovelace", fields };
}

/** Builds a recipients-file fixture. */
function fileOf(recipients: RecipientRow[], optInColumn: string | null = OPT_IN_COLUMN): RecipientsFile {
  return {
    key: "les-mills-sep-2026",
    source: "/tmp/orders.local.csv",
    detected: {
      email: "Email",
      firstName: "Name",
      lastName: "Name",
      status: "Order status",
      optIn: optInColumn,
    },
    recipients,
  };
}

const CONSENT = composeConsentSource({
  form: DEFAULT_FORM_NAME,
  question: HUMANITIX_OPTIN_QUESTION,
  eventName: "Les Mills: Tech in Fitness",
  eventDate: "2026-09-03",
});

/** Runs a plan over a fixture with empty registers. */
function plan(file: RecipientsFile, suppressed: string[] = [], existing: string[] = []) {
  return planOptinImport({
    file,
    consentSource: CONSENT,
    suppressed: new Set(suppressed),
    existing: new Set(existing),
    hashEmail,
  });
}

// ---------------------------------------------------------------------------
// The headline refusal
// ---------------------------------------------------------------------------

check("a file with no opt-in column is refused outright", () => {
  // The single most important behaviour in the tool. consent-rules.md: "If
  // there is no opt-in column, there was no opt-in."
  assert.throws(
    () => plan(fileOf([person("a@example.com", null)], null)),
    (error: unknown) => {
      assert.ok(error instanceof OptinImportError);
      const text = error.lines.join("\n");
      assert.match(text, /no marketing opt-in column/);
      assert.match(text, /there was no opt-in/);
      assert.match(text, /newsletter\/subscribe/, "the alternative must be offered");
      return true;
    }
  );
});

check("a refusal names the rule, not a stack trace", () => {
  try {
    plan(fileOf([person("a@example.com", "Yes")], null));
    assert.fail("expected a refusal");
  } catch (error) {
    assert.ok(error instanceof OptinImportError);
    assert.ok(error.lines.length > 3, "the refusal explains itself over several lines");
  }
});

check("a rejected file is rejected even when every row says Yes", () => {
  // The tempting failure: the data looks consented, so surely it is. It is not
  // — the column that would carry the question is absent, so the tick belongs
  // to no question at all.
  assert.throws(
    () => plan(fileOf([person("a@example.com", "Yes"), person("b@example.com", "Yes")], null)),
    OptinImportError
  );
});

// ---------------------------------------------------------------------------
// Which rows survive
// ---------------------------------------------------------------------------

check('"Yes", "TRUE" and "Y" are kept', () => {
  const result = plan(
    fileOf([person("a@example.com", "Yes"), person("b@example.com", "TRUE"), person("c@example.com", "y")])
  );
  assert.strictEqual(result.rows.length, 3);
  assert.strictEqual(result.dropped.length, 0);
});

check('"No", blank and "false" are dropped and counted', () => {
  const result = plan(
    fileOf([
      person("a@example.com", "No"),
      person("b@example.com", null),
      person("c@example.com", "false"),
      person("d@example.com", ""),
      person("e@example.com", "Yes"),
    ])
  );
  assert.strictEqual(result.rows.length, 1, "only the tick survives");
  assert.strictEqual(result.dropped.length, 4);
  assert.deepStrictEqual(countReasons(result.dropped), [{ reason: "no marketing opt-in", count: 4 }]);
});

check("a dropped row is reported by hash, never by address", () => {
  const result = plan(fileOf([person("someone@example.com", "No")]));
  const text = JSON.stringify(result.dropped);
  assert.ok(!text.includes("someone@example.com"), "no address may reach a report");
  assert.strictEqual(result.dropped[0].emailHash, hashEmail("someone@example.com"));
});

check("unrecognised answers are treated as no", () => {
  // The asymmetry is deliberate: a missed subscriber can subscribe, a mailed
  // non-subscriber can only complain.
  for (const value of ["maybe", "n", "0", "unchecked", "later", "no thanks"]) {
    assert.strictEqual(isAffirmative(value), false, `"${value}" must not count as a tick`);
  }
  for (const value of ["yes", "Yes", " TRUE ", "1", "checked", "opted-in"]) {
    assert.strictEqual(isAffirmative(value), true, `"${value}" must count as a tick`);
  }
});

check("duplicates within one file collapse to one row", () => {
  const result = plan(
    fileOf([person("a@example.com", "Yes"), person("A@Example.com", "Yes"), person("b@example.com", "Yes")])
  );
  assert.strictEqual(result.rows.length, 2);
  assert.deepStrictEqual(countReasons(result.dropped), [{ reason: "duplicate in file", count: 1 }]);
});

check("a suppressed address is held back, never imported", () => {
  // consent-rules.md: "An import can never resurrect someone."
  const result = plan(fileOf([person("gone@example.com", "Yes"), person("b@example.com", "Yes")]), [
    hashEmail("gone@example.com"),
  ]);
  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.dropped[0].reason, "on the suppression register");
  assert.strictEqual(result.dropped[0].emailHash, hashEmail("gone@example.com"));
});

check("an existing subscriber is skipped rather than duplicated", () => {
  const result = plan(fileOf([person("known@example.com", "Yes")]), [], [hashEmail("known@example.com")]);
  assert.strictEqual(result.rows.length, 0);
  assert.strictEqual(result.dropped[0].reason, "already a subscriber");
});

check("suppression outranks 'already a subscriber' in the reported reason", () => {
  // Someone reading the report is asking why a person did not get on the list.
  // The strongest reason is the honest one.
  const hash = hashEmail("both@example.com");
  const result = plan(fileOf([person("both@example.com", "Yes")]), [hash], [hash]);
  assert.strictEqual(result.dropped[0].reason, "on the suppression register");
});

// ---------------------------------------------------------------------------
// What the rows record
// ---------------------------------------------------------------------------

check("the composed consent sentence carries question, event and date", () => {
  assert.ok(CONSENT.includes(HUMANITIX_OPTIN_QUESTION), "the exact question text");
  assert.ok(CONSENT.includes("Les Mills: Tech in Fitness"), "the event name");
  assert.ok(CONSENT.includes("2026-09-03"), "the event date");
  assert.ok(CONSENT.includes("Humanitix checkout"), "where it was asked");
});

check("the sentence cannot be composed with a part missing", () => {
  assert.throws(
    () =>
      composeConsentSource({
        form: DEFAULT_FORM_NAME,
        question: HUMANITIX_OPTIN_QUESTION,
        eventName: "  ",
        eventDate: "2026-09-03",
      }),
    OptinImportError
  );
});

check("every produced row carries the composed sentence", () => {
  const result = plan(fileOf([person("a@example.com", "Yes")]));
  assert.strictEqual(result.rows[0].consentSource, CONSENT);
  assert.strictEqual(result.rows[0].source, OPTIN_SOURCE);
  assert.strictEqual(result.rows[0].status, "subscribed");
});

check("confirmedAt is null on every produced row", () => {
  // These people ticked a box on somebody else's checkout. Writing a date here
  // would fabricate an act — and selectMailable() reads this field when
  // deciding whether a re-subscription outranks a suppression, so the lie
  // would have teeth.
  const result = plan(
    fileOf([person("a@example.com", "Yes"), person("b@example.com", "Y"), person("c@example.com", "1")])
  );
  assert.strictEqual(result.rows.length, 3);
  for (const row of result.rows) {
    assert.strictEqual(row.confirmedAt, null);
    assert.strictEqual(row.consentIp, null);
    assert.strictEqual(row.consentUserAgent, null);
  }
});

check("consentDate is the order's own date, not today", () => {
  const result = plan(
    fileOf([
      person("a@example.com", "Yes", "2026-08-27 21:34:11"),
      person("b@example.com", "Yes", "2026-08-28T09:00:00.000Z"),
    ])
  );
  assert.strictEqual(result.rows[0].consentDate.toISOString(), "2026-08-27T21:34:11.000Z");
  assert.strictEqual(result.rows[1].consentDate.toISOString(), "2026-08-28T09:00:00.000Z");
});

check("a row with no usable order date is dropped, not back-filled", () => {
  const result = plan(
    fileOf([person("a@example.com", "Yes", null), person("b@example.com", "Yes", "2026-08-27")])
  );
  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.dropped[0].reason, "no order date on the row");
});

check("a slash date is refused as ambiguous rather than guessed", () => {
  // 03/09/2026 is 3 September in New Zealand and 9 March in the United States.
  // A consent date six months out looks perfectly defensible and is not.
  const parsedDate = parseOrderDate("03/09/2026");
  assert.ok("reason" in parsedDate);
  assert.match(parsedDate.reason, /ambiguous/);
});

check("named-month and bare ISO dates are read as UTC", () => {
  const named = parseOrderDate("27 August 2026");
  assert.ok("date" in named);
  assert.strictEqual(named.date.toISOString(), "2026-08-27T00:00:00.000Z");

  const bare = parseOrderDate("2026-08-27");
  assert.ok("date" in bare);
  assert.strictEqual(bare.date.toISOString(), "2026-08-27T00:00:00.000Z");
});

check("an offset in the text is honoured rather than overwritten", () => {
  const parsedDate = parseOrderDate("2026-08-27T21:34:11+12:00");
  assert.ok("date" in parsedDate);
  assert.strictEqual(parsedDate.date.toISOString(), "2026-08-27T09:34:11.000Z");
});

check("no order-date column is a refusal that lists the columns present", () => {
  const bare: RecipientsFile = fileOf([
    { email: "a@example.com", firstName: null, lastName: null, fields: { [OPT_IN_COLUMN]: "Yes", Ticket: "General" } },
  ]);
  assert.throws(
    () => plan(bare),
    (error: unknown) => {
      assert.ok(error instanceof OptinImportError);
      const text = error.lines.join("\n");
      assert.match(text, /no order-date column/);
      assert.match(text, /not when this import ran/);
      assert.match(text, /- Ticket/, "the columns present are listed");
      return true;
    }
  );
});

check("--date-column overrides detection, and a wrong one is refused", () => {
  const file = fileOf([
    {
      email: "a@example.com",
      firstName: null,
      lastName: null,
      fields: { [OPT_IN_COLUMN]: "Yes", "Order date": "2026-01-01", "Paid at": "2026-08-27" },
    },
  ]);
  const result = planOptinImport({
    file,
    consentSource: CONSENT,
    dateColumn: "Paid at",
    suppressed: new Set(),
    existing: new Set(),
    hashEmail,
  });
  assert.strictEqual(result.rows[0].consentDate.toISOString(), "2026-08-27T00:00:00.000Z");

  assert.throws(() => resolveColumns(file, "Nope"), OptinImportError);
});

// ---------------------------------------------------------------------------
// Shape guard
// ---------------------------------------------------------------------------

check("a file that is not a recipients file is refused with a pointer", () => {
  assert.throws(
    () => asRecipientsFile({ hello: "world" }),
    (error: unknown) => {
      assert.ok(error instanceof OptinImportError);
      assert.match(error.lines.join("\n"), /normalize-recipients\.ts/);
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// End to end, over a real normalize-recipients run
// ---------------------------------------------------------------------------

check("a real CSV with no opt-in column normalizes, then is refused here", () => {
  // This is the case the whole tool exists to stop, and it has to be tested
  // against a file `normalize-recipients.ts` really produced: that script's
  // --for-import filter only fires when an opt-in column was mapped, so a CSV
  // with none passes through it INTACT. Composing with it is not enough; the
  // refusal has to live on this side too.
  const dir = mkdtempSync(join(tmpdir(), "optin-rows-"));
  try {
    const csv = join(dir, "orders.local.csv");
    writeFileSync(
      csv,
      ["Email,Name,Ticket Type,Order date", "a@example.com,Ada Lovelace,General,2026-08-27"].join("\n"),
      "utf8"
    );

    const produced = runNormalize(dir, csv, "email=Email,firstName=Name");
    assert.strictEqual(produced.recipients.length, 1, "--for-import kept the row: it has no opt-in column to test");
    assert.strictEqual(produced.detected.optIn, null);
    assert.throws(() => plan(produced), OptinImportError);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a real CSV with an opt-in column keeps only the ticks, end to end", () => {
  const dir = mkdtempSync(join(tmpdir(), "optin-rows-"));
  try {
    const csv = join(dir, "orders.local.csv");
    writeFileSync(
      csv,
      [
        "Email,Name,Order status,Marketing opt-in,Order date",
        "yes@example.com,Ada Lovelace,Completed,Yes,2026-08-27",
        "no@example.com,Grace Hopper,Completed,No,2026-08-27",
        "refunded@example.com,Joan Clarke,Refunded,Yes,2026-08-28",
      ].join("\n"),
      "utf8"
    );

    const produced = runNormalize(
      dir,
      csv,
      "email=Email,firstName=Name,status=Order status,optIn=Marketing opt-in"
    );
    const result = plan(produced);
    assert.strictEqual(result.rows.length, 1, "one tick, one row");
    assert.strictEqual(result.rows[0].email, "yes@example.com");
    assert.strictEqual(result.rows[0].confirmedAt, null);
    assert.strictEqual(result.rows[0].consentDate.toISOString(), "2026-08-27T00:00:00.000Z");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All optin-rows checks passed.");
