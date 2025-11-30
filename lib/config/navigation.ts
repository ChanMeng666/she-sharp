import { LucideIcon, Calendar, Users, Briefcase, Heart, Mic, Mail, Camera, FileText, Award, BookOpen, Sparkles, HandHeart, Building2, FolderOpen, Bell, GraduationCap, UserPlus } from "lucide-react";

export interface NavigationItem {
  title: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
  children?: NavigationItem[];
  image?: {
    src: string;
    alt: string;
    href: string;
  };
}

export interface NavigationButton {
  title: string;
  href: string;
  variant:
    | "default"
    | "secondary"
    | "accent"
    | "navy"
    | "glass"
    | "gradient"
    | "glassmorphism"
    | "neumorphism"
    | "outline"
    | "outline-thick"
    | "outline-dashed"
    | "outline-gradient"
    | "ghost"
    | "link"
    | "minimal"
    | "text"
    | "black"
    | "white"
    | "dark"
    | "light"
    | "success"
    | "warning"
    | "danger"
    | "info"
    | "destructive";
}

export const navigationConfig: {
  items: NavigationItem[];
  buttons: NavigationButton[];
} = {
  items: [
    {
      title: "About",
      href: "/about",
      icon: Users,
      image: {
        src: "/img/mesh-570.png",
        alt: "Our team at She Sharp",
        href: "/about#team",
      },
      children: [
        {
          title: "Our Mission",
          href: "/about",
          description: "Learn about our mission and values",
          icon: Heart,
        },
        {
          title: "Meet the Team",
          href: "/about#team",
          description: "Get to know our dedicated team",
          icon: Users,
        },
        {
          title: "Impact Report",
          href: "/media/impact-report",
          description: "Our annual achievements and impact",
          icon: FileText,
        },
      ],
    },
    {
      title: "Mentorship",
      href: "/mentorship",
      icon: GraduationCap,
      image: {
        src: "/img/mesh-954.png",
        alt: "Mentorship program in action",
        href: "/mentorship",
      },
      children: [
        {
          title: "About the Program",
          href: "/mentorship",
          description: "Learn about our mentorship program",
          icon: BookOpen,
        },
        {
          title: "Become a Mentee",
          href: "/mentorship/join",
          description: "Join the program and get matched with a mentor",
          icon: GraduationCap,
        },
        {
          title: "Become a Mentor",
          href: "/mentorship/become-a-mentor",
          description: "Apply to share your expertise and guide others",
          icon: Award,
        },
        {
          title: "Meet Our Mentors",
          href: "/mentorship/mentors",
          description: "Browse our experienced mentor community",
          icon: Users,
        },
      ],
    },
    {
      title: "Events",
      href: "/events",
      icon: Calendar,
      image: {
        src: "/img/mesh-152.png",
        alt: "She Sharp Events",
        href: "/events",
      },
      children: [
        {
          title: "All Events",
          href: "/events",
          description: "Explore our upcoming events and workshops",
          icon: Calendar,
        },
        {
          title: "THRIVE: Your Career, Your Story",
          href: "/events/thrive-your-career-your-story-2025",
          description: "Inspiring career stories from women leaders",
          icon: Sparkles,
        },
        {
          title: "Google Educator Conference",
          href: "/events/google-educator-conference-2024",
          description: "Annual education technology conference",
          icon: Award,
        },
      ],
    },
    {
      title: "Get Involved",
      href: "/join-our-team",
      icon: HandHeart,
      image: {
        src: "/img/mesh-152.png",
        alt: "Join our volunteer team",
        href: "/join-our-team",
      },
      children: [
        {
          title: "Volunteer with Us",
          href: "/join-our-team",
          description: "Join our team and make a difference",
          icon: Heart,
        },
        {
          title: "Corporate Partnership",
          href: "/sponsors/corporate-sponsorship",
          description: "Partner with us to support women in STEM",
          icon: Building2,
        },
        {
          title: "Donate",
          href: "/donate",
          description: "Support our mission with a donation",
          icon: HandHeart,
        },
      ],
    },
    {
      title: "Resources",
      href: "/media",
      icon: BookOpen,
      image: {
        src: "/img/mesh-437.png",
        alt: "She Sharp Podcast",
        href: "/media/podcasts",
      },
      children: [
        {
          title: "Podcasts",
          href: "/media/podcasts",
          description: "Listen to inspiring women in tech stories",
          icon: Mic,
        },
        {
          title: "Newsletters",
          href: "/media/newsletters",
          description: "Subscribe to our monthly newsletter",
          icon: Mail,
        },
        {
          title: "Photo Gallery",
          href: "/media/photo-gallery",
          description: "Event highlights and memorable moments",
          icon: Camera,
        },
        {
          title: "In the Press",
          href: "/media/news-and-press",
          description: "Media coverage and press releases",
          icon: FileText,
        },
      ],
    },
    {
      title: "Contact",
      href: "/contact",
      icon: Mail,
    },
  ],
  buttons: [
    {
      title: "Join Program",
      href: "/mentorship/join",
      variant: "default",
    },
  ],
};
