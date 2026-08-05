/**
 * Copy discipline for slide decks.
 *
 * A projected slide is read from three metres away by someone who is also
 * listening to a person talk. The limits below are what survives that. They are
 * enforced — `deck.test.ts` asserts them and `scripts/deck/lint-deck.ts` runs
 * them from the CLI — because "keep it short" as advice loses to a source JSON
 * with twenty-one prose sections in it.
 *
 * Long-form material belongs on the event page, reachable by the QR slides.
 */

import { eventSlugForFeedbackCode } from "@/lib/data/feedback-codes";

import type { Deck, QrBlock, Slide, SlideType } from "./types";
import {
  HERO_TYPES as RHYTHM_HERO_TYPES,
  longestRunPerValue,
  toRhythmStep,
} from "./rhythm";
import { checkAccentContrast } from "./theme";
import { toneOf } from "./utils";

export const COPY_LIMITS = {
  /** Words in a slide title. */
  titleWords: 7,
  /** Words in the single supporting sentence under a title. */
  leadWords: 18,
  /** Bullets on one slide. */
  bulletCount: 5,
  /** Words in one bullet. */
  bulletWords: 10,
  /** Words after the clock time on a run-sheet row. */
  agendaLabelWords: 6,
  /** Rows on one run-sheet slide before it needs splitting. */
  agendaRows: 14,
  /** Words in a person's role label. */
  personRoleWords: 6,
  /**
   * People on one slide, per density.
   *
   * These are the counts that still fit two rows on a 4:3 projector — the
   * narrowest stage the deck supports — with the type above the 28px legibility
   * floor. Past them the layout has to shrink itself, and a name nobody at the
   * back can read is worse than a second slide. Split the roster instead.
   */
  peopleCount: { sm: 20, md: 8, lg: 4 },
  /** Figures on a stats slide. */
  statCount: 4,
  /** Cards on a themes slide. */
  themeCount: 6,
  /** Rows on a criteria slide. */
  criteriaCount: 5,
  /** Rows on a prizes slide. */
  prizeCount: 4,
  /** Images in a photo grid. */
  photoGridMax: 5,
  photoGridMin: 3,
  /** Codes on the contact slide — more and none of them scan. */
  contactQrMax: 3,
  /** Facts under a title-slide headline. */
  titleMetaMax: 3,
  /** Events on the upcoming slide. */
  upcomingMax: 3,
  /** Consecutive bullet slides before the deck needs a change of rhythm. */
  consecutiveBullets: 2,
  /**
   * Rhythm limits.
   *
   * A deck can pass every copy rule slide by slide and still be exhausting to
   * sit through, because the failure is in the sequence rather than in any one
   * page. Ours had eight consecutive light information slides in the middle of
   * it — each one correct, the run of them a flat line. These are the numbers
   * that fix that.
   */
  consecutiveHero: 2,
  consecutiveContent: 4,
  consecutiveTone: 4,
  /** Minimum share of dark slides in a deck of `rhythmFloorSlides` or more. */
  darkShare: 0.25,
  rhythmFloorSlides: 12,
  /** Distinct slide types a deck of 10+ slides must use. */
  distinctLayouts: 8,
} as const;

/**
 * Slide types that carry a full-frame, low-information moment.
 *
 * These are the beats that let a room breathe. Everything else is information,
 * and information does not rest an audience however well it is set.
 *
 * Defined in `rhythm.ts` so the evening-event planner avoids creating the runs
 * this file reports, rather than restating the same set and drifting from it.
 */
const HERO_TYPES = RHYTHM_HERO_TYPES;

export interface LintIssue {
  slideId: string;
  slideIndex: number;
  rule: string;
  message: string;
  /** `error` fails the build; `warning` is reported and does not fail. */
  severity: "error" | "warning";
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function sentences(text: string): number {
  return text.trim().split(/[.!?]+\s+/).filter(Boolean).length;
}

/** Significant words, lowercased — articles and prepositions carry no meaning here. */
const STOP_WORDS = new Set([
  "a", "an", "the", "of", "and", "or", "to", "for", "in", "on", "at", "with",
  "our", "your", "is", "are", "we", "us", "this", "that", "it",
]);

function significantWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word && !STOP_WORDS.has(word));
}

