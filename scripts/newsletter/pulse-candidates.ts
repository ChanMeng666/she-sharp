/**
 * Step 1 of 3 — fetch the month's NZ Tech Pulse candidates for an agent to
 * choose from.
 *
 * WHY THE FETCH STAYS IN CODE
 * ---------------------------
 * The obvious shortcut, once the writing moved to the agent, is to let the
 * agent search the web itself. That is wrong for three reasons, and this script
 * is the answer to all three.
 *
 * First, agents differ. Claude Code, Cursor and Codex do not all have web
 * search, and the ones that do do not return the same things — so the section
 * would be a different section depending on whose laptop ran the skill, which
 * is the exact failure this whole design exists to close.
 *
 * Second, the traps are already paid for. `lib/newsletter/pulse.ts` encodes
 * which feeds have a retention window too short for a monthly newsletter, which
 * one silently returns the identical 30 items for every `?page=`, that hcamag
 * must be read through a per-year SITEMAP and that January needs the previous
 * year's, that RNZ is deliberately excluded, and that a women/diversity item
 * gets a wider window but only when there is no fresh one. An agent searching
 * afresh each month would rediscover all of that, badly, every month.
 *
 * Third, a pinned corpus is what makes a refusal honest. `pulse-apply.ts`
 * checks the draft against THIS FILE, not against a fresh fetch, so an item
 * cannot be refused because a feed rolled over between writing and checking.
 *
 * WHAT THE AGENT GETS, AND WHAT IT DOES NOT
 * -----------------------------------------
 * Each candidate carries its URL, source label, publication date and age, its
 * relevance tier in words, the publisher's own headline, a teaser, and the
 * retrieved text. That text is the SAME string `assertNumbersVerbatim` will
 * check a drafted item against — so a number the agent can read is a number it
 * may use, and there is no third case. The file also carries the editorial
 * brief and the house style from the library, rather than restating them, so
 * the rules the agent writes to and the rules the checker enforces cannot
 * drift.
 *
 * It does NOT carry the ordering decision (`selectNewsBites` owns that), the
 * attribution (attached from our fetched item), or anything the agent could
 * mistake for permission to cite a source that is not in the list.
 *
 * Usage:
 *   npx tsx scripts/newsletter/pulse-candidates.ts 2026-09
 *   npx tsx scripts/newsletter/pulse-candidates.ts 2026-09 --json
 */

import "dotenv/config";

import {
  fetchPulseSources,
  PULSE_EDITORIAL_BRIEF,
  pulsePreflightLines,
  RSS_TIER_LABELS,
  rssRelevanceRank,
  seekNewsCandidate,
} from "../../lib/newsletter/pulse";
import { PULSE_HOUSE_STYLE_RULES } from "../../lib/newsletter/pulse-copy";
import {
  draftPath,
  ISSUE_ID,
  monthLabel,
  writeCandidateFile,
  type PulseCandidate,
  type PulseCandidateFile,
} from "./pulse-candidate-file";

/** Prints an error and exits, in the house shape. */
function fail(...lines: string[]): never {
  console.error(`Error: ${lines[0]}`);
  for (const line of lines.slice(1)) console.error(`  ${line}`);
  process.exit(1);
}

/** Whole days between an ISO date and now; null when there is no usable date. */
function ageInDays(isoDate: string | null): number | null {
  if (!isoDate) return null;
  const stamp = Date.parse(isoDate);
  if (Number.isNaN(stamp)) return null;
  return Math.max(0, Math.floor((Date.now() - stamp) / (24 * 60 * 60 * 1000)));
}

/**
 * The draft shape, with one complete worked example.
 *
 * Written into the candidate file rather than only into SKILL.md so that an
 * agent which read the file and not the skill still writes the right JSON. The
 * example is the July 2026 hand-written section, which is the best the
 * newsletter has had — a real target rather than lorem ipsum.
 */
