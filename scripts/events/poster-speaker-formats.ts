/**
 * The design layer for per-speaker artwork: one poster about one person.
 *
 * WHY A SECOND SET OF FORMATS AT ALL. The five formats in `poster-formats.ts`
 * are the event's artwork, and an event's artwork can be posted once. She Sharp
 * promotes an evening for weeks, so what marketing actually needs is a run of
 * posts that are new to a follower's feed while pointing at the same RSVP link.
 * One speaker at a time is that run: the picture, the name and the reason to
 * come all change, the event does not.
 *
 * THE PICTURE IS A REAL PHOTOGRAPH AND IT HAS TO BE. The plate underneath is
 * still generated and still abstract, but the face is `speaker.image` from the
 * event record. The skill's second guardrail forbids generated people, and it is
 * not a style rule: the archive's whole value is that it is true, and one
 * convincing fake face of a real, named woman is the worst version of that
 * problem rather than a milder one.
 *
 * WHY THE LOWER BLOCK FLOWS AND THE PORTRAIT IS SIZED FROM WHAT IS LEFT. Job
 * titles in the record run from "Legal Counsel" to "Commissioner for NZ-UNESCO ·
 * Chair, AI Forum NZ · Head of Computer and Information Sciences". Fixed
 * baselines would fit the first and collide on the second. So the type stack is
 * measured first and bottom-anchored, and the portrait takes the space above it
 * — which also means the top edge and the bottom edge are identical across a
 * whole campaign, and only the circle breathes.
 *
 * EVERY SINGLE LINE IS `fitSize`d OR WRAPPED, AND THAT IS NOT BELT-AND-BRACES.
 * There is no horizontal gate anywhere in this pipeline. The legibility gate
 * measures the ground under a box and reports a clean pass for a line that has
 * run off the right edge of the frame, because the ground out there is fine. A
 * line set at a fixed size is a line that will one day be half a line.
 *
 * A NOTE ON WHAT IS NOT HERE. No bio, no agenda, no street address, no LinkedIn
 * URL. A poster is a hook; the caption underneath it is the briefing. Every line
 * on these formats is either who this is, what event, or when and where.
 */

import { COPY_LIMITS } from "@/lib/deck/lint";

import {
  frame,
  lockup,
  lockupBudget,
  pill,
  pillBox,
  washDefs,
  type Layout,
  type PosterCopy,
  type PosterTheme,
} from "./poster-formats";
import {
  BODY,
  DISPLAY,
  boxFor,
  fitSize,
  measure,
  textLine,
  wrapBalanced,
  type PortraitSpec,
  type TextBox,
} from "./poster-type";

/* -------------------------------------------------------------------- copy */

/** One person, as much of them as a poster carries. */
export interface SpeakerCopy {
  /** The slug of their name — the CLI argument and half the output filename. */
  slug: string;
  /** "PANELLIST", "KEYNOTE", "HOST"… derived, never read. See `roleLabelFor()`. */
  role: string;
  name: string;
  /** The job title, untruncated. See the note at the call site. */
  title?: string;
  company?: string;
  /** Repo-relative headshot. Its absence is a refusal, not a fallback. */
  portrait: string;
  /** At most `HOOK_MAX_WORDS`. Optional, and deliberately not from the record. */
  hook?: string;
  /**
   * The display size for the name, solved once across everyone in the run.
   *
   * WHY THIS IS NOT SOLVED PER POSTER. Measured in DISPLAY, "Ben Sullivan" is
   * 533 units per 100pt and "Gemma Lynskey" is 729. Fitted independently to the
   * same column those solve at 176pt and 128pt — so Ben's poster would carry a
   * name 37% larger than Gemma's. In a drip-feed where the two posts land in the
   * same feed a week apart, that does not read as one campaign; it reads as two
   * agencies. Taking the minimum across the run is the same mechanism
   * `socialLayout` already uses across the display lines of one poster, applied
   * across the posters of one event.
   */
  nameSize: number;
}

/** A whole group, for the line-up tile. */
export interface LineupCopy {
  /** The event's own heading, e.g. "Meet the Panel". */
  heading: string;
  people: SpeakerCopy[];
}

/**
 * The longest a hook may be.
 *
 * Nine words is not a taste limit, it is roughly one line of BODY type in the
 * narrowest of these columns. A tenth word either wraps — at which point the
 * hook is competing with the name for the eye — or pushes the stack down until
 * the portrait hits its floor. Refusing is kinder than either, and the fix is
 * always to cut the sentence rather than to change the poster.
 */
export const HOOK_MAX_WORDS = 9;

/** How many lines of job title a poster will set before it complains. */
const TITLE_MAX_LINES = 2;

/**
 * The heading is the event's own words, so it is asked first.
 *
 * THE CASE THAT FORCED THIS. `aotearoa-ai-hackathon-festival-2026` stores its
 * JUDGES under the `panelists` key, with the heading "Meet the Judges". A poster
 * built from the key alone calls a judge a panellist — on a public graphic, with
 * their photograph next to it. The key is stable but it is not always honest;
 * the heading is what the organisation actually decided to call these people.
 *
 * Order matters here: "Meet the Judges" contains neither "panel" nor "speaker",
 * but a heading like "Judging Panel" contains both, and the more specific word
 * has to win.
 */
const HEADING_ROLES: Array<[RegExp, string]> = [
  [/judg/i, "JUDGE"],
  [/keynote/i, "KEYNOTE"],
  [/mentor/i, "MENTOR"],
  [/facilitat/i, "FACILITATOR"],
  [/\bhosts?\b|\bmc\b|\bemcee\b/i, "HOST"],
  [/panell?ist|\bpanel\b/i, "PANELLIST"],
  [/guest/i, "GUEST SPEAKER"],
  [/speaker/i, "SPEAKER"],
];

