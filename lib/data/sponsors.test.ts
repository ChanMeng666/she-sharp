/**
 * Guards for the sponsor logo wall.
 *
 * Run: npx tsx lib/data/sponsors.test.ts
 *
 * The Deloitte adjacency rule is a term of a sponsorship agreement, not a
 * layout preference, and it is invisible in a diff — someone tidying the logo
 * order has no way to know it exists. That is exactly the kind of rule that
 * needs a test rather than a comment.
 */
import { existsSync } from "node:fs";
import {
  DELOITTE_RESTRICTED_NEIGHBOURS,
  scrollingSponsorLogoRows,
  scrollingSponsorLogos,
  tieredSponsors,
} from "./sponsors";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `: ${detail}` : ""}`);
  }
}

// --- Deloitte adjacency ------------------------------------------------------
const deloitteRow = scrollingSponsorLogoRows.findIndex((row) =>
  row.some((logo) => logo.name === "Deloitte")
);

check("Deloitte appears in the logo wall", deloitteRow !== -1);

if (deloitteRow !== -1) {
  const restricted = new Set<string>(DELOITTE_RESTRICTED_NEIGHBOURS);
  const clash = scrollingSponsorLogoRows[deloitteRow]
    .map((logo) => logo.name)
    .filter((name) => restricted.has(name));

  check(
    "Deloitte shares its row with no restricted organisation",
    clash.length === 0,
    clash.length ? `found ${clash.join(", ")} in the same row` : undefined
  );
}

check(
  "the wall is split across rows so the rule can hold",
  scrollingSponsorLogoRows.length >= 2,
  `only ${scrollingSponsorLogoRows.length} row(s)`
);

// --- Logo-usage permissions --------------------------------------------------
// Google, AWS and ANZ each have a documented usage restriction and no recorded
// permission. Their files stay in the repo; putting them back on the wall needs
// a decision, not a data edit.
const UNCLEARED_LOGOS = ["Google", "AWS", "ANZ"];
const uncleared = scrollingSponsorLogos
  .map((logo) => logo.name)
  .filter((name) => UNCLEARED_LOGOS.includes(name));

check(
  "no logo with an unresolved usage restriction is on the wall",
  uncleared.length === 0,
  uncleared.length ? uncleared.join(", ") : undefined
);

// --- Data hygiene ------------------------------------------------------------
const names = scrollingSponsorLogos.map((logo) => logo.name);
const duplicateNames = names.filter((name, i) => names.indexOf(name) !== i);
check(
  "no organisation appears twice on the wall",
  duplicateNames.length === 0,
  duplicateNames.join(", ")
);

const logoPaths = [
  ...scrollingSponsorLogos.map((logo) => logo.logo),
  ...tieredSponsors.map((sponsor) => sponsor.logo),
];
const missing = logoPaths.filter((path) => !existsSync(`public${path}`));
check(
  "every referenced logo file exists on disk",
  missing.length === 0,
  missing.join(", ")
);

const badCasing = tieredSponsors
  .map((sponsor) => sponsor.name)
  .filter((name) => name === name.toLowerCase() && name.length > 3);
check(
  "no tiered sponsor name is written in all lower case",
  badCasing.length === 0,
  badCasing.join(", ")
);

console.log(
  failures === 0
    ? "\nAll sponsor checks passed."
    : `\n${failures} sponsor check(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
