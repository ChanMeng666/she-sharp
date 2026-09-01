/**
 * Checks for the Humanitix opt-in exporter's rules.
 *
 * Run: `npx tsx scripts/humanitix/optin-orders.test.ts`
 *
 * Offline and pure — no network, no key, no database — which is why it belongs
 * as a step in the single `verify` job rather than in a job of its own
 * (`docs/development/TESTING.md`).
 *
 * CLAUDE.md's rule shapes this file: a guard is not verified until you have
 * broken the thing it guards. Two of the things guarded here fail *silently*
 * when broken, which is why they get the most assertions:
 *
 *  - **The column contract.** If a header stops matching what
 *    `normalize-recipients.ts` and `optin-rows.ts` look for, nothing throws:
 *    the chain either refuses the file (loud, fine) or — worse — reads a
 *    different column and imports people under a consent date nobody consented
 *    on. The detection predicates are re-implemented here from those two
 *    modules, where they are private, and the test asserts the headers against
 *    the copies. A drift between the copy and the original is caught by the
 *    live end-to-end run recorded in the PR, not by this file; what this file
 *    catches is somebody renaming a column here.
 *  - **The field allowlist.** A reviver that quietly stopped dropping
 *    `accessCode` would produce output that looks exactly the same, right up
 *    until a code reaches a file.
 */

import assert from "node:assert";

import {
  judgeOptinSwitch,
  OPTIN_CSV_COLUMNS,
  selectOptinOrders,
  toOptinCsv,
  type OptinCsvRow,
} from "./optin-orders";
import { OPTIN_COUNT_FIELDS, OPTIN_EXPORT_FIELDS, parseOrdersForTest } from "./orders-api";

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

/** A trivial stand-in for `hashEmail`, so this file stays free of crypto. */
const fakeHash = (email: string): string => `h:${email}`;

// ---------------------------------------------------------------------------
// Local copies of the downstream detection predicates
//
// These are private to scripts/email/normalize-recipients.ts and
// scripts/email/optin-rows.ts. Copied rather than exported, because widening
// those modules' public surface so a test can read them is a worse trade than
// two short functions with a comment saying where they came from.
// ---------------------------------------------------------------------------