/** Group key → label, used only when the heading says nothing recognisable. */
const KEY_ROLES: Record<string, string> = {
  hosts: "HOST",
  keynote_speakers: "KEYNOTE",
  panel_speakers: "PANELLIST",
  panelists: "PANELLIST",
  guest_speakers: "GUEST SPEAKER",
  workshop_facilitators: "WORKSHOP FACILITATOR",
  readiness_workshop_facilitators: "WORKSHOP FACILITATOR",
  panel_facilitators: "PANEL FACILITATOR",
  demo_facilitators: "DEMO FACILITATOR",
  mentors: "MENTOR",
};

export interface RoleLabel {
  label: string;
  /** Where the label came from, so the skill can read both back. */
  from: "override" | "heading" | "key";
  heading: string;
}

/**
 * The words above the name.
 *
 * This is the ONLY string on a speaker poster that is derived rather than read
 * out of `events-custom.json`, which is why it is also the only one the skill
 * reads back to the organiser before building. Guardrail 1 says never invent a
 * fact; a label inferred from a heading is exactly the kind of near-fact that
 * needs a human to say yes.
 */
export function roleLabelFor(
  groupKey: string,
  heading: string,
  override?: string,
): RoleLabel {
  if (override?.trim()) {
    return { label: override.trim().toUpperCase(), from: "override", heading };
  }
  for (const [pattern, label] of HEADING_ROLES) {
    if (pattern.test(heading)) return { label, from: "heading", heading };
  }
  const byKey = KEY_ROLES[groupKey];
  if (byKey) return { label: byKey, from: "key", heading };

  throw new Error(
    `Nothing tells me what to call this person. The group key is "${groupKey}" and its ` +
      `heading is "${heading}", and neither matches a role I know.\n` +
      'Say what the kicker should read with --role, e.g. --role "Guest speaker".',
  );
}

/** Rejects a hook too long to set on one line. */
export function assertHook(hook: string, who: string): string {
  const words = hook.trim().split(/\s+/).filter(Boolean);
  if (words.length > HOOK_MAX_WORDS) {
    throw new Error(
      `The hook for ${who} is ${words.length} words (max ${HOOK_MAX_WORDS}):\n` +
        `  "${hook.trim()}"\n` +
        "A hook is the one line that says what the room gets. Cut it — the rest of the " +
        "thought belongs in the caption, not on the picture.",
    );
  }
  return words.join(" ");
}

/**
 * The one display size that fits every name in a run.
 *
 * See the note on `SpeakerCopy.nameSize`. Called once by the caller, before any
 * layout, and handed to all of them.
 */
export function solveNameSize(names: string[], column: number, maxSize: number): number {
  return Math.min(
    ...names.map(
      (name) => fitSize({ text: name, family: DISPLAY, maxWidth: column, maxSize }).size,
    ),
  );
}

/* ----------------------------------------------------------------- formats */

export interface SpeakerFormat {
  key: string;
  width: number;
  height: number;
  encode: readonly ("webp" | "jpeg")[];
  bytes: { min: number; max: number };
  usedFor: string;
  /** The column a name is solved against, so the caller can pre-solve it. */
  column: number;
  /** The cap for that solve. */
  nameMax: number;
  build: (copy: PosterCopy, speaker: SpeakerCopy, theme: PosterTheme) => Layout;
}

export interface LineupFormat {
  key: string;
  width: number;
  height: number;
  encode: readonly ("webp" | "jpeg")[];
  bytes: { min: number; max: number };
  usedFor: string;
  build: (copy: PosterCopy, group: LineupCopy, theme: PosterTheme) => Layout;
}

/* ------------------------------------------------------------ the measurer */

/**
 * The baseline of the line after this one, leaving `clear` px of empty space.
 *
 * Every vertical number in this file goes through here, and that is the whole
 * defence against the mistake `poster-formats.ts` records twice: a gap written
 * as a baseline-to-baseline distance silently draws the next line over the
 * previous one the moment the previous one solves larger than the gap. Ink rises
 * a full ink-height above its own baseline, so that height has to be added, and
 * adding it in one place means it cannot be forgotten in nine.
 */
function nextBaseline(
  y: number,
  clear: number,
  text: string,
  family: string,
  size: number,
): number {
  return y + clear + inkHeight(text, family, size);
}

/** Ink height of a string at a given size, in px. */
function inkHeight(text: string, family: string, size: number): number {
  return (measure(text, family).height * size) / 100;
}

/** Shrink-only: never larger than `max`, smaller only when the column demands. */
function fitDown(text: string, family: string, column: number, max: number): number {
  return fitSize({ text, family, maxWidth: column, maxSize: max }).size;
}

interface SpeakerType {
  kicker: number;
  kickerTrack: number;
  title: number;
  company: number;
  hook: number;
  event: number;
  facts: number;
}

interface SpeakerGaps {
  kickerToName: number;
  nameToTitle: number;
  titleLine: number;
  titleToCompany: number;
  beforeRule: number;
  afterRule: number;
  hookToEvent: number;
  eventLine: number;
  eventToWhen: number;
  factLine: number;
}

interface SpeakerStackResult {
  parts: string[];
  boxes: TextBox[];
  /** Height from the kicker's baseline to the last baseline. */
  height: number;
}

/**
 * Kicker → name → title → company → rule → hook → event → when → where.
 *
 * Built twice per poster: once at `y = 0` purely to learn its height, then again
 * at the baseline that height implies. `measure()` is memoised on
 * `family|tracking|text`, so the second pass costs a few multiplications and
 * nothing else — which is what makes "measure, then place" affordable enough to
 * be the default rather than a special case.
 */
