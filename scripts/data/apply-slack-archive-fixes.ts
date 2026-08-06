/**
 * One-off corrections to `events-custom.json` from the She Sharp Slack
 * archive review (findings A3, A4, A16, A17, A18, A19, A28, A55).
 *
 * Kept in the repo rather than applied by hand so each change carries its
 * finding id and its authority — the event's own Google run sheet outranks
 * Slack chat, which outranks anything inferred. Every edit below is either a
 * run-sheet value or an explicit instruction recorded in the archive.
 *
 * Re-running is safe: each step is idempotent and reports "already applied"
 * rather than failing.
 */
import { readEventJson, writeEventJson } from "./json-format";

const FILE = "lib/data/json/events-custom.json";

type Speaker = {
  name: string;
  title?: string;
  company?: string;
  bio?: string;
  image?: string;
  linkedin?: string;
};
type SpeakerGroup = { heading: string; speakers: Speaker[] };
type EventRecord = {
  id: number;
  title: string;
  coverImage: { url?: string; alt?: string };
  shortDescription: string;
  detailPageData: {
    title: string;
    subtitle: string;
    fullDescription: string[];
    location: { venueName: string; address: string; city: string };
    speakers: Record<string, SpeakerGroup | undefined>;
    sponsors: { main: { name: string; logo: string; description: string }[] };
    specialSections: { type: string; title: string; content: string[] }[];
  };
};

const data = readEventJson<{ events: EventRecord[] }>(FILE);
const byId = new Map(data.events.map((e) => [e.id, e]));
const get = (id: number): EventRecord => {
  const event = byId.get(id);
  if (!event) throw new Error(`Event id ${id} not found in ${FILE}`);
  return event;
};

const log: string[] = [];
const note = (finding: string, message: string) =>
  log.push(`${finding.padEnd(4)} ${message}`);

const replaceIn = (text: string, from: string, to: string) =>
  text.includes(from) ? text.split(from).join(to) : text;

const findSpeaker = (event: EventRecord, name: string): Speaker | undefined => {
  for (const group of Object.values(event.detailPageData.speakers)) {
    const hit = group?.speakers.find((s) => s.name === name);
    if (hit) return hit;
  }
  return undefined;
};

// ---------------------------------------------------------------- A3, id 89
// The Vibe Coding segment was cancelled at MSD's request on 2026-03-26; the
// instruction was to run #IAmRemarkable only and drop Chan Meng from the
// speakers once Mahsa confirmed. Neither the run sheet's Event Title nor its
// Speakers tab mentions either. The body copy was corrected at the time but
// the titles, the short description, the cover alt text and the speaker list
// were not — so a completed event advertised a session that never ran.
{
  const event = get(89);
  const d = event.detailPageData;
  const strip = (text: string) =>
    replaceIn(
      replaceIn(text, " — #IAmRemarkable & Vibe Coding", " — #IAmRemarkable"),
      "#IAmRemarkable & Vibe Coding",
      "#IAmRemarkable"
    );

  event.title = strip(event.title);
  d.title = strip(d.title);
  d.subtitle = strip(d.subtitle);
  if (event.coverImage.alt) event.coverImage.alt = strip(event.coverImage.alt);
  event.shortDescription =
    "The second HER WAKA cohort focuses on building confidence through the " +
    "#IAmRemarkable workshop, followed by a recruiter networking activity.";

  // The run sheet and the original workshop outline both say 55 minutes.
  d.fullDescription = d.fullDescription.map((p) =>
    replaceIn(p, "50-minute workshop", "55-minute workshop")
  );

  const keynote = d.speakers.keynote_speakers;
  if (keynote) {
    const before = keynote.speakers.length;
    keynote.speakers = keynote.speakers.filter((s) => s.name !== "Chan Meng");
    note(
      "A3",
      before === keynote.speakers.length
        ? "id 89 Chan Meng already absent from keynote_speakers"
        : "id 89 removed Chan Meng from keynote_speakers (run sheet Speakers tab)"
    );
  }
  note(
    "A3",
    "id 89 dropped the cancelled Vibe Coding segment from titles and alt text"
  );
  note("A3", "id 89 workshop length 50 -> 55 minutes (run sheet)");
}

// ---------------------------------------------------------------- A4, id 88
// Two working recruitment consultants had their details crossed: Paul Kelly
// carried Neekee Reshamwala's title and bio. Authoritative values are the
// Speakers tab of the 25 March 2026 run sheet.
{
  const paul = findSpeaker(get(88), "Paul Kelly");
  if (!paul) throw new Error("id 88: Paul Kelly not found");
  paul.title = "Business Manager and Principal Consultant, Absolute IT";
  paul.company = "Absolute IT";
  paul.bio =
    "As Business Manager and Principal Consultant, Paul manages Absolute IT" +
    "’s Auckland office while remaining an active recruiter. He joined the " +
    "team in 2021 after a decade in Sales and Relationship Management. He " +
    "enjoys the fast paced and ever-changing tech industry — like " +
    "recruitment, no two days are ever the same. Building genuine, long-term " +
    "relationships is central to how he works, and getting to know clients on " +
    "a personal level helps him understand what they need and how he can " +
    "connect them with the right people.";
  note("A4", "id 88 Paul Kelly title/company/bio restored from the run sheet");
}

