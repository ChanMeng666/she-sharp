/**
 * The CI guard over the on-site newsletter archive.
 *
 * Run: npx tsx scripts/mailchimp/archive-guard.test.ts
 *
 * WHY THIS EXISTS. `lib/data/newsletter-archive/` holds 179 sent emails, and a
 * sent email is not a page this organisation may republish as-is: it carries
 * Mailchimp's unsubscribe footer, its referral badge, a per-recipient `e=`
 * parameter, and — in two campaigns — click-tracking links keyed to a real
 * subscriber. `extract-archive.ts` removes all of that, but the extractor needs
 * the private vault and therefore **cannot run on CI**. So the thing CI has to
 * defend is the committed file, not the run that produced it, and this reads
 * the files rather than trusting the generator.
 *
 * It also carries the join PR 3 depends on: every Mailchimp URL on
 * `/resources/newsletters` must resolve to an archived campaign. Those URLs
 * were written by hand over five years in three different shapes; a card that
 * stops resolving is exactly the kind of break that shows up as a 404 on the
 * live site months later.
 *
 * Needs no database, no network and no vault, which is why it belongs in the
 * `verify-image-paths` job with the other offline data checks.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { NEWSLETTER_ARCHIVE } from "@/lib/data/newsletters-archive";
import { NEWSLETTER_MANUAL } from "@/lib/data/newsletters-manual";
import { OWN_MAILBOXES } from "../email/own-mailboxes";
import { ALLOWED_ADDRESSES, scanSanitised } from "./archive-html";
import {
  ARCHIVE_HTML_DIR,
  ARCHIVE_INDEX_PATH,
  buildArchiveLookup,
  readArchiveIndex,
  resolveCampaignByArchiveUrl,
} from "./archive-index";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `:\n${detail}` : ""}`);
  }
}

/** Caps a failure list so one systemic break does not print 179 identical lines. */
function first(lines: string[], limit = 12): string {
  const shown = lines.slice(0, limit).map((line) => `      ${line}`);
  if (lines.length > limit) shown.push(`      … and ${lines.length - limit} more`);
  return shown.join("\n");
}

console.log("Newsletter archive guard\n");

// ---------------------------------------------------------------------------
// The archive is present and its index describes exactly what is on disk.
// ---------------------------------------------------------------------------

check(
  "lib/data/newsletter-archive/ exists with an index",
  existsSync(ARCHIVE_HTML_DIR) && existsSync(ARCHIVE_INDEX_PATH),
  `      ${ARCHIVE_HTML_DIR} is missing. Regenerate it with the vault:\n` +
    "        MAILCHIMP_VAULT_DIR=…/mailchimp/2026-08-28-api \\\n" +
    "          npx tsx scripts/mailchimp/extract-archive.ts --export 2026-08-28-api"
);

if (failures > 0) {
  console.error("\nCannot continue without the archive.");
  process.exit(1);
}

const indexText = readFileSync(ARCHIVE_INDEX_PATH, "utf8");
const index = readArchiveIndex();
const onDisk = readdirSync(ARCHIVE_HTML_DIR).filter((name) => name.endsWith(".html"));

check(
  "every indexed campaign has a file, and every file is indexed",
  (() => {
    const indexed = new Set(index.entries.map((entry) => entry.file));
    return (
      onDisk.length === indexed.size && onDisk.every((name) => indexed.has(name))
    );
  })(),
  first([
    `${onDisk.length} .html file(s) on disk, ${index.entries.length} indexed`,
    ...onDisk.filter((n) => !index.entries.some((e) => e.file === n)).map((n) => `orphan: ${n}`),
    ...index.entries.filter((e) => !onDisk.includes(e.file)).map((e) => `missing: ${e.file}`),
  ])
);

check(
  "the index's own totals agree with its entries",
  index.campaignsArchived === index.entries.length &&
    index.campaignsSent === index.entries.length + index.campaignsWithoutBody.length,
  `      sent ${index.campaignsSent}, archived ${index.campaignsArchived}, ` +
    `entries ${index.entries.length}, without a body ${index.campaignsWithoutBody.length}`
);

// ---------------------------------------------------------------------------
// The files are what the generator wrote. A hand-edit to a GENERATED file is
// silent otherwise: it survives review, and the next extraction run discards it.
// ---------------------------------------------------------------------------