const DRAFT_SHAPE = {
  _comment:
    "Write this exact shape to the path in writeDraftTo, then run applyWith. " +
    "Every url must be copied from a candidate below. heroStat may be null.",
  heroStat: {
    value: "a number copied character-for-character from heroSource.text",
    label: "what it measures, at most 8 words, sentence case",
    context: "one plain sentence; any number in it must also be verbatim",
  },
  newsBites: [
    {
      title: "our headline, sentence case, at most 14 words, never the publisher's",
      summary:
        "At most two sentences, about 35 words. The fact, then what it means " +
        "for a woman working in or entering tech in New Zealand.",
      url: "https://example.co.nz/copied-exactly-from-a-candidate",
    },
  ],
  _workedExample: {
    heroStat: {
      value: "9.9%",
      label: "more NZ tech job ads than a year ago",
      context:
        "Tech job ads rose 9.9% on a year ago, while ads nationally rose just 0.2%.",
    },
    newsBites: [
      {
        title: "Know a Year 9 girl? August is when to nudge her",
        summary:
          "TechWomen NZ's ShadowTech26 places 1,500 secondary school girls in tech " +
          "workplaces this August, for Years 9 to 11. If you know one, this is the " +
          "month to tell her about it.",
        url: "https://techwomen.nz/shadowtech26/",
      },
    ],
  },
};

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const issueId = argv.find((arg) => !arg.startsWith("--"));
  const asJson = argv.includes("--json");

  if (!issueId || !ISSUE_ID.test(issueId)) {
    fail(
      "An issue id is required, as YYYY-MM.",
      "Usage: npx tsx scripts/newsletter/pulse-candidates.ts 2026-09 [--json]"
    );
  }

  console.log(`NZ Tech Pulse — gathering candidates for ${issueId} (${monthLabel(issueId)})`);
  console.log("");
  for (const line of pulsePreflightLines()) console.log(`  ${line}`);
  console.log("");
  console.log("  Fetching live sources…");

  const sources = await fetchPulseSources();
  const seek = seekNewsCandidate(sources.seekArticle);

  // The SEEK report goes in the list as a candidate — it is eligible for ONE
  // bite — and its full text also goes in `heroSource`, because the hero
  // statistic must come from it and an agent should not have to work out which
  // list entry is the one it is allowed to lead with.
  const items = [...sources.newsItems, ...(seek ? [seek] : [])];

  const candidates: PulseCandidate[] = items.map((item) => {
    const tier = rssRelevanceRank(item.title);
    return {
      url: item.url,
      sourceLabel: item.source,
      sourceTitle: item.title,
      publishedAt: item.isoDate,
      ageDays: ageInDays(item.isoDate),
      tier,
      tierLabel: RSS_TIER_LABELS[tier],
      isSeekReport: Boolean(seek && item.url === seek.url),
      teaser: item.snippet,
      text: item.sourceText,
    };
  });

  const file: PulseCandidateFile = {
    issue: issueId,
    monthLabel: monthLabel(issueId),
    generatedAt: new Date().toISOString(),
    writeDraftTo: draftPath(issueId).replace(/\\/g, "/"),
    applyWith:
      `npx tsx scripts/newsletter/pulse-apply.ts ${issueId} ` +
      `--from ${draftPath(issueId).replace(/\\/g, "/")}`,
    draftShape: DRAFT_SHAPE,
    editorialBrief: PULSE_EDITORIAL_BRIEF,
    houseStyle: PULSE_HOUSE_STYLE_RULES,
    heroSource: sources.seekArticle
      ? {
          sourceLabel: seek!.source,
          sourceTitle: sources.seekArticle.title,
          url: sources.seekArticle.url,
          text: sources.seekArticle.text,
        }
      : null,
    candidates,
  };

  const path = writeCandidateFile(file);

  console.log(
    `  SEEK report: ${sources.seekArticle ? "found" : "NOT FOUND"}` +
      `   news items fetched: ${sources.newsItems.length}`
  );
  console.log("");

  if (!sources.seekArticle) {
    console.log(
      "  ! No SEEK report this month, so there is no verifiable hero statistic.\n" +
        '    Write "heroStat": null and the evergreen pool supplies one. That is a\n' +
        "    correct outcome, not a gap to fill by hand.\n"
    );
  }

  console.log(`  ${candidates.length} candidate(s), in mission order:`);
  console.log("");
  for (const [index, candidate] of candidates.entries()) {
    const age =
      candidate.ageDays === null ? "no date" : `${candidate.ageDays}d old`;
    const seekMark = candidate.isSeekReport ? "  [SEEK — at most ONE bite]" : "";
    console.log(
      `  ${String(index + 1).padStart(2)}. [t${candidate.tier}] ${candidate.sourceLabel} · ${age}${seekMark}`
    );
    console.log(`      ${candidate.sourceTitle}`);
    console.log(`      ${candidate.url}`);
  }

  console.log("");
  console.log(`Wrote ${path.replace(/\\/g, "/")}`);
  console.log("");
  console.log("Next, YOU (the agent running this skill) write the section:");
  console.log(`  1. Read ${path.replace(/\\/g, "/")} — the editorialBrief and houseStyle in it are the rules.`);
  console.log(`  2. Write the draft to ${file.writeDraftTo} in the draftShape given there.`);
  console.log(`  3. ${file.applyWith}`);
  console.log("");
  console.log(
    "  Two items is a correct outcome. Nothing here may be sourced from a web\n" +
      "  search — every url must be copied from a candidate above, and every number\n" +
      "  must appear verbatim in that candidate's own `text`."
  );

  if (asJson) console.log(JSON.stringify(file, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
