/**
 * Layout and copy checks for the per-speaker artwork.
 *
 *   npx tsx scripts/events/poster-speaker.test.ts
 *
 * No network, no plate, no API key: this builds the layouts and inspects the
 * boxes, which is where every failure worth catching lives. The picture cannot
 * be asserted and does not need to be — what breaks is a job title that runs off
 * the right edge, a kicker that slides under a chin, and a call to action that
 * ends up behind Instagram's reply bar.
 *
 * WHY IT READS THE REAL RECORD RATHER THAN FIXTURES. Every one of these failures
 * arrives as a data change, not a code change: a re-synced heading, a longer job
 * title, a headshot that was never committed. A fixture would keep passing
 * through all of them. `lib/data/json/events-custom.json` is the input the
 * posters actually have, so it is the input this checks.
 */

import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { getAllEvents, getEventBySlug } from "@/lib/data/events";
import { loadEventForDeck } from "@/lib/deck/event-source";
import { contrastRatio } from "@/lib/deck/theme";

import { copyFor, rosterFor, speakerCopyFor } from "./build-event-poster";
import {
  FORMATS,
  SHE_SHARP_LIGHT_THEME,
  SHE_SHARP_THEME,
  SOCIAL_BAND,
  lockup,
  lockupBudget,
  pillBox,
  pillInk,
  type PosterCopy,
  type PosterTheme,
} from "./poster-formats";
import {
  HOOK_MAX_WORDS,
  LINEUP_FORMATS,
  SPEAKER_FORMATS,
  STORY_BAND,
  STORY_SAFE,
  assertHook,
  roleLabelFor,
  solveNameSize,
  type LineupCopy,
  type SpeakerCopy,
} from "./poster-speaker-formats";
import { speakerSlug } from "./poster-type";

const TRIAL = "event-lesmills-03-september-2026";
const HACKATHON = "aotearoa-ai-hackathon-festival-2026";
/** The first event She Sharp ran with two co-hosts rather than one partner. */
const TWO_HOSTS = "code-secure-2026";

let failures = 0;