const bodies = new Map<string, string>();
const tampered: string[] = [];
for (const entry of index.entries) {
  const text = readFileSync(join(ARCHIVE_HTML_DIR, entry.file), "utf8");
  bodies.set(entry.file, text);
  const sha = createHash("sha256").update(text, "utf8").digest("hex");
  if (sha !== entry.sha256 || Buffer.byteLength(text, "utf8") !== entry.bytes) {
    tampered.push(`${entry.file}: index says ${entry.bytes} bytes / ${entry.sha256.slice(0, 12)}…`);
  }
}
check(
  "no archived body has been hand-edited since it was generated",
  tampered.length === 0,
  first(tampered)
);

// ---------------------------------------------------------------------------
// The sanitisation rules. This is the part that must go red when somebody
// commits a body that still carries Mailchimp's plumbing.
// ---------------------------------------------------------------------------

const violations: string[] = [];
for (const [file, text] of bodies) {
  for (const violation of scanSanitised(text, "body")) {
    violations.push(`${file} — ${violation.rule}: ${violation.detail}`);
  }
}
check(
  "no archived body carries a Mailchimp subscription link, a script, a merge tag, a recipient id, or an unlisted address",
  violations.length === 0,
  first(violations) +
    "\n\n      Every rule and the reason for it is in scripts/mailchimp/archive-html.ts." +
    "\n      Regenerate rather than hand-fixing: the extractor applies the same scan."
);

check(
  "index.json carries no unlisted address and no recipient id",
  scanSanitised(indexText, "index").length === 0,
  first(scanSanitised(indexText, "index").map((v) => `${v.rule}: ${v.detail}`))
);

const unresolvedMarkers: string[] = [];
for (const [file, text] of bodies) {
  const count = (text.match(/data-mc-campaign="unresolved"/g) ?? []).length;
  if (count > 0) unresolvedMarkers.push(`${file}: ${count}`);
}
check(
  "every Mailchimp archive URL inside a body resolves to a campaign",
  unresolvedMarkers.length === 0,
  first(unresolvedMarkers) +
    "\n      An unresolved marker means PR 3 has a link it cannot repoint on-site."
);

// ---------------------------------------------------------------------------
// The addresses that DO survive must be mailboxes that accept mail. Publishing
// an invitation to write to a dead address is the failure
// scripts/email/published-addresses.test.ts was written for, twice.
// ---------------------------------------------------------------------------

const liveLocals = new Set(
  OWN_MAILBOXES.filter((mailbox) => mailbox.expected === "exists").map((mailbox) => mailbox.local)
);
const deadAllowed = ALLOWED_ADDRESSES.filter((address) => {
  const [local, domain] = address.split("@");
  return domain === "shesharp.org.nz" && !liveLocals.has(local);
});
check(
  "every She Sharp address on the archive allow-list is a mailbox the probe found",
  deadAllowed.length === 0,
  first(deadAllowed.map((a) => `${a} is not marked 'exists' in scripts/email/own-mailboxes.ts`))
);

// ---------------------------------------------------------------------------
// The join PR 3 needs. 51 cards on /resources/newsletters open a Mailchimp URL;
// each one must land on an archived campaign, or re-pointing it on-site is
// guesswork.
// ---------------------------------------------------------------------------

const lookup = buildArchiveLookup(index.entries);
const archivedIds = new Set(index.entries.map((entry) => entry.id));

// DISTINCT urls, not card entries. The two files hold 52 entries pointing at a
// Mailchimp page and 51 distinct URLs: the retracted `2026-02` card shares the
// March 2026 campaign's URL, because the legacy site pointed February at the
// March send. Counting entries would put 52 in a PR description and a doc, and
// the number a reader can verify on the live site is 51.
const siteUrls = [
  ...new Set(
    [...NEWSLETTER_ARCHIVE, ...NEWSLETTER_MANUAL]
      .map((issue) => issue.url)
      .filter((url) => /mailchi\.mp|campaign-archive\.com|eepurl\.com/.test(url))
  ),
];

const unjoinable = siteUrls.filter((url) => {
  const id = resolveCampaignByArchiveUrl(lookup, url);
  return id === null || !archivedIds.has(id);
});
check(
  `all ${siteUrls.length} distinct Mailchimp newsletter URLs join to an archived campaign`,
  unjoinable.length === 0,
  first(unjoinable.map((url) => `no archived campaign for ${url}`)) +
    "\n      The three join keys are documented in scripts/mailchimp/archive-index.ts." +
    "\n      A card that cannot be joined stays pointed at Mailchimp after the cancellation."
);

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `${index.entries.length} archived newsletters, ${siteUrls.length} distinct site URLs joined, ` +
    "no Mailchimp plumbing and no unlisted address."
);
