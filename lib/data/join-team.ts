import type { TabMedia, VolunteerPath } from "@/components/join-team/types";

export const volunteerPaths: VolunteerPath[] = [
  {
    id: "volunteer",
    title: "Event Volunteer",
    commitment: "Flexible - 4-6 times per year",
    image: "/img/gallery/about-4.jpg",
    imageAlt: "She Sharp volunteers at event setup",
    description: "Perfect for those with busy schedules who want to make a difference. Choose events that interest you and network with industry professionals.",
    highlights: [
      "Perfect for busy schedules",
      "Choose events that interest you",
      "Network with industry professionals",
      "No weekly commitment required",
    ],
    responsibilities: [
      "Help with event setup and registration",
      "Welcome and guide attendees",
      "Support speakers and panellists",
      "Represent She Sharp at conferences",
      "Assist with photography and social media",
    ],
    benefits: [
      "Free entry to all She Sharp events",
      "Networking opportunities",
      "Certificate of volunteer service",
      "Professional development workshops",
    ],
    applicationNote:
      "Applications open year-round. Join us for our next event!",
  },
  {
    id: "ambassador",
    title: "She Sharp Ambassador",
    commitment: "Regular - Weekly involvement",
    image: "/img/gallery/about-5.jpg",
    imageAlt: "She Sharp ambassadors team meeting",
    description: "Shape She Sharp's future and lead meaningful projects. Build lasting connections while developing your leadership skills.",
    highlights: [
      "Shape She Sharp's future",
      "Lead meaningful projects",
      "Build lasting connections",
      "Develop leadership skills",
    ],
    responsibilities: [
      "Attend fortnightly team meetings",
      "Lead event planning and execution",
      "Manage sponsor relationships",
      "Create content for social media",
      "Mentor new volunteers",
    ],
    benefits: [
      "Leadership development opportunities",
      "Direct impact on She Sharp's strategy",
      "Strong professional network",
      "Resume and LinkedIn recommendations",
    ],
    applicationNote:
      "Applications open in February each year. Register your interest below.",
  },
];

export const volunteerImages: TabMedia[] = [
  {
    value: "volunteer",
    label: "Event Volunteer",
    src: "/img/gallery/about-4.jpg",
    alt: "She Sharp volunteers at event setup",
  },
  {
    value: "ambassador",
    label: "Ambassador",
    src: "/img/gallery/about-5.jpg",
    alt: "She Sharp ambassadors team meeting",
  },
];

export type StatItem = {
  iconName: "route" | "calendar" | "clock";
  text: string;
};

export const joinTeamStats: StatItem[] = [
  { iconName: "route", text: "2 Paths" },
  { iconName: "calendar", text: "Year-round" },
  { iconName: "clock", text: "Flexible Hours" },
];

export const joinTeamContent = {
  title: "Join the Sharpest Team",
  description:
    "Be part of a passionate community of volunteers and ambassadors working together to bridge the gender gap in STEM",
};

