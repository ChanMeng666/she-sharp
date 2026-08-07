// Global statistics data management — single source of truth for all pages
//
// PROVENANCE
// ==========
// Every figure below is tagged with where it came from. The tags are for
// whoever maintains this file; none of them reach the browser.
//
//   SOURCED    — traceable to a record: the event register, a Humanitix
//                export, or a dated figure in the organisation's own archive.
//   UNSOURCED  — no record anywhere. It is presentational copy. Keeping it is
//                a deliberate call by the maintainers; the tag exists so the
//                next person does not mistake it for measured data.
//
// The distinction matters most when a number leaves this website. Marketing
// copy on our own pages is one thing; the same figure quoted in a funding
// application, a sponsorship deck or an impact report is a claim to a third
// party who may rely on it. Do not lift an UNSOURCED number into any of those
// without finding a source for it first.
//
// A 2026 stock-take of the organisation's Slack archive found three mutually
// contradictory sets of headline numbers issued within a fortnight of each
// other — including a longer time span reporting *fewer* members than a
// shorter one. That is why this convention exists.
import { getEventsHeldCount } from "./events";

export const globalStats = {
  members: {
    // UNSOURCED as an exact figure. The archive carries 3,673+ and 3,767+ from
    // the same fortnight in 2026 (the second covering a shorter period, so the
    // two cannot both be right), and the founder separately put it "over
    // 3,000". 3,500 sits inside that range.
    current: 3500,
    label: "Members",
    description: "Active community members",
    growth: "+15% YoY", // UNSOURCED — no year-on-year series exists.
  },
  sponsors: {
    // UNSOURCED. The archive's own counts are 33+ and 23 industry partners;
    // the cumulative logo wall in ./sponsors.ts holds 39 organisations.
    current: 50,
    label: "Sponsors",
    description: "Corporate partners",
  },
  events: {
    // SOURCED — derived from the event register, not hand-typed. See
    // getEventsHeldCount().
    total: getEventsHeldCount(),
    label: "Events",
    description: "Since 2014",
    yearly: 12, // UNSOURCED — 2025 actually ran 7 events, 2022 ran 7–9.
  },
  // UNSOURCED, all of it, and this is the block to be most careful with: it
  // renders on /mentorship. The programme's own registers for the 2026 cycle
  // record 23 mentors and 9 mentees registered, with 0 active pairings at the
  // time of the stock-take. No survey producing a success rate or a promotion
  // multiple has ever been run.
  mentorship: {
    mentors: 120,
    mentees: 350,
    successRate: 85,
    promotionRate: {
      mentors: 6, // 6x more likely
      mentees: 5, // 5x more likely
    },
    skillImprovement: 90, // 90% report skill improvement
  },
  // UNSOURCED. `workshopAttendees` is the closest to defensible — "5,000+
  // women empowered" was the 10th-anniversary line — but note it is a
  // different metric from `members.current` and the two must never be
  // presented as the same thing. `careerTransitions` renders on the homepage
  // as "Career Success Stories"; nothing tracks career outcomes.
  impact: {
    workshopAttendees: 5000,
    careerTransitions: 500,
    salaryIncrease: 23, // average % increase
  },
};

export type ImpactItem = {
  title: string;
  value: string;
  desc: string;
  icon: string;
};

/**
 * Build the homepage impact tiles for a given held-event count.
 *
 * The count is a parameter rather than a module-level read so a server
 * component can compute it once and hand the same value to the client tiles —
 * server and browser sit in different timezones, and letting each derive the
 * count independently would flip it by one for a ~12-hour window around any
 * event date and trip a hydration mismatch.
 */
