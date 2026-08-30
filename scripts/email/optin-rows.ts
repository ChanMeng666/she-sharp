/**
 * The decisions behind a route-2 subscriber import, with no database and no
 * filesystem attached.
 *
 * `import-optin-subscribers.ts` is the CLI around this module. Everything that
 * can be got wrong — which rows carry an opt-in, what the consent sentence
 * says, which date is recorded as the consent date — lives here instead of
 * there, for the same reason `decideSubscribe()` was lifted out of
 * `subscribe()`: the rule is the expensive part, and a rule that needs a
 * production database to exercise is a rule nobody exercises.
 *
 * "Route 2" is the second of the four consent routes in
 * `.claude/skills/update-mailing-list/references/consent-rules.md`: a tick-box
 * on a registration form. It is the only one of routes 2–4 that can be
 * automated at all, because it is the only one whose evidence arrives as a
 * column in a file rather than as a colleague's recollection.
 */

/**
 * The wording of Humanitix's built-in checkout opt-in, verified 2026-08-30
 * against the live OpenAPI document (`organiserMailListOptIn`, a boolean on the
 * `Order` schema — absent from `Event` and `Ticket`) and Humanitix's own help
 * articles 8914023, 9772313 and 8950849.
 *
 * It is quoted rather than paraphrased because `consentSource` has to be the
 * sentence a human would stand behind in front of a complaint, and "we asked
 * something like this" is not that. The control is built in and its wording is
 * not editable by the host, which is exactly why it can be a default here — any
 * OTHER platform's question must be supplied with `--question`.
 */
export const HUMANITIX_OPTIN_QUESTION =
  "Keep me updated on the latest news, events, and exclusive offers from the event host";

/** Where that question is asked, when nobody says otherwise. */
export const DEFAULT_FORM_NAME = "Humanitix checkout";

/**
 * The machine-readable route recorded in `newsletter_subscribers.source`.
 *
 * It names the consent ROUTE, not the vendor: the same tick-box reaches us from
 * Eventbrite and from a Google Form, and a row stamped `humanitix-optin` that
 * came out of an Eventbrite export would be false in the one column a reader
 * cannot check against anything. The platform is named in `consentSource`,
 * where it belongs, beside the question it asked.
 */
export const OPTIN_SOURCE = "registration-optin";

/** A refusal, carried as the lines the CLI should print. */
export class OptinImportError extends Error {
  readonly lines: string[];

  constructor(lines: string[]) {
    super(lines[0]);
    this.name = "OptinImportError";
    this.lines = lines;
  }
}

// ---------------------------------------------------------------------------
// The shape `normalize-recipients.ts --map` writes
// ---------------------------------------------------------------------------

/** One recipient as the recipients file holds them. */
export interface RecipientRow {
  email: string;
  firstName: string | null;
  lastName: string | null;
  /** Every non-empty source column, keyed by its header. */
  fields: Record<string, string>;
}

/** The subset of `normalize-recipients.ts`'s output this importer reads. */
export interface RecipientsFile {
  key: string;
  source: string;
  /** field → header, as that script detected or was told. */
  detected: Record<string, string | null>;
  recipients: RecipientRow[];
}

/**
 * Checks that a parsed JSON blob really is a recipients file.
 *
 * @param value Anything `JSON.parse` returned.
 * @returns The same value, typed.
 * @throws OptinImportError when the shape is wrong — pointing at the script
 *   that produces the right one rather than leaving a stack trace.
 */
export function asRecipientsFile(value: unknown): RecipientsFile {
  const file = value as Partial<RecipientsFile> | null;
  if (
    !file ||
    typeof file !== "object" ||
    !Array.isArray(file.recipients) ||
    typeof file.detected !== "object" ||
    file.detected === null
  ) {
    throw new OptinImportError([
      "that file is not a recipients file.",
      "This importer reads the JSON that normalize-recipients.ts writes, not a CSV.",
      "Build one first:",
      "  npx tsx scripts/email/normalize-recipients.ts <export.csv> --key <k> --map \"…\" \\",
      "    --for-import --consent-source \"…\" --consent-date YYYY-MM-DD --tier 0",
    ]);
  }
  return file as RecipientsFile;
}

// ---------------------------------------------------------------------------
// The consent sentence
// ---------------------------------------------------------------------------

