import React from "react";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Timeline } from "@/components/ui/timeline";
import { TimelineYearPhotos } from "@/components/about/timeline-year-photos";
import { getTimelineYear } from "@/lib/data/timeline-years";

/**
 * The /about timeline — twelve years, one entry each.
 *
 * SERVER COMPONENT, and it has to stay one: `getTimelineYear()` reaches into
 * `lib/data/events`, which value-imports the whole event archive. `/about` was
 * a client page until this section grew photographs; see
 * `components/layout/scroll-to-hash.tsx` for why it no longer is.
 *
 * The prose is hand-written because a year's significance is not derivable from
 * the register, but every fact in it comes from the register or from
 * `docs/development/CONTENT_RULES.md`. Two traps already walked into once each:
 * `attendees` holds REGISTRATIONS rather than attendance, so the copy says so;
 * and the founding year (2014) and the charity registration (2019) are
 * different things.
 */

interface TimelineEntryData {
  year: number;
  eventTitle: string;
  description: string;
  highlights: string[];
}

const TimelineEntryContent = ({
  year,
  eventTitle,
  description,
  highlights,
}: TimelineEntryData) => {
  const { photos, albumCount } = getTimelineYear(year);

  return (
    <div>
      <TimelineYearPhotos year={year} photos={photos} albumCount={albumCount} />
      <p className="mb-4 text-lg font-semibold text-foreground md:text-xl">
        {eventTitle}
      </p>
      <p className="mb-8 text-sm text-ink-600 md:text-base">{description}</p>
      {highlights.length > 0 && (
        <ul className="mb-8 space-y-2">
          {highlights.map((highlight, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-ink-700 md:text-base"
            >
              <span
                aria-hidden="true"
                className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand"
              />
              {highlight}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const timelineData: TimelineEntryData[] = [
  {
    year: 2014,
    eventTitle: "She# Launch Event",
    description:
      "She Sharp was founded with a mission to bridge the gender gap in STEM fields. Our inaugural launch event with Orion Health marked the beginning of a movement to create a supportive community for women in technology across New Zealand.",
    highlights: ["Partnership with Orion Health", "Auckland launch"],
  },
  {
    year: 2015,
    eventTitle: "Wellington Launch with Xero",
    description:
      "Expanded our reach beyond Auckland with the Wellington launch, partnering with Xero to bring She Sharp's mission to the capital city. This expansion marked our commitment to supporting women in tech nationwide.",
    highlights: ["Partnership with Xero", "First regional expansion"],
  },
  {
    year: 2016,
    eventTitle: "First 100-Attendee Event with Google",
    description:
      "A major milestone as we hosted our first event reaching 100 attendees, in partnership with Google. This growth demonstrated the strong demand for community and support among women in New Zealand's tech sector.",
    highlights: ["Partnership with Google", "100 attendees milestone"],
  },
  {
    year: 2017,
    eventTitle: "Auckland Tech Grand Tour",
    description:
      "An ambitious 6.5-hour tour showcasing some of New Zealand's biggest tech companies. Participants got exclusive behind-the-scenes access to leading organisations, gaining insights into diverse career paths and company cultures in the tech industry.",
    highlights: [
      "6.5 hours of exclusive access",
      "Multiple top tech companies",
      "Behind-the-scenes experience",
    ],
  },
  {
    year: 2018,
    eventTitle: "Six Events, Six Host Companies",
    description:
      "A year spent inside the industry rather than talking about it. Every event was hosted by a different organisation, from a design thinking workshop with Air New Zealand in February to an evening at Nyriad in July — each one putting members in a real workplace with the people who work there.",
    highlights: [
      "Design Thinking with Air New Zealand",
      "Google Codelab — 50 registrations",
      "Vend, TechWeek, GridAKL with Xero, and Nyriad",
    ],
  },
  {
    year: 2019,
    eventTitle: "Registered as a Charity",
    description:
      "She Sharp was entered on the New Zealand Charities Register as CC57025 on 4 June 2019, five years after the first launch event. The programme carried on around it: five evenings hosted by Deloitte, Workday, Amazon Web Services, Wāhine Kākano and Centrality.",
    highlights: [
      "Registered charity CC57025",
      "First event with Amazon Web Services",
      "Wāhine Kākano — kaupapa Māori partnership",
    ],
  },
  {
    year: 2020,
    eventTitle: "Going Virtual During COVID-19",
    description:
      "Adapted to the global pandemic by pivoting to virtual events, dramatically expanding our reach and accessibility. Despite the challenges, we hosted 12 events throughout the year—10 of which were online—keeping our community connected and engaged.",
    highlights: [
      "12 events during COVID year",
      "10 online events",
      "Community stayed connected",
    ],
  },
  {
    year: 2021,
    eventTitle: "Eight Events, Half of Them Online",
    description:
      "The busiest year to that point, and the one that proved the hybrid model worked. Eight events ran between March and November — four in a room, four on a screen — spanning trades, gaming, AI for social good, and data and analytics.",
    highlights: [
      "International Women's Day with MYOB — 76 registrations",
      "Women in AI for Social Good with AUT",
      "#IAmRemarkable with Google — 61 registrations",
    ],
  },
  {
    year: 2022,
    eventTitle: "First Female-Led Hackathon",
    description:
      "Made history by hosting New Zealand's first female-led hackathon, creating a space where women could lead, innovate, and showcase their technical skills. This groundbreaking event set a new standard for inclusive tech events in the country.",
    highlights: [
      "First female-led hackathon in NZ",
      "Women-led innovation",
      "Technical skills showcase",
    ],
  },
  {
    year: 2023,
    eventTitle: "Expanding Horizons",
    description:
      'A transformative year with multiple landmark initiatives. Partnered with Google for an Educator Conference, launched "Inspire Her" to empower Māori and Pasifika school students, and expanded to Hamilton with HCLTech—bringing She Sharp\'s mission to more communities than ever.',
    highlights: [
      "Google Educator Conference",
      "Inspire Her: Māori & Pasifika students",
      "Hamilton launch with HCLTech",
    ],
  },
  {
    year: 2024,
    eventTitle: "A Decade of Impact",
    description:
      "Celebrating 10 years of bridging the gender gap in STEM. Hosted another successful hackathon with Fisher & Paykel Healthcare and launched our flagship mentoring programme—connecting aspiring women in tech with experienced industry professionals.",
    highlights: [
      "Hackathon with F&P Healthcare",
      "Mentoring programme launched",
      "10 years of impact",
    ],
  },
  {
    year: 2025,
    eventTitle: "Building Momentum",
    description:
      "An incredible year of growth with 6 major events reaching over 500 registered attendees from 135 unique companies. From celebrating International Women's Day at AcademyEX to hosting AI Hackathon Festival with AI Forum NZ—each event strengthened our community and advanced our mission.",
    highlights: [
      "March: AcademyEX — International Women's Day",
      "April: #IAmRemarkable Workshop",
      "May: MYOB — Tech That Matches Your Vibe",
      "July: HPE — THRIVE: Your Career, Your Story",
      "August: AI Forum — AI Hackathon Festival",
      "September: Fonterra — Business & Tech Transformation",
    ],
  },
  {
    year: 2026,
    eventTitle: "The Fullest Year on Record",
    description:
      "Thirteen events scheduled — more than any year before it — with 680 registrations across the eleven held between March and August. The Aotearoa AI Hackathon Festival filled AUT City Campus alongside AI Forum NZ, the Her Waka series ran every month from March, and the Youth Tech Series took She Sharp into a primary school for the first time.",
    highlights: [
      "August: Aotearoa AI Hackathon Festival at AUT — 125 registrations",
      "June: Youth Tech Series launched with Peyvand Academy and the Ministry of Education",
      "March–June: Her Waka, every month",
      "Still to come: Les Mills in September, Code Secure in October",
    ],
  },
];

const transformTimelineData = (
  data: TimelineEntryData[]
): Array<{ title: string; content: React.ReactNode }> =>
  data.map((entry) => ({
    title: String(entry.year),
    content: <TimelineEntryContent {...entry} />,
  }));

export function TimelineSection() {
  return (
    <Section noPadding className="bg-white">
      <Container size="full">
        <div className="px-4 pt-16 md:pt-24">
          <p className="text-label mb-4 text-brand">Twelve years of impact</p>
          <h2 className="text-display-sm text-left text-foreground">
            A deep dive into our journey
          </h2>
          <p className="mt-4 max-w-2xl text-left text-sm leading-relaxed text-ink-600 sm:mt-6 md:text-base lg:text-lg">
            From a small launch event in 2014 to a thriving community of 3500+
            members across New Zealand — one year, and one room full of people,
            at a time.
          </p>
        </div>
        <Timeline data={transformTimelineData(timelineData)} />
      </Container>
    </Section>
  );
}