function buildSpeakerStack(o: {
  x: number;
  y: number;
  column: number;
  theme: PosterTheme;
  copy: PosterCopy;
  speaker: SpeakerCopy;
  type: SpeakerType;
  gap: SpeakerGaps;
  /** Whether this format has room for the venue under the date. */
  venue: boolean;
}): SpeakerStackResult {
  const { theme, speaker, copy, type, gap, column } = o;
  const parts: string[] = [];
  const boxes: TextBox[] = [];
  let y = o.y;

  // No `label` on the kicker's fit: a kicker is MEANT to cap — it is a fixed
  // small size with wide tracking, not a line trying to reach the column, so
  // warning when its cap binds only trains the reader to ignore warnings.
  const kickerFit = fitSize({
    text: speaker.role,
    family: BODY,
    maxWidth: column,
    maxSize: type.kicker,
    trackEm: type.kickerTrack,
  });
  const kickerLine = {
    x: o.x,
    y,
    text: speaker.role,
    family: BODY,
    size: kickerFit.size,
    letterSpacing: kickerFit.letterSpacing,
  };
  parts.push(textLine({ ...kickerLine, fill: theme.spark }));
  boxes.push(boxFor("role kicker", kickerLine, theme.spark));

  /* The name, at the size solved across the whole run rather than against this
     column — see `SpeakerCopy.nameSize`. Clamped down here so a narrow format
     cannot overflow with a size chosen for a wider one. */
  const nameSize = Math.min(speaker.nameSize, fitDown(speaker.name, DISPLAY, column, 400));
  y = nextBaseline(y, gap.kickerToName, speaker.name, DISPLAY, nameSize);
  const nameLine = { x: o.x, y, text: speaker.name, family: DISPLAY, size: nameSize };
  parts.push(textLine({ ...nameLine, fill: theme.ink }));
  boxes.push(boxFor("name", nameLine, theme.ink));

  /* The job title, WRAPPED rather than truncated.
     `lib/deck/event-source.ts` clamps this to `COPY_LIMITS.personRoleWords` for
     a slide, where a person is one card in a grid of four. A poster gives the
     same string a full column, and truncating "Head of Finance – LM Media &
     Automation Lead" to six words yields "Head of Finance – LM Media", which is
     not a shorter title, it is a wrong one. So it wraps, and only a title that
     needs more lines than the format has is refused. */
  if (speaker.title) {
    const lines = wrapBalanced(speaker.title, BODY, type.title, column);
    if (lines.length > TITLE_MAX_LINES) {
      throw new Error(
        `${speaker.name}'s job title needs ${lines.length} lines and this format has ` +
          `${TITLE_MAX_LINES}:\n  "${speaker.title}"\n` +
          "Shorten it in lib/data/json/events-custom.json — the event page reads the " +
          "same field, so the fix lands in both places.",
      );
    }
    for (const [i, text] of lines.entries()) {
      y = nextBaseline(y, i === 0 ? gap.nameToTitle : gap.titleLine, text, BODY, type.title);
      const line = { x: o.x, y, text, family: BODY, size: type.title };
      parts.push(textLine({ ...line, fill: theme.ink, opacity: 0.92 }));
      boxes.push(boxFor("job title", line, theme.ink));
    }
  }

  if (speaker.company) {
    const size = fitDown(speaker.company, BODY, column, type.company);
    y = nextBaseline(y, gap.titleToCompany, speaker.company, BODY, size);
    const line = { x: o.x, y, text: speaker.company, family: BODY, size };
    parts.push(textLine({ ...line, fill: theme.ink, opacity: 0.6 }));
    boxes.push(boxFor("company", line, theme.ink));
  }

  y += gap.beforeRule;
  parts.push(
    `<rect x="${o.x}" y="${y}" width="${column}" height="1.5" fill="${theme.ink}" fill-opacity="0.2"/>`,
  );

  /* The hook, in `spark`.
     Spark carries ink and accent carries fills, for the reason recorded on
     `PosterTheme`: the brand magenta cannot clear 4.5:1 over anything lit. This
     is the one line on the poster that is an argument rather than a fact, so it
     is also the one line that gets a colour. */
  if (speaker.hook) {
    const size = fitDown(speaker.hook, BODY, column, type.hook);
    y = nextBaseline(y, gap.afterRule, speaker.hook, BODY, size);
    const line = { x: o.x, y, text: speaker.hook, family: BODY, size };
    parts.push(textLine({ ...line, fill: theme.spark }));
    boxes.push(boxFor("hook", line, theme.spark));
  }

  /* The event, so the poster answers "what is this for" without the caption.
     Set well under the name: the person is the subject of this poster and the
     event is the context, and inverting that gives four posters that look the
     same from a thumb's distance. */
  const eventText = [copy.titleLead, copy.titleTail].filter(Boolean).join(" — ");
  const eventLines = wrapBalanced(eventText, DISPLAY, type.event, column);
  for (const [i, text] of eventLines.entries()) {
    y = nextBaseline(
      y,
      i === 0 ? (speaker.hook ? gap.hookToEvent : gap.afterRule) : gap.eventLine,
      text,
      DISPLAY,
      type.event,
    );
    const line = { x: o.x, y, text, family: DISPLAY, size: type.event };
    parts.push(textLine({ ...line, fill: theme.ink }));
    boxes.push(boxFor(`event "${text}"`, line, theme.ink));
  }

  /* When, and — where the format has room — where.
     One size for both lines, solved from whichever is longer: two fact lines at
     visibly different sizes read as a mistake rather than as a hierarchy. */
  const when = [copy.date, copy.time].filter(Boolean).join("   ·   ");
  const facts: [string, number][] = [[when, 1]];
  if (o.venue && copy.venue) facts.push([copy.venue, 0.72]);

  const factsSize = Math.min(
    ...facts.map(([text]) => fitDown(text, BODY, column, type.facts)),
  );
  for (const [i, [text, opacity]] of facts.entries()) {
    if (!text) continue;
    y = nextBaseline(y, i === 0 ? gap.eventToWhen : gap.factLine, text, BODY, factsSize);
    const line = { x: o.x, y, text, family: BODY, size: factsSize };
    parts.push(textLine({ ...line, fill: theme.ink, opacity }));
    boxes.push(boxFor("facts", line, theme.ink));
  }

  return { parts, boxes, height: y - o.y };
}

