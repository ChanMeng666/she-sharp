/**
 * Drafts `lib/data/json/mailchimp/crosswalk.json` for a human to check.
 *
 * The crosswalk is the one AUTHORED file that carries judgements about the
 * site's own event records, so it is never written by the builder and never
 * overwritten by this script either: the draft goes to `tmp/mailchimp/` and a
 * person moves it across after reading every row.
 *
 * A Mailchimp `Event:` tag carries no date — only a title somebody typed, years
 * ago, into a tag box with a 100-character limit. Matching that against the
 * site's own titles is weak: the export contains `Google Educators Conference`
 * with two plausible years on the site, `She celebrates - End of Year Event`
 * with two more, and one title whose partner is spelled `Generative Al` with a
 * lowercase L.
 *
 * **So the Humanitix crosswalk is consulted first.** The `Event:` tags were
 * pasted into Mailchimp from Humanitix ticket lists, which is why they read
 * like Humanitix listing names rather than like the site's titles — `She
 * Sharp@ EY` for the event the site calls `Robotic Process Automation
 * Workshop`. `lib/data/json/humanitix/crosswalk.json` has already mapped those
 * listing names to site slugs by hand, anchored on exact dates and matching
 * registration counts. Reusing it turns a guess here into a link somebody has
 * already checked against evidence this file does not have.
 *
 * Site-title matching remains as the fallback, for the tags that name an event
 * which was never ticketed through Humanitix.
 *
 * Usage:
 *   npx tsx scripts/mailchimp/propose-crosswalk.ts [--out tmp/mailchimp]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getAllEvents } from "../../lib/data/events";
import { humanitixCrosswalk } from "../../lib/data/humanitix";
import type { EventV3 } from "../../types/event";
import type { MailchimpCrosswalk, MailchimpCrosswalkLink, MailchimpTags } from "../../types/mailchimp";
import { ARCHIVE_DIR, REPO_ROOT, argValue } from "./vault";
import { readFileSync } from "node:fs";

/** The `Event: ` prefix, stripped to leave the title somebody typed. */
const EVENT_PREFIX = "Event:";

/**
 * Comparison form: lowercase, alphanumerics only, with `&` spelled out.
 *
 * The `&` matters. Humanitix slugifies an ampersand to `and`, so its listing
 * name for the 2022 end-of-year event is
 * `she-sharp-and-aws-presents-she-celebrates-…`, while the Mailchimp tag reads
 * `She Sharp & AWS presents: …`. Stripping punctuation alone leaves `shesharpaws`
 * against `sheshaprandaws` and three genuine matches fall through to a human
 * for no reason. Expanding first makes them agree.
 */
function key(value: string): string {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");
}

/** Crude 4-gram overlap, for ranking candidates when nothing matches exactly. */
function similarity(a: string, b: string): number {
  const [left, right] = [key(a), key(b)];
  if (!left || !right) return 0;
  if (left === right) return 1;

  const grams = (value: string) => {
    const out = new Set<string>();
    for (let i = 0; i + 4 <= value.length; i++) out.add(value.slice(i, i + 4));
    return out;
  };
  const [x, y] = [grams(left), grams(right)];
  if (x.size === 0 || y.size === 0) return 0;
  let shared = 0;
  for (const gram of x) if (y.has(gram)) shared++;
  return shared / Math.min(x.size, y.size);
}