export function buildHomeImpactData(eventsHeld: number): ImpactItem[] {
  return [
    {
      title: "Active Members",
      value: `${globalStats.members.current}+`,
      desc: "Women in tech building connections and advancing careers.",
      icon: "/icons/members.svg",
    },
    {
      title: "Events Since 2014",
      value: `${eventsHeld}+`,
      desc: "Workshops and conferences empowering women in tech.",
      icon: "/icons/events.svg",
    },
    {
      title: "Partner Companies",
      value: `${globalStats.sponsors.current}+`,
      desc: "Leading tech companies supporting our mission.",
      icon: "/icons/parnership.svg",
    },
    {
      title: "Career Success Stories",
      value: `${globalStats.impact.careerTransitions}+`,
      desc: "Women advancing careers through mentorship and networking.",
      icon: "/icons/success.svg",
    },
  ];
}

export const homeImpactData: ImpactItem[] = buildHomeImpactData(
  globalStats.events.total
);

// Page-specific stats configurations
export const pageStats = {
  home: {
    primary: [
      {
        value: globalStats.members.current,
        label: "Members Strong",
        suffix: "+",
      },
      {
        value: globalStats.sponsors.current,
        label: "Corporate Partners",
        suffix: "+",
      },
      {
        value: globalStats.events.total,
        label: "Events Since 2014",
        suffix: "+",
      },
    ],
  },
  about: {
    // UNSOURCED — the whole timeline and milestone list. No membership series
    // exists for any year before 2022, and "Global Expansion" in 2024 does not
    // correspond to anything the organisation did. The real 2024 milestone was
    // the 10th anniversary event.
    timeline: [
      { year: 2014, members: 50, events: 2 },
      { year: 2016, members: 200, events: 8 },
      { year: 2018, members: 500, events: 15 },
      { year: 2020, members: 700, events: 20 },
      { year: 2022, members: 800, events: 25 },
      { year: 2024, members: 1000, events: 30 },
    ],
    milestones: [
      { year: 2014, event: "She Sharp Founded" },
      { year: 2016, event: "First THRIVE Conference" },
      { year: 2018, event: "Mentorship Programme Launched" },
      { year: 2020, event: "Virtual Events Platform" },
      { year: 2022, event: "1000 Members Milestone" },
      { year: 2024, event: "Global Expansion" },
    ],
  },
  mentorship: {
    overview: [
      {
        value: globalStats.mentorship.mentors,
        label: "Active Mentors",
        icon: "Users",
      },
      {
        value: globalStats.mentorship.mentees,
        label: "Programme Participants",
        icon: "GraduationCap",
      },
      {
        value: globalStats.mentorship.successRate,
        label: "Success Rate",
        suffix: "%",
        icon: "TrendingUp",
      },
    ],
    outcomes: [
      {
        percentage: `${globalStats.mentorship.successRate}%`,
        description: "Feel more empowered after joining",
        detail: "Based on annual programme survey",
      },
      {
        percentage: `${globalStats.mentorship.skillImprovement}%`,
        description: "Report improved interpersonal skills",
        detail: "Including communication and leadership",
      },
      {
        percentage: `${globalStats.mentorship.promotionRate.mentors}x more`,
        description: "Mentors likely to be promoted",
        detail: "Compared to non-participants",
      },
      {
        percentage: `${globalStats.mentorship.promotionRate.mentees}x more`,
        description: "Mentees likely to be promoted",
        detail: "Within 2 years of programme completion",
      },
    ],
  },
  events: {
    // UNSOURCED. `upcoming` is a literal rather than a count of the register,
    // so it cannot be right for long; getUpcomingEvents().length is the real
    // number if anything ever renders this.
    summary: {
      upcoming: 12,
      thisYear: globalStats.events.yearly,
      totalAttendees: 3500,
      locations: 4,
    },
  },
  // UNSOURCED — the donation tiers describe what a gift buys, and nothing in
  // the organisation's records costs a workshop kit, a student place or a
  // mentorship pairing. Treat as illustrative copy, not a costing.
  donate: {
    impact: [
      {
        amount: "$50",
        impact: "Provides workshop materials for 5 students",
      },
      {
        amount: "$100",
        impact: "Sponsors a student to attend a full-day event",
      },
      {
        amount: "$500",
        impact: "Funds a mentorship pair for 6 months",
      },
      {
        amount: "$1000",
        impact: "Supports a coding bootcamp for 10 students",
      },
    ],
  },
};