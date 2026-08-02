/**
 * The organisational sequence every She Sharp event deck opens and closes with.
 *
 * Nine slides open an event and six close it, and they are the same nine and
 * six every time: karakia, health and safety, who we are, the team, the impact
 * numbers, the sponsors, how to stay in touch, feedback, ambassadors. Authoring
 * those by hand once per event is how a deck ends up showing a team member who
 * left in March and a sponsor who signed in June.
 *
 * So they are generated here from the same live modules the website renders —
 * `lib/data/team.ts`, `lib/data/stats.ts`, `lib/data/sponsors.ts`,
 * `lib/config/footer.ts`, `lib/seo/site.ts`. Update the site, and every deck
 * that has not yet been presented updates with it.
 *
 * What stays per-event: the title, the karakia (which the host chooses), the
 * venue's own safety lines, the photograph, and the QR destinations.
 */

import { footerConfig } from "@/lib/config/footer";
import { scrollingSponsorLogos, tieredSponsors } from "@/lib/data/sponsors";
import { homeImpactData } from "@/lib/data/stats";
import { teamMembers } from "@/lib/data/team";
import { SITE_DESCRIPTION } from "@/lib/seo/site";
import { curatedImages, toSrcSet } from "@/public/img/curated";

import { COPY_LIMITS } from "./lint";
import type {
  DeckImage,
  DeckLogo,
  PersonItem,
  QrBlock,
  Slide,
  UpcomingSlide,
} from "./types";

/** A karakia and its English translation, one array entry per spoken line. */
export interface KarakiaText {
  teReo: string[];
  english: string[];
}

/**
 * Health and safety lines that apply at every She Sharp venue.
 *
 * Ordered least- to most-critical on purpose: when a venue adds its own lines
 * the slide keeps the last five, so "dial 111" survives and "find the exits"
 * is the first thing to go. Each line is a fragment under ten words, because
 * the linter enforces that and because nobody reads a sentence during a
 * briefing.
 */
const ORG_SAFETY_LINES = [
  "Find the nearest fire exits before we start",
  "Follow staff to the assembly point in an evacuation",
  "First aid and accessible facilities are available on request",
  "Keep your bag and devices with you",
  "In an emergency dial 111",
];

/** Path segments that are platform routing, not a social handle. */
const NON_HANDLE_SEGMENTS = new Set([
  "company",
  "channel",
  "user",
  "show",
  "pages",
  "posts",
  "in",
  "c",
]);

/**
 * The Mailchimp newsletter archive is a subscribe funnel, not a profile, and it
 * has no handle a person could read off a projector. `lib/seo/site.ts` filters
 * it out of the social list for the same reason.
 */
const NON_SOCIAL_LINKS = new Set(["Mailchimp"]);

/** Trims `text` to at most `max` words, dropping any dangling punctuation. */
function truncateWords(text: string, max: number): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= max) return text.trim();
  return parts.slice(0, max).join(" ").replace(/[,;:—–-]+$/, "");
}

/**
 * Derives a readable social handle from a profile URL.
 *
 * Returns `@shesharpnz` for the platforms that put the account name in the
 * path, and the bare hostname for the ones that use an opaque id (a Spotify
 * show id, a YouTube channel id) — an unreadable id is worse than no handle.
 */
export function deriveSocialHandle(href: string): string {
  const url = new URL(href);
  const candidate = url.pathname
    .split("/")
    .filter(Boolean)
    .find((segment) => !NON_HANDLE_SEGMENTS.has(segment.toLowerCase()));

  const looksLikeHandle =
    !!candidate && /^[a-z0-9][a-z0-9._-]{2,29}$/.test(candidate);
  return looksLikeHandle ? `@${candidate}` : url.hostname.replace(/^www\./, "");
}

/**
 * The one-line "who we are" for the mission photo slide.
 *
 * Takes the site description's leading clause (the trailing "through events,
 * mentorship, …" list is a second thought and does not survive projection),
 * tightens the verb phrase, and clamps to the lead-length limit.
 */
