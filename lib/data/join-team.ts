import type { TabMedia, VolunteerPath } from "@/components/join-team/types";

// TEMPORARY (founder request, 2026-06-25): All three "join our team" applications
// (Ambassador, Event Volunteer, Ex-Ambassador) are routed to external Google Forms
// instead of the in-site forms under /join-our-team/apply*. The in-site forms, API,
// Slack service and DB schema are kept intact but made unreachable from the public site.
// To restore an in-site form, revert the "TEMPORARY ambassador" / "TEMPORARY join-our-team"
// blocks in:
//   - components/ui/pricing-section-with-comparison.tsx   (card buttons)
//   - app/(site)/join-our-team/apply/page.tsx             (volunteer + ambassador guard)
//   - app/(site)/join-our-team/apply/ex-ambassador/page.tsx (ex-ambassador guard)
// then these constants can be removed.
export const AMBASSADOR_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSdTEFjOs6lLHZDGpSvoMfkckloPBMbvFA45iNhVvh1sAsUZlA/viewform?usp=header";
export const VOLUNTEER_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSfQCjMOvfh7OVmBZg3T7eS70xhKkB_iSnlIpjv3xJ1i-EUTyg/viewform";
export const EX_AMBASSADOR_GOOGLE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLScTnj1TZrEQnPR-n9hsuXpEkjSD_CFiiJkiot_cHNubvZa5qw/viewform?usp=header";

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
  {
    id: "ex-ambassador",
    title: "Ex-Ambassador Feedback",
    commitment: "One-time - 5 minutes",
    image: "/img/gallery/about-5.jpg",
    imageAlt: "She Sharp alumni sharing experiences",
    description: "Were you a She Sharp Ambassador? Share your experience and help us improve. Your feedback is invaluable to our community.",
    highlights: [
      "Share your journey",
      "Help improve She Sharp",
      "Stay connected with alumni",
      "Get featured in our spotlight",
    ],
    responsibilities: [
      "Complete a short feedback survey",
      "Share what you valued most",
      "Provide suggestions for improvement",
      "Optionally stay connected as alumni",
    ],
    benefits: [
      "Be featured in our alumni spotlight",
      "Stay connected with the community",
      "Help shape future programmes",
      "Network with current ambassadors",
    ],
    applicationNote:
      "Open to all current and past She Sharp ambassadors.",
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
  {
    value: "ex-ambassador",
    label: "Ex-Ambassador",
    src: "/img/gallery/about-5.jpg",
    alt: "She Sharp alumni sharing experiences",
  },
];

export type StatItem = {
  iconName: "route" | "calendar" | "clock";
  text: string;
};

export const joinTeamStats: StatItem[] = [
  { iconName: "route", text: "3 Paths" },
  { iconName: "calendar", text: "Year-round" },
  { iconName: "clock", text: "Flexible Hours" },
];

export const joinTeamContent = {
  title: "Join the Sharpest Team",
  description:
    "Be part of a passionate community of volunteers and ambassadors working together to bridge the gender gap in STEM",
};

