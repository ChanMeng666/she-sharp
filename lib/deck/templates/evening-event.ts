/**
 * The deck shape of an ordinary She Sharp evening.
 *
 * Twelve years of events land on the same shape: an Auckland evening, five
 * o'clock to half seven, in six blocks — food and hello, welcome and karakia,
 * the thing people came for, a break and a photograph, a room-wide activity,
 * then thanks and goodbye. The hackathon is the exception, not the rule, and it
 * is the only deck that existed when this file was written.
 *
 * ## What this produces, and why it is source rather than slides
 *
 * The planner does not return `Slide[]`. It returns **TypeScript fragments**
 * that `scripts/deck/new-deck.ts` writes into a deck file. That matters because
 * the whole workflow assumes the deck is a document a person reads, trims and
 * annotates: the organiser deletes the blocks their event does not have, and
 * writes the host note that says what to say. A deck assembled at runtime by a
 * function call cannot be trimmed, cannot carry a note, and cannot be reviewed
 * — it exists only on the projector.
 *
 * The fragments themselves reference **live expressions**, not baked values:
 *
 * ```ts
 * items: RUN_SHEET.items          // not a copied array of times
 * people: PANEL.people            // not copied names and job titles
 * ```
 *
 * So the division is deliberate and it is the point of the whole exercise:
 *
 * | Stays live, read from the event JSON on every build | Baked into the deck file |
 * |---|---|
 * | names, roles, employers, headshots | host notes and kickers |
 * | run-sheet times and labels | copy rewritten to fit a slide |
 * | title, date, venue, partner logos | colour, chosen photographs |
 *
 * Correct a speaker's job title in `events-custom.json` and the website and the
 * projector change together, with no edit to the deck. Add a whole new speaker
 * group and the deck needs regenerating, because that is a change of shape
 * rather than a change of fact.
 *
 * ## Why there is no rhythm "repair" pass
 *
 * The obvious way to satisfy `lintRhythm` is to assemble the middle and then
 * insert a photograph wherever a run gets too long. It was the first design and
 * it is wrong three times over: the inserted slide's only relationship to its
 * neighbours is arithmetic, so nobody can answer "why is there a photo here";
 * it can drop a countdown for a break that is not in the run sheet, so the deck
 * contradicts the thing the host is following; and because it happens after
 * generation the slide is not in the file, so it cannot be deleted.
 *
 * Instead the structure makes long runs unreachable. Chapters are small — one
 * dark divider carrying one or two light information slides — and a chapter's
 * divider dies with its body, so **removing an optional slide can only shorten
 * a run, never lengthen one**. That single property is what makes the template
 * safe across every combination of missing event data, and it is asserted
 * exhaustively in `deck.test.ts` rather than argued for here.
 *
 * The one constraint that no amount of local reasoning would have caught:
 * `buildClosingSlides()` ends every deck with four consecutive information
 * slides (thanks, upcoming, feedback, ambassador). Four is the limit. So **the
 * middle's last slide must be a full-frame slide**, or the run reaches five and
 * the deck fails. That is why the finale is mandatory and never conditional.
 */

import type { EventV3 } from "@/types/event";

import {
  type RunSheet,
  type SpeakerGroup,
  deckTitleFrom,
  densityFor,
  findRow,
  findRowByPatterns,
  listSectionFrom,
  minutesOf,
  partnerLogosFrom,
  runSheetFrom,
  shortenBullet,
  speakerGroupsFrom,
} from "../event-source";
import { COPY_LIMITS } from "../lint";
import { type RhythmStep, rhythmViolations } from "../rhythm";
import type { SlideTone, SlideType } from "../types";

/** A slide the planner has decided on, as source plus what rhythm needs. */
export interface PlannedSlide {
  id: string;
  type: SlideType;
  tone: SlideTone;
  /** The TypeScript object literal written into the deck file. */
  source: string;
  /** A comment written above the fragment, explaining why it is there. */
  why?: string;
}

/** Something the organiser has to be told before the deck is shown to anyone. */
export interface PlanNote {
  kind: "dropped" | "shortened" | "confirm" | "missing";
  message: string;
}

