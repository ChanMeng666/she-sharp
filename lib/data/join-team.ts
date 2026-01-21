import type { TabMedia } from "@/components/ui/feature-showcase";

export interface VolunteerPath {
  id: string;
  title: string;
  commitment: string;
  highlights: string[];
  responsibilities: string[];
  benefits: string[];
  applicationNote: string;
}

export const volunteerPaths: VolunteerPath[] = [
  {
    id: "events",
    title: "Event Volunteer",
    commitment: "Flexible - 4-6 times per year",
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
    src: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/join-our-team-volunteer.jpg",
    alt: "She Sharp volunteers at event setup",
  },
  {
    value: "ambassador",
    label: "Ambassador",
    src: "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/public/img/join-our-team-ambassador.jpg",
    alt: "She Sharp ambassadors team meeting",
  },
];

export const joinTeamStats = ["2 Paths", "Year-round", "Flexible Hours"];

export const joinTeamContent = {
  eyebrow: "Make a Difference",
  title: "Join the Sharpest Team",
  description:
    "Be part of a passionate community of volunteers and ambassadors working together to bridge the gender gap in STEM",
};