/**
 * Whether one label is essentially a restatement of another.
 *
 * True when either is a subset of the other's significant words, or when they
 * overlap by more than half. Catches "Day One" / "Day one begins" as well as
 * outright duplication.
 */
function echoes(a: string, b: string | undefined): boolean {
  if (!b) return false;
  const left = significantWords(a);
  const right = significantWords(b);
  if (left.length === 0 || right.length === 0) return false;

  const rightSet = new Set(right);
  const shared = left.filter((word) => rightSet.has(word)).length;
  const smaller = Math.min(left.length, right.length);
  return shared === smaller || shared / smaller > 0.5;
}

/** Bullets are fragments, not sentences: no terminal period, no nesting. */
function checkBullet(
  bullet: string,
  slideId: string,
  slideIndex: number,
  issues: LintIssue[],
): void {
  if (words(bullet) > COPY_LIMITS.bulletWords) {
    issues.push({
      slideId,
      slideIndex,
      rule: "bullet-length",
      severity: "error",
      message: `Bullet is ${words(bullet)} words (max ${COPY_LIMITS.bulletWords}): "${bullet}"`,
    });
  }
  if (/\.\s*$/.test(bullet)) {
    issues.push({
      slideId,
      slideIndex,
      rule: "bullet-punctuation",
      severity: "error",
      message: `Bullet ends with a full stop; bullets are fragments: "${bullet}"`,
    });
  }
  if (/^\s*[-–—•*]/.test(bullet)) {
    issues.push({
      slideId,
      slideIndex,
      rule: "bullet-nesting",
      severity: "error",
      message: `Bullet looks like a sub-bullet; flatten it: "${bullet}"`,
    });
  }
}

function checkTitle(
  title: string,
  slideId: string,
  slideIndex: number,
  issues: LintIssue[],
): void {
  if (words(title) > COPY_LIMITS.titleWords) {
    issues.push({
      slideId,
      slideIndex,
      rule: "title-length",
      severity: "error",
      message: `Title is ${words(title)} words (max ${COPY_LIMITS.titleWords}): "${title}"`,
    });
  }
}

function checkLead(
  lead: string | undefined,
  slideId: string,
  slideIndex: number,
  issues: LintIssue[],
): void {
  if (!lead) return;
  if (words(lead) > COPY_LIMITS.leadWords) {
    issues.push({
      slideId,
      slideIndex,
      rule: "lead-length",
      severity: "error",
      message: `Lead is ${words(lead)} words (max ${COPY_LIMITS.leadWords}): "${lead}"`,
    });
  }
  if (sentences(lead) > 1) {
    issues.push({
      slideId,
      slideIndex,
      rule: "lead-sentences",
      severity: "error",
      message: `Lead must be one sentence: "${lead}"`,
    });
  }
}

/**
 * Flags a QR block whose destination has not been supplied yet.
 *
 * A warning rather than an error on purpose: a deck is normally built days
 * before every one of its links exists, and blocking the build would push
 * authors towards pasting last event's link to make it go away — which is the
 * failure this is trying to prevent. The slide shows "Link not set yet" on
 * screen, so it also cannot slip past a rehearsal.
 *
 * This no longer fires on the feedback slide of a normal deck: that code is
 * derived from the event slug and defaults (`feedbackQrFor()` in
 * `boilerplate.ts`). It still guards the contact-slide codes and any QR an
 * author supplied by hand, including a deliberately empty feedback override.
 */
function checkQr(
  qr: QrBlock,
  what: string,
  slideId: string,
  slideIndex: number,
  issues: LintIssue[],
): void {
  if (qr.url.trim()) return;
  issues.push({
    slideId,
    slideIndex,
    rule: "qr-url-missing",
    severity: "warning",
    message: `${what} has no link yet — the slide will show "Link not set yet". Add the URL before the event.`,
  });
}