export interface EveningPlan {
  /** `const` declarations the fragments refer to, written above the deck. */
  preamble: string[];
  slides: PlannedSlide[];
  notes: PlanNote[];
  /** Import specifiers from `../event-source` the preamble needs. */
  sourceImports: string[];
}

export interface EveningOptions {
  event: EventV3;
  /** The chapter label carried by every middle slide; defaults to the title. */
  sectionLabel?: string;
  /** Blocks to leave out even though the data supports them. */
  omit?: readonly EveningBlockKey[];
}

export type EveningBlockKey =
  | "run-sheet"
  | "host"
  | "main-act"
  | "explore"
  | "tables"
  | "readouts"
  | "finale";

/** A chapter: a dark divider that lives or dies with its body. */
interface Chapter {
  key: EveningBlockKey;
  divider?: PlannedSlide;
  body: PlannedSlide[];
  /**
   * A dark beat written for this chapter's middle, used only when the chapter
   * grows past the budget below.
   */
  beat?: PlannedSlide;
}

/**
 * Information slides one chapter may carry before it needs a breath.
 *
 * The linter's limit is four. Three leaves a slide of slack for whatever
 * follows the chapter — an undivided block such as the readouts, which appends
 * straight onto the previous chapter's run.
 *
 * Chapters overrun through data *growth*, never through absence: an event with
 * three speaker groups makes the main act four slides where an event with one
 * makes it two. That is why the answer is a beat authored in advance for a
 * known seam, rather than a slide inserted wherever a counter happens to trip.
 */
const BODY_BUDGET = 3;

/** Renders a value as a TypeScript source literal. */
function lit(value: unknown): string {
  return JSON.stringify(value);
}

/** Indents an object literal's inner lines to sit inside the slides array. */
function slide(fields: Record<string, string | undefined>): string {
  const body = Object.entries(fields)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `      ${key}: ${value},`)
    .join("\n");
  return `    {\n${body}\n    }`;
}

/**
 * Run-sheet labels that break the six-word cap, as an exact-match map.
 *
 * Written into the deck file as a literal, the way the hackathon deck does it.
 * The value of an exact-match map over a truncation is what happens when the
 * event JSON is edited later: the key stops matching, the long label falls
 * through, and the linter fails loudly. A truncation would silently re-truncate
 * something the organiser had already approved.
 */
function labelReplacements(sheet: RunSheet): { map: Record<string, string>; notes: PlanNote[] } {
  const map: Record<string, string> = {};
  const notes: PlanNote[] = [];

  for (const item of sheet.items) {
    const words = item.label.trim().split(/\s+/).filter(Boolean).length;
    if (words <= COPY_LIMITS.agendaLabelWords) continue;

    const short = shortenBullet(item.label, COPY_LIMITS.agendaLabelWords);
    if (short) {
      map[item.label] = short;
      notes.push({
        kind: "shortened",
        message: `Run sheet, ${item.time}: "${item.label}" → "${short}"`,
      });
    } else {
      notes.push({
        kind: "confirm",
        message:
          `Run sheet, ${item.time}: "${item.label}" is ${words} words and the ` +
          `slide holds ${COPY_LIMITS.agendaLabelWords}. Needs a shorter label — ask what to call it.`,
      });
    }
  }

  return { map, notes };
}

/** The chapter label every middle slide carries, for the overview grid. */
function chapterOf(options: EveningOptions): string {
  return options.sectionLabel ?? deckTitleFrom(options.event);
}