/* ------------------------------------------------------------ the portrait */

/** How far inside the photo's radius the ring is drawn, as a fraction. */
const RING_AT = 0.955;
/** The alpha ramp, as a fraction of the radius. See `PortraitSpec.feather`. */
const FEATHER = 0.09;

/** The glow that sits UNDER the portrait, in the scrim layer. */
function portraitGlow(cx: number, cy: number, r: number): string {
  return (
    `<ellipse cx="${Math.round(cx)}" cy="${Math.round(cy)}" ` +
    `rx="${Math.round(r * 1.85)}" ry="${Math.round(r * 1.6)}" fill="url(#glow)"/>`
  );
}

/**
 * The ring that sits OVER it, in the type layer.
 *
 * Drawn just inside the photograph's radius, where the feather begins, so it
 * reads as the picture's own edge. A crisp ring at the full radius sits in the
 * band that has already faded to nothing, which looks like a lens artefact —
 * fine once and wrong four times in a row.
 *
 * `spark`, not `accent`: this is a hairline, and a hairline is ink. The accent
 * is a fill colour and on a light deck theme it disappears against the plate.
 */
function portraitRing(theme: PosterTheme, cx: number, cy: number, r: number, width: number): string {
  return (
    `<circle cx="${Math.round(cx)}" cy="${Math.round(cy)}" r="${Math.round(r * RING_AT)}" ` +
    `fill="none" stroke="${theme.spark}" stroke-width="${width}" stroke-opacity="0.62"/>`
  );
}

interface Disc {
  cx: number;
  cy: number;
  r: number;
}

/**
 * Refuses type laid over a face.
 *
 * The legibility gate would catch this, but it would describe it wrongly. It
 * samples the ground under a box, so a name across a lit cheek comes back as "a
 * highlight at luminance 0.9 runs through it" — which sends whoever reads it to
 * deepen the scrim, and deepening the scrim cannot help: the thing on top of the
 * ground is the portrait, and the portrait is composited after it.
 *
 * The disc is the only element in these layouts placed in absolute pixels while
 * everything under it is placed by accumulated ink height. Nudge one gap and the
 * kicker slides up under a chin, where a dark jacket passes the contrast check
 * perfectly well.
 */
function assertClearOfDiscs(boxes: TextBox[], discs: Disc[]): void {
  for (const box of boxes) {
    for (const d of discs) {
      const nearestX = Math.max(box.left, Math.min(d.cx, box.left + box.width));
      const nearestY = Math.max(box.top, Math.min(d.cy, box.top + box.height));
      const dx = d.cx - nearestX;
      const dy = d.cy - nearestY;
      if (dx * dx + dy * dy < d.r * d.r) {
        throw new Error(
          `"${box.name}" overlaps the portrait at (${Math.round(d.cx)}, ${Math.round(d.cy)}).\n` +
            "Type has to sit clear of a face. The legibility gate cannot repair this — " +
            "the thing covering the ground is the photograph, not the scrim.",
        );
      }
    }
  }
}

/** Every box a format owes the safe-area check, type and chrome alike. */
function chromeBoxes(
  theme: PosterTheme,
  band: { y: number; logoHeight: number },
  pillRect: { top: number; height: number } | null,
): TextBox[] {
  const boxes: TextBox[] = [
    {
      name: "logo lockup",
      ink: theme.ink,
      left: 0,
      top: Math.round(band.y),
      width: 1,
      height: Math.round(band.logoHeight),
    },
  ];
  if (pillRect) {
    boxes.push({
      name: "RSVP pill",
      ink: theme.ink,
      left: 0,
      top: Math.round(pillRect.top),
      width: 1,
      height: Math.round(pillRect.height),
    });
  }
  return boxes;
}

/* ------------------------------------------------- the shared speaker build */

interface SpeakerGeometry {
  width: number;
  height: number;
  margin: number;
  /** Fixed top edge of the portrait, shared by every poster in a campaign. */
  portraitTop: number;
  portrait: { min: number; max: number };
  /** Ring stroke width at this size. */
  ring: number;
  /** Clear space between the bottom of the circle and the kicker's ink. */
  portraitToKicker: number;
  /** The last baseline the type stack may occupy. */
  lastBaseline: number;
  /** Where the bottom band of lockup + pill sits. */
  band: { y: number; logo: number; pill: number };
  /** Does this size have room for the venue under the date? */
  venue: boolean;
  crop: { top: number; bottom: number };
  /** Where the `band` wash starts. See the note at `washFor`. */
  washFrom: number;
  ceiling: number;
  type: SpeakerType;
  gap: SpeakerGaps;
  /** Run after layout, over the type boxes AND the chrome. */
  assert?: (boxes: TextBox[]) => void;
}

