// Global statistics data management — single source of truth for all pages
export const globalStats = {
  members: {
    current: 2200,
    label: "Members",
    description: "Active community members",
    growth: "+15% YoY",
  },
  sponsors: {
    current: 50,
    label: "Sponsors",
    description: "Corporate partners",
  },
  events: {
    total: 84,
    label: "Events",
    description: "Since 2014",
    yearly: 12,
  },
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

export const homeImpactData: ImpactItem[] = [
  {
    title: "Active Members",
    value: `${globalStats.members.current}+`,
    desc: "Women in tech building connections and advancing careers.",
    icon: "/icons/members.svg",
  },
  {
    title: "Events Since 2014",
    value: `${globalStats.events.total}+`,
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
    summary: {
      upcoming: 12,
      thisYear: globalStats.events.yearly,
      totalAttendees: 3500,
      locations: 4,
    },
  },
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