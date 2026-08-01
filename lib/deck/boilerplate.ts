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
  /** Two or three codes on the "Stay Connected" slide. */
  contactQrs?: QrBlock[];
  sectionLabel?: string;
}

/**
 * Builds the nine slides that open a She Sharp event, in running order.
 *
 * Slide nine is a chapter card carrying the event title: everything before it
 * is She Sharp, everything after it is this event.
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
      title: "Our Impact",
      stats: homeImpactData.slice(0, COPY_LIMITS.statCount).map((item) => ({
        value: item.value,
        label: item.title,
      })),
      image: impactPhoto(),
      note: "Read the four numbers and stop. The detail is on the website, not on the slide.",
    },
    {
      id: "sponsors-and-partners",
      type: "logos",
      section,
      tone: "light",
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
      index: "01",
      title: options.eventTitle,
      subtitle: options.eventMeta?.join(" · "),
      note: "Hand over to whoever is running the event itself. The She Sharp introduction is finished.",
    },
  ];
}

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
  feedbackQr: QrBlock;
  ambassadorQr: QrBlock;
  /** Required: a She Sharp event closes with a karakia. */
  karakia: KarakiaText;
  sectionLabel?: string;
}

/** Builds the six slides that close a She Sharp event, in running order. */
export function buildClosingSlides(options: ClosingOptions): Slide[] {
  const section = options.sectionLabel ?? "Closing";

  return [
    {
      id: "thank-you",
      type: "thanks",
      section,
      tone: "light",
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
      title: "Become a SheSharp Ambassador",
      lead: "Help shape the future of women in tech",
      points: ["Scan to get started"],
      qr: options.ambassadorQr,
      note: "Mention that ambassadors run these events; the people in this room are who we recruit from.",
    },
    {
      id: "karakia-whakamutunga",
      type: "karakia",
      section,
      tone: "dark",
      variant: "whakamutunga",
      title: "Karakia Whakamutunga",
      teReo: options.karakia.teReo,
      english: options.karakia.english,
      note: "Invite the room to stand. Read the te reo, then the English translation.",
    },
    {
      id: "end",
      type: "title",
      section,
      tone: "dark",
      variant: "end",
      title: "Ngā mihi nui",
      subtitle: "Thank you for being here",
      note: "Leave this on screen while the room empties. Do not advance past it.",
    },
  ];
}