/**
 * One speaker poster, at whatever size the geometry says.
 *
 * The three speaker formats differ only in their numbers, which is the whole
 * reason they share this: a change to the composition should land on all three
 * or on none, or a campaign posted across three platforms stops looking like one
 * campaign.
 *
 * THE ORDER OF OPERATIONS IS THE DESIGN. Measure the stack, bottom-anchor it,
 * give the portrait the space that is left. A tall stack — two lines of job
 * title, a long event title — takes room from the circle rather than pushing
 * anything off the frame, and only when the circle would fall below `min` does
 * anything fail. When that happens the hook goes first, because it is the one
 * line that was optional to begin with.
 */
function speakerLayout(
  g: SpeakerGeometry,
  copy: PosterCopy,
  speaker: SpeakerCopy,
  theme: PosterTheme,
): Layout {
  const column = g.width - g.margin * 2;

  const solve = (person: SpeakerCopy) => {
    const probe = buildSpeakerStack({
      x: g.margin,
      y: 0,
      column,
      theme,
      copy,
      speaker: person,
      type: g.type,
      gap: g.gap,
      venue: g.venue,
    });
    const kickerBaseline = g.lastBaseline - probe.height;
    const kickerTop = kickerBaseline - inkHeight(person.role, BODY, g.type.kicker);
    const room = kickerTop - g.portraitToKicker - g.portraitTop;
    return { kickerBaseline, kickerTop, diameter: Math.min(room, g.portrait.max) };
  };

  let person = speaker;
  let solved = solve(person);

  if (solved.diameter < g.portrait.min && person.hook) {
    console.warn(
      `  ! no room for ${person.name}'s hook at ${g.width}×${g.height} — dropping it so the ` +
        `portrait stays above ${g.portrait.min}px. The taller sizes keep it.`,
    );
    person = { ...person, hook: undefined };
    solved = solve(person);
  }
  if (solved.diameter < g.portrait.min) {
    throw new Error(
      `${person.name} does not fit at ${g.width}×${g.height}: the portrait would be ` +
        `${Math.round(solved.diameter)}px against a floor of ${g.portrait.min}px.\n` +
        "The longest line is almost always the job title or the event title. Shorten one " +
        "in lib/data/json/events-custom.json.",
    );
  }

  const d = Math.round(solved.diameter);
  const r = d / 2;
  const cx = g.margin + r;
  const top = solved.kickerTop - g.portraitToKicker - d;
  const cy = top + r;

  const stack = buildSpeakerStack({
    x: g.margin,
    y: solved.kickerBaseline,
    column,
    theme,
    copy,
    speaker: person,
    type: g.type,
    gap: g.gap,
    venue: g.venue,
  });

  /* The band's width is shared with the call to action, so the pill is measured
     BEFORE the lockup rather than after it. Two co-hosts and an RSVP pill add up
     to more than the column on the narrower sizes, and nothing downstream would
     notice: both are chrome, and every safe-area assert here walks TextBoxes. */
  const bandPill = copy.hasRsvp ? pillBox("RSVP TODAY", g.band.pill) : null;
  const mark = lockup(copy, theme, {
    x: g.margin,
    y: g.band.y,
    sheSharpWidth: g.band.logo,
    maxWidth: lockupBudget({
      left: g.margin,
      right: g.width - g.margin,
      sheSharpWidth: g.band.logo,
      pillWidth: bandPill?.width ?? 0,
    }),
  });
  const parts = [portraitRing(theme, cx, cy, r, g.ring), ...stack.parts, mark.markup];

  let pillRect: { top: number; height: number } | null = null;
  if (bandPill) {
    const y = g.band.y + (mark.height - bandPill.height) / 2;
    pillRect = { top: y, height: bandPill.height };
    parts.push(pill("RSVP TODAY", theme, { right: g.width - g.margin, y, size: g.band.pill }));
  }

  assertClearOfDiscs(stack.boxes, [{ cx, cy, r }]);
  g.assert?.([
    ...stack.boxes,
    ...chromeBoxes(theme, { y: g.band.y, logoHeight: mark.height }, pillRect),
  ]);

  const scrim = `${washFor(theme, g)}
    ${portraitGlow(cx, cy, r)}`;

  return {
    scrim: frame(g.width, g.height, scrim),
    type: frame(g.width, g.height, parts.join("\n")),
    boxes: stack.boxes,
    crop: g.crop,
    portraits: [
      { file: person.portrait, left: Math.round(cx - r), top: Math.round(top), size: d, feather: FEATHER },
    ],
  };
}

/**
 * The wash, and why it is `band` on all three rather than `up`.
 *
 * `up` reaches 0.62 opacity only 35% of the way down its rect. On these layouts
 * the type block starts a little past halfway with a large lit disc above it, so
 * an `up` rect placed low enough to leave the plate open beside the portrait
 * gives the kicker somewhere around 0.3 — and a small tracked kicker in `spark`
 * over a lit fibre highlight at that depth does not clear 4.5:1. `band` hits
 * 0.80 at 17% and holds, which is the shape this wants and the shape
 * `socialLayout` already documents for the same reason.
 *
 * The rect deliberately STARTS ABOVE the bottom of the disc. That costs nothing,
 * because the portrait composites over the scrim, and it buys the ramp the
 * kicker needs immediately below the face.
 */
function washFor(theme: PosterTheme, g: SpeakerGeometry): string {
  return `${washDefs(theme, "band")}
    <rect x="0" y="${g.washFrom}" width="${g.width}" height="${g.height - g.washFrom}" fill="url(#wash)"/>
    <rect x="0" y="0" width="${g.width}" height="${g.ceiling}" fill="url(#ceiling)"/>`;
}

/* --------------------------------------------------- the speaker geometries */

