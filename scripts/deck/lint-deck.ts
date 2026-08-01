/**
 * Deck checker — the report a non-technical person can act on.
 *
 * Usage:
 *   npx tsx scripts/deck/lint-deck.ts                 # every registered deck
 *   npx tsx scripts/deck/lint-deck.ts <event-slug>    # one deck
 *
 * Runs the same three checks the test suite runs — copy limits, accent
 * contrast, and whether every image actually exists — but prints them grouped
 * by slide, in plain English, with a concrete instruction for each problem.
 * The `/build-event-slides` skill hands this output straight to whoever is
 * writing the deck, so the wording is the feature.
 *
 * Exit 1 when anything must be fixed; exit 0 when only advisories remain.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { COPY_LIMITS, lintDeck, type LintIssue } from "@/lib/deck/lint";
import { getAllDecks, getDeck, getDeckSlugs } from "@/lib/deck/registry";
import { checkAccentContrast } from "@/lib/deck/theme";
import type { Deck, Slide } from "@/lib/deck/types";
import { collectDeckImages, slideLabel } from "@/lib/deck/utils";

const PUBLIC_DIR = join(process.cwd(), "public");

/** Plain-English name for each linter rule, shown as the problem headline. */
const RULE_TITLES: Record<string, string> = {
  "slide-id": "Slide id is not URL-safe",
  "slide-id-unique": "Two slides share an id",
  "host-note": "No note for the host",
  "eyebrow-length": "Kicker is too long",
  "title-length": "Title is too long",
  "lead-length": "Supporting line is too long",
  "lead-sentences": "Supporting line is more than one sentence",
  "bullet-length": "Bullet is too long",
  "bullet-punctuation": "Bullet ends with a full stop",
  "bullet-nesting": "Bullet looks like a sub-bullet",
  "bullet-count": "Too many bullets on one slide",
  "bullet-rhythm": "Too many bullet slides in a row",
  "agenda-rows": "Run sheet is too long for one slide",
  "agenda-label-length": "Run-sheet label is too long",
  "agenda-parse": "Run-sheet row is missing a time or a label",
  "person-role-length": "Job title is too long",
  "stat-count": "Too many figures on one slide",
  "theme-count": "Too many theme cards",
  "theme-detail": "Theme detail is more than one line",
  "criteria-count": "Too many judging criteria",
  "criteria-description": "Criterion description is too long",
  "prize-count": "Too many prizes on one slide",
  "photo-grid-count": "Wrong number of photos in the grid",
  "contact-qr-count": "Too many QR codes on one slide",
  "title-meta-count": "Too many facts under the headline",
  "upcoming-count": "Too many upcoming events",
  "upcoming-blurb": "Event blurb is too long",
  "qr-point-count": "Too many points beside a QR code",
  "karakia-complete": "Karakia is missing te reo or the translation",
  "break-duration": "Break length looks wrong",
  "accent-contrast": "Accent colour is too faint to read",
  "missing-image": "Image file does not exist",
};

/** What to actually do about each rule. One instruction, no theory. */
const RULE_FIXES: Record<string, string> = {
  "slide-id":
    "Rename the id using lowercase letters, numbers and hyphens only, e.g. \"meet-the-mentors\".",
  "slide-id-unique":
    "Give one of the two slides a different id — ids are the deep-link anchors, so they must be unique.",
  "host-note":
    "Add a `note`: one line telling the host what to say. It prints in the PDF and never appears on screen.",
  "eyebrow-length": "Shorten the kicker to 5 words or fewer.",
  "title-length": `Shorten the title to ${COPY_LIMITS.titleWords} words or fewer.`,
  "lead-length": `Shorten the supporting line to ${COPY_LIMITS.leadWords} words or fewer, or move the detail into the host note.`,
  "lead-sentences":
    "Keep the supporting line to one sentence — move the second sentence into the host note.",
  "bullet-length": `Shorten to ${COPY_LIMITS.bulletWords} words or fewer. Cut the words a reader would guess anyway.`,
  "bullet-punctuation":
    "Delete the full stop. Bullets are fragments, not sentences.",
  "bullet-nesting":
    "Delete the leading dash or bullet character. Sub-bullets are unreadable from the back of a room — make it its own bullet or drop it.",
  "bullet-count": `Keep ${COPY_LIMITS.bulletCount} bullets at most. Move the rest onto a second slide, or into the host note.`,
  "bullet-rhythm":
    "Change one of these slides to a photo, a themes grid or a section divider. Three lists in a row and the room stops reading.",
  "agenda-rows": `Split the run sheet across two slides — ${COPY_LIMITS.agendaRows} rows is the most that fits.`,
  "agenda-label-length": `Shorten the label to ${COPY_LIMITS.agendaLabelWords} words or fewer. The host says the detail out loud.`,
  "agenda-parse":
    "Every row needs a time and a label, e.g. `{ time: \"5:30–5:40pm\", label: \"Event opening\" }`.",
  "person-role-length": `Shorten the job title to ${COPY_LIMITS.personRoleWords} words or fewer, e.g. "Senior Director, AI Strategy".`,
  "stat-count": `Show ${COPY_LIMITS.statCount} figures at most — a fifth number stops any of them landing.`,
  "theme-count": `Show ${COPY_LIMITS.themeCount} theme cards at most.`,
  "theme-detail": "Cut the detail back to a single line.",
  "criteria-count": `Show ${COPY_LIMITS.criteriaCount} criteria at most.`,
  "criteria-description": `Shorten the description to ${COPY_LIMITS.bulletWords} words or fewer.`,
  "prize-count": `Show ${COPY_LIMITS.prizeCount} prizes at most; put the rest in the footnote.`,
  "photo-grid-count": `Use between ${COPY_LIMITS.photoGridMin} and ${COPY_LIMITS.photoGridMax} photos — fewer looks accidental, more stops reading as a composition.`,
  "contact-qr-count": `Show ${COPY_LIMITS.contactQrMax} QR codes at most. More and none of them are big enough to scan from the room.`,
  "title-meta-count": `Show ${COPY_LIMITS.titleMetaMax} facts at most under the headline — usually the date and the venue.`,
  "upcoming-count": `Show ${COPY_LIMITS.upcomingMax} upcoming events at most.`,
  "upcoming-blurb": `Shorten the blurb to ${COPY_LIMITS.leadWords} words or fewer.`,
  "qr-point-count":
    "Show 3 points at most beside a QR code — the code needs the room.",
  "karakia-complete":
    "A karakia slide needs both the te reo lines and the English translation.",
  "break-duration":
    "Set the break to somewhere between 1 and 120 minutes.",
  "accent-contrast":
    "Pick a lighter accent for dark slides and a darker one for light slides, or call `accentFromBrandColour()` in `lib/deck/theme.ts` to fix the luminance automatically.",
  "missing-image":
    "Add the file under `public/`, or correct the path. A deck runs offline — a missing image is a blank rectangle on the projector with no way to recover.",
};