export function missionLead(): string {
  const clause = SITE_DESCRIPTION.split("—")[0]
    .replace(" on a mission to bridge", " bridging")
    .replace(/[\s,]+$/, "");
  return truncateWords(clause, COPY_LIMITS.leadWords);
}

/** Team members as slide people: last role wins, because it is the specific one. */
function teamAsPeople(): PersonItem[] {
  return teamMembers.map((member) => ({
    name: member.name,
    // `roles` runs general to specific — ["Trustee", "Ambassador", "Founder and
    // Chair"] — so the last entry is the one worth 28px on a projector.
    role: truncateWords(
      member.roles[member.roles.length - 1],
      COPY_LIMITS.personRoleWords,
    ),
    image: member.image,
  }));
}

/** The She Sharp community photograph shown under "We are She Sharp". */
function communityPhoto(): DeckImage {
  const image = curatedImages["hero-community-cheer"];
  return {
    src: image.src,
    alt: image.alt,
    srcSet: toSrcSet(image),
    focus: "50% 40%",
  };
}

/** Supporting plate beside the impact figures — four numbers alone read thin. */
function impactPhoto(): DeckImage {
  const image = curatedImages["hero-inspire-her-crowd"];
  return {
    src: image.src,
    alt: image.alt,
    srcSet: toSrcSet(image),
    focus: "50% 35%",
  };
}

export interface OpeningOptions {
  /** Short enough to be a slide title — seven words, not the full event name. */
  eventTitle: string;
  /** Up to three facts, e.g. `['7–8 August 2026', 'AUT City Campus']`. */
  eventMeta?: string[];
  partnerLogos?: DeckLogo[];
  /** Required: a She Sharp event opens with a karakia, so a deck cannot omit it. */
  karakia: KarakiaText;
  /** Venue-specific safety lines, appended to the organisational defaults. */
  safetyExtras?: string[];
  /** Quiet plate behind the opening karakia; the layout scrims it to atmosphere. */
  heroImage?: DeckImage;
  /**
   * Plate behind the chapter card that hands over to the event itself.
   *
   * Distinct from `heroImage` because the two carry opposite jobs: the karakia
   * plate is somewhere for a room to rest its eyes, and this one is the first
   * time the event's own identity appears on the projector.
   */
  chapterPlate?: DeckImage;
  /** Two or three codes on the "Stay Connected" slide. */
  contactQrs?: QrBlock[];
  sectionLabel?: string;
}

/**
 * Builds the nine slides that open a She Sharp event, in running order.
 *
 * Slide nine is a chapter card carrying the event title: everything before it
 * is She Sharp, everything after it is this event.
 *
 * Every slide carries an `eyebrow`. It is written as an instruction to the room
 * or a fact that is true at the moment the slide is up — "PLEASE FIND A SEAT",
 * "SOME OF THEM ARE HERE" — never a restatement of the title beneath it. These
 * are deliberately generic enough to be true at any She Sharp event, because
 * they ship with the boilerplate; per-event kickers belong in the deck file.
 */