/**
 * The 4:5 that does the most work: LinkedIn, Instagram and Facebook feeds.
 *
 * NO `SOCIAL_SAFE` ASSERT, and that is not an omission. The event format's safe
 * band exists only because `social` doubles as the website's `coverImage` and is
 * re-cropped at five aspect ratios. A speaker poster is never a cover image, so
 * the whole 1350 is usable — which is exactly what buys the 520px disc. The
 * corollary is a rule, and it is in SKILL.md: never point `coverImage.url` at
 * one of these, because an event card would crop the person's name away.
 */
const SOCIAL: SpeakerGeometry = {
  width: 1080,
  height: 1350,
  margin: 72,
  portraitTop: 110,
  portrait: { min: 360, max: 520 },
  ring: 3,
  portraitToKicker: 66,
  lastBaseline: 1142,
  band: { y: 1222, logo: 150, pill: 32 },
  venue: true,
  crop: { top: 0.1, bottom: 1 },
  washFrom: 430,
  ceiling: 240,
  type: {
    kicker: 28,
    kickerTrack: 0.2,
    title: 32,
    company: 27,
    hook: 30,
    event: 38,
    facts: 26,
  },
  gap: {
    kickerToName: 34,
    nameToTitle: 28,
    titleLine: 16,
    titleToCompany: 20,
    beforeRule: 34,
    afterRule: 28,
    hookToEvent: 32,
    eventLine: 10,
    eventToWhen: 28,
    factLine: 16,
  },
};

/**
 * Instagram and Facebook stories: the roomiest of the three, and the only one
 * with someone else's interface drawn on top of it.
 *
 * The safe check here covers the LOCKUP AND THE PILL as well as the type, which
 * the event `storyLayout` does not: those are a `<g>` and a `<rect>`, not
 * `TextBox`es, so the box-walking assert cannot see them. The pill is the one
 * element on the poster that is a call to action, and Instagram's reply bar
 * covering it is the single most expensive way for this to fail.
 */
export const STORY_SAFE = { top: 250, bottom: 1670 };

/**
 * The story's bottom band, exported so a test can check it against the safe area.
 *
 * The copy on these posters is bottom-ANCHORED, so no amount of text can push
 * the band anywhere: a long job title shrinks the portrait instead. That makes
 * the band a constant, and a constant is exactly the thing that gets nudged in a
 * later tuning pass with nothing to notice. `poster-speaker.test.ts` pins it.
 */
export const STORY_BAND = { y: 1570, logo: 190, pill: 34 };

const STORY: SpeakerGeometry = {
  width: 1080,
  height: 1920,
  margin: 84,
  portraitTop: 300,
  portrait: { min: 420, max: 660 },
  ring: 4,
  portraitToKicker: 82,
  lastBaseline: 1490,
  band: STORY_BAND,
  venue: true,
  crop: { top: 0, bottom: 1 },
  washFrom: 760,
  ceiling: 420,
  type: {
    kicker: 30,
    kickerTrack: 0.2,
    title: 34,
    company: 29,
    hook: 32,
    event: 42,
    facts: 28,
  },
  gap: {
    kickerToName: 36,
    nameToTitle: 30,
    titleLine: 18,
    titleToCompany: 22,
    beforeRule: 36,
    afterRule: 30,
    hookToEvent: 34,
    eventLine: 12,
    eventToWhen: 30,
    factLine: 18,
  },
  assert(boxes) {
    for (const box of boxes) {
      const bottom = box.top + box.height;
      if (box.top < STORY_SAFE.top || bottom > STORY_SAFE.bottom) {
        throw new Error(
          `"${box.name}" spans y ${box.top}–${bottom}, outside the story safe area ` +
            `${STORY_SAFE.top}–${STORY_SAFE.bottom}. Instagram and Facebook draw their own ` +
            "interface over those strips, so it would be covered rather than cropped — " +
            "which looks correct in the file and in the preview, and is wrong only once " +
            "it is live.",
        );
      }
    }
  },
};

/**
 * The 1:1 grid tile: the tight one, and the first to drop the hook.
 *
 * No venue line either. At 1080 square there is room for the person, the event
 * and the two facts that decide whether someone can come; a square that carries
 * everything is a square nobody reads in a grid thumbnail.
 */
const SQUARE: SpeakerGeometry = {
  width: 1080,
  height: 1080,
  margin: 72,
  portraitTop: 90,
  portrait: { min: 280, max: 400 },
  ring: 3,
  portraitToKicker: 54,
  lastBaseline: 888,
  band: { y: 956, logo: 132, pill: 27 },
  venue: false,
  crop: { top: 0.14, bottom: 0.94 },
  washFrom: 300,
  ceiling: 200,
  type: {
    kicker: 24,
    kickerTrack: 0.2,
    title: 26,
    company: 23,
    hook: 25,
    event: 31,
    facts: 23,
  },
  gap: {
    kickerToName: 28,
    nameToTitle: 22,
    titleLine: 13,
    titleToCompany: 18,
    beforeRule: 28,
    afterRule: 24,
    hookToEvent: 26,
    eventLine: 9,
    eventToWhen: 24,
    factLine: 14,
  },
};

/**
 * Every per-speaker size, JPEG only.
 *
 * These are social-only artefacts: nothing on the website renders them, so the
 * WebP that every event format carries for the site would be a file with no
 * destination. And Instagram, which is where these are posted from — on a phone
 * — handles WebP inconsistently. One file, one door.
 */