/** `compact()` from both modules: alphanumerics only. */
function compact(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** `isOptInHeader()` from normalize-recipients.ts. */
function isOptInHeader(header: string): boolean {
  const key = compact(header);
  if (key.includes("subscribe")) return true;
  if (key.includes("canweemail")) return true;
  return key.includes("opt") && (key.includes("in") || key.includes("marketing"));
}

/** `ALIASES` from normalize-recipients.ts, for the four mapped fields. */
const ALIASES: Record<string, string[]> = {
  email: ["email", "attendee email", "buyer email", "e-mail", "email address", "e-mail address"],
  firstName: ["first name", "firstname", "given name", "attendee first name"],
  lastName: ["last name", "lastname", "surname", "family name"],
  status: ["order status", "status", "ticket status", "attendee status"],
};

/** `FULL_NAME_ALIASES` from normalize-recipients.ts. */
const FULL_NAME_ALIASES = ["name", "full name", "attendee name"];

/** `ORDER_DATE_ALIASES` from optin-rows.ts. */
const ORDER_DATE_ALIASES = [
  "order date", "order completed", "order completed date", "order completed at",
  "completed date", "date completed", "order created", "order created at", "created at",
  "created date", "purchase date", "date purchased", "order time", "timestamp", "date",
];

/** `OPT_IN_VALUES` / `AFFIRMATIVE`, which are the same set in both modules. */
const AFFIRMATIVE = new Set(["yes", "y", "true", "1", "checked", "opted in"]);

/** `CANCELLED_STATUS_MARKERS` from normalize-recipients.ts. */
const CANCELLED_STATUS_MARKERS = ["cancel", "refund", "declin", "void"];

/** `ISO_DATE` from optin-rows.ts. */
const ISO_DATE =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
/** `SLASHED_DATE` from optin-rows.ts — the form it refuses. */
const SLASHED_DATE = /^\d{1,2}\s*[/.]\s*\d{1,2}\s*[/.]\s*\d{2,4}/;

// ---------------------------------------------------------------------------
// The column contract
// ---------------------------------------------------------------------------

const HEADERS = [...OPTIN_CSV_COLUMNS];

test("the headers are exactly the six the chain expects, in order", () => {
  assert.deepStrictEqual(HEADERS, [
    "Email",
    "First name",
    "Last name",
    "Order status",
    "Marketing opt-in",
    "Order completed",
  ]);
});

test("each mapped field resolves to exactly one column", () => {
  for (const [field, aliases] of Object.entries(ALIASES)) {
    const wanted = new Set(aliases.map(compact));
    const hits = HEADERS.filter((header) => wanted.has(compact(header)));
    assert.strictEqual(hits.length, 1, `${field} matched ${hits.length} columns: ${hits}`);
  }
});

test("INVARIANT 1 — exactly one column matches isOptInHeader()", () => {
  const hits = HEADERS.filter(isOptInHeader);
  assert.deepStrictEqual(
    hits,
    ["Marketing opt-in"],
    "normalize-recipients.ts takes headers.find(isOptInHeader), so a second matching " +
      "column would make the consent answer depend on column order"
  );
});

test("INVARIANT 2 — exactly one column matches an ORDER_DATE_ALIASES entry", () => {
  const wanted = new Set(ORDER_DATE_ALIASES.map(compact));
  const hits = HEADERS.filter((header) => wanted.has(compact(header)));
  assert.deepStrictEqual(
    hits,
    ["Order completed"],
    "findOrderDateColumn() takes headers.find(...), and both `created at` and " +
      "`order created` are aliases — a second date column makes the consent date a coin toss"
  );
});

test("a second date column would break invariant 2 — so the invariant is not vacuous", () => {
  const wanted = new Set(ORDER_DATE_ALIASES.map(compact));
  const withExtra = [...HEADERS, "Created at"];
  assert.strictEqual(
    withExtra.filter((header) => wanted.has(compact(header))).length,
    2,
    "if this is not 2, the alias list this test copied has drifted"
  );
});

test("a second opt-in column would break invariant 1 — so that one is not vacuous either", () => {
  assert.strictEqual([...HEADERS, "Opt-in source"].filter(isOptInHeader).length, 2);
});

test("no column would be split as a full name", () => {
  const wanted = new Set(FULL_NAME_ALIASES.map(compact));
  assert.ok(
    !HEADERS.some((header) => wanted.has(compact(header))),
    "a matching column would make normalize-recipients.ts split it at the first space"
  );
});

// ---------------------------------------------------------------------------
// The cell values
// ---------------------------------------------------------------------------

/** One synthetic order carrying every field the API sends, PII included. */
function order(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    _id: "order-1",
    email: "ada@example.test",
    firstName: "Ada",
    lastName: "Lovelace",
    mobile: "+64 21 555 0100",
    organisation: "Analytical Engines Ltd",
    accessCode: "K5SJHRMS",
    additionalFields: [{ name: "Dietary", value: "none" }],
    address: { line1: "1 Somewhere St", city: "Auckland" },
    status: "complete",
    financialStatus: "paid",
    organiserMailListOptIn: true,
    completedAt: "2026-08-26T02:11:00.000Z",
    createdAt: "2026-08-26T02:10:00.000Z",
    updatedAt: "2026-08-26T02:11:00.000Z",
    ...overrides,
  };
}

test("the opt-in cell is a value both modules read as affirmative", () => {
  const { rows } = selectOptinOrders([order()], fakeHash);
  assert.strictEqual(rows[0]["Marketing opt-in"], "Yes");
  assert.ok(AFFIRMATIVE.has(rows[0]["Marketing opt-in"].toLowerCase()));
});

