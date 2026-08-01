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

import type { Deck, Slide } from "./types";
import { checkAccentContrast } from "./theme";

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
} as const;

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
  if (slide.eyebrow && words(slide.eyebrow) > 5) {
    issues.push({
      slideId: id,
      slideIndex: index,
      rule: "eyebrow-length",
      severity: "warning",
      message: `Eyebrow is ${words(slide.eyebrow)} words (max 5): "${slide.eyebrow}"`,
    });
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

/** Convenience for callers that only care whether the deck is presentable. */
export function hasErrors(issues: LintIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}