export const SPEAKER_FORMATS: SpeakerFormat[] = [
  {
    key: "social",
    width: SOCIAL.width,
    height: SOCIAL.height,
    encode: ["jpeg"],
    bytes: { min: 100 * 1024, max: 340 * 1024 },
    usedFor: "LinkedIn, Instagram and Facebook feeds (4:5).",
    column: SOCIAL.width - SOCIAL.margin * 2,
    nameMax: 128,
    build: (copy, speaker, theme) => speakerLayout(SOCIAL, copy, speaker, theme),
  },
  {
    key: "story",
    width: STORY.width,
    height: STORY.height,
    encode: ["jpeg"],
    bytes: { min: 100 * 1024, max: 420 * 1024 },
    usedFor: "Instagram and Facebook stories (9:16). Keeps clear of their interface.",
    column: STORY.width - STORY.margin * 2,
    nameMax: 138,
    build: (copy, speaker, theme) => speakerLayout(STORY, copy, speaker, theme),
  },
  {
    key: "square",
    width: SQUARE.width,
    height: SQUARE.height,
    encode: ["jpeg"],
    bytes: { min: 80 * 1024, max: 320 * 1024 },
    usedFor: "A square Instagram grid tile (1:1).",
    column: SQUARE.width - SQUARE.margin * 2,
    nameMax: 100,
    build: (copy, speaker, theme) => speakerLayout(SQUARE, copy, speaker, theme),
  },
];

/* ------------------------------------------------------------- the line-up */

/**
 * The most people one tile will carry.
 *
 * `COPY_LIMITS.peopleCount.lg` is 4 — the number of faces a slide can show large
 * enough to recognise, and a phone feed is not more generous than a projector.
 * Six is the ceiling, and above it this refuses rather than shrinking: the
 * `mentors` group of the 2026 hackathon has seventeen people in it, and a silent
 * cap would have posted four faces and dropped thirteen names without saying so.
 */
const LINEUP_MAX = 6;
const LINEUP_COMFORTABLE = COPY_LIMITS.peopleCount.lg;

/** Columns for a headcount, chosen so no row is left with a single orphan. */
function gridColumns(n: number): number {
  if (n <= 3) return n;
  if (n === 4) return 2;
  return 3;
}

/**
 * The whole group on one tile — the post that opens a campaign.
 *
 * A different job from the per-speaker set and not a substitute for it: this
 * says "here is the panel", the others say "here is a reason to come". Posted
 * first, it makes the four that follow legible as a series.
 */
