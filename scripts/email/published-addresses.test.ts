/**
 * Nothing this project publishes may invite someone to write to a mailbox that
 * does not exist.
 *
 * Run: npx tsx scripts/email/published-addresses.test.ts
 *
 * WHY THIS EXISTS. The failure has now happened twice, the same way both times:
 * an address is written into a page or a document by whoever is building it,
 * nobody creates the mailbox, and the mistake is invisible because SENDING as a
 * non-existent address works fine — Resend signs at the domain. It only breaks
 * when a reader presses Reply, and the reader is the one person who never tells
 * you.
 *
 *   2025-07 → 2026-08  `hello@` was the contact page's headline address for a
 *                      year, for its first months on a domain the organisation
 *                      does not even own. Seven of the eleven addresses the
 *                      site published had never been created. Retired in #173.
 *   2026-08            The Typst funder report kept its own copy of the org
 *                      constants, was not part of that sweep, and went on
 *                      printing `hello@` in bold on its back cover — the
 *                      address a funder is invited to write to.
 *
 * The second one is the reason this is a test and not a checklist. A sweep
 * fixes the instances somebody thought to look at; this fails the build.
 *
 * WHAT IT CHECKS. `OWN_MAILBOXES` in ./own-mailboxes.ts is the registry, with
 * the verdict of the 2026-08-23 delivery probe against each address. Anything
 * marked `missing` is fiction and must not appear in a publishable surface.
 * Anything marked `exists` may appear — existing is a lower bar than being
 * read, and who reads what is an organisational question this file cannot
 * settle, so it defers to docs/development/EMAIL_ADDRESSES.md for that.
 *
 * A "publishable surface" is somewhere the string reaches a human outside the
 * team: the site, the emails, the two Typst reports. Source files that discuss
 * the retired addresses — this test, the registry, the audit docs, the gate
 * tests that assert `hello@` is BLOCKED — are exempt by path, because naming a
 * dead address in order to keep it dead is the opposite of publishing it.
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { OWN_MAILBOXES } from "./own-mailboxes";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `:\n${detail}` : ""}`);
  }
}

/**
 * Files allowed to name a retired address, and why. Every entry is somewhere
 * the address appears in order to keep it retired — a registry, a record of
 * the audit, or a test asserting it is blocked.
 */
const EXEMPT = [
  "scripts/email/own-mailboxes.ts",
  "scripts/email/published-addresses.test.ts",
  "scripts/email/probe-mailboxes.ts",
  "scripts/email/suppression.ts",
  "docs/development/EMAIL_ADDRESSES.md",
  "docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md",
  "docs/deployment/EMAIL_AUTHENTICATION.md",
  "docs/development/EMAIL_OPERATIONS.md",
  "docs/development/PHOTOGRAPHING_MINORS.md",
  "lib/email/hardening.test.ts",
  "lib/email/senders.ts",
  "lib/email/gates.ts",
  // The record of the fix itself: this page states what the feedback form used
  // to say and why it changed.
  "docs/development/EVENT_FEEDBACK.md",
  // Uses a wrong-domain address as the worked example of the typo it warns about.
  ".claude/skills/reply-to-contact-messages/references/reply-voice-and-templates.md",
  // Applied migrations are immutable history. 0008 created a table whose
  // from_email defaulted to a domain the organisation does not own; 0031 drops
  // it. Neither can send anything and neither can be edited.
  "lib/db/migrations/0008_add_notifications_table.sql",
  "lib/db/migrations/0031_drop_dead_email_queue.sql",
];

const retired = OWN_MAILBOXES.filter((m) => m.expected === "missing").map((m) => m.local);
const live = OWN_MAILBOXES.filter((m) => m.expected === "exists").map((m) => m.local);

console.log(`Retired mailboxes that must not be published: ${retired.join(", ")}`);

/** Every tracked file, so an untracked scratch file cannot fail the build. */
function trackedFiles(): string[] {
  return execFileSync("git", ["ls-files"], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 })
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);
}

const ADDRESS = /([a-z0-9._-]+)@shesharp\.(org\.nz|co\.nz|org)\b/gi;

interface Hit {
  file: string;
  line: number;
  address: string;
  reason: string;
}

const hits: Hit[] = [];

for (const file of trackedFiles()) {
  if (EXEMPT.includes(file)) continue;
  // Binary and asset paths cannot carry a mailbox a human will read.
  if (/\.(png|jpe?g|webp|avif|pdf|ico|ttf|woff2?|mp4|zip|lock)$/i.test(file)) continue;

  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (!text.includes("@shesharp.")) continue;

  text.split("\n").forEach((lineText, i) => {
    for (const match of lineText.matchAll(ADDRESS)) {
      const local = match[1].toLowerCase();
      const domain = match[2].toLowerCase();

      if (domain !== "org.nz") {
        hits.push({
          file,
          line: i + 1,
          address: match[0],
          reason: `wrong domain — the organisation owns shesharp.org.nz only`,
        });
        continue;
      }
      if (retired.includes(local)) {
        hits.push({
          file,
          line: i + 1,
          address: match[0],
          reason: `retired: this mailbox does not exist and hard-bounces`,
        });
      }
    }
  });
}

check(
  "no retired or wrong-domain address appears outside the files that document it",
  hits.length === 0,
  hits
    .map((h) => `      ${h.file}:${h.line}  ${h.address}  — ${h.reason}`)
    .join("\n") +
    (hits.length > 0
      ? "\n\n      Replace it with a mailbox from the Monitored table in" +
        "\n      docs/development/EMAIL_ADDRESSES.md — `info@` is the general one." +
        "\n      If a file legitimately needs to NAME a dead address (a test, a" +
        "\n      record of the audit), add it to EXEMPT in this file and say why."
      : "")
);

// The registry itself has to stay usable: every address the site publishes is
// resolved through lib/config/contact-addresses.ts, and each of those must be a
// mailbox the probe found.
const contactConfig = readFileSync("lib/config/contact-addresses.ts", "utf8");
const published = [...contactConfig.matchAll(ADDRESS)].map((m) => m[1].toLowerCase());
const unknown = [...new Set(published)].filter((local) => !live.includes(local));

check(
  "every address the website publishes is a mailbox the probe found",
  unknown.length === 0,
  unknown.map((u) => `      ${u}@shesharp.org.nz is not marked 'exists' in OWN_MAILBOXES`).join("\n")
);

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All published addresses resolve to a mailbox that accepts mail.");