export interface ConsentSourceInput {
  /** Where the question was asked, e.g. "Humanitix checkout". */
  form: string;
  /** The exact question text, quoted verbatim. */
  question: string;
  /** The event whose registration form asked it. */
  eventName: string;
  /** That event's date, `YYYY-MM-DD`. */
  eventDate: string;
}

/**
 * Builds the `consentSource` sentence from its three mandatory parts.
 *
 * Route 2 requires the exact question text, the event name and the event date.
 * Composing the sentence here rather than accepting one on the command line is
 * the difference between a rule and a suggestion: a free-text `--consent-source`
 * can be typed as "Humanitix opt-in" and pass every check in the system, and
 * nobody notices until somebody asks which event that was.
 *
 * The date stays in `YYYY-MM-DD`. "3 September 2026" reads better and
 * "03/09/2026" is a different day either side of the Pacific.
 *
 * @param input The form, the question and the event.
 * @returns The sentence to store on every row of this import.
 * @throws OptinImportError when any part is blank.
 */
export function composeConsentSource(input: ConsentSourceInput): string {
  const missing = (Object.keys(input) as (keyof ConsentSourceInput)[]).filter(
    (key) => input[key].trim().length === 0
  );
  if (missing.length > 0) {
    throw new OptinImportError([
      `the consent sentence is missing ${missing.join(", ")}.`,
      "Route 2 records the exact question text, the event name and the event date.",
      "A sentence short of any of those cannot answer \"why is this person on our list?\".",
    ]);
  }
  return `${input.form.trim()} opt-in "${input.question.trim()}" — ${input.eventName.trim()}, ${input.eventDate.trim()}`;
}

// ---------------------------------------------------------------------------
// The order date
// ---------------------------------------------------------------------------

/** Header aliases for the column holding when the order was completed. */
const ORDER_DATE_ALIASES = [
  "order date",
  "order completed",
  "order completed date",
  "order completed at",
  "completed date",
  "date completed",
  "order created",
  "order created at",
  "created at",
  "created date",
  "purchase date",
  "date purchased",
  "order time",
  "timestamp",
  "date",
];

/** Alphanumeric-only form of a header, matching normalize-recipients.ts. */
function compact(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Finds the column holding each order's own completion date.
 *
 * @param headers Every column present in the recipients file.
 * @param override A column named on the command line, which always wins.
 * @returns The header to read.
 * @throws OptinImportError when nothing matches — listing what is there, so the
 *   colleague can name the column instead of guessing at the alias list.
 */
export function findOrderDateColumn(headers: string[], override: string | null): string {
  if (override) {
    const hit = headers.find((header) => compact(header) === compact(override));
    if (!hit) {
      throw new OptinImportError([
        `--date-column "${override}" is not a column in that file.`,
        "Columns present:",
        ...headers.map((header) => `  - ${header}`),
      ]);
    }
    return hit;
  }

  const wanted = new Set(ORDER_DATE_ALIASES.map(compact));
  const hit = headers.find((header) => wanted.has(compact(header)));
  if (!hit) {
    throw new OptinImportError([
      "no order-date column found, so there is no consent date to record.",
      "`consentDate` is when the person ticked the box, which is when they placed",
      "their order — not when this import ran. Recording the import date instead",
      "would date the consent to a moment nobody consented at.",
      "",
      "Name the column explicitly with --date-column \"<header>\". Columns present:",
      ...headers.map((header) => `  - ${header}`),
    ]);
  }
  return hit;
}

const MONTHS = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sep", "oct", "nov", "dec",
];

/** `YYYY-MM-DD` with an optional time and an optional zone. */
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?$/;
/** `3 Sep 2026`, `03 September 2026`, with an optional time. */
const NAMED_DATE = /^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?m\.?)?)?$/i;
/** `03/09/2026`, `3.9.26` — deliberately refused, see below. */
const SLASHED_DATE = /^\d{1,2}\s*[/.]\s*\d{1,2}\s*[/.]\s*\d{2,4}/;