function lineupLayout(copy: PosterCopy, group: LineupCopy, theme: PosterTheme): Layout {
  const W = 1080;
  const H = 1350;
  const M = 72;
  const COL = W - M * 2;
  const n = group.people.length;

  if (n < 2) {
    throw new Error(
      `A line-up needs at least two people; "${group.heading}" has ${n}.\n` +
        "Use the per-speaker set instead: --speaker all.",
    );
  }
  if (n > LINEUP_MAX) {
    throw new Error(
      `"${group.heading}" has ${n} people and one tile carries ${LINEUP_MAX}.\n` +
        `Past ${LINEUP_COMFORTABLE} the faces stop being recognisable in a phone feed, and ` +
        "cropping the group to fit would drop names silently. Post them one at a time " +
        "instead: --speaker all.",
    );
  }

  const parts: string[] = [];
  const boxes: TextBox[] = [];

  const kickerText = group.heading.toUpperCase();
  const kickerFit = fitSize({
    text: kickerText,
    family: BODY,
    maxWidth: COL,
    maxSize: 30,
    trackEm: 0.2,
  });
  const kickerLine = {
    x: M,
    y: 150,
    text: kickerText,
    family: BODY,
    size: kickerFit.size,
    letterSpacing: kickerFit.letterSpacing,
  };
  parts.push(textLine({ ...kickerLine, fill: theme.spark }));
  boxes.push(boxFor("group heading", kickerLine, theme.spark));

  /* The event title, both halves solved to the same column — which is the whole
     mechanism by which their right edges line up, the same as the poster's. */
  const eventLines = [copy.titleLead, copy.titleTail].filter(Boolean);
  const eventSize = Math.min(...eventLines.map((t) => fitDown(t, DISPLAY, COL, 84)));
  let y = 150;
  for (const [i, text] of eventLines.entries()) {
    y = nextBaseline(y, i === 0 ? 42 : 10, text, DISPLAY, eventSize);
    const line = { x: M, y, text, family: DISPLAY, size: eventSize };
    const ink = i > 0 ? theme.spark : theme.ink;
    parts.push(textLine({ ...line, fill: ink }));
    boxes.push(boxFor(`event "${text}"`, line, ink));
  }

  const cols = gridColumns(n);
  const rows = Math.ceil(n / cols);
  const cellW = COL / cols;
  const nameMax = cols >= 3 ? 22 : 26;
  const roleMax = cols >= 3 ? 17 : 20;

  /* ONE LINE UNDER EACH NAME, AND WHICH ONE DEPENDS ON THE PANEL.
     A mixed panel is told apart by employer, so the company is the useful line.
     A panel drawn entirely from the partner organisation is not: the first
     version of this tile said "Les Mills International" four times, under a
     lockup that already carried the Les Mills mark. Four identical lines are
     four lines of nothing. When everyone shares an employer, the job title is
     what actually differs, so that is what goes under the face. */
  const oneEmployer =
    group.people.every((p) => p.company) &&
    new Set(group.people.map((p) => p.company)).size === 1;
  const captionFor = (p: SpeakerCopy) =>
    (oneEmployer ? p.title || p.company : p.company || p.title) || "";

  /* Solved once across the grid, from whichever caption is longest. Fitted per
     cell they would come out at four different sizes in four identical cells,
     which reads as a mistake rather than as a hierarchy. */
  const captions = group.people.map(captionFor).filter(Boolean);
  const roleSize = captions.length
    ? Math.min(...captions.map((t) => fitDown(t, BODY, cellW - 24, roleMax)))
    : roleMax;

  const bandY = 1209;
  const factsBaseline = bandY - 46;
  const gridTop = y + 72;
  const gridBottom = factsBaseline - 58;
  const rowH = (gridBottom - gridTop) / rows;
  // The caption under a face is a name plus one line about them; both are
  // measured rather than assumed, because a two-column grid sets them larger.
  const captionH = 28 + nameMax + 16 + roleMax;
  const d = Math.round(Math.min(rowH - captionH - 20, cellW - 40, 320));

  if (d < 170) {
    throw new Error(
      `${n} people leave only ${d}px per face on a 1080×1350 tile, which is smaller than a ` +
        "thumbnail avatar.\nPost them one at a time instead: --speaker all.",
    );
  }

  const discs: Disc[] = [];
  const portraits: PortraitSpec[] = [];

  for (const [i, person] of group.people.entries()) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cx = M + cellW * col + cellW / 2;
    const cy = gridTop + rowH * row + d / 2;
    discs.push({ cx, cy, r: d / 2 });
    portraits.push({
      file: person.portrait,
      left: Math.round(cx - d / 2),
      top: Math.round(cy - d / 2),
      size: d,
      feather: FEATHER,
    });
    parts.push(portraitRing(theme, cx, cy, d / 2, 3));

    /* Centred under the circle — the only centred type in this whole system, and
       it earns the exception because a grid cell is symmetric and a flush-left
       name under a centred face reads as a misalignment rather than a choice.
       `boxFor` measures from a left edge, so the gate's box is placed by hand at
       the centred line's true left. */
    const nameSize = fitDown(person.name, BODY, cellW - 24, nameMax);
    const nameY = cy + d / 2 + 28 + inkHeight(person.name, BODY, nameSize);
    const nameWidth = (measure(person.name, BODY).width * nameSize) / 100;
    parts.push(
      textLine({
        x: cx,
        y: nameY,
        text: person.name,
        family: BODY,
        size: nameSize,
        fill: theme.ink,
        anchor: "middle",
      }),
    );
    boxes.push(
      boxFor(
        `name ${person.name}`,
        { x: cx - nameWidth / 2, y: nameY, text: person.name, family: BODY, size: nameSize },
        theme.ink,
      ),
    );

    const roleText = captionFor(person);
    if (roleText) {
      const roleY = nameY + 16 + inkHeight(roleText, BODY, roleSize);
      const roleWidth = (measure(roleText, BODY).width * roleSize) / 100;
      parts.push(
        textLine({
          x: cx,
          y: roleY,
          text: roleText,
          family: BODY,
          size: roleSize,
          fill: theme.ink,
          opacity: 0.68,
          anchor: "middle",
        }),
      );
      boxes.push(
        boxFor(
          `role ${person.name}`,
          { x: cx - roleWidth / 2, y: roleY, text: roleText, family: BODY, size: roleSize },
          theme.ink,
        ),
      );
    }
  }

  // One line of facts. A line-up tile is about the faces, and a second fact line
  // costs a row of pixels the faces need more.
  const factsText = [copy.date, copy.time, copy.venue].filter(Boolean).join("   ·   ");
  const factsSize = fitDown(factsText, BODY, COL, 24);
  const factsLine = { x: M, y: factsBaseline, text: factsText, family: BODY, size: factsSize };
  parts.push(textLine({ ...factsLine, fill: theme.ink, opacity: 0.85 }));
  boxes.push(boxFor("facts", factsLine, theme.ink));

  const bandPill = copy.hasRsvp ? pillBox("RSVP TODAY", 32) : null;
  const mark = lockup(copy, theme, {
    x: M,
    y: bandY,
    sheSharpWidth: 150,
    maxWidth: lockupBudget({
      left: M,
      right: W - M,
      sheSharpWidth: 150,
      pillWidth: bandPill?.width ?? 0,
    }),
  });
  parts.push(mark.markup);
  if (bandPill) {
    parts.push(
      pill("RSVP TODAY", theme, {
        right: W - M,
        y: bandY + (mark.height - bandPill.height) / 2,
        size: 32,
      }),
    );
  }

  assertClearOfDiscs(boxes, discs);

  /* THE ONLY TOP-HEAVY COMPOSITION IN THE SET, AND IT NEEDS ITS OWN SCRIM.
     Every speaker poster puts its type in the lower half, where a plate is
     usually already dark; this one leads with a heading and a title at y 150–370,
     which on a plate whose subject runs across the upper third is the brightest
     part of the frame. Handed the speaker formats' scrim — band from 430, a
     260px ceiling — the two display lines came back from the gate with "a
     highlight at luminance 1.00 runs through it", twice.
     So the band covers the WHOLE frame, which puts its 0.80 stop at y 230 where
     the title is, and the ceiling reaches 560 to hold down everything above it. */
  const scrim = `${washDefs(theme, "band")}
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#wash)"/>
    <rect x="0" y="0" width="${W}" height="560" fill="url(#ceiling)"/>
    ${discs.map((c) => portraitGlow(c.cx, c.cy, c.r)).join("\n")}`;

  return {
    scrim: frame(W, H, scrim),
    type: frame(W, H, parts.join("\n")),
    boxes,
    crop: { top: 0.1, bottom: 1 },
    portraits,
  };
}

export const LINEUP_FORMATS: LineupFormat[] = [
  {
    key: "social",
    width: 1080,
    height: 1350,
    encode: ["jpeg"],
    bytes: { min: 120 * 1024, max: 420 * 1024 },
    usedFor: "LinkedIn, Instagram and Facebook feeds (4:5) — the whole line-up at once.",
    build: lineupLayout,
  },
];
