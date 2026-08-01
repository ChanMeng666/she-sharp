/**
 * Slide deck schema for She Sharp in-person event presentations.
 *
 * A deck is plain data. Every slide is a member of the `Slide` discriminated
 * union, rendered by exactly one layout component in `components/deck/slides/`.
 * Adding a union member without a layout is a compile error (see the `never`
 * guard in `components/deck/slide-renderer.tsx`).
 *
 * Copy discipline is enforced by `lib/deck/lint.ts`, not by convention.
 */

export type SlideTone = "light" | "dark";

/** An image rendered inside the deck stage. Paths must exist under `public/`. */
export interface DeckImage {
  /** Site-relative path, e.g. `/img/curated/hero-anniversary-crowd-1920.webp`. */
  src: string;
  alt: string;
  /** Responsive candidates; use `toSrcSet()` from the curated manifest. */
  srcSet?: string;
  /** `object-position` for full-bleed crops, e.g. `"50% 30%"`. */
  focus?: string;
}

export interface DeckLogo {
  name: string;
  /** Site-relative path to an SVG or PNG under `public/`. */
  logo: string;
}

/** One row of a run sheet: a clock time plus a very short label. */
export interface TimedItem {
  /** Display-ready, e.g. `"5:30–5:40pm"`. */
  time: string;
  /** Max 6 words — enforced by the linter. */
  label: string;
  /** Renders in the accent colour; use for the "you are here" moment. */
  emphasis?: boolean;
}

export interface PersonItem {
  name: string;
  /** Job title. Omitted at `density: "sm"` to keep the grid readable. */
  role?: string;
  org?: string;
  /** Headshot path; falls back to an initials tile when absent. */
  image?: string;
}

/**
 * A scannable code plus its human-readable destination.
 *
 * The code is drawn from `url` in the browser, so it can never drift out of
 * sync with the link and needs no asset pipeline. `image` is an escape hatch
 * for a pre-made code someone else produced (a ticketing platform's branded
 * one, say) and is only used when `DECK_QR_MODE` is `"image"`.
 */
export interface QrBlock {
  /**
   * Destination. An **empty string** means "not known yet" — some links, like a
   * per-event feedback form, only exist a few days before the event. The slide
   * then renders a visible "link not set" panel rather than a dead code, and
   * the linter flags it, so it cannot quietly reach a projector.
   */
  url: string;
  /** Optional pre-made code; only used in `"image"` QR mode. */
  image?: string;
  /** What the code does, e.g. `"Feedback form"`. */
  label: string;
  /** Short human-typable fallback, e.g. `"shesharp.org.nz/events"`. */
  caption?: string;
}

export interface SlideBase {
  /** Stable and URL-safe: deep-link anchor, overview key, and React key. */
  id: string;
  /** Omit to take the per-type default from `slideDefaultTone()`. */
  tone?: SlideTone;
  /** Grouping label; renders as a header row in the overview grid. */
  section?: string;
  /** Small kicker above the title. Max 5 words. */
  eyebrow?: string;
  /**
   * Host-facing note. Printed in `?print=1` only — never shown on screen.
   * Required: a slide nobody can introduce is a slide nobody should present.
   */
  note: string;
  /** Safe to skip when the event runs late. Dashed outline in the overview. */
  optional?: boolean;
}

export interface TitleSlide extends SlideBase {
  type: "title";
  title: string;
  subtitle?: string;
  /** Short facts, e.g. `["7–8 August 2026", "AUT City Campus"]`. Max 3. */
  meta?: string[];
  /** Partner logo row. */
  logos?: DeckLogo[];
  variant?: "open" | "end";
}

export interface KarakiaSlide extends SlideBase {
  type: "karakia";
  variant: "timatanga" | "whakamutunga";
  title: string;
  teReo: string[];
  english: string[];
  background?: DeckImage;
}

export interface SectionSlide extends SlideBase {
  type: "section";
  title: string;
  subtitle?: string;
  /** Chapter number, e.g. `"02"`. */
  index?: string;
  background?: DeckImage;
}

export interface BulletsSlide extends SlideBase {
  type: "bullets";
  title: string;
  lead?: string;
  /** Max 5 items, max 10 words each — enforced by the linter. */
  items: string[];
  columns?: 1 | 2;
  variant?: "plain" | "checklist" | "numbered";
  /** Optional supporting plate on the trailing edge. */
  image?: DeckImage;
}

export interface AgendaSlide extends SlideBase {
  type: "agenda";
  title: string;
  lead?: string;
  items: TimedItem[];
  columns?: 1 | 2;
}

export interface PeopleSlide extends SlideBase {
  type: "people";
  title: string;
  lead?: string;
  people: PersonItem[];
  /** `lg` = 4 across with role; `md` = 6 across; `sm` = 8 across, names only. */
  density?: "sm" | "md" | "lg";
  shape?: "circle" | "card";
}