function checkCount(
  actual: number,
  max: number,
  rule: string,
  label: string,
  slideId: string,
  slideIndex: number,
  issues: LintIssue[],
): void {
  if (actual > max) {
    issues.push({
      slideId,
      slideIndex,
      rule,
      severity: "error",
      message: `${label}: ${actual} (max ${max})`,
    });
  }
}

/** Lints one slide against the copy limits for its type. */
/**
 * Every string on a slide the room can read, as `[field, text]` pairs.
 *
 * Deliberately not `JSON.stringify(slide)`: `note` must not be included, and
 * neither must an image `alt` or a QR `url`, none of which are projected.
 */
function onScreenStrings(slide: Slide): [string, string][] {
  const found: [string, string][] = [];
  const push = (field: string, value?: string) => {
    if (value && value.trim()) found.push([field, value]);
  };

  push("eyebrow", slide.eyebrow);
  push("section", slide.section);
  if ("title" in slide) push("title", slide.title as string | undefined);
  if ("subtitle" in slide) push("subtitle", slide.subtitle as string | undefined);
  if ("lead" in slide) push("lead", slide.lead as string | undefined);

  switch (slide.type) {
    case "bullets":
      slide.items.forEach((item, i) => push(`bullet ${i + 1}`, item));
      break;
    case "agenda":
      slide.items.forEach((item) => push(`run sheet "${item.time}"`, item.label));
      break;
    case "themes":
      slide.themes.forEach((theme) => {
        push("theme title", theme.title);
        push("theme detail", theme.detail);
        push("theme tag", theme.tag);
      });
      break;
    case "people":
      slide.people.forEach((person) => {
        push("person name", person.name);
        push("person role", person.role);
        push("person org", person.org);
      });
      break;
    case "stats":
      slide.stats.forEach((stat) => {
        push("stat value", stat.value);
        push("stat label", stat.label);
        push("stat detail", stat.detail);
      });
      break;
    case "criteria":
      slide.criteria.forEach((entry) => {
        push("criterion", entry.name);
        push("criterion detail", entry.description);
      });
      break;
    case "prizes":
      slide.prizes.forEach((prize) => {
        push("prize", prize.name);
        push("prize detail", prize.detail);
      });
      break;
    case "upcoming":
      slide.events.forEach((event) => {
        push("upcoming title", event.title);
        push("upcoming blurb", event.blurb);
      });
      break;
    case "qr-cta":
      slide.points?.forEach((point, i) => push(`point ${i + 1}`, point));
      push("qr caption", slide.qr.caption);
      break;
    case "break":
      push("resume label", slide.resumeLabel);
      break;
    case "karakia":
      slide.teReo.forEach((line, i) => push(`te reo ${i + 1}`, line));
      slide.english.forEach((line, i) => push(`english ${i + 1}`, line));
      break;
    default:
      break;
  }

  return found;
}