// --------------------------------------------------------------- A28, id 88
// The same person's bio differed between two adjacent event pages. Mahsa
// supplied a single 730-character version on 2026-03-18 and asked for the
// March event and the website to be updated with it; id 89 got it, id 88 did
// not. Use id 89's copy so one person reads the same way on both pages.
{
  const march = findSpeaker(get(88), "Dr. Mahsa McCauley");
  const april = findSpeaker(get(89), "Dr. Mahsa McCauley (Mohaghegh)");
  if (march && april?.bio && march.bio !== april.bio) {
    march.bio = april.bio;
    note(
      "A28",
      "id 88 Mahsa bio aligned with id 89 (her own 2026-03-18 version)"
    );
  } else {
    note("A28", "id 88 Mahsa bio already matches id 89");
  }
}

// --------------------------------------------------------------- A16, id 85
// LinkedIn and the run sheet both spell it Danubia.
{
  const speaker = findSpeaker(get(85), "Danubi Paim (Dani)");
  if (speaker) {
    speaker.name = "Danubia Paim (Dani)";
    note("A16", "id 85 Danubi -> Danubia Paim");
  } else {
    note("A16", "id 85 Danubia Paim already correct");
  }
}

// --------------------------------------------------------------- A16, id 89
{
  let changed = false;
  for (const group of Object.values(get(89).detailPageData.speakers)) {
    for (const speaker of group?.speakers ?? []) {
      if (speaker.title === "Director Consultant of Elevate Consulting") {
        speaker.title = "Director and Principal Consultant - Elevate Consulting";
        changed = true;
      }
    }
  }
  note(
    "A16",
    changed
      ? "id 89 Elevate Consulting title corrected (run sheet)"
      : "id 89 Elevate Consulting title already correct"
  );
}

// --------------------------------------------------------------- A16, id 91
// LinkedIn is a registered trade mark and is capitalised mid-word.
{
  const event = get(91);
  const before = event.title;
  event.title = replaceIn(event.title, "Making Linkedin", "Making LinkedIn");
  note(
    "A16",
    before === event.title
      ? "id 91 title already spells LinkedIn correctly"
      : "id 91 Making Linkedin -> Making LinkedIn"
  );
}

// --------------------------------------------------------------- A19, id 91
// Stuart Little asked on 2026-04-24 for "Creative Lead for the THRIVE" to be
// dropped; posts and posters were remade at the time. His `title` was fixed,
// his bio was not. The run sheet still carries the old wording, so this is a
// deliberate departure from it — a speaker's own wishes about how they are
// described outrank the run sheet.
{
  const stuart = findSpeaker(get(91), "Stuart Little");
  if (stuart?.bio) {
    const before = stuart.bio;
    stuart.bio = replaceIn(
      stuart.bio,
      "Stuart Little, Creative Lead for the THRIVE and Director of Agency8.",
      "Stuart Little is a Creative Strategist and Director of Agency8."
    );
    note(
      "A19",
      before === stuart.bio
        ? "id 91 Stuart Little bio already updated"
        : "id 91 Stuart Little bio: dropped the wording he asked to remove"
    );
  }
}

// --------------------------------------------------------------- A17, id 86
// The misspelling was flagged on 2023-08-31 and only Humanitix was corrected.
// The venue was blank; the address is from the event's own listing. The start
// time stays empty on purpose — Slack carries two versions (7:30 sharp in the
// attendee email, 7:45 suggested by AWS) and the run sheet is a Google Doc
// that cannot be read here. Guessing it would be worse than leaving it out.
{
  const d = get(86).detailPageData;
  d.fullDescription = d.fullDescription.map((p) =>
    replaceIn(p, "Maya Lee", "Maja Lee")
  );
  if (!d.location.venueName) d.location.venueName = "AWS";
  if (!d.location.address) {
    d.location.address = "Level 13, PwC Tower, Commercial Bay, Auckland";
  }
  if (!d.location.city) d.location.city = "Auckland";
  note(
    "A17",
    "id 86 Maya -> Maja Lee, venue and address filled in (time left blank)"
  );
}

// --------------------------------------------------------------- A55, id 93
// The 13 June session is the "AI and Electronics Workshop" and the electronics
// half came from Little Engineers. The 20 June record (id 94) lists all three
// partners; this one omitted them.
{
  const sponsors = get(93).detailPageData.sponsors.main;
  if (!sponsors.some((s) => s.name === "Little Engineers")) {
    sponsors.push({
      name: "Little Engineers",
      logo: "/img/sponsors/little-engineers.jpg",
      description: "",
    });
    note("A55", "id 93 added Little Engineers as a partner");
  } else {
    note("A55", "id 93 Little Engineers already listed");
  }
}