export function buildOpeningSlides(options: OpeningOptions): Slide[] {
  const section = options.sectionLabel ?? "Welcome";

  // Venue lines are additive, and the limit is five bullets. Keeping the tail
  // drops organisational defaults from the top — "find the exits" goes before
  // "dial 111" does.
  const safety = [...ORG_SAFETY_LINES, ...(options.safetyExtras ?? [])].slice(
    -COPY_LIMITS.bulletCount,
  );

  return [
    {
      id: "title",
      type: "title",
      section,
      tone: "dark",
      eyebrow: "Please find a seat",
      variant: "open",
      title: options.eventTitle,
      meta: options.eventMeta,
      logos: options.partnerLogos,
      note: "Hold here while people find seats. Welcome the room and name the hosting partners out loud.",
    },
    {
      id: "karakia-timatanga",
      type: "karakia",
      section,
      tone: "dark",
      eyebrow: "Stand if you are able",
      variant: "timatanga",
      title: "Karakia Tīmatanga",
      teReo: options.karakia.teReo,
      english: options.karakia.english,
      background: options.heroImage,
      note: "Invite the room to stand. Read the te reo, then the English translation.",
    },
    {
      id: "health-and-safety",
      type: "bullets",
      section,
      tone: "light",
      eyebrow: "Thirty seconds, then we begin",
      variant: "checklist",
      title: "Health & Safety",
      items: safety,
      note: "Point at the actual exits as you read them. This takes thirty seconds and is not optional.",
    },
    {
      id: "we-are-she-sharp",
      type: "photo",
      section,
      tone: "dark",
      // A year, not a count of years: "twelve years" reads better and rots the
      // moment this boilerplate is reused in another January.
      eyebrow: "Running since 2014",
      overlay: "gradient",
      title: "We are She Sharp",
      lead: missionLead(),
      image: communityPhoto(),
      note: "One sentence on who She Sharp is. Mention that we have run events since 2014.",
    },
    {
      id: "she-sharp-team",
      type: "people",
      section,
      tone: "light",
      eyebrow: "Interrupt any of us today",
      title: "The She Sharp Team",
      lead: "Find any of us today — we are here to help",
      people: teamAsPeople(),
      density: "sm",
      shape: "circle",
      note: "Ask the team members in the room to raise a hand rather than reading every name.",
    },
    {
      id: "our-impact",
      type: "stats",
      section,
      tone: "light",
      eyebrow: "Every number here is people",
      title: "Our Impact",
      stats: homeImpactData.slice(0, COPY_LIMITS.statCount).map((item) => ({
        value: item.value,
        label: item.title,
      })),
      image: impactPhoto(),
      // The only handwritten line in the deck. It says what the figures mean,
      // which the figures cannot.
      annotation: "people keep showing up",
      note: "Read the four numbers and stop. The detail is on the website, not on the slide.",
    },
    {
      id: "sponsors-and-partners",
      type: "logos",
      section,
      tone: "light",
      eyebrow: "Some of them are here",
      title: "Our Sponsors & Partners",
      lead: "None of this happens without the organisations behind it",
      groups: [
        {
          label: "Current partners",
          size: "lg",
          logos: tieredSponsors.map((sponsor) => ({
            name: sponsor.name,
            logo: sponsor.logo,
          })),
        },
        {
          label: "Supporters since 2014",
          size: "sm",
          logos: scrollingSponsorLogos.map((sponsor) => ({
            name: sponsor.name,
            logo: sponsor.logo,
          })),
        },
      ],
      note: "Name today's host and any sponsor with people in the room; let the rest of the wall speak for itself.",
    },
    {
      id: "stay-connected",
      type: "contact",
      section,
      tone: "light",
      eyebrow: "Scan now, read later",
      title: "Stay Connected",
      lead: "Everything we run is announced on these channels first",
      socials: footerConfig.socialLinks
        .filter((link) => !NON_SOCIAL_LINKS.has(link.name))
        .map((link) => ({
          name: link.name,
          handle: deriveSocialHandle(link.href),
          href: link.href,
        })),
      qrs: options.contactQrs ?? [],
      footnote: `${footerConfig.charityInfo.name} is a registered New Zealand charity, ${footerConfig.charityInfo.registrationNumber}.`,
      note: "Leave this up during the first break so people can scan it without asking.",
    },
    {
      id: "event-opening",
      type: "section",
      section,
      tone: "dark",
      eyebrow: "From here it is yours",
      index: "01",
      title: options.eventTitle,
      subtitle: options.eventMeta?.join(" · "),
      background: options.chapterPlate,
      note: "Hand over to whoever is running the event itself. The She Sharp introduction is finished.",
    },
  ];
}

/**
 * The standing ambassador intake form.
 *
 * One form across all events, so it lives here rather than being retyped into
 * every deck. The post-event feedback survey is the opposite — a fresh Google
 * Form each time — which is why `feedbackFormUrl` is a per-deck input with no
 * default worth having.
 */