export function lintSlide(slide: Slide, index: number): LintIssue[] {
  const issues: LintIssue[] = [];
  const id = slide.id;

  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    issues.push({
      slideId: id,
      slideIndex: index,
      rule: "slide-id",
      severity: "error",
      message: `Slide id must be lowercase kebab-case: "${id}"`,
    });
  }
  if (!slide.note || !slide.note.trim()) {
    issues.push({
      slideId: id,
      slideIndex: index,
      rule: "host-note",
      severity: "error",
      message: "Every slide needs a host note (printed in the PDF, never shown)",
    });
  }

  /*
   * Placeholder text that reaches the projector.
   *
   * The scaffold writes real slides now, and a slide it could not fill is
   * marked rather than left blank — which means the way this fails is a
   * plausible-looking slide with TODO on it, three metres high. Host notes are
   * deliberately exempt: "PLACEHOLDER — replace these with the real prompts"
   * is exactly the right thing for a note to say, and the note is never shown.
   */
  for (const [field, value] of onScreenStrings(slide)) {
    const marker = /\b(TODO|TBC|TBA|XXX|FIXME|LOREM)\b/i.exec(value);
    if (!marker) continue;
    issues.push({
      slideId: id,
      slideIndex: index,
      rule: "placeholder-copy",
      severity: "error",
      message: `"${marker[0]}" is still on screen in ${field}: "${value}"`,
    });
  }
  if (slide.eyebrow && words(slide.eyebrow) > 5) {
    issues.push({
      slideId: id,
      slideIndex: index,
      rule: "eyebrow-length",
      severity: "warning",
      message: `Eyebrow is ${words(slide.eyebrow)} words (max 5): "${slide.eyebrow}"`,
    });
  }
  /* The section label names the chapter and stays put across many slides; the
     eyebrow names *this* slide and is different every time. When one is a
     restatement of the other the deck reads as machine-written — it is the
     single most reliable tell. */
  if (slide.eyebrow) {
    const title = "title" in slide ? slide.title : undefined;
    if (echoes(slide.eyebrow, slide.section)) {
      issues.push({
        slideId: id,
        slideIndex: index,
        rule: "eyebrow-echoes-section",
        severity: "error",
        message: `Eyebrow "${slide.eyebrow}" restates the section "${slide.section}". The section names the chapter; the eyebrow names this slide. They must not be translations of each other.`,
      });
    }
    if (echoes(slide.eyebrow, title)) {
      issues.push({
        slideId: id,
        slideIndex: index,
        rule: "eyebrow-echoes-title",
        severity: "error",
        message: `Eyebrow "${slide.eyebrow}" restates the title "${title}". Say something the title does not.`,
      });
    }
  }

  switch (slide.type) {
    case "title":
      checkTitle(slide.title, id, index, issues);
      checkCount(
        slide.meta?.length ?? 0,
        COPY_LIMITS.titleMetaMax,
        "title-meta-count",
        "Facts under the headline",
        id,
        index,
        issues,
      );
      break;

    case "karakia":
      checkTitle(slide.title, id, index, issues);
      if (slide.teReo.length === 0 || slide.english.length === 0) {
        issues.push({
          slideId: id,
          slideIndex: index,
          rule: "karakia-complete",
          severity: "error",
          message: "A karakia slide needs both te reo and the English translation",
        });
      }
      break;

    case "section":
      checkTitle(slide.title, id, index, issues);
      break;

    case "bullets":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.items.length,
        COPY_LIMITS.bulletCount,
        "bullet-count",
        "Bullets on this slide",
        id,
        index,
        issues,
      );
      slide.items.forEach((item) => checkBullet(item, id, index, issues));
      break;

    case "agenda":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.items.length,
        COPY_LIMITS.agendaRows,
        "agenda-rows",
        "Run-sheet rows",
        id,
        index,
        issues,
      );
      slide.items.forEach((item) => {
        if (!item.time.trim() || !item.label.trim()) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "agenda-parse",
            severity: "error",
            message: `Run-sheet row is missing a time or a label: ${JSON.stringify(item)}`,
          });
          return;
        }
        if (words(item.label) > COPY_LIMITS.agendaLabelWords) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "agenda-label-length",
            severity: "error",
            message: `Run-sheet label is ${words(item.label)} words (max ${COPY_LIMITS.agendaLabelWords}): "${item.label}"`,
          });
        }
      });
      break;

    case "people": {
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      const density = slide.density ?? "md";
      checkCount(
        slide.people.length,
        COPY_LIMITS.peopleCount[density],
        "people-count",
        `People on one "${density}" density slide`,
        id,
        index,
        issues,
      );
      slide.people.forEach((person) => {
        if (person.role && words(person.role) > COPY_LIMITS.personRoleWords) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "person-role-length",
            severity: "error",
            message: `Role for ${person.name} is ${words(person.role)} words (max ${COPY_LIMITS.personRoleWords}): "${person.role}"`,
          });
        }
      });
      break;
    }

    case "photo":
      if (slide.title) checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      break;

    case "photo-grid":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      if (
        slide.images.length < COPY_LIMITS.photoGridMin ||
        slide.images.length > COPY_LIMITS.photoGridMax
      ) {
        issues.push({
          slideId: id,
          slideIndex: index,
          rule: "photo-grid-count",
          severity: "error",
          message: `Photo grid has ${slide.images.length} images (allowed ${COPY_LIMITS.photoGridMin}–${COPY_LIMITS.photoGridMax})`,
        });
      }
      break;

    case "stats":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.stats.length,
        COPY_LIMITS.statCount,
        "stat-count",
        "Figures on this slide",
        id,
        index,
        issues,
      );
      break;

    case "logos":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      break;

    case "themes":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.themes.length,
        COPY_LIMITS.themeCount,
        "theme-count",
        "Theme cards",
        id,
        index,
        issues,
      );
      slide.themes.forEach((theme) => {
        /*
         * A theme card's title was unbounded — only its detail was checked —
         * so a grid built from an event's own prose could ship fourteen-word
         * cards and pass. The cards are set large and side by side; a title
         * that wraps to three lines breaks the grid before it breaks the eye.
         */
        if (words(theme.title) > COPY_LIMITS.titleWords) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "theme-title-length",
            severity: "error",
            message: `Theme card title is ${words(theme.title)} words (max ${COPY_LIMITS.titleWords}): "${theme.title}"`,
          });
        }
        if (theme.detail && sentences(theme.detail) > 1) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "theme-detail",
            severity: "error",
            message: `Theme detail must be one line: "${theme.detail}"`,
          });
        }
      });
      break;

    case "criteria":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.criteria.length,
        COPY_LIMITS.criteriaCount,
        "criteria-count",
        "Criteria rows",
        id,
        index,
        issues,
      );
      slide.criteria.forEach((item) => {
        if (words(item.description) > COPY_LIMITS.bulletWords) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "criteria-description",
            severity: "error",
            message: `Criterion "${item.name}" description is ${words(item.description)} words (max ${COPY_LIMITS.bulletWords})`,
          });
        }
      });
      break;

    case "prizes":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.prizes.length,
        COPY_LIMITS.prizeCount,
        "prize-count",
        "Prize rows",
        id,
        index,
        issues,
      );
      break;

    case "break":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      if (slide.minutes <= 0 || slide.minutes > 120) {
        issues.push({
          slideId: id,
          slideIndex: index,
          rule: "break-duration",
          severity: "error",
          message: `Break is ${slide.minutes} minutes; expected 1–120`,
        });
      }
      break;

    case "qr-cta":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      (slide.points ?? []).forEach((point) =>
        checkBullet(point, id, index, issues),
      );
      checkCount(
        slide.points?.length ?? 0,
        3,
        "qr-point-count",
        "Supporting points beside a QR code",
        id,
        index,
        issues,
      );
      checkQr(slide.qr, `"${slide.title}"`, id, index, issues);
      break;

    case "contact":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.qrs.length,
        COPY_LIMITS.contactQrMax,
        "contact-qr-count",
        "QR codes",
        id,
        index,
        issues,
      );
      slide.qrs.forEach((qr) => checkQr(qr, `The "${qr.label}" code`, id, index, issues));
      break;

    case "upcoming":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      checkCount(
        slide.events.length,
        COPY_LIMITS.upcomingMax,
        "upcoming-count",
        "Upcoming events",
        id,
        index,
        issues,
      );
      slide.events.forEach((event) => {
        if (event.blurb && words(event.blurb) > COPY_LIMITS.leadWords) {
          issues.push({
            slideId: id,
            slideIndex: index,
            rule: "upcoming-blurb",
            severity: "error",
            message: `Blurb for "${event.title}" is ${words(event.blurb)} words (max ${COPY_LIMITS.leadWords})`,
          });
        }
      });
      break;

    case "thanks":
      checkTitle(slide.title, id, index, issues);
      checkLead(slide.lead, id, index, issues);
      break;

    default: {
      const exhaustive: never = slide;
      void exhaustive;
    }
  }

  return issues;
}