/** Every image path a single slide will request, attributed to that slide. */
function slideImages(deck: Deck, slide: Slide): string[] {
  return collectDeckImages({
    ...deck,
    theme: { ...deck.theme, darkBackground: undefined },
    slides: [slide],
  });
}

/** Missing-file problems, shaped like linter issues so they print together. */
function imageIssues(deck: Deck): LintIssue[] {
  const issues: LintIssue[] = [];

  if (deck.theme.darkBackground) {
    const src = deck.theme.darkBackground.src;
    if (!existsSync(join(PUBLIC_DIR, src))) {
      issues.push({
        slideId: "(theme)",
        slideIndex: -1,
        rule: "missing-image",
        severity: "error",
        message: `The deck background "${src}" is not in public/`,
      });
    }
  }

  deck.slides.forEach((slide, index) => {
    for (const src of slideImages(deck, slide)) {
      if (!existsSync(join(PUBLIC_DIR, src))) {
        issues.push({
          slideId: slide.id,
          slideIndex: index,
          rule: "missing-image",
          severity: "error",
          message: `"${src}" is not in public/`,
        });
      }
    }
  });

  return issues;
}

/** Prints one problem: what is wrong, the offending text, and what to do. */
function printIssue(issue: LintIssue): void {
  const marker = issue.severity === "error" ? "MUST FIX" : "LOOK AT";
  const title = RULE_TITLES[issue.rule] ?? issue.rule;
  console.log(`    ${marker}  ${title}`);
  console.log(`              ${issue.message}`);
  const fix = RULE_FIXES[issue.rule];
  if (fix) console.log(`              Fix: ${fix}`);
  console.log("");
}

/** Checks one deck and prints its report. Returns the number of must-fix items. */
function reportDeck(deck: Deck): number {
  const issues = [...lintDeck(deck), ...imageIssues(deck)];
  const errors = issues.filter((issue) => issue.severity === "error");

  console.log("");
  console.log(`${deck.title}`);
  console.log(`  /present/${deck.slug} · ${deck.slides.length} slides`);

  for (const accent of checkAccentContrast(deck.theme)) {
    const verdict = accent.passes ? "reads clearly" : "TOO FAINT";
    console.log(
      `  Accent on ${accent.tone} slides: ${accent.accent} on ${accent.canvas} — ${accent.ratio.toFixed(2)}:1, ${verdict}`,
    );
  }

  const images = collectDeckImages(deck);
  console.log(`  Images referenced: ${images.length}`);
  console.log("");

  if (issues.length === 0) {
    console.log("  Nothing to fix. This deck is ready to present.");
    console.log("");
    return 0;
  }

  // Deck-wide problems (the theme) carry slideIndex -1, so they sort first.
  const bySlide = new Map<number, LintIssue[]>();
  for (const issue of issues) {
    const list = bySlide.get(issue.slideIndex) ?? [];
    list.push(issue);
    bySlide.set(issue.slideIndex, list);
  }

  for (const index of [...bySlide.keys()].sort((a, b) => a - b)) {
    const slide = deck.slides[index];
    const heading =
      index < 0
        ? "  Whole deck"
        : `  Slide ${index + 1} — "${slideLabel(slide)}" (${slide.type})`;
    console.log(heading);
    bySlide.get(index)!.forEach(printIssue);
  }

  const warnings = issues.length - errors.length;
  console.log(
    `  ${errors.length} must fix, ${warnings} to look at.` +
      (errors.length === 0 ? " Nothing blocks presenting this deck." : ""),
  );
  console.log("");

  return errors.length;
}

function main(): void {
  const slug = process.argv[2];

  let decks: Deck[];
  if (slug) {
    const deck = getDeck(slug);
    if (!deck) {
      console.error(`No deck registered for "${slug}".`);
      console.error(`Registered decks: ${getDeckSlugs().join(", ") || "(none)"}`);
      console.error(
        "Create one with: npx tsx scripts/deck/new-deck.ts <event-slug>",
      );
      process.exit(1);
    }
    decks = [deck];
  } else {
    decks = getAllDecks();
  }

  console.log("She Sharp deck check");
  const total = decks.reduce((count, deck) => count + reportDeck(deck), 0);

  if (total > 0) {
    console.log(
      `${total} thing${total === 1 ? "" : "s"} must be fixed before this goes on a projector.`,
    );
    process.exit(1);
  }

  console.log("All checks passed.");
}

main();