function main() {
  const argv = process.argv.slice(2);
  const outDir = join(REPO_ROOT, argValue(argv, "--out") ?? join("tmp", "mailchimp"));

  const tags = JSON.parse(
    readFileSync(join(ARCHIVE_DIR, "tags.json"), "utf8")
  ) as MailchimpTags;

  const events = getAllEvents();
  const byTitle = new Map<string, EventV3>();
  for (const event of events) byTitle.set(key(event.title), event);

  // The Humanitix listing name → site slug map, keyed on the slugified name.
  // A Humanitix key is `<iso-date>--<slugified-event-name>`, so the name is
  // everything after the first `--`.
  const byHumanitixName = new Map<string, string>();
  for (const link of humanitixCrosswalk.links) {
    const name = link.humanitixKey.slice(link.humanitixKey.indexOf("--") + 2);
    // Several listings map to one site event (a series, or a re-run). Keeping
    // the first is enough: the value is the site slug, and duplicates agree.
    if (!byHumanitixName.has(key(name))) byHumanitixName.set(key(name), link.siteSlug);
  }

  const eventTags = tags.tags
    .filter((tag) => tag.kind === "event")
    .map((tag) => tag.tag)
    .sort((a, b) => a.localeCompare(b, "en"));

  const links: MailchimpCrosswalkLink[] = [];
  const unmatched: { tag: string; reason: string }[] = [];

  for (const tag of eventTags) {
    const title = tag.slice(EVENT_PREFIX.length).trim();
    const needle = key(title);

    // Strongest evidence first: the same listing name, already hand-verified
    // against a date and a registration count in the Humanitix crosswalk.
    const viaHumanitix = byHumanitixName.get(needle);
    if (viaHumanitix) {
      links.push({
        tag,
        siteSlug: viaHumanitix,
        match: "hand-verified",
        confidence: "high",
        note: "Matched through lib/data/json/humanitix/crosswalk.json: the same listing name, already tied to this site event by date and registration count.",
      });
      continue;
    }

    const exact = byTitle.get(needle);
    if (exact) {
      links.push({
        tag,
        siteSlug: exact.slug,
        match: "title-exact",
        confidence: "high",
      });
      continue;
    }

    // A tag truncated at Mailchimp's 100-character limit is a prefix of the
    // real title, so containment in either direction is a genuine signal here
    // rather than the coincidence it would usually be.
    const contained = events.filter(
      (event) => needle.includes(key(event.title)) || key(event.title).includes(needle)
    );
    if (contained.length === 1) {
      links.push({
        tag,
        siteSlug: contained[0].slug,
        match: "title-substring",
        confidence: "medium",
        note: `Proposed by containment, not by an exact title match. Site title: ${JSON.stringify(contained[0].title)}.`,
      });
      continue;
    }

    const ranked = events
      .map((event) => ({ event, score: similarity(title, event.title) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter((candidate) => candidate.score > 0.3);

    unmatched.push({
      tag,
      reason: ranked.length
        ? `NEEDS A HUMAN. Closest site events: ${ranked
            .map((candidate) => `${candidate.event.slug} (${Math.round(candidate.score * 100)}%)`)
            .join(", ")}`
        : "NEEDS A HUMAN. No site event resembles this title.",
    });
  }

  // Several tags can point at one event — an early short tag and a later,
  // fuller one. Surfaced in the draft so the reviewer sees it while deciding,
  // rather than discovering it later by double-counting people.
  const perSlug = new Map<string, number>();
  for (const link of links) perSlug.set(link.siteSlug, (perSlug.get(link.siteSlug) ?? 0) + 1);

  const draft: MailchimpCrosswalk = {
    metadata: {
      authored: true,
      verifiedAt: "DRAFT — NOT VERIFIED",
      verifiedAgainst: "lib/data/events.ts getAllEvents()",
      note: "DRAFT produced by scripts/mailchimp/propose-crosswalk.ts. Every row must be read by a person before this file is moved into lib/data/json/mailchimp/. Matching on a title alone is a proposal, never a verification.",
    },
    links,
    unmatched,
    multiTagEvents: [...perSlug.entries()]
      .filter(([, count]) => count > 1)
      .sort((a, b) => a[0].localeCompare(b[0], "en"))
      .map(([siteSlug, tags]) => ({
        siteSlug,
        tags,
        note: "More than one Mailchimp tag points at this event — usually an early tag and a later, fuller one. Counting the tags would double-count the people.",
      })),
  };

  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "crosswalk.draft.json");
  writeFileSync(path, JSON.stringify(draft, null, 2) + "\n", "utf8");

  console.log(`Wrote ${path}`);
  console.log(
    `  ${eventTags.length} Event: tags — ${links.length} proposed, ${unmatched.length} need a human`
  );
  for (const row of unmatched) {
    console.log(`\n  ${row.tag}\n    ${row.reason}`);
  }
}

main();