/** Lints a whole deck: per-slide copy, id uniqueness, rhythm, and contrast. */
export function lintDeck(deck: Deck): LintIssue[] {
  const issues: LintIssue[] = [];
  const seen = new Map<string, number>();
  let bulletRun = 0;

  deck.slides.forEach((slide, index) => {
    issues.push(...lintSlide(slide, index));

    const previous = seen.get(slide.id);
    if (previous !== undefined) {
      issues.push({
        slideId: slide.id,
        slideIndex: index,
        rule: "slide-id-unique",
        severity: "error",
        message: `Duplicate slide id "${slide.id}" (also at slide ${previous + 1})`,
      });
    }
    seen.set(slide.id, index);

    if (slide.type === "bullets") {
      bulletRun += 1;
      if (bulletRun > COPY_LIMITS.consecutiveBullets) {
        issues.push({
          slideId: slide.id,
          slideIndex: index,
          rule: "bullet-rhythm",
          severity: "error",
          message: `${bulletRun} bullet slides in a row; change the layout or insert a section divider`,
        });
      }
    } else {
      bulletRun = 0;
    }
  });

  issues.push(...lintRhythm(deck));
  issues.push(...lintFeedbackQr(deck));

  checkAccentContrast(deck.theme).forEach((check) => {
    if (!check.passes) {
      issues.push({
        slideId: "(theme)",
        slideIndex: -1,
        rule: "accent-contrast",
        severity: "error",
        message: `Accent ${check.accent} on the ${check.tone} canvas ${check.canvas} is ${check.ratio.toFixed(2)}:1 (need 4.5:1)`,
      });
    }
  });

  return issues;
}