/** A `people` slide per speaker group, split when a group is too large. */
function peopleSlides(
  groups: SpeakerGroup[],
  section: string,
  notes: PlanNote[],
): PlannedSlide[] {
  /* `?? []` rather than a bare index: if every speaker is later removed from
     the event data this renders an empty slide the linter flags, instead of
     throwing during the build of a page nobody is looking at yet. */
  return groups.map((group, index) => {
    const { density, shape } = densityFor(group.people.length);
    const cap = COPY_LIMITS.peopleCount[density];
    if (group.people.length > cap) {
      notes.push({
        kind: "confirm",
        message:
          `${group.heading} has ${group.people.length} people; a slide holds ${cap}. ` +
          "The extras are not shown — split the group in the event data or drop the slide.",
      });
    }

    return {
      id: `meet-${group.key.replace(/_/g, "-")}`,
      type: "people" as const,
      tone: "light" as const,
      source: slide({
        id: lit(`meet-${group.key.replace(/_/g, "-")}`),
        type: lit("people"),
        section: lit(section),
        eyebrow: lit(index === 0 ? "Please welcome them" : "And with them"),
        title: lit(group.heading),
        people: `SPEAKERS[${index}]?.people ?? []`,
        density: lit(density),
        shape: lit(shape),
        note: lit(
          "Read the names out. Say each person's role, not their biography — " +
            "the full bios are on the event page behind the closing QR code.",
        ),
      }),
    };
  });
}

/**
 * Plans the middle of an evening-event deck.
 *
 * Throws rather than returning a deck that breaks a sequence rule. The failure
 * lands on whoever ran the scaffold, which is the only place it can be fixed;
 * an organiser cannot act on it and must never be shown it.
 */