export const AMBASSADOR_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdTEFjOs6lLHZDGpSvoMfkckloPBMbvFA45iNhVvh1sAsUZlA/viewform";

export interface ClosingOptions {
  thanksLogos: { label?: string; logos: DeckLogo[] }[];
  /** People thanked by name — mentors, judges, volunteers. */
  thanksNames?: string[];
  /**
   * Snapshotted at authoring time. `getUpcomingEvents()` is relative to today,
   * so calling it at render time would change the projector content under the
   * host on the day.
   */
  upcoming: UpcomingSlide["events"];
  /**
   * This event's post-event survey.
   *
   * Every event gets a new Google Form, so there is deliberately no fallback:
   * a code pointing at the previous event's form collects the wrong data and
   * nobody in the room can tell. Leave it empty until the organiser supplies
   * the link and the slide will say so on screen.
   */
  feedbackQr: QrBlock;
  /** Defaults to the standing ambassador form. */
  ambassadorQr?: QrBlock;
  /** Required: a She Sharp event closes with a karakia. */
  karakia: KarakiaText;
  /**
   * Quiet plate behind the closing karakia.
   *
   * Should not be the plate used behind the opening one. The two karakia
   * bookend the day and land three hours apart at minimum; repeating the image
   * makes the second read as a rerun of the first rather than as its answer.
   */
  karakiaImage?: DeckImage;
  sectionLabel?: string;
}

/**
 * Builds the six slides that close a She Sharp event, in running order.
 *
 * Eyebrows follow the same rule as the opening: an instruction or a fact that
 * is true while the slide is up, never a paraphrase of the title.
 */
export function buildClosingSlides(options: ClosingOptions): Slide[] {
  const section = options.sectionLabel ?? "Closing";
  const ambassadorQr: QrBlock = options.ambassadorQr ?? {
    url: AMBASSADOR_FORM_URL,
    label: "Ambassador application",
    caption: "Or visit shesharp.org.nz/join-our-team",
  };

  return [
    {
      id: "thank-you",
      type: "thanks",
      section,
      tone: "light",
      eyebrow: "Clap for each group",
      title: "Thank You",
      lead: "To everyone who gave their time, their venue and their expertise",
      groups: options.thanksLogos,
      names: options.thanksNames,
      note: "Read the names of anyone still in the room and pause for applause after each group.",
    },
    {
      id: "upcoming-events",
      type: "upcoming",
      section,
      tone: "light",
      eyebrow: "Put this in your calendar",
      title: "What's Coming Up",
      lead: "The next thing you can come to",
      events: options.upcoming,
      note: "Say the date twice. People write it down on the second one.",
    },
    {
      id: "feedback",
      type: "qr-cta",
      section,
      tone: "dark",
      eyebrow: "One minute of silence, please",
      title: "Complete Our Feedback Form",
      lead: "Scan to share your feedback and go in the draw to win",
      qr: options.feedbackQr,
      note: "Leave this up for a full minute and wait in silence while people scan it.",
    },
    {
      id: "ambassador",
      type: "qr-cta",
      section,
      tone: "light",
      eyebrow: "Run by people like you",
      title: "Become a SheSharp Ambassador",
      lead: "Help shape the future of women in tech",
      points: ["Scan to get started"],
      qr: ambassadorQr,
      note: "Mention that ambassadors run these events; the people in this room are who we recruit from.",
    },
    {
      id: "karakia-whakamutunga",
      type: "karakia",
      section,
      tone: "dark",
      eyebrow: "Stand one last time",
      variant: "whakamutunga",
      title: "Karakia Whakamutunga",
      teReo: options.karakia.teReo,
      english: options.karakia.english,
      background: options.karakiaImage,
      note: "Invite the room to stand. Read the te reo, then the English translation.",
    },
    {
      id: "end",
      type: "title",
      section,
      tone: "dark",
      eyebrow: "Travel safely, see you soon",
      variant: "end",
      title: "Ngā mihi nui",
      subtitle: "Thank you for being here",
      note: "Leave this on screen while the room empties. Do not advance past it.",
    },
  ];
}