/**
 * Checks the shape of the deck as a sequence rather than as a set of slides.
 *
 * Every rule here can be satisfied slide by slide and violated by the deck. A
 * long run of one register is the most common way a technically correct deck
 * becomes unwatchable, and it is invisible to anyone reviewing one slide at a
 * time — which is how decks are always reviewed.
 */
export function lintRhythm(deck: Deck): LintIssue[] {
  const issues: LintIssue[] = [];
  const { slides } = deck;
  if (slides.length === 0) return issues;

  const at = (index: number, rule: string, message: string, severity: LintIssue["severity"] = "error") =>
    issues.push({ slideId: slides[index].id, slideIndex: index, rule, severity, message });

  /*
   * Per register, not one global best.
   *
   * These two rules used to share a single `longestRun()` result and then ask
   * whether it happened to be a hero run or a content run. Because
   * `buildClosingSlides()` always ends a deck with four consecutive
   * information slides, the global winner was always a content run, so a run
   * of three or four heroes could never win and `rhythm-hero-run` never fired.
   */
  const steps = slides.map(toRhythmStep);
  const byRegister = longestRunPerValue(steps, (step) =>
    HERO_TYPES.has(step.type) ? "hero" : "content",
  );

  const heroRun = byRegister.get("hero");
  if (heroRun && heroRun.length > COPY_LIMITS.consecutiveHero) {
    at(
      heroRun.endsAt,
      "rhythm-hero-run",
      `${heroRun.length} full-frame slides in a row (max ${COPY_LIMITS.consecutiveHero}), ending at slide ${heroRun.endsAt + 1}. Back-to-back statement slides stop landing.`,
    );
  }

  const contentRun = byRegister.get("content");
  if (contentRun && contentRun.length > COPY_LIMITS.consecutiveContent) {
    at(
      contentRun.endsAt,
      "rhythm-content-run",
      `${contentRun.length} information slides in a row (max ${COPY_LIMITS.consecutiveContent}), ending at slide ${contentRun.endsAt + 1}. Break the run with a section divider, a photograph or a break.`,
    );
  }

  for (const [tone, run] of longestRunPerValue(steps, (step) => step.tone)) {
    if (run.length > COPY_LIMITS.consecutiveTone) {
      at(
        run.endsAt,
        "rhythm-tone-run",
        `${run.length} ${tone} slides in a row (max ${COPY_LIMITS.consecutiveTone}), ending at slide ${run.endsAt + 1}. A deck with no light/dark alternation reads flat however good each slide is.`,
      );
    }
  }

  if (slides.length >= COPY_LIMITS.rhythmFloorSlides) {
    const dark = slides.filter((slide) => toneOf(slide) === "dark").length;
    const share = dark / slides.length;
    if (share < COPY_LIMITS.darkShare) {
      issues.push({
        slideId: "(deck)",
        slideIndex: -1,
        rule: "rhythm-dark-share",
        severity: "error",
        message: `Only ${Math.round(share * 100)}% of slides are dark (need ${Math.round(COPY_LIMITS.darkShare * 100)}%). The dark slides are what the light ones are measured against.`,
      });
    }
  }

  if (slides.length >= 10) {
    const distinct = new Set(slides.map((slide) => slide.type)).size;
    if (distinct < COPY_LIMITS.distinctLayouts) {
      issues.push({
        slideId: "(deck)",
        slideIndex: -1,
        rule: "rhythm-layout-variety",
        severity: "error",
        message: `Only ${distinct} distinct layouts across ${slides.length} slides (need ${COPY_LIMITS.distinctLayouts}). Reaching for the same layout twice usually means the content was bent to fit it.`,
      });
    }
  }

  return issues;
}