/**
 * Reads an order timestamp out of a CSV cell.
 *
 * Two deliberate strictnesses:
 *
 * - **A purely numeric slash date is refused, not guessed.** `03/09/2026` is
 *   3 September in New Zealand and 9 March in the United States, and a consent
 *   date six months out is worse than one that is missing: the missing one gets
 *   the row dropped and reported, the wrong one is silently defensible-looking.
 * - **A timestamp with no zone is read as UTC**, following
 *   `import-mailchimp-subscribers.ts`. A consent date out by a few hours does
 *   not change what it evidences; inventing a zone would be worse than
 *   admitting one.
 *
 * @param raw The cell value.
 * @returns The parsed date, or the reason it was not usable.
 */
export function parseOrderDate(raw: string | undefined): { date: Date } | { reason: string } {
  const value = (raw ?? "").trim();
  if (value.length === 0) return { reason: "no order date on the row" };

  if (SLASHED_DATE.test(value)) {
    return {
      reason: "ambiguous order date (a slash date could be day-first or month-first)",
    };
  }

  const iso = ISO_DATE.exec(value);
  if (iso) {
    // No zone in the text means no zone was recorded; read it as UTC.
    const date = new Date(iso[4] ? value.replace(" ", "T") : `${value.replace(" ", "T")}Z`);
    return Number.isNaN(date.getTime()) ? { reason: "unreadable order date" } : { date };
  }

  const named = NAMED_DATE.exec(value);
  if (named) {
    const month = MONTHS.indexOf(named[2].slice(0, 3).toLowerCase());
    if (month !== -1) {
      const date = new Date(Date.UTC(Number(named[3]), month, Number(named[1])));
      return Number.isNaN(date.getTime()) ? { reason: "unreadable order date" } : { date };
    }
  }

  return { reason: "unreadable order date" };
}

// ---------------------------------------------------------------------------
// The opt-in cell
// ---------------------------------------------------------------------------

/**
 * Values that count as a tick.
 *
 * Kept in step with `OPT_IN_VALUES` in `normalize-recipients.ts` on purpose:
 * this importer re-checks every row rather than trusting that the file it was
 * handed came out of `--for-import` at all. See `resolveColumns()` for why.
 */
const AFFIRMATIVE = new Set(["yes", "y", "true", "1", "checked", "opted in"]);

/** Normalizes a cell for comparison (case, punctuation, spacing). */
function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Reports whether a cell records an affirmative answer.
 *
 * Anything unrecognised — "No", "false", a blank, a stray note — is not a tick.
 * The default has to be "did not opt in", because the cost of the two mistakes
 * is not symmetric: a missed subscriber can subscribe, a mailed non-subscriber
 * can only complain.
 *
 * @param value The cell, or undefined when the column was empty for this row.
 * @returns True only for a recognised affirmative.
 */