test("Order status carries financialStatus, so a refund is excluded downstream", () => {
  const { rows, counts } = selectOptinOrders([order({ financialStatus: "refunded" })], fakeHash);
  assert.strictEqual(rows[0]["Order status"], "refunded");
  assert.ok(
    CANCELLED_STATUS_MARKERS.some((marker) => rows[0]["Order status"].includes(marker)),
    "normalize-recipients.ts must recognise this cell as cancelled"
  );
  assert.strictEqual(counts.refundedAmongOptedIn, 1, "and the count must let the two reconcile");
});

test("writing `status` instead would let a refund through — so the choice is load-bearing", () => {
  assert.ok(
    !CANCELLED_STATUS_MARKERS.some((marker) => "complete".includes(marker)),
    "`complete` matches no cancellation marker, which is why financialStatus is used"
  );
});

test("Order completed is a verbatim ISO instant parseOrderDate() accepts", () => {
  const { rows } = selectOptinOrders([order()], fakeHash);
  const cell = rows[0]["Order completed"];
  assert.strictEqual(cell, "2026-08-26T02:11:00.000Z", "verbatim, not reformatted");
  assert.ok(ISO_DATE.test(cell), "ISO_DATE must accept it");
  assert.ok(!SLASHED_DATE.test(cell), "SLASHED_DATE must not, or it would be refused as ambiguous");
});

test("names are written verbatim, never joined into one cell", () => {
  const { rows } = selectOptinOrders([order()], fakeHash);
  assert.strictEqual(rows[0]["First name"], "Ada");
  assert.strictEqual(rows[0]["Last name"], "Lovelace");
});

// ---------------------------------------------------------------------------
// The row filter
// ---------------------------------------------------------------------------

test("only complete AND ticked AND addressed rows are written", () => {
  const { rows, counts } = selectOptinOrders(
    [
      order({ _id: "a" }),
      order({ _id: "b", status: "cancelled" }),
      order({ _id: "c", organiserMailListOptIn: false }),
      order({ _id: "d", email: "" }),
      order({ _id: "e", completedAt: "" }),
    ],
    fakeHash
  );
  assert.strictEqual(rows.length, 1);
  assert.deepStrictEqual(
    { ...counts, distinctEmails: counts.distinctEmails },
    {
      ordersSeen: 5,
      notComplete: 1,
      noOptIn: 1,
      optedIn: 3,
      refundedAmongOptedIn: 0,
      noEmail: 1,
      noCompletedAt: 1,
      distinctEmails: 1,
      duplicateOrders: 0,
    }
  );
});

test('a string "false" does not count as a tick', () => {
  const { rows, counts } = selectOptinOrders(
    [order({ organiserMailListOptIn: "false" })],
    fakeHash
  );
  assert.strictEqual(rows.length, 0, "truthiness must not stand in for the boolean");
  assert.strictEqual(counts.noOptIn, 1);
});

test("missing organiserMailListOptIn is not a tick", () => {
  const row = order();
  delete row.organiserMailListOptIn;
  assert.strictEqual(selectOptinOrders([row], fakeHash).rows.length, 0);
});

// ---------------------------------------------------------------------------
// Ordering and duplicates
// ---------------------------------------------------------------------------

test("rows come out ascending, so the kept duplicate is the EARLIEST tick", () => {
  const { rows, counts } = selectOptinOrders(
    [
      order({ _id: "late", email: "ada@example.test", completedAt: "2026-08-30T00:00:00.000Z" }),
      order({ _id: "early", email: "ada@example.test", completedAt: "2026-08-26T00:00:00.000Z" }),
      order({ _id: "mid", email: "grace@example.test", completedAt: "2026-08-28T00:00:00.000Z" }),
    ],
    fakeHash
  );
  assert.deepStrictEqual(
    rows.map((row) => row["Order completed"]),
    ["2026-08-26T00:00:00.000Z", "2026-08-28T00:00:00.000Z", "2026-08-30T00:00:00.000Z"]
  );
  // normalize-recipients.ts keeps the first occurrence, so this is the row
  // whose date becomes the recorded consentDate.
  assert.strictEqual(rows[0].Email, "ada@example.test");
  assert.strictEqual(counts.duplicateOrders, 1, "duplicates are reported, never dropped here");
  assert.strictEqual(counts.distinctEmails, 2);
});