// --------------------------------------------------------------- A20, id 92
// Raquel asked on 2026-05-11 for the two recruiter bios added to the run sheet
// to be put on the event page; nobody replied and it never happened. The
// page's own copy meanwhile promised them — "As with every HER WAKA cohort,
// RCSA will join the session" — so the description and the speaker list
// disagreed. Values are the RCSA block of the June run sheet's Speakers tab.
// No `image`: the run sheet links Drive files, and 12 of the 376 speakers on
// this site already render fine without a photo.
//
// Two rendering constraints, both learned by breaking them: the speaker card
// prints `[title, company].join(", ")`, so an employer already named in the
// run sheet's Role column must not be repeated in `company` ("Senior
// Consultant, Potentia, Potentia"). And the section heading passes through a
// normaliser that title-cases any all-caps string over three characters, so a
// bare "RCSA" heading renders as "Rcsa".
{
  const speakers = get(92).detailPageData.speakers;
  const existing = speakers.guest_speakers;
  const rcsa: Speaker[] = [
    {
      name: "Lisa Cooley",
      title: "Founder & Managing Director of BrightSpark",
      company: "",
      bio:
        "With over 20 years’ experience in recruitment and 15 years in New " +
        "Zealand’s tech and digital sector, Lisa brings deep expertise in " +
        "hard-to-fill and specialist roles. She works closely with innovative " +
        "companies and highly skilled candidates navigating competitive, " +
        "short-market conditions. At the heart of Lisa’s work is helping " +
        "people find roles that genuinely excite and fulfil them, while " +
        "supporting businesses to thrive. A passionate advocate for " +
        "people-first recruitment, Lisa runs jobseeker and graduate readiness " +
        "workshops, champions Women in Tech, and supports inclusive hiring " +
        "practices. She believes great recruitment can genuinely change lives.",
      image: "",
      linkedin: "",
    },
    {
      name: "Sri Nanduri",
      title: "Senior Consultant, Potentia",
      company: "",
      bio:
        "Sri Nanduri is an experienced Auckland-based technology recruiter " +
        "with over 8 years’ experience, specialising in Technology, " +
        "Transformation and Digital roles within New Zealand. She has a " +
        "strong background in senior client management, candidate placement " +
        "and career coaching, helping professionals build personal brands and " +
        "sharpen their interview skills. Sri stands out for her ability to " +
        "find talent for niche, high-impact roles such as product management " +
        "and technical leadership, having recruited product owners, senior " +
        "data architects and testers.",
      image: "",
      linkedin: "",
    },
  ];

  const group: SpeakerGroup = existing ?? {
    heading: "Joining Us from RCSA",
    speakers: [],
  };
  let added = 0;
  for (const speaker of rcsa) {
    const index = group.speakers.findIndex((s) => s.name === speaker.name);
    if (index === -1) {
      group.speakers.push(speaker);
      added++;
    } else {
      // Upsert rather than skip, so re-running also repairs a bad earlier write.
      group.speakers[index] = { ...group.speakers[index], ...speaker };
    }
  }
  group.heading = "Joining Us from RCSA";
  speakers.guest_speakers = group;
  note(
    "A20",
    added
      ? `id 92 added ${added} RCSA recruiter(s) from the June run sheet`
      : "id 92 RCSA recruiters refreshed from the June run sheet"
  );
}

// ---------------------------------------------------- A18, ids 88 / 89 / 92
// The June run sheet's short description says "Note: This session is by
// invitation only". Only id 90 carried it, and in April an outsider asked via
// LinkedIn whether they could attend — the team's own conclusion was that the
// event page did not say so clearly enough.
{
  const NOTICE = "NOTE: This event is strictly by invitation only.";
  for (const id of [88, 89, 92]) {
    const description = get(id).detailPageData.fullDescription;
    if (!description.includes(NOTICE)) {
      description.push(NOTICE);
      note("A18", `id ${id} added the invitation-only notice`);
    } else {
      note("A18", `id ${id} invitation-only notice already present`);
    }
  }
}

// ---------------------------------------------- A6, ids 88 / 89 / 90 / 92
// On 2026-04-27 Mahsa asked for the HER WAKA programme site to be added to
// *all* Her Waka event pages. The reply asked for more detail and the thread
// died there. The site is linked from the footer and the homepage programmes
// section, but not from any of the four events it documents — which is where
// a participant looking it up would go. `programming.chanmeng.org/docs/
// 2026-her-waka/...` was its first home; it now serves from
// herwaka.shesharp.org.nz, and both were checked as live before this landed.
{
  const HER_WAKA_URL = "https://herwaka.shesharp.org.nz/programme/about-her-waka";
  const SECTION_TITLE = "About the HER WAKA Programme";

  for (const id of [88, 89, 90, 92]) {
    const sections = get(id).detailPageData.specialSections;
    if (sections.some((s) => s.title === SECTION_TITLE)) {
      note("A6", `id ${id} programme link already present`);
      continue;
    }
    sections.push({
      type: "related-links",
      title: SECTION_TITLE,
      content: [
        `Read about HER WAKA, the monthly programme this session is part of :${HER_WAKA_URL}`,
      ],
    });
    note("A6", `id ${id} linked the HER WAKA programme site`);
  }
}

writeEventJson(FILE, data);
console.log(log.map((line) => `  ${line}`).join("\n"));
console.log(`\nWrote ${FILE}`);
