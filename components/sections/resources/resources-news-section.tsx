"use client";

import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import TimeLine_01, { TimeLine_01Entry } from "@/components/ui/release-time-line";
import { Trophy, Calendar, Mic, Newspaper } from "lucide-react";

const NEWS_ENTRIES: TimeLine_01Entry[] = [
  {
    icon: Trophy,
    title: "2024 New Zealand Community of the Year Semi-Finalists",
    subtitle: "January 2024",
    description:
      "She Sharp is proud to announce that our Founder/Director Mahsa McCauley was named as a Semi-Finalist in the New Zealand Community of the year.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a49c11fa8bb9093855aebd_nzcommunityAward.png",
    items: [
      "Recognition for bridging the gender gap in STEM fields across New Zealand",
      "Celebrates organizations making significant community contributions",
      "Sustained commitment to positive change through innovative programs",
    ],
  },
  {
    icon: Trophy,
    title: "Women in Security Award 2023",
    subtitle: "November 2023",
    description:
      "SheSharp is proud to announce that our Founder/Director Mahsa McCauley was named as the Unsung Heroes at the 2023 Women in Security Awards!",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65bb25d48049d4f4ebdd3094_IMG_1468.jpg",
    items: [
      "Outstanding contributions to cybersecurity and technology security",
      "Recognition as an Unsung Hero in the industry",
      "Creating pathways for women in tech security roles",
    ],
  },
  {
    icon: Trophy,
    title: "Finalists of Diversity Awards NZ",
    subtitle: "August 2023",
    description:
      "She Sharp is proud to announce that our Founder/Director Mahsa McCauley, PhD was named as a Finalist of Diversity Awards NZ.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/65a49c7147224ebbb474faaa_Diversity%20Award.png",
    items: [
      "Commitment to creating inclusive technology spaces",
      "Championing diversity and inclusion across New Zealand",
      "Testament to She Sharp's impact in the tech community",
    ],
  },
  {
    icon: Trophy,
    title: "Finalist in the Women Leading Tech Awards",
    subtitle: "March 2023",
    description:
      "She Sharp is proud to announce that our Founder/Director Mahsa McCauley, PhD was named as a Finalist in the Women Leading Tech Awards in the Mentor category.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938f0ed0bd98ba0f7a1c90_finalist-metor.png",
    items: [
      "Recognition for exceptional contributions to the technology sector",
      "Nominated in the Mentor category",
      "Dedication to guiding the next generation of women in tech",
    ],
  },
  {
    icon: Trophy,
    title: "NZ Women in Security Awards",
    subtitle: "November 2022",
    description:
      'She Sharp won in the "Best Industry Initiative that Supports Diversity, Inclusion and Equality" at the NZ Women in Security Awards 2022.',
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938e649e000b0c78a541b4_Image%204_3.png",
    items: [
      "Prestigious award for innovative programs and initiatives",
      "Successfully promoted diversity, inclusion, and equality",
      "Recognition for mentorship programs and community events",
    ],
  },
  {
    icon: Mic,
    title: "Featured in TechWomen NZ Magazine",
    subtitle: "September 2023",
    description:
      "She Sharp's mentorship program was featured in a 4-page spread discussing the impact of structured mentorship in tech careers.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938ce7a663b5f88ba36ea3_Press%20Tile%201_2021.png",
    items: [
      "Innovative approach to mentorship highlighted",
      "Success stories from mentees and mentors featured",
      "How structured programs accelerate career growth",
    ],
  },
  {
    icon: Mic,
    title: "She Sharp Anniversary Coverage on National Radio",
    subtitle: "October 2024",
    description:
      "National Radio featured She Sharp's 10-year anniversary, discussing our journey and impact on women in tech.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/649cb3689f78cd4c6f728bc6_Diversity%20Awards%20photo-min.jpg",
    items: [
      "Special segment celebrating 10-year milestone",
      "Interview with Mahsa McCauley about She Sharp's evolution",
      "Reached over 500,000 listeners nationwide",
    ],
  },
  {
    icon: Calendar,
    title: "THRIVE Conference Success Story",
    subtitle: "July 2024",
    description:
      "She Sharp's THRIVE conference brought together 500+ attendees for a day of inspiration, learning, and networking.",
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64938e649e000b0c78a541b4_Image%204_3.png",
    items: [
      "Largest event to date with 500+ attendees",
      "Keynote speakers from leading tech companies",
      "Hands-on workshops and networking opportunities",
    ],
  },
];

export function ResourcesNewsSection() {
  return (
    <Section id="news" className="bg-transparent py-16 md:py-24">
      <Container size="content">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-dark/10 rounded-lg">
              <Newspaper className="h-6 w-6 text-purple-dark" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold">News & Press</h2>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Celebrating milestones and recognition for our commitment to
            empowering women in technology.
          </p>
        </div>
      </Container>
      <TimeLine_01
        title="Our Journey & Achievements"
        description=""
        entries={NEWS_ENTRIES}
        className="py-8"
      />
    </Section>
  );
}