test("hashes line up with the written rows and carry no address", () => {
  const { rows, hashes } = selectOptinOrders([order()], fakeHash);
  assert.strictEqual(hashes.length, rows.length);
  assert.strictEqual(hashes[0], "h:ada@example.test", "the injected hash is what is called");
});

// ---------------------------------------------------------------------------
// Serialisation
// ---------------------------------------------------------------------------

test("zero rows still produce a header, never a zero-byte file", () => {
  assert.strictEqual(toOptinCsv([]), HEADERS.join(","));
});

test("the CSV has the header row and one line per row", () => {
  const { rows } = selectOptinOrders([order(), order({ _id: "2", email: "g@example.test" })], fakeHash);
  const lines = toOptinCsv(rows).split("\n");
  assert.strictEqual(lines[0], "Email,First name,Last name,Order status,Marketing opt-in,Order completed");
  assert.strictEqual(lines.length, 3);
});

test("a comma or quote in a name cannot break the row apart", () => {
  const rows: OptinCsvRow[] = [
    {
      Email: "x@example.test",
      "First name": 'Ada, "the" ',
      "Last name": "Lovelace",
      "Order status": "paid",
      "Marketing opt-in": "Yes",
      "Order completed": "2026-08-26T00:00:00.000Z",
    },
  ];
  const lines = toOptinCsv(rows).split("\n");
  assert.strictEqual(lines.length, 2);
  assert.ok(lines[1].includes('"Ada, ""the"" "'));
});

// ---------------------------------------------------------------------------
// The field allowlist — break the thing it guards
// ---------------------------------------------------------------------------

/** A synthetic orders page carrying exactly what must never survive. */
const ORDERS_PAGE = JSON.stringify({
  total: 1,
  page: 1,
  pageSize: 100,
  orders: [order()],
});

test("the export allowlist drops accessCode, mobile, additionalFields and the address", () => {
  const envelope = parseOrdersForTest(ORDERS_PAGE, OPTIN_EXPORT_FIELDS);
  assert.ok(envelope, "the page must parse");
  const row = (envelope.orders as Record<string, unknown>[])[0];
  for (const forbidden of ["accessCode", "mobile", "additionalFields", "address", "organisation"]) {
    assert.ok(!(forbidden in row), `${forbidden} survived the reviver`);
  }
  // And a JSON dump of the whole envelope cannot contain them either — this is
  // the assertion that would catch a reviver that returned the value under a
  // different key.
  const dumped = JSON.stringify(envelope);
  for (const secret of ["K5SJHRMS", "+64 21 555 0100", "Somewhere St", "Dietary"]) {
    assert.ok(!dumped.includes(secret), `${secret} reached the parsed object`);
  }
});

test("the export allowlist keeps every field the exporter needs", () => {
  const envelope = parseOrdersForTest(ORDERS_PAGE, OPTIN_EXPORT_FIELDS);
  const row = (envelope?.orders as Record<string, unknown>[])[0];
  for (const wanted of OPTIN_EXPORT_FIELDS) {
    assert.ok(wanted in row, `${wanted} was dropped, so the exporter would emit an empty cell`);
  }
});

test("the count allowlist keeps two fields and drops the address as well", () => {
  const envelope = parseOrdersForTest(ORDERS_PAGE, OPTIN_COUNT_FIELDS);
  const row = (envelope?.orders as Record<string, unknown>[])[0];
  assert.deepStrictEqual(Object.keys(row).sort(), ["organiserMailListOptIn", "status"]);
  assert.ok(!JSON.stringify(envelope).includes("ada@example.test"), "no address may survive");
});