/**
 * Resolves a feedback URL back to the event slug it collects for.
 *
 * Both shapes count, because both work in a browser: the short `/f/<code>`
 * alias the QR encodes, and the canonical `/events/<slug>/feedback` page a
 * person might paste in by hand. `undefined` means the URL is not a She Sharp
 * feedback destination at all.
 */
function feedbackTarget(url: string): string | undefined {
  let path: string;
  try {
    path = new URL(url, "https://www.shesharp.org.nz").pathname;
  } catch {
    // Not a URL at all; nothing to resolve, and `feedback-qr-external` says so.
    return undefined;
  }

  const segments = path.split("/").filter(Boolean);

  if (segments.length === 2 && segments[0] === "f") {
    return eventSlugForFeedbackCode(segments[1]);
  }
  if (
    segments.length === 3 &&
    segments[0] === "events" &&
    segments[2] === "feedback"
  ) {
    return eventSlugForFeedbackCode(segments[1]);
  }
  return undefined;
}

/**
 * Checks that the feedback code collects for *this* event.
 *
 * Deck-level rather than per-slide because it needs the deck's own slug, which
 * `lintSlide` never sees.
 *
 * The mismatch is an **error** while the missing-link rule stays a warning, and
 * the difference is that this check was previously impossible. A Google Form
 * URL says nothing about which event it belongs to — precisely why `feedbackQr`
 * had no default and no verification. Now that the destination is derived from
 * the slug, "does this code point at this event" is a question a machine can
 * answer, and it is exactly the question nobody in the room can: a QR aimed at
 * last month's event looks perfectly correct from the front of the room while
 * collecting the wrong data, and the results only surface days later.
 */
export function lintFeedbackQr(deck: Deck): LintIssue[] {
  const issues: LintIssue[] = [];

  const index = deck.slides.findIndex(
    (slide) => slide.id === "feedback" && slide.type === "qr-cta",
  );
  if (index === -1) return issues;

  const slide = deck.slides[index];
  if (slide.type !== "qr-cta") return issues;

  const url = slide.qr.url.trim();
  // An empty URL is `qr-url-missing`'s business; reporting it twice would only
  // make the report longer.
  if (!url) return issues;

  const expected = deck.eventSlug ?? deck.slug;
  const target = feedbackTarget(url);

  if (!target) {
    issues.push({
      slideId: slide.id,
      slideIndex: index,
      rule: "feedback-qr-external",
      severity: "warning",
      message: `The feedback code points at "${url}", which is not a She Sharp feedback form. Legitimate if a partner is running the survey — otherwise this is a leftover link.`,
    });
    return issues;
  }

  if (target !== expected) {
    issues.push({
      slideId: slide.id,
      slideIndex: index,
      rule: "feedback-qr-event-mismatch",
      severity: "error",
      message: `The feedback code collects for "${target}" but this deck is for "${expected}". Everyone who scans it files feedback against the wrong event.`,
    });
  }

  return issues;
}

/** Convenience for callers that only care whether the deck is presentable. */
export function hasErrors(issues: LintIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
