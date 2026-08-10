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
import { feedbackUrlForSlug } from "@/lib/data/feedback-codes";
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
  /**
   * Replaces `ORG_SAFETY_LINES` outright, for a venue that briefs differently.
   *
   * An escape hatch, not the normal path — the defaults exist so that no deck
   * has to remember the exits. Written as a replacement rather than an
   * omit-list because matching a line to remove by its exact string is a
   * silent no-op the moment someone rewords the default, and a safety
   * instruction that quietly stops appearing is the worst version of this bug.
   * Still capped at `COPY_LIMITS.bulletCount`, and `safetyExtras` still appends.
   */
  safetyLines?: string[];
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
 * "STAND IF YOU ARE ABLE" — never a restatement of the title beneath it. These
 * are deliberately generic enough to be true at any She Sharp event, because
 * they ship with the boilerplate; per-event kickers belong in the deck file.
 */
export function buildOpeningSlides(options: OpeningOptions): Slide[] {
  const section = options.sectionLabel ?? "Welcome";

  // Venue lines are additive, and the limit is five bullets. Keeping the tail
  // drops organisational defaults from the top — "find the exits" goes before
  // "dial 111" does.
  const safety = [
    ...(options.safetyLines ?? ORG_SAFETY_LINES),
    ...(options.safetyExtras ?? []),
  ].slice(-COPY_LIMITS.bulletCount);

  const slides: Slide[] = [
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
      // Not "Some of them are here": whoever builds the deck rarely knows who
      // has actually turned up, and a kicker that guesses wrong is read out to
      // a room that can see the empty seats. Thanks are true either way.
      eyebrow: "With thanks to them all",
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
      // THE HANDOVER, and the one slide in this sequence that is NOT house.
      // Everything above it is She Sharp introducing itself; this card is where
      // the event's own identity arrives, so it is the first slide to wear the
      // event's skin. See `lib/deck/skins.ts`.
      surface: "event",
    },
  ];

  return slides.map(asHouse);
}

/**
 * Stamps a slide as organisational unless it has already claimed otherwise.
 *
 * Applied at the return rather than written onto fourteen slide literals, so a
 * slide added to either sequence later is stamped without anybody remembering
 * to. The organisational slides carry She Sharp's own record of itself — the
 * team, the impact figures, the sponsor wall, the thanks — and an event may not
 * restyle them; see the boundary described in `lib/deck/skins.ts`.
 */
function asHouse<T extends Slide>(slide: T): T {
  return slide.surface ? slide : { ...slide, surface: "house" };
}

/**
 * Where the ambassador code sends people.
 *
 * The She Sharp recruitment page, NOT the Google Form behind it — and the
 * reason is not a preference.
 *
 * The intake form has a file-upload question, and Google requires a signed-in
 * account for any form that has one, because the upload has to land in
 * somebody's Drive. There is no setting that turns this off. So the form's own
 * URL puts a Google sign-in page in front of every person who scans the code,
 * at the exact moment they are holding up a phone in a room full of people.
 * The organisers cannot see this happening: they are always signed in.
 *
 * Sending people to the page instead costs one extra click and is the better
 * flow anyway. Nobody attaches a CV standing in a hall. What should happen in
 * that moment is "I am interested and I know where to go", which a public page
 * does and a login wall does not.
 *
 * If the file-upload question is ever removed from the form, this can point
 * straight at it again.
 */
export const AMBASSADOR_FORM_URL = "https://www.shesharp.org.nz/join-our-team";

/**
 * The feedback code for one event.
 *
 * This used to be impossible. Every event got a fresh Google Form, whose URL
 * says nothing about which event it belongs to, so a default would have meant
 * guessing — and a code pointing at last month's form looks perfectly correct
 * from the front of the room while collecting the wrong data. Hence the old
 * rule: no default, show "Link not set yet", make the organiser paste a link.
 *
 * The form is ours now and its URL is derived from the event slug, so the
 * failure mode has moved rather than gone away: to point the code at the wrong
 * event you would have to have built the wrong deck entirely. `lintDeck()`
 * re-checks the derivation against the deck's own slug, so even that is caught.
 *
 * It encodes the short `/f/<code>` alias, not `/events/<slug>/feedback`. At
 * error-correction level `M` — which `components/deck/deck-qr.tsx` picks
 * deliberately, for distance — 36 bytes fits QR version 3 at 29x29 modules
 * while the 79-byte long path needs version 5 at 37x37. Same area on the
 * projector, modules 28% larger, which is the difference between scanning from
 * six metres and not. The short form is also short enough to read aloud, which
 * matters because half the room photographs the slide instead of scanning it.
 *
 * Throws on a slug that is not a known event — a deck for an event the site has
 * never heard of is a mistake worth failing on.
 */
export function feedbackQrFor(eventSlug: string): QrBlock {
  const url = feedbackUrlForSlug(eventSlug);
  return {
    url,
    label: "Feedback form",
    // The caption is what the back of the room reads instead of scanning, so it
    // is the destination itself, minus the `https://www.` nobody says out loud.
    caption: url.replace(/^https:\/\/www\./, ""),
  };
}

export interface ClosingOptions {
  /**
   * The event this deck belongs to, as it appears in `lib/data/events.ts`.
   *
   * Required, and this is where the old safety property now lives: you cannot
   * obtain a feedback QR without declaring which event it is for. `feedbackQr`
   * used to carry that weight by having no default at all.
   */
  eventSlug: string;
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
   * Overrides the derived feedback code — an escape hatch, not the normal path.
   *
   * The only real case is a survey somebody else runs: a partner's own form, a
   * university's evaluation. Otherwise leave it out and `eventSlug` supplies
   * the right code. An empty `url` still renders the visible "Link not set yet"
   * panel and is still reported by the linter, and anything pointing away from
   * a She Sharp feedback URL is reported too — see `feedback-qr-external`.
   */
  feedbackQr?: QrBlock;
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
    label: "Become an ambassador",
    // The caption is what the back of the room reads instead of scanning, so it
    // has to be the destination itself — it used to say "or visit
    // shesharp.org.nz/join-our-team" while the code went somewhere else.
    caption: "shesharp.org.nz/join-our-team",
  };
  const feedbackQr: QrBlock = options.feedbackQr ?? feedbackQrFor(options.eventSlug);

  const slides: Slide[] = [
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
    /*
     * Only when there is genuinely something to come to.
     *
     * With an empty list this still projected "What's Coming Up / The next
     * thing you can come to" over nothing at all, under a host note telling
     * whoever was holding the clicker to "say the date twice". An empty
     * promise on a wall is worse than one slide fewer, and the events QR is
     * already on the opening "Stay Connected" slide, so nobody loses the way
     * to find out.
     */
    ...(options.upcoming.length > 0
      ? [
          {
            id: "upcoming-events",
            type: "upcoming" as const,
            section,
            tone: "light" as const,
            eyebrow: "Put this in your calendar",
            title: "What's Coming Up",
            lead: "The next thing you can come to",
            events: options.upcoming,
            note: "Say the date twice. People write it down on the second one.",
          },
        ]
      : []),
    {
      id: "feedback",
      type: "qr-cta",
      section,
      tone: "dark",
      eyebrow: "Takes under a minute",
      title: "Complete Our Feedback Form",
      lead: "Scan to share your feedback and go in the draw to win",
      qr: feedbackQr,
      note: "Leave this up for a full minute and wait in silence while people scan it. The form is ours now — answers land in Slack before people leave the room.",
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

  return slides.map(asHouse);
}
