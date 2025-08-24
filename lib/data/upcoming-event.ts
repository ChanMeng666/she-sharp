export interface UpcomingEventContent {
  title: string;
  date: string;
  time: string;
  location: string;
  image: string;
  description: string;
  href: string;
}

export const upcomingEventDefault: UpcomingEventContent = {
  title: "THRIVE: Your Career, Your Story",
  date: "March 15, 2025",
  time: "6:00 PM - 8:30 PM",
  location: "Auckland CBD",
  image:
    "https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg",
  description:
    "An evening of inspiring stories and career insights from women leaders in tech.",
  href: "/events/thrive-your-career-your-story",
};