export function isAffirmative(value: string | undefined): boolean {
  if (value === undefined) return false;
  return AFFIRMATIVE.has(normalizeValue(value));
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/** One row this import would write, complete except for its timestamps. */
export interface PlannedRow {
  email: string;
  emailHash: string;
  firstName: string | null;
  lastName: string | null;
  status: "subscribed";
  source: string;
  consentSource: string;
  /** The order's own completion date. Never the import date. */
  consentDate: Date;
  consentIp: null;
  consentUserAgent: null;
  /**
   * Always null on this route. These people ticked a box on somebody else's
   * checkout; they never clicked a confirmation link of ours, and writing
   * anything here would fabricate an act. `selectMailable()` reads this field
   * when deciding whether a re-subscription outranks a suppression, so a wrong
   * value would not merely be untidy — it would let an import resurrect
   * somebody who left.
   */
  confirmedAt: null;
}

/** One row that will not be written, and why. */
export interface DroppedRow {
  /** sha256 of the address. Never the address — this ends up in reports. */
  emailHash: string;
  reason: string;
}

export interface OptinPlan {
  /** The composed sentence every row carries. */
  consentSource: string;
  /** The column the opt-in was read from. */
  optInColumn: string;
  /** The column the consent date was read from. */
  dateColumn: string;
  rows: PlannedRow[];
  dropped: DroppedRow[];
  /**
   * `--exclude` addresses that matched nobody in the file.
   *
   * Reported rather than ignored: an exclusion that silently matches nothing is
   * indistinguishable from one that worked, and the operator typed it because
   * they believed that person was in this import. A mistyped address, the wrong
   * file, or a person who was never in it are three different situations and
   * only the operator can tell which.
   */
  unmatchedExclusions: ExcludedAddress[];
}

export interface PlanInput {
  file: RecipientsFile;
  consentSource: string;
  /** Column named on the command line, when the file's detection was wrong. */
  dateColumn?: string | null;
  /**
   * Addresses named with `--exclude`, because a human found them on the event's
   * own unsubscriber list. See `assertUnsubscriberCheck()`.
   */
  excluded?: ExcludedAddress[];
  /** Committed register plus the runtime `email_optouts` table, lowercased. */
  suppressed: Set<string>;
  /** Every `email_hash` already in `newsletter_subscribers`, lowercased. */
  existing: Set<string>;
  /** Injected so this module never imports node:crypto or the suppression file. */
  hashEmail: (email: string) => string;
}

/**
 * Resolves the two columns an import cannot proceed without, refusing loudly
 * when either is absent.
 *
 * Separate from `planOptinImport()` so the CLI can run both refusals *before*
 * it opens a database connection. The no-opt-in-column refusal is the single
 * most important behaviour in this tool, and a refusal that needs production
 * credentials to fire is one nobody can demonstrate.
 *
 * **Why the opt-in column is checked here at all**, given
 * `normalize-recipients.ts --for-import` refuses such a file too: because a
 * recipients file can reach this importer without ever having been through
 * that flag. It might have been built for a fulfilment send, produced before
 * `forImportOptInRefusal()` existed (until 2026-08-30 that run succeeded and
 * wrote a full file reporting `Excluded 0`), or edited by hand — the shape is
 * plain JSON. So the strongest rule in the system is enforced at both ends
 * rather than inherited from a file this script did not write.
 *
 * @param file The recipients file.
 * @param dateColumn A column named on the command line, which always wins.
 * @returns The opt-in column and the order-date column.
 * @throws OptinImportError when either is missing.
 */
export function resolveColumns(
  file: RecipientsFile,
  dateColumn: string | null = null
): { optInColumn: string; dateColumn: string } {
  const optInColumn = file.detected?.optIn ?? null;
  if (!optInColumn) {
    throw new OptinImportError([
      "that file records no marketing opt-in column, so nobody in it may be imported.",
      "",
      "consent-rules.md, route 2:",
      "",
      '  "If there is no opt-in column, there was no opt-in — a form that only asked',
      '   for a name and a ticket type cannot retroactively have asked for consent."',
      "",
      "If the registration form DID ask, re-run normalize-recipients.ts with the",
      "question's column mapped:",
      '  --map "email=…,optIn=<the question column>" --for-import',
      "",
      "If it did not ask, this is the end of the road for an import. Send these",
      "people https://www.shesharp.org.nz/newsletter/subscribe instead — it puts",
      "them on the list today, with better evidence than any import produces.",
    ]);
  }

  const headers = new Set<string>();
  for (const recipient of file.recipients) {
    for (const header of Object.keys(recipient.fields)) headers.add(header);
  }
  return { optInColumn, dateColumn: findOrderDateColumn([...headers], dateColumn) };
}

/**
 * Turns a recipients file into the rows an import would write.
 *
 * Every row is re-checked against the opt-in column here, rather than trusting
 * that the file was produced by `--for-import` — see `resolveColumns()` for the
 * gap that makes that necessary.
 *
 * @param input The file, the composed sentence, the registers and a hasher.
 * @returns The rows to write and the rows held back, with counts a report can
 *   print without ever naming a person.
 * @throws OptinImportError when the file has no opt-in column or no date column.
 */
export function planOptinImport(input: PlanInput): OptinPlan {
  const { file, consentSource, suppressed, existing, hashEmail } = input;
  const { optInColumn, dateColumn } = resolveColumns(file, input.dateColumn ?? null);

  const rows: PlannedRow[] = [];
  const dropped: DroppedRow[] = [];
  const seen = new Set<string>();
  const excluded = input.excluded ?? [];
  const excludedHashes = new Set(excluded.map((entry) => entry.hash));
  // Tracked against every hash in the file rather than against the rows that
  // were dropped, so "that address is not in this file" stays true whatever
  // else would also have held the row back.
  const present = new Set<string>();

  for (const recipient of file.recipients) {
    const email = recipient.email.trim().toLowerCase();
    const emailHash = hashEmail(email).toLowerCase();
    present.add(emailHash);

    // Order matters: the strongest reason a row was dropped is the one the
    // report should give. Somebody reading it is asking "why did this person
    // not get on the list?", and "they did not tick the box" outranks "their
    // address appears twice".
    //
    // A hand exclusion comes first because it is the one reason a human
    // supplied for this run, and burying it under a data-shaped reason would
    // read as "--exclude did nothing".
    if (excludedHashes.has(emailHash)) {
      dropped.push({ emailHash, reason: EXCLUDED_REASON });
      continue;
    }
    if (!isAffirmative(recipient.fields[optInColumn])) {
      dropped.push({ emailHash, reason: "no marketing opt-in" });
      continue;
    }
    if (suppressed.has(emailHash)) {
      dropped.push({ emailHash, reason: "on the suppression register" });
      continue;
    }
    if (existing.has(emailHash)) {
      dropped.push({ emailHash, reason: "already a subscriber" });
      continue;
    }
    if (seen.has(emailHash)) {
      dropped.push({ emailHash, reason: "duplicate in file" });
      continue;
    }

    const parsed = parseOrderDate(recipient.fields[dateColumn]);
    if ("reason" in parsed) {
      dropped.push({ emailHash, reason: parsed.reason });
      continue;
    }

    seen.add(emailHash);
    rows.push({
      email,
      emailHash,
      firstName: recipient.firstName?.trim() || null,
      lastName: recipient.lastName?.trim() || null,
      status: "subscribed",
      source: OPTIN_SOURCE,
      consentSource,
      consentDate: parsed.date,
      consentIp: null,
      consentUserAgent: null,
      confirmedAt: null,
    });
  }

  return {
    consentSource,
    optInColumn,
    dateColumn,
    rows,
    dropped,
    unmatchedExclusions: excluded.filter((entry) => !present.has(entry.hash)),
  };
}

/**
 * Counts the drop reasons for the report.
 *
 * @param dropped Every held-back row.
 * @returns Reasons with counts, commonest first.
 */
export function countReasons(dropped: DroppedRow[]): { reason: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of dropped) counts.set(row.reason, (counts.get(row.reason) ?? 0) + 1);
  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// The register this importer cannot see
// ---------------------------------------------------------------------------

/**
 * The flag that asserts a human has read the event's unsubscriber list.
 *
 * Named for what was checked rather than for what it unlocks. `--force` and
 * `--yes` invite the reading "get past this"; this one can only be typed as a
 * claim about an act, which is the claim it is actually making.
 */
export const UNSUBSCRIBER_ACK_FLAG = "--event-unsubscribers-checked";

/** Where that list lives in the Humanitix console. */
export const HUMANITIX_UNSUBSCRIBER_URL =
  "https://console.humanitix.com/console/comms/email-campaigns-unsubscriptions";

/**
 * The reason recorded for a row dropped by `--exclude`.
 *
 * Deliberately distinct from "on the suppression register": that register is a
 * general do-not-contact list, and this one is a person who muted **this
 * event's** communications. Reading a report months later, the two facts are
 * not interchangeable.
 */
export const EXCLUDED_REASON = "on this event's unsubscriber list (--exclude)";

/** One address named on the command line, reduced to what may be printed. */
export interface ExcludedAddress {
  /** sha256 of the normalized address — the only form that reaches a report. */
  hash: string;
  /** `j****@gmail.com`, for a line the operator has to recognise. */
  masked: string;
}

/** Masks an address the way every other script here masks one. */
function mask(email: string): string {
  const [local, domain] = email.trim().split("@");
  if (!domain) return "****";
  return `${local.slice(0, 1)}****@${domain}`;
}

/**
 * Turns `--exclude` values into hashes, dropping the addresses immediately.
 *
 * The address is passed on the command line for the length of one run and is
 * never written anywhere: this function is the last point at which it exists,
 * and what comes out is a hash plus a masked label. That is why the exclusion
 * list is a flag rather than a file — a file of addresses of people who
 * unsubscribed would be a second, undeclared register of exactly the kind this
 * design refuses to create.
 *
 * Matching is on `hashEmail()`, which trims and lowercases, so
 * `" Ada@Example.COM "` and `ada@example.com` are the same person here.
 *
 * @param addresses Raw `--exclude` values, in the order given.
 * @param hashEmail The shared hasher, injected as everywhere else in this file.
 * @returns One entry per distinct address.
 * @throws OptinImportError when a value is not an address — a typo would
 *   otherwise hash to something that quietly matches nobody.
 */
export function parseExclusions(
  addresses: string[],
  hashEmail: (email: string) => string
): ExcludedAddress[] {
  const seen = new Map<string, ExcludedAddress>();
  for (const raw of addresses) {
    const value = raw.trim();
    if (value.length === 0 || !value.includes("@")) {
      throw new OptinImportError([
        `--exclude "${raw}" is not an email address.`,
        "It takes one address per flag, repeated:",
        '  --exclude someone@example.com --exclude someone.else@example.com',
      ]);
    }
    const hash = hashEmail(value).toLowerCase();
    if (!seen.has(hash)) seen.set(hash, { hash, masked: mask(value) });
  }
  return [...seen.values()];
}

/**
 * The procedure a human has to carry out before an import may be applied.
 *
 * @param eventName The event this import is for.
 * @param count How many rows would be written.
 * @returns Lines to print, as guidance on a dry run and as the refusal on
 *   `--apply`.
 */
export function unsubscriberCheckLines(eventName: string, count: number): string[] {
  return [
    `Before writing up to ${count} row(s) for "${eventName}", check that event's unsubscriber list.`,
    "",
    "Humanitix keeps a register this repo cannot read: the people who unsubscribed",
    "from an event's own communications. Somebody who muted your emails about an",
    "event and then bought a ticket to it is not somebody to add to a marketing",
    "list — that is a contradiction inside one event, not a guess across events.",
    "",
    "  1. Open the Humanitix console → Email campaigns → Unsubscriber list",
    `     ${HUMANITIX_UNSUBSCRIBER_URL}`,
    `  2. Search it for "${eventName}". The register is a few dozen rows and is`,
    "     scoped per event, so the realistic overlap here is zero or one.",
    "  3. If nobody from this import appears, re-run with:",
    `       ${UNSUBSCRIBER_ACK_FLAG}`,
    "     If somebody does, drop them in the same run:",
    `       --exclude their@address --exclude another@address ${UNSUBSCRIBER_ACK_FLAG}`,
    "",
    "The excluded address is used for this run only. It is hashed immediately and",
    "never written to disk — do not add it to the suppression register instead:",
    "that register is a general do-not-contact list and this evidence is about one",
    "event, so folding it in would block the person from everything She Sharp ever",
    "sends because they once muted one event's reminders.",
  ];
}

/**
 * Refuses to apply an import until the unsubscriber list has been acknowledged.
 *
 * **This is an acknowledgement, not a verification, and the difference matters
 * enough to write down.** Nothing here checks the register: a person can type
 * the flag without opening the page, and the code cannot tell. What it buys is
 * that the check has to be declined deliberately rather than never occurring to
 * anyone — the same thing `--apply` itself buys.
 *
 * Nothing stronger is available. The Humanitix public API has no route to this
 * list: verified 2026-08-30 against the live OpenAPI document (v1.21.0), where
 * the strings `campaign`, `unsubscri`, `notify`, `follower` and `send` do not
 * appear anywhere in the spec. The console page has no export button either. So
 * the alternatives were an acknowledgement or nothing, and the third option —
 * asking an operator to type a dozen real addresses into a file so a script
 * could match them — would create a register of unsubscribers' addresses on
 * disk to avoid mailing them, which is worse than the problem.
 *
 * **If Humanitix ever exposes the list** — an endpoint, or an export button
 * whose CSV `normalize-recipients.ts` could read — replace this function with a
 * real check: hash the register, drop the intersection automatically, and let
 * the flag go. Until then it says what it is.
 *
 * @param input Whether this run writes, whether the flag was passed, and what
 *   the operator would be asserting about.
 * @throws OptinImportError when `--apply` is used without the acknowledgement.
 */
export function assertUnsubscriberCheck(input: {
  apply: boolean;
  acknowledged: boolean;
  eventName: string;
  count: number;
}): void {
  if (!input.apply || input.acknowledged) return;
  throw new OptinImportError([
    `--apply also needs ${UNSUBSCRIBER_ACK_FLAG}.`,
    "",
    ...unsubscriberCheckLines(input.eventName, input.count),
  ]);
}
