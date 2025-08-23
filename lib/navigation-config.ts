import { LucideIcon, Calendar, Users, Briefcase, Heart, Mic, Mail, Camera, FileText, Award, BookOpen, Sparkles, HandHeart, Building2, FolderOpen, Bell } from "lucide-react";

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
  variant: "default" | "outline" | "ghost";
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
      title: "Programs",
      href: "/events",
      icon: Calendar,
      image: {
        src: "/img/mesh-954.png",
        alt: "Mentorship program in action",
        href: "/mentorship",
      },
      children: [
        {
          title: "All Events",
          href: "/events",
          description: "Explore our upcoming events and workshops",
          icon: Calendar,
        },
        {
          title: "Google Educator Conference",
          href: "/events/google-educator",
          description: "Annual education technology conference",
          icon: Award,
        },
        {
          title: "Mentorship Program",
          href: "/mentorship",
          description: "Connect with mentors and grow your career",
          icon: Users,
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
          title: "Become a Mentor",
          href: "/mentorship/mentors",
          description: "Share your expertise and guide others",
          icon: Award,
        },
        {
          title: "Join as Mentee",
          href: "/mentorship/mentee",
          description: "Apply to join our mentorship program",
          icon: BookOpen,
        },
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
        {
          title: "Resource Library",
          href: "/dashboard/resources",
          description: "Access learning materials and resources",
          icon: FolderOpen,
        },
      ],
    },
    {
      title: "Contact",
      href: "/contact",
      icon: Mail,
    },
    {
      title: "Support Us",
      href: "/donate",
      icon: HandHeart,
    },
  ],
  buttons: [],
};