export function planEveningEvent(options: EveningOptions): EveningPlan {
  const { event } = options;
  const omit = new Set(options.omit ?? []);
  const section = chapterOf(options);
  const notes: PlanNote[] = [];
  const preamble: string[] = [];
  const sourceImports = new Set<string>(["loadEventForDeck"]);

  const sheet = runSheetFrom(event);
  const groups = speakerGroupsFrom(event);
  const partners = partnerLogosFrom(event);
  const chapters: Chapter[] = [];

  /*
   * `PARTNERS` is declared whether or not the host block survives — the
   * opening and closing boilerplate both take the logos, so the const is not
   * the host slide's to own. It is legitimately empty for an event with no
   * partner, and both builders handle that.
   */
  sourceImports.add("partnerLogosFrom");
  preamble.push("const PARTNERS = partnerLogosFrom(event);");

  // --- A. The run sheet ----------------------------------------------------
  if (!omit.has("run-sheet") && sheet.items.length > 0) {
    const { map, notes: labelNotes } = labelReplacements(sheet);
    notes.push(...labelNotes);

    sourceImports.add("runSheetFrom");
    preamble.push(
      "/* The run sheet is read from the event's own schedule section, so a time",
      "   changed in `events-custom.json` changes the website and this slide",
      "   together. Labels too long for the slide are replaced by exact match",
      "   below — if a label is edited in the JSON its key stops matching and the",
      "   linter says so, which is the failure we want. */",
      "const RUN_SHEET = runSheetFrom(event);",
      `const RUN_SHEET_LABELS: Record<string, string> = ${JSON.stringify(map, null, 2)};`,
      "",
      "const RUN_SHEET_ROWS = RUN_SHEET.items.map((row) => ({",
      "  ...row,",
      "  label: RUN_SHEET_LABELS[row.label] ?? row.label,",
      "}));",
    );

    if (sheet.items.length > COPY_LIMITS.agendaRows) {
      notes.push({
        kind: "confirm",
        message: `The run sheet has ${sheet.items.length} rows and a slide holds ${COPY_LIMITS.agendaRows}. Split it across two slides.`,
      });
    }
    for (const line of sheet.skipped) {
      notes.push({
        kind: "dropped",
        message: `Not a timed row, left off the run sheet: "${line}"`,
      });
    }

    chapters.push({
      key: "run-sheet",
      body: [
        {
          id: "tonight-run-sheet",
          type: "agenda",
          tone: "light",
          source: slide({
            id: lit("tonight-run-sheet"),
            type: lit("agenda"),
            section: lit(section),
            eyebrow: lit("Up again at the break"),
            title: lit("How Tonight Runs"),
            items: "RUN_SHEET_ROWS",
            note: lit(
              "The most-looked-at slide of the night. Leave it up while people " +
                "are still finding seats, and come back to it at the break.",
            ),
          }),
        },
      ],
    });
  } else if (!omit.has("run-sheet")) {
    notes.push({
      kind: "missing",
      message:
        "This event has no timed schedule in its data, so there is no run-sheet " +
        "slide. It is the slide people look at most — worth adding an `agenda` " +
        "section to the event in `events-custom.json`.",
    });
  }

  // --- B. Tonight's host ---------------------------------------------------
  if (!omit.has("host") && partners.length > 0) {
    chapters.push({
      key: "host",
      body: [
        {
          id: "tonights-host",
          type: "logos",
          tone: "light",
          source: slide({
            id: lit("tonights-host"),
            type: lit("logos"),
            section: lit(section),
            eyebrow: lit("They opened the doors"),
            title: lit("Tonight's Hosts"),
            lead: lit("Thank you for the room, the food and the evening"),
            groups: `[{ label: "Hosting with She Sharp", logos: PARTNERS, size: "lg" }]`,
            note: lit(
              "Name the host organisation and the person from it who is in the " +
                "room. If they are speaking later, say so now.",
            ),
          }),
        },
      ],
    });
  }

  // --- C/D. The main act: speakers, then what the room will get ------------
  /*
   * Each chapter names itself, rather than every middle slide carrying the
   * event title. `groupSlides()` builds the `O` overview from this field, so
   * one label across ten slides makes the overview a single undifferentiated
   * block — which is no use to the person trying to skip ahead when the panel
   * overruns, and skipping ahead is what the overview is for.
   */
  const mainLabel = groups[0]?.heading ?? "Tonight's Kōrero";
  const tablesLabel = "Over To The Room";

  const mainBody: PlannedSlide[] = [];
  if (!omit.has("main-act") && groups.length > 0) {
    sourceImports.add("speakerGroupsFrom");
    preamble.push("const SPEAKERS = speakerGroupsFrom(event);");
    mainBody.push(...peopleSlides(groups, mainLabel, notes));
  }

  if (!omit.has("explore")) {
    const list = listSectionFrom(event, /why.?attend|what you|explore|gain|learn|expect/i);
    if (list) {
      const kept: string[] = [];
      for (const item of list.items) {
        if (kept.length >= COPY_LIMITS.bulletCount) {
          notes.push({
            kind: "dropped",
            message: `"${list.title}" has more than ${COPY_LIMITS.bulletCount} points; not shown: "${item}"`,
          });
          continue;
        }
        const short = shortenBullet(item);
        if (!short) {
          notes.push({
            kind: "dropped",
            message: `"${list.title}": too long for a bullet and no natural cut — "${item}"`,
          });
          continue;
        }
        if (short !== item.trim().replace(/[.]+$/, "")) {
          notes.push({ kind: "shortened", message: `"${item}" → "${short}"` });
        }
        kept.push(short);
      }

      if (kept.length > 0) {
        mainBody.push({
          id: "what-well-explore",
          type: "bullets",
          tone: "light",
          source: slide({
            id: lit("what-well-explore"),
            type: lit("bullets"),
            section: lit(mainLabel),
            eyebrow: lit("Ask about any of these"),
            title: lit(list.title),
            items: `[\n${kept.map((item) => `        ${lit(item)},`).join("\n")}\n      ]`,
            note: lit(
              "These came from the event page, shortened to fit. Say them as " +
                "an invitation to ask questions, not as a syllabus.",
            ),
          }),
        });
      }
    }
  }

  if (mainBody.length > 0) {
    chapters.push({
      key: "main-act",
      beat: {
        id: "the-room",
        type: "photo",
        tone: "dark",
        source: slide({
          id: lit("the-room"),
          type: lit("photo"),
          section: lit(mainLabel),
          eyebrow: lit("Look around a moment"),
          image: "CHAPTER_BEAT",
          overlay: lit("gradient"),
          note: lit(
            "Say nothing over this one. It is here to give the room a breath " +
              "between the introductions and what the speakers will cover.",
          ),
        }),
        why:
          "A breath in the middle of a long chapter. Tonight has enough " +
          "speaker groups that this chapter runs to four information slides, " +
          "which is one more than a room takes without a pause. Delete this " +
          "and the deck fails its shape check; drop a speaker group from the " +
          "event data and it stops being generated.",
      },
      divider: {
        id: "section-main-act",
        type: "section",
        tone: "dark",
        source: slide({
          id: lit("section-main-act"),
          type: lit("section"),
          section: lit(mainLabel),
          eyebrow: lit("Phones down for this bit"),
          index: lit("02"),
          title: lit(mainLabel),
          note: lit("Hand over to the host or the facilitator here."),
        }),
      },
      body: mainBody,
    });
  }

  // --- E. The tables -------------------------------------------------------
  /* Most specific first — see `findRowByPatterns`. A bare /discussion/ finds
     the panel, not the tables, and puts the panel's clock on the wall. */
  const tableRow = findRowByPatterns(sheet, [
    /roundtable|round table|breakout|break-out/i,
    /table discussion|group activity|group exercise|interactive/i,
    /workshop|activity/i,
  ]);
  const tablesBody: PlannedSlide[] = [];
  if (!omit.has("tables") && tableRow) {
    const minutes = minutesOf(tableRow.time);

    tablesBody.push({
      id: "how-the-tables-work",
      type: "bullets",
      tone: "light",
      source: slide({
        id: lit("how-the-tables-work"),
        type: lit("bullets"),
        section: lit(tablesLabel),
        eyebrow: lit("Talk to someone new"),
        title: lit("At Your Table"),
        items:
          "[\n" +
          [
            "One person writes, everyone talks",
            "Start with what you already do",
            "Two minutes to report back",
          ]
            .map((item) => `        ${lit(item)},`)
            .join("\n") +
          "\n      ]",
        note: lit(
          "PLACEHOLDER — replace these three with the actual prompts. Read them " +
            "out slowly, then say how long they have.",
        ),
      }),
      why:
        "The prompts are a placeholder. They are the one thing on this slide " +
        "that cannot come from the event data, because nobody writes table " +
        "questions down before the night.",
    });

    if (minutes) {
      tablesBody.push({
        id: "table-discussion",
        type: "break",
        tone: "dark",
        source: slide({
          id: lit("table-discussion"),
          type: lit("break"),
          section: lit(tablesLabel),
          eyebrow: lit("Space starts the clock"),
          title: lit("Over to You"),
          lead: lit("Talk it through, then we will hear from every table"),
          minutes: String(minutes),
          resumeLabel: lit("Back together"),
          note: lit(
            "Press Space to start the countdown and Space again to pause it. " +
              "The clock on the wall is what gets a room back on time.",
          ),
        }),
        why:
          `${minutes} minutes is what the run sheet gives this block ` +
          `(${tableRow.time}) — not a default. Change the time in the event ` +
          "data and regenerate rather than editing the number here.",
      });
    } else {
      notes.push({
        kind: "confirm",
        message: `"${tableRow.label}" has no readable duration in "${tableRow.time}", so there is no countdown clock. How long is it?`,
      });
    }
  }

  if (tablesBody.length > 0) {
    chapters.push({
      key: "tables",
      divider: {
        id: "section-the-tables",
        type: "section",
        tone: "dark",
        source: slide({
          id: lit("section-the-tables"),
          type: lit("section"),
          section: lit(tablesLabel),
          eyebrow: lit("Everyone talks now"),
          index: lit("03"),
          title: lit(tablesLabel),
          note: lit("Get people turned towards each other before you explain the task."),
        }),
      },
      body: tablesBody,
    });
  }

  // --- F. Readouts ---------------------------------------------------------
  const readoutRow = findRow(sheet, /readout|playback|report back|feedback/i);
  if (!omit.has("readouts") && readoutRow) {
    chapters.push({
      key: "readouts",
      body: [
        {
          id: "readouts",
          type: "bullets",
          tone: "light",
          source: slide({
            id: lit("readouts"),
            type: lit("bullets"),
            section: lit(tablesLabel),
            eyebrow: lit("One voice per table"),
            title: lit("What Did You Find?"),
            items:
              "[\n" +
              [
                "One thing you agreed on",
                "One thing you disagreed on",
                "One thing you will try",
              ]
                .map((item) => `        ${lit(item)},`)
                .join("\n") +
              "\n      ]",
            note: lit(
              "Keep each table to under a minute. Repeat the good ones back to " +
                "the room so the people at the back hear them.",
            ),
          }),
        },
      ],
    });
  }

  // --- G. The finale — never optional --------------------------------------
  const photoRow = findRow(sheet, /group photo|photo/i);
  const closeRow = sheet.items[sheet.items.length - 1];
  const finaleLead = photoRow
    ? "Everyone in, including the people at the back"
    : (closeRow?.label ?? "Stay as long as you like");

  const finale: PlannedSlide = {
    id: photoRow ? "group-photo" : "close-networking",
    type: "photo",
    tone: "dark",
    source: slide({
      id: lit(photoRow ? "group-photo" : "close-networking"),
      type: lit("photo"),
      section: lit(section),
      eyebrow: lit(photoRow ? "Squeeze in, please" : "Doors open till the end"),
      image: "CLOSING_PHOTO",
      overlay: lit("scrim"),
      title: lit(photoRow ? "Everyone Together" : "Stay and Talk"),
      lead: lit(finaleLead),
      note: lit(
        photoRow
          ? "Get the room standing before you put this up. Count to three out loud."
          : "Leave this up while people talk. It is the last thing they see.",
      ),
    }),
    why:
      "The deck's closing sequence is four information slides in a row, which " +
      "is the limit — so the middle has to end on a full-frame slide or the " +
      "run reaches five and the deck fails its shape check. This slide is " +
      "never optional. Change the photograph, not the slide.",
  };

  preamble.push(
    "",
    "/* The closing frame. One photograph from She Sharp's own archive — the",
    "   event has none of its own yet. Swap in a real one when it does. */",
    "const CLOSING_PHOTO: DeckImage = archiveFrame(3);",
  );

  // --- Assemble ------------------------------------------------------------
  const slides: PlannedSlide[] = [];
  let usedBeat = false;

  chapters
    .filter((chapter) => chapter.body.length > 0)
    .forEach((chapter, index) => {
      /*
       * The first surviving chapter takes `event-opening` as its divider —
       * the boilerplate already puts a dark chapter card immediately before
       * the middle, and a second one on top of it is two full-frame slides
       * doing one job.
       */
      if (chapter.divider && index > 0) slides.push(chapter.divider);

      if (chapter.body.length > BODY_BUDGET && chapter.beat) {
        const split = Math.ceil(chapter.body.length / 2);
        slides.push(...chapter.body.slice(0, split), chapter.beat, ...chapter.body.slice(split));
        usedBeat = true;
        return;
      }

      slides.push(...chapter.body);
    });
  slides.push(finale);

  if (usedBeat) {
    preamble.push(
      "",
      "/* A breath in the middle of a long chapter — see the comment on the",
      "   slide that uses it. A different frame from the closing one. */",
      "const CHAPTER_BEAT: DeckImage = archiveFrame(41);",
    );
  }

  return {
    preamble,
    slides,
    notes,
    sourceImports: [...sourceImports].sort(),
  };
}

/**
 * Checks a planned deck against the sequence rules before it is written.
 *
 * Takes the opening and closing steps as well, because the runs that actually
 * break are the ones that straddle the join between the boilerplate and the
 * middle — and no amount of reasoning about the middle alone can see them.
 */
export function assertPlanRhythm(
  plan: EveningPlan,
  opening: readonly RhythmStep[],
  closing: readonly RhythmStep[],
): void {
  const steps: RhythmStep[] = [
    ...opening,
    ...plan.slides.map((planned) => ({ type: planned.type, tone: planned.tone })),
    ...closing,
  ];

  const violations = rhythmViolations(steps);
  if (violations.length === 0) return;

  throw new Error(
    "The planned deck breaks its shape rules:\n" +
      violations
        .map((violation) => `  - ${violation.rule}: ${violation.detail}`)
        .join("\n") +
      "\nThis is a template bug, not something the organiser can fix.",
  );
}