function check(name: string, run: () => void): void {
  try {
    run();
    console.log(`ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`not ok - ${name}\n    ${(error as Error).message.split("\n").join("\n    ")}`);
  }
}

/* ------------------------------------------------------------------ naming */

check("a name slug survives titles, initials and brackets", () => {
  assert.equal(speakerSlug("Keryn McKenzie"), "keryn-mckenzie");
  assert.equal(speakerSlug("Dr. Mahsa Mohaghegh (McCauley)"), "dr-mahsa-mohaghegh-mccauley");
  assert.equal(speakerSlug("José Ángel Núñez"), "jose-angel-nunez");
  // The slug is also the headshot's filename, which is why round-tripping it
  // matters more than the exact spelling: `--speaker keryn-mckenzie` has to find
  // the same person that `keryn-mckenzie.jpg` belongs to.
  const roster = rosterFor(loadEventForDeck(TRIAL));
  assert.ok(roster.some((entry) => entry.slug === "keryn-mckenzie"));
});

/* ------------------------------------------------------------------- roles */

check("the judges are called judges, not panellists", () => {
  // The hackathon files its JUDGES under the `panelists` key with the heading
  // "Meet the Judges". A key-driven label would print PANELLIST on a judge's
  // poster, next to their photograph, in public.
  const event = getEventBySlug(HACKATHON);
  assert.ok(event, `${HACKATHON} is missing from the event data`);
  const judges = rosterFor(event).filter((e) => /judg/i.test(e.heading));
  assert.ok(judges.length > 0, "expected a group whose heading names judges");
  assert.equal(judges[0].groupKey, "panelists", "the trap has moved — re-read this test");

  const label = roleLabelFor(judges[0].groupKey, judges[0].heading);
  assert.equal(label.label, "JUDGE");
  assert.equal(label.from, "heading");
});

check("--role wins, and an unrecognisable group refuses rather than guessing", () => {
  assert.equal(roleLabelFor("panelists", "Meet the Judges", "Guest speaker").label, "GUEST SPEAKER");
  assert.equal(roleLabelFor("panel_speakers", "Meet the Panel").label, "PANELLIST");
  // No heading, no key: printing "SPEAKER" here would be inventing a fact about
  // a named person, which is the one thing the skill's first guardrail forbids.
  assert.throws(() => roleLabelFor("something_new", ""), /--role/);
});

/* -------------------------------------------------------------------- copy */

check("a speaker with no photograph is refused by name", () => {
  // Two of the speakers in events-custom.json carry `image: ""`. Without this
  // check the build dies inside sharp with "Input file is missing" — a stack
  // trace, which the skill's fourth guardrail forbids handing to an organiser.
  const faceless = getAllEvents()
    .flatMap((event) => rosterFor(event))
    .filter((entry) => !entry.person.image?.trim());

  for (const entry of faceless) {
    assert.throws(
      () => speakerCopyFor(entry, { nameSize: 100 }),
      (error: Error) => error.message.includes(entry.person.name),
      `expected a refusal naming ${entry.person.name}`,
    );
  }
});

check("every listed headshot is actually on disk", () => {
  // The JSON path and the committed file are written by different steps of
  // sync-event-from-slack, so they can disagree — and when they do, the poster
  // build is where it surfaces.
  const missing = getAllEvents()
    .flatMap((event) => rosterFor(event))
    .filter((entry) => entry.person.image?.trim())
    .filter(
      (entry) =>
        !existsSync(path.join(process.cwd(), "public", entry.person.image.replace(/^\//, ""))),
    )
    .map((entry) => `${entry.person.name} → ${entry.person.image}`);

  assert.deepEqual(missing, [], `headshots listed in the record but not on disk`);
});

check("a hook longer than one line is refused", () => {
  const nine = "Where artificial intelligence finally meets the whole finance team";
  assert.equal(nine.split(/\s+/).length, HOOK_MAX_WORDS);
  assert.equal(assertHook(nine, "Someone"), nine);
  assert.throws(() => assertHook(`${nine} today`, "Carolina Lobos"), /Carolina Lobos/);
});

/* ------------------------------------------------------------------ layout */

const theme: PosterTheme = SHE_SHARP_THEME;

/** The trial event's four panellists, with a hook each. */
function trialSpeakers(hook?: string): { copy: SpeakerCopy[]; poster: ReturnType<typeof posterCopyFor> } {
  const event = loadEventForDeck(TRIAL);
  const roster = rosterFor(event);
  const column = Math.min(...SPEAKER_FORMATS.map((f) => f.column));
  const nameMax = Math.min(...SPEAKER_FORMATS.map((f) => f.nameMax));
  const nameSize = solveNameSize(roster.map((e) => e.person.name), column, nameMax);
  return {
    copy: roster.map((entry) => speakerCopyFor(entry, { hook, nameSize })),
    poster: posterCopyFor(),
  };
}

/** The event half of the copy, built the way `build-event-poster.ts` builds it. */
function posterCopyFor() {
  const event = loadEventForDeck(TRIAL);
  const detail = event.detailPageData;
  return {
    event: TRIAL,
    titleLead: "No Pain, All Gain",
    titleTail: "Getting Fit for AI",
    date: "Thursday, 3 September 2026",
    time: (detail.time ?? "").trim(),
    venue: detail.location?.venueName?.trim() ?? "",
    partners: [{ name: "Les Mills", logo: "/img/sponsors/lesmills_logo.svg" }],
    hasRsvp: true,
  };
}

check("no line runs off the edge of any speaker poster", () => {
  // THIS IS THE ONE WITH NO OTHER GUARD. The legibility gate measures the ground
  // under a box and reports a clean pass for a line that has left the frame,
  // because the ground out there is fine. Nothing else in the pipeline looks at
  // x at all.
  const { copy, poster } = trialSpeakers("Where AI meets the finance team");

  for (const format of SPEAKER_FORMATS) {
    for (const speaker of copy) {
      const layout = format.build(poster, speaker, theme);
      for (const box of layout.boxes) {
        assert.ok(
          box.left >= 0 && box.left + box.width <= format.width,
          `${format.key}/${speaker.slug}: "${box.name}" spans x ${box.left}–${
            box.left + box.width
          } in a ${format.width}px frame`,
        );
        assert.ok(
          box.top >= 0 && box.top + box.height <= format.height,
          `${format.key}/${speaker.slug}: "${box.name}" spans y ${box.top}–${
            box.top + box.height
          } in a ${format.height}px frame`,
        );
      }
    }
  }
});

check("the portrait lands in the frame and nothing is set on top of it", () => {
  const { copy, poster } = trialSpeakers("Where AI meets the finance team");

  for (const format of SPEAKER_FORMATS) {
    for (const speaker of copy) {
      const layout = format.build(poster, speaker, theme);
      assert.equal(layout.portraits?.length, 1, `${format.key} should place one portrait`);
      const p = layout.portraits![0];
      assert.ok(
        p.left >= 0 && p.top >= 0 && p.left + p.size <= format.width && p.top + p.size <= format.height,
        `${format.key}/${speaker.slug}: portrait ${p.size}px at (${p.left}, ${p.top}) leaves the frame`,
      );
      // `speakerLayout` asserts this internally, so reaching here at all is the
      // check; the explicit repeat is what makes the failure readable.
      const cx = p.left + p.size / 2;
      const cy = p.top + p.size / 2;
      for (const box of layout.boxes) {
        const nx = Math.max(box.left, Math.min(cx, box.left + box.width));
        const ny = Math.max(box.top, Math.min(cy, box.top + box.height));
        assert.ok(
          (cx - nx) ** 2 + (cy - ny) ** 2 >= (p.size / 2) ** 2,
          `${format.key}/${speaker.slug}: "${box.name}" is over the face`,
        );
      }
    }
  }
});

check("the story keeps its call to action clear of Instagram's chrome", () => {
  const story = SPEAKER_FORMATS.find((f) => f.key === "story");
  assert.ok(story);
  const { copy, poster } = trialSpeakers();

  // A nine-word hook is the documented maximum and must fit.
  story.build(
    poster,
    { ...copy[0], hook: "Where artificial intelligence finally meets the whole finance team" },
    theme,
  );

  // The band is a CONSTANT, because the copy is bottom-anchored: a long job
  // title shrinks the portrait rather than pushing anything down. So no input
  // can move the pill, and the only way it ends up behind Instagram's reply bar
  // is somebody nudging these numbers in a later tuning pass — with nothing to
  // notice, because the pill is a <rect> and every box-walking assert in the
  // pipeline only sees TextBoxes. The file looks right, the preview looks right,
  // and the call to action is hidden the moment it goes live.
  const box = pillBox("RSVP TODAY", STORY_BAND.pill);
  assert.ok(
    STORY_BAND.y >= STORY_SAFE.top,
    `the story band starts at ${STORY_BAND.y}, above the safe top ${STORY_SAFE.top}`,
  );
  assert.ok(
    STORY_BAND.y + box.height <= STORY_SAFE.bottom,
    `the RSVP pill ends at ${Math.round(STORY_BAND.y + box.height)}, past the safe bottom ${
      STORY_SAFE.bottom
    }`,
  );
});

check("a long job title wraps rather than being cut, and an impossible one is refused", () => {
  const { copy, poster } = trialSpeakers();
  const social = SPEAKER_FORMATS.find((f) => f.key === "social");
  assert.ok(social);

  // The longest real title in the repo. It has to SET, on two lines — clamping
  // it to six words the way a slide does would turn it into a different job.
  const long = {
    ...copy[0],
    title:
      "Commissioner for NZ-UNESCO · Chair, AI Forum NZ · Head of Computer and Information Sciences",
  };
  const layout = social.build(poster, long, theme);
  assert.equal(
    layout.boxes.filter((b) => b.name === "job title").length,
    2,
    "the repo's longest real title should occupy two lines",
  );
  for (const box of layout.boxes) {
    assert.ok(box.left + box.width <= social.width, `"${box.name}" leaves the frame`);
  }

  // Three lines is where it stops being a job title and starts being a bio.
  assert.throws(
    () =>
      social.build(
        poster,
        {
          ...copy[0],
          title:
            "Commissioner for NZ-UNESCO and Chair of the AI Forum of New Zealand and Head of " +
            "the School of Computer and Information Sciences and Director of the Centre for " +
            "Artificial Intelligence Research",
        },
        theme,
      ),
    /needs \d+ lines|does not fit/,
    "a title this long should be refused with an explanation, not silently cut",
  );
});

check("every name in a run is set at the same size", () => {
  const { copy, poster } = trialSpeakers();
  const social = SPEAKER_FORMATS.find((f) => f.key === "social");
  assert.ok(social);

  // Fitted independently, "Ben Sullivan" solves far larger than "Gemma Lynskey".
  // Four posts a week apart, at two different display sizes, read as two
  // designs rather than one campaign.
  const sizes = new Set(copy.map((s) => s.nameSize));
  assert.equal(sizes.size, 1, "the run should share one name size");
  for (const speaker of copy) social.build(poster, speaker, theme);
});

/* ----------------------------------------------------------------- line-up */

check("the line-up carries a panel and refuses a crowd", () => {
  const { copy, poster } = trialSpeakers();
  const lineup = LINEUP_FORMATS[0];

  const panel: LineupCopy = { heading: "Meet the Panel", people: copy };
  const layout = lineup.build(poster, panel, theme);
  assert.equal(layout.portraits?.length, 4);

  // The 2026 hackathon lists seventeen mentors. Cropping the group to fit would
  // post four faces and drop thirteen names without saying so.
  const crowd: LineupCopy = {
    heading: "Meet the Mentors",
    people: Array.from({ length: 17 }, (_, i) => ({ ...copy[i % copy.length], slug: `person-${i}` })),
  };
  assert.throws(() => lineup.build(poster, crowd, theme), /one at a time|--speaker all/);
  assert.throws(
    () => lineup.build(poster, { heading: "Solo", people: [copy[0]] }, theme),
    /at least two/,
  );
});

/* -------------------------------------------------------------------- pill */

check("the RSVP pill's label is readable on whatever accent it is given", () => {
  // Brand magenta keeps white. 4.27:1 is below the body-text floor and above the
  // large-text one, which is the right question for a 32pt word in a solid fill;
  // it is also the look that has shipped for every poster so far, and flipping
  // it would change published artwork to fix nothing.
  assert.equal(pillInk(SHE_SHARP_THEME), SHE_SHARP_THEME.ink);

  // The Les Mills deck's accent is a mint tuned for navy slides. White on it is
  // 1.22:1 — the pill rendered as an empty lozenge, and the one component
  // exempt from the legibility gate was the one that had broken.
  const mint: PosterTheme = { ...SHE_SHARP_THEME, accent: "#b1f6e9" };
  assert.equal(pillInk(mint), SHE_SHARP_THEME.canvas);
  assert.ok(contrastRatio(pillInk(mint), mint.accent) >= 4.5);
});


/* ------------------------------------------------------------------ hosts */

/**
 * A slice of a mark's own path data, as proof that mark was actually drawn.
 *
 * Counting `<g>` elements would not do: two of these logos carry their own inner
 * groups, and the failure being guarded against is a host silently missing from
 * the artwork — which is a count that looks plausible either way.
 */
function markFingerprint(logo: string): string {
  const raw = readFileSync(path.join(process.cwd(), "public", logo.replace(/^\//, "")), "utf8");
  const d = raw.match(/ d="([^"]{80,})"/)?.[1];
  assert.ok(d, `${logo} has no path long enough to fingerprint`);
  return (d as string).slice(0, 60);
}

/** The widest wordmark in the repo — the one that makes a lockup run out of room. */
const WIDEST = { name: "Les Mills", logo: "/img/sponsors/lesmills_logo.svg" };

check("every host on the record reaches the artwork, at every size", () => {
  // THE DEFECT THIS FILE EXISTS FOR, in its newest form. code-secure-2026 has two
  // co-hosts; the lockup took `partnerLogosFrom(event)[0]` and the poster that
  // shipped showed one of them. Nothing failed, because a lockup is a `<g>` and
  // every assert in this pipeline walks TextBoxes.
  const copy = copyFor(TWO_HOSTS);
  assert.equal(copy.partners.length, 2, `${TWO_HOSTS} should be billed with two hosts`);

  const prints = copy.partners.map((partner) => markFingerprint(partner.logo));
  for (const format of FORMATS) {
    const layout = format.build(copy, theme);
    for (const [i, print] of prints.entries()) {
      assert.ok(
        layout.type.includes(print),
        `${format.key} drew no mark for ${copy.partners[i].name}`,
      );
    }
  }
});

check("the marks scale to the budget, and an impossible line-up is refused", () => {
  const base = copyFor(TWO_HOSTS);
  // The square's band is the tightest of the event formats: 150pt She Sharp mark
  // in a 912px column.
  const box = { x: 84, y: 0, sheSharpWidth: 150, maxWidth: 912 };

  for (const n of [1, 2, 3, 4]) {
    const copy: PosterCopy = { ...base, partners: Array.from({ length: n }, () => WIDEST) };
    const mark = lockup(copy, theme, box);
    assert.ok(
      mark.width <= box.maxWidth + 0.5,
      `${n} hosts made a ${Math.round(mark.width)}px lockup in a ${box.maxWidth}px budget`,
    );
    // …and every one of them is still on the poster. Fitting by dropping the
    // last host would satisfy the width check and be the original bug.
    const drawn = mark.markup.match(/transform="translate\(/g) ?? [];
    assert.equal(drawn.length, n + 1, `${n} hosts should draw ${n + 1} marks`);
  }

  // Eight wordmarks cannot be set at a readable size in that column, and the
  // refusal has to say whose poster it is and how many hosts it was given —
  // the person reading it is an organiser, not the author of this file.
  const crowd: PosterCopy = { ...base, partners: Array.from({ length: 8 }, () => WIDEST) };
  assert.throws(
    () => lockup(crowd, theme, box),
    (error: Error) =>
      error.message.includes(TWO_HOSTS) && error.message.includes("8 host logos"),
    "expected a refusal naming the event and the number of hosts",
  );
});

check("a bottom band leaves the lockup and the call to action clear of each other", () => {
  // Both are chrome — a `<g>` and a `<rect>` — so nothing else in the pipeline
  // would notice two co-hosts sliding under the RSVP pill.
  const pill = pillBox("RSVP TODAY", SOCIAL_BAND.pill);
  const budget = lockupBudget({
    left: 72,
    right: 1080 - 72,
    sheSharpWidth: SOCIAL_BAND.logo,
    pillWidth: pill.width,
  });
  assert.ok(budget < 1080 - 144, "the pill's side of the band was not subtracted");

  const mark = lockup(copyFor(TWO_HOSTS), theme, {
    x: 72,
    y: SOCIAL_BAND.y,
    sheSharpWidth: SOCIAL_BAND.logo,
    maxWidth: budget,
  });
  assert.ok(
    72 + mark.width <= 1080 - 72 - pill.width,
    `the lockup ends at ${Math.round(72 + mark.width)} and the pill starts at ${
      Math.round(1080 - 72 - pill.width)
    }`,
  );
});

check("a host's own brand colours do not survive into the lockup", () => {
  // Xero and Secure Code Warrior both declare their fills, and an explicit fill
  // beats an inherited one — so the wrapper's ink never reached them. Xero came
  // out in brand cyan beside a cyan spark; Secure Code Warrior's `#202A42`
  // wordmark came out invisible on a near-black poster, which is the missing
  // host all over again.
  const mark = lockup(copyFor(TWO_HOSTS), theme, {
    x: 96,
    y: 108,
    sheSharpWidth: 208,
    maxWidth: 1208,
  });
  assert.ok(!/#202A42/i.test(mark.markup), "Secure Code Warrior kept its navy");
  assert.ok(!/#13B5EA/i.test(mark.markup), "Xero kept its cyan");
  assert.ok(mark.markup.includes(theme.ink), "the marks are not set in the poster's ink");
  // The shield is drawn through a luminance mask whose path is `fill="white"`.
  // Repaint that and the mask stops passing light and the mark disappears —
  // which is why the repaint is a scan rather than one String.replace.
  assert.match(mark.markup, /<mask[\s\S]{0,400}?fill="white"/);
});

/* ------------------------------------------------------------------ light */

check("the light palette clears the same floor the gate applies, in reverse", () => {
  // Measured against the ground the gate actually samples — the canvas laid over
  // a near-black plate at the wash's own 0.94 — not against the canvas.
  const ground = "#e6e3df";
  assert.ok(
    contrastRatio(SHE_SHARP_LIGHT_THEME.ink, ground) >= 4.5,
    "the light theme's ink does not clear the gate on its own ground",
  );
  assert.ok(
    contrastRatio(SHE_SHARP_LIGHT_THEME.spark, ground) >= 4.5,
    "the light theme's spark does not clear the gate on its own ground",
  );
  // And this is why --light is one named palette rather than an --ink flag: the
  // dark theme's spark measures 1.28:1 here, so a half-swapped theme would be a
  // poster with an invisible kicker and no way for a flag to know.
  assert.ok(contrastRatio(SHE_SHARP_THEME.spark, ground) < 4.5);
  assert.equal(pillInk(SHE_SHARP_LIGHT_THEME), SHE_SHARP_LIGHT_THEME.ink);
});

check("no format writes a colour of its own instead of the theme's", () => {
  // The whole of Task B in one assertion: `INK = "#ffffff"` was a module
  // constant, and one line of it left behind anywhere would ship white type on a
  // pale poster — legible in the file, invisible on the wall.
  const light = SHE_SHARP_LIGHT_THEME;
  const allowed = new Set([light.ink, light.spark]);
  const { copy, poster } = trialSpeakers("Where AI meets the finance team");
  const lightPoster: PosterCopy = { ...poster };

  const layouts = [
    ...FORMATS.map((f) => f.build(lightPoster, light)),
    ...SPEAKER_FORMATS.map((f) => f.build(lightPoster, copy[0], light)),
    ...LINEUP_FORMATS.map((f) =>
      f.build(lightPoster, { heading: "Meet the Panel", people: copy }, light),
    ),
  ];
  for (const layout of layouts) {
    for (const box of layout.boxes) {
      assert.ok(allowed.has(box.ink), `"${box.name}" is set in ${box.ink}, not a theme colour`);
    }
  }
});

if (failures > 0) {
  console.error(`\n${failures} check(s) failed.`);
  process.exit(1);
}
console.log("\nAll speaker-poster checks passed.");