test("the pagination envelope survives, or the walk could not terminate", () => {
  const envelope = parseOrdersForTest(ORDERS_PAGE, OPTIN_COUNT_FIELDS);
  assert.strictEqual(envelope?.total, 1);
  assert.ok(Array.isArray(envelope?.orders));
});

test("array indices survive, so a page of many orders is not collapsed", () => {
  const page = JSON.stringify({
    total: 3,
    orders: [order({ _id: "a" }), order({ _id: "b" }), order({ _id: "c" })],
  });
  const envelope = parseOrdersForTest(page, OPTIN_COUNT_FIELDS);
  assert.strictEqual((envelope?.orders as unknown[]).length, 3);
});

// ---------------------------------------------------------------------------
// The switch verdict
// ---------------------------------------------------------------------------

/** Builds a judgement input with the script's own default thresholds. */
function judge(over: Partial<Parameters<typeof judgeOptinSwitch>[0]>) {
  return judgeOptinSwitch({
    completeOrders: 0,
    ticks: 0,
    firstOrderAt: null,
    firstTickAt: null,
    ordersBeforeFirstTick: null,
    minOrders: 10,
    problemAt: 25,
    ...over,
  });
}

test("one tick is OK however few the orders — asymmetric evidence", () => {
  assert.strictEqual(judge({ completeOrders: 1, ticks: 1 }).verdict, "OK");
  assert.strictEqual(judge({ completeOrders: 400, ticks: 1 }).verdict, "OK");
});

test("zero ticks under the floor is NO EVIDENCE YET, never clean", () => {
  assert.strictEqual(judge({ completeOrders: 0 }).verdict, "NO EVIDENCE YET");
  assert.strictEqual(judge({ completeOrders: 9 }).verdict, "NO EVIDENCE YET");
});

test("zero ticks between the thresholds is WARN", () => {
  assert.strictEqual(judge({ completeOrders: 10 }).verdict, "WARN");
  assert.strictEqual(judge({ completeOrders: 24 }).verdict, "WARN");
});

test("zero ticks at or above problemAt is PROBLEM", () => {
  assert.strictEqual(judge({ completeOrders: 25 }).verdict, "PROBLEM");
  assert.strictEqual(judge({ completeOrders: 900 }).verdict, "PROBLEM");
});

test("the thresholds are honoured, not hard-coded", () => {
  assert.strictEqual(judge({ completeOrders: 12, minOrders: 20, problemAt: 40 }).verdict, "NO EVIDENCE YET");
  assert.strictEqual(judge({ completeOrders: 12, minOrders: 5, problemAt: 10 }).verdict, "PROBLEM");
});

test("the late-switch flag fires on the 2026-08-26 signature", () => {
  const result = judge({
    completeOrders: 40,
    ticks: 16,
    firstOrderAt: "2026-07-01T00:00:00.000Z",
    firstTickAt: "2026-08-26T02:11:00.000Z",
    ordersBeforeFirstTick: 24,
  });
  assert.strictEqual(result.verdict, "OK", "ticks make it OK — which is why the flag is needed");
  assert.strictEqual(result.lateSwitch, true);
  assert.ok(result.lines.some((line) => line.includes("LATE SWITCH")));
  assert.ok(result.lines.some((line) => line.includes("24 order(s) were placed before")));
});

test("an event ticked from its first order is not flagged late", () => {
  const result = judge({
    completeOrders: 40,
    ticks: 16,
    firstOrderAt: "2026-08-26T02:11:00.000Z",
    firstTickAt: "2026-08-26T02:11:00.000Z",
    ordersBeforeFirstTick: 0,
  });
  assert.strictEqual(result.lateSwitch, false);
});

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All Humanitix opt-in exporter checks passed.");
