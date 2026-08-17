/**
 * Drafts `lib/data/json/humanitix/crosswalk.json` for a human to check.
 *
 * The crosswalk is the one AUTHORED file that carries judgements about the
 * site's own event records, so it is never written by the builder and never
 * overwritten by this script either: the draft goes to `tmp/humanitix/` and a
 * person moves it across after reading every row. Matching an event on its
 * date and a fuzzy title is good enough to propose a mapping and nowhere near
 * good enough to publish one — this archive has already turned up a site event
 * whose published date is 16 days before its own last ticket sale.
 *
 * Every row it proposes carries BOTH figures, the site's and the export's, so
 * the person reviewing it can see what a backfill would change without running
 * anything.
 *
 * Usage:
 *   npx tsx scripts/humanitix/propose-crosswalk.ts [--out tmp/humanitix]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { getAllEvents, parseDateString } from "../../lib/data/events";
import { getHumanitixInstances } from "../../lib/data/humanitix";
import type {
  HumanitixCrosswalk,
  HumanitixEventInstance,
  HumanitixLink,
  HumanitixSeries,
} from "../../types/humanitix";
import type { EventV3 } from "../../types/event";
import { REPO_ROOT, argValue } from "./vault";

/** The site's `date` field is human-readable prose; normalise it to ISO. */
function siteIsoDate(event: EventV3): string | null {
  const parsed = parseDateString(event.date);
  if (Number.isNaN(parsed.getTime())) return null;
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${parsed.getFullYear()}-${month}-${day}`;
}

/** Crude 4-gram overlap — enough to rank candidates on the same date. */
function titleSimilarity(a: string, b: string): number {
  const clean = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const [left, right] = [clean(a), clean(b)];
  if (left.length < 4) return 0;
  let hits = 0;
  for (let index = 0; index <= left.length - 4; index++) {
    if (right.includes(left.slice(index, index + 4))) hits++;
  }
  return hits / (left.length - 3);
}

function figuresFor(site: EventV3 | null, instance: HumanitixEventInstance) {
  return {
    site: {
      attendees: site?.attendees ?? null,
      checkedIn: site?.checkedIn ?? null,
    },
    export: {
      registered: instance.registered,
      checkedIn: instance.checkInDataPresent ? instance.checkedIn : null,
    },
  };
}

function main() {
  const argv = process.argv.slice(2);
  const outDir = join(REPO_ROOT, argValue(argv, "--out") ?? "tmp/humanitix");

  const site = getAllEvents();
  const byDate = new Map<string, EventV3[]>();
  for (const event of site) {
    const iso = siteIsoDate(event);
    if (!iso) continue;
    byDate.set(iso, [...(byDate.get(iso) ?? []), event]);
  }

  const instances = getHumanitixInstances();
  const seriesMembers = new Map<string, HumanitixEventInstance[]>();
  for (const instance of instances) {
    if (!instance.seriesKey) continue;
    seriesMembers.set(instance.seriesKey, [
      ...(seriesMembers.get(instance.seriesKey) ?? []),
      instance,
    ]);
  }

  const links: HumanitixLink[] = [];
  const series: HumanitixSeries[] = [];
  const unmatched: HumanitixCrosswalk["unmatched"] = [];

  for (const instance of instances) {
    if (instance.seriesKey) continue;

    const candidates = byDate.get(instance.eventDate) ?? [];
    const match =
      candidates.length === 0
        ? null
        : candidates.reduce((best, candidate) =>
            titleSimilarity(instance.eventName, candidate.title) >=
            titleSimilarity(instance.eventName, best.title)
              ? candidate
              : best
          );

    if (!match) {
      unmatched.push({
        humanitixKey: instance.key,
        reason: "No site event carries this date.",
        action:
          "HUMAN DECISION: find the site record under a different date, add one, or accept the event as unlisted.",
        note: "",
      });
      continue;
    }

    const figures = figuresFor(match, instance);
    const attendeesAgree = figures.site.attendees === figures.export.registered;
    const checkInAgree =
      figures.export.checkedIn === null
        ? figures.site.checkedIn === null || figures.site.checkedIn === 0
        : figures.site.checkedIn === figures.export.checkedIn;

    links.push({
      humanitixKey: instance.key,
      siteSlug: match.slug,
      siteId: match.id,
      siteFile: match.id <= 84 ? "events-v3" : "events-custom",
      match: "exact-date",
      confidence:
        titleSimilarity(instance.eventName, match.title) >= 0.4 ? "high" : "medium",
      figures,
      status:
        figures.site.attendees === null
          ? "gap"
          : attendeesAgree && checkInAgree
            ? "agrees"
            : "disagrees",
      note: "",
    });
  }

  for (const [seriesKey, members] of seriesMembers) {
    const sorted = [...members].sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    const candidate =
      sorted
        .map((member) => byDate.get(member.eventDate) ?? [])
        .flat()
        .find(Boolean) ?? null;

    series.push({
      seriesKey,
      siteSlug: candidate?.slug ?? "",
      siteId: candidate?.id ?? 0,
      sessionKeys: sorted.map((member) => member.key),
      sessions: sorted.length,
      rule: "sum",
      exportRegistered: sorted.reduce((sum, member) => sum + member.registered, 0),
      exportCheckedIn: sorted.reduce((sum, member) => sum + member.checkedIn, 0),
      siteAttendees: candidate?.attendees ?? null,
      siteCheckedIn: candidate?.checkedIn ?? null,
      status: "agrees",
      note: "",
    });
  }

  const draft: HumanitixCrosswalk = {
    metadata: {
      authored: true,
      verifiedAt: "",
      verifiedAgainst: "lib/data/events.ts getAllEvents()",
      note: "DRAFT — every note is empty and every status is a guess from a date match. Read each row before moving this into lib/data/json/humanitix/.",
    },
    links: links.sort((a, b) => a.humanitixKey.localeCompare(b.humanitixKey)),
    series: series.sort((a, b) => a.seriesKey.localeCompare(b.seriesKey)),
    unmatched,
    keyAliases: [],
  };

  mkdirSync(outDir, { recursive: true });
  const path = join(outDir, "crosswalk.draft.json");
  writeFileSync(path, JSON.stringify(draft, null, 2) + "\n", "utf8");

  const counts = links.reduce<Record<string, number>>((tally, link) => {
    tally[link.status] = (tally[link.status] ?? 0) + 1;
    return tally;
  }, {});

  console.log(`Wrote ${path}`);
  console.log(`  links       ${links.length}  ${JSON.stringify(counts)}`);
  console.log(`  series      ${series.length}`);
  console.log(`  unmatched   ${unmatched.length}`);
  console.log(
    `  low confidence ${links.filter((link) => link.confidence === "medium").length}`
  );
  console.log(
    "\nNothing under lib/data/json/humanitix/ was written. Review every row, fill in\n" +
      "every note on a row that is not `agrees`, then move the file across."
  );
}

main();