export interface PhotoSlide extends SlideBase {
  type: "photo";
  image: DeckImage;
  title?: string;
  lead?: string;
  overlay?: "none" | "scrim" | "gradient";
}

export interface PhotoGridSlide extends SlideBase {
  type: "photo-grid";
  title: string;
  lead?: string;
  /** 3–5 images. More than 5 stops reading as a composition. */
  images: DeckImage[];
}

export interface StatsSlide extends SlideBase {
  type: "stats";
  title: string;
  lead?: string;
  /** 3–4 figures. Each `value` is display-ready, e.g. `"3000+"`. */
  stats: { value: string; label: string; detail?: string }[];
  image?: DeckImage;
}

export interface LogosSlide extends SlideBase {
  type: "logos";
  title: string;
  lead?: string;
  groups: { label?: string; logos: DeckLogo[]; size?: "sm" | "md" | "lg" }[];
}

export interface ThemesSlide extends SlideBase {
  type: "themes";
  title: string;
  lead?: string;
  /** 3–6 cards. `detail` is one short line, not a paragraph. */
  themes: { title: string; detail?: string; tag?: string }[];
}

export interface CriteriaSlide extends SlideBase {
  type: "criteria";
  title: string;
  lead?: string;
  criteria: { name: string; description: string; weight?: string }[];
  footnote?: string;
}

export interface PrizesSlide extends SlideBase {
  type: "prizes";
  title: string;
  lead?: string;
  prizes: {
    amount: string;
    name: string;
    detail?: string;
    scope?: "venue" | "national";
  }[];
  footnote?: string;
}

export interface BreakSlide extends SlideBase {
  type: "break";
  title: string;
  lead?: string;
  /** Countdown length. Space starts and pauses it. */
  minutes: number;
  resumeLabel?: string;
  background?: DeckImage;
}

export interface QrCtaSlide extends SlideBase {
  type: "qr-cta";
  title: string;
  lead?: string;
  points?: string[];
  qr: QrBlock;
}

export interface ContactSlide extends SlideBase {
  type: "contact";
  title: string;
  lead?: string;
  socials: { name: string; handle: string; href: string }[];
  /** 2–3 codes. More and each one gets too small to scan from the room. */
  qrs: QrBlock[];
  footnote?: string;
}

export interface UpcomingSlide extends SlideBase {
  type: "upcoming";
  title: string;
  lead?: string;
  /**
   * Snapshotted at authoring time on purpose. `getUpcomingEvents()` is relative
   * to today, so a live call would quietly change what is on the projector.
   */
  events: {
    title: string;
    date: string;
    time?: string;
    venue?: string;
    blurb?: string;
    image?: DeckImage;
  }[];
  qr?: QrBlock;
}

export interface ThanksSlide extends SlideBase {
  type: "thanks";
  title: string;
  lead?: string;
  groups: { label?: string; logos: DeckLogo[] }[];
  /** People thanked by name, e.g. mentors and judges. */
  names?: string[];
}

export type Slide =
  | TitleSlide
  | KarakiaSlide
  | SectionSlide
  | BulletsSlide
  | AgendaSlide
  | PeopleSlide
  | PhotoSlide
  | PhotoGridSlide
  | StatsSlide
  | LogosSlide
  | ThemesSlide
  | CriteriaSlide
  | PrizesSlide
  | BreakSlide
  | QrCtaSlide
  | ContactSlide
  | UpcomingSlide
  | ThanksSlide;

export type SlideType = Slide["type"];

/**
 * Accent colours, one per tone.
 *
 * The pair is not a stylistic nicety: the She Sharp brand purple `#9b2e83`
 * scores 2.92:1 on the dark canvas, below even the 3:1 large-text floor. Every
 * deck therefore carries a lighter partner for dark slides.
 */
export interface DeckAccent {
  /** Used on light slides. Must reach 4.5:1 on `lightCanvas`. */
  onLight: string;
  /** Used on dark slides. Must reach 4.5:1 on `darkCanvas`. */
  onDark: string;
  /** Decorative only — gradients, hairlines, timer ring. Never carries text. */
  spark: string;
}

export interface DeckTheme {
  accent: DeckAccent;
  /** Defaults to `#0b0a14`. */
  darkCanvas?: string;
  /** Defaults to `#ffffff`. */
  lightCanvas?: string;
  /** Optional plate behind dark slides; the CSS light-burst is used when absent. */
  darkBackground?: DeckImage;
}

export interface Deck {
  /** Matches the event slug so `/present/<slug>` mirrors `/events/<slug>`. */
  slug: string;
  title: string;
  subtitle?: string;
  /** Back-reference into `lib/data/events.ts`. */
  eventSlug?: string;
  theme: DeckTheme;
  slides: Slide[];
}
