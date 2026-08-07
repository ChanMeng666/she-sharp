/**
 * Expos, school visits and competitions She Sharp turned up to — as a guest,
 * an exhibitor or a competitor rather than the host.
 *
 * These are deliberately NOT in the event data. Two reasons, and the second is
 * the important one:
 *
 * 1. She Sharp did not run them, so there is no run sheet, no speaker list and
 *    no registration page — most of the event schema would be empty.
 * 2. **The organisation has never counted heads at a booth.** Forcing these
 *    into a model built around `attendees` and `checkedIn` would leave every
 *    record looking like it was missing data, when in fact the number was
 *    never taken and never will be. Where a real, recorded outcome exists it
 *    is in `outcome` below; where it does not, the field is absent rather than
 *    filled with a guess.
 *
 * Everything here comes from the organisation's own records. One appearance is
 * deliberately missing — a September 2024 careers expo where the booth was
 * confirmed but two rounds of volunteer recruitment drew nobody, and no record
 * says whether anyone went. Listing an appearance nobody can confirm would be
 * worse than the gap.
 */

export interface CommunityAppearance {
  /** Sort key and heading. ISO date of the first day. */
  date: string;
  /** Display date, written the way a person would say it. */
  dateLabel: string;
  name: string;
  venue: string;
  /** What She Sharp was there to do. One sentence. */
  what: string;
  /** Who it was for, when the audience was specific. */
  audience?: string;
  /** A recorded outcome. Only present when one exists — never estimated. */
  outcome?: string;
  /** Public photo album, when there is one. */
  galleryUrl?: string;
}

export const communityAppearances: CommunityAppearance[] = [
  {
    date: "2021-04-11",
    dateLabel: "11 April 2021",
    name: "MOTAT STEM Fair",
    venue: "MOTAT, Auckland",
    what: "A hands-on stall running Coding Duo, Neuron and Sphero Edu, with robots and a beanbag corner for anyone who wanted to sit down and try something.",
    outcome: "Fourteen people joined the newsletter on the day.",
    galleryUrl: "https://photos.app.goo.gl/t1Upny1zFhwTM2tn9",
  },
  {
    date: "2021-07-01",
    dateLabel: "1 July 2021",
    name: "Northwest Schools Expo",
    venue: "Kumeū Showgrounds, Auckland",
    what: "One of around fifty exhibitor stalls, running colouring, Merge Cube augmented reality, robots, a tappy piano and Osmo tangrams.",
    audience: "Year 7–9 students",
  },
  {
    date: "2021-07-17",
    dateLabel: "17 July 2021",
    name: "STEMtastic, with Girl Guiding New Zealand and AUT",
    venue: "AUT, Auckland",
    what: "Four workshops running twice each across the afternoon — App Inventor, Makey Makey, Merge Cube and Sphero robots — each led by a She Sharp volunteer.",
    audience: "Girl Guiding New Zealand members",
  },
  {
    date: "2021-08-17",
    dateLabel: "17 August 2021",
    name: "Rangitoto College",
    venue: "Rangitoto College, Auckland",
    what: "A careers panel for students, in twenty-minute rotations. The country went into level 4 lockdown the same evening.",
    audience: "Secondary students",
  },
  {
    date: "2022-06-29",
    dateLabel: "29–30 June 2022",
    name: "Tech22 at Wynyard Quarter",
    venue: "GridAKL, John Lysaght Building, Auckland",
    what: "Two days of hands-on stations — large Sphero robots on a floor mat, Merge Cube, Osmo, augmented-reality colouring and Raspberry Pi kits.",
    audience: "Year 11–13 students",
  },
  {
    date: "2022-10-30",
    dateLabel: "30 October 2022",
    name: "MOTAT Expo",
    venue: "MOTAT, Auckland",
    what: "A returning exhibitor stall across the day.",
  },
  {
    date: "2024-06-07",
    dateLabel: "7–9 June 2024",
    name: "Startup Weekend Auckland",
    venue: "GridAKL, Lysaght Building, Auckland",
    what: "She Sharp entered a team of six and built ConnectMent, a tool for matching mentors and mentees at an event from a QR scan and a LinkedIn profile. It did not place — the team said it was worth it anyway.",
  },
  {
    date: "2024-09-06",
    dateLabel: "6 September 2024",
    name: "Tech24: Connecting Ākonga and the Tech Sector",
    venue: "MOTAT, Auckland",
    what: "An exhibitor at the Ministry of Education, MOTAT and Tātaki Auckland Unlimited schools day, across a morning and an afternoon session.",
    audience: "Around 300 Year 9–13 students",
  },
  {
    date: "2024-09-17",
    dateLabel: "17 September 2024",
    name: "Summer of Tech Meet & Greet",
    venue: "Viaduct Events Centre, Auckland",
    what: "A stand in the Community Zone at the annual student and employer evening.",
    audience: "Students looking for internships",
  },
  {
    date: "2025-09-16",
    dateLabel: "16 September 2025",
    name: "Summer of Tech Meet & Greet",
    venue: "The Cloud, Auckland waterfront",
    what: "Back again the following year, this time on the waterfront.",
    audience: "500+ students and graduates expected",
  },
];

/** Most recent first — the order the page reads in. */
export function getCommunityAppearances(): CommunityAppearance[] {
  return [...communityAppearances].sort((a, b) => b.date.localeCompare(a.date));
}
