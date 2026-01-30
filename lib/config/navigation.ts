import {
  LucideIcon,
  Calendar,
  Users,
  Award,
  BookOpen,
  HandHeart,
  Building2,
  GraduationCap,
  Sparkles,
  Library,
  UserPlus,
  FileText,
  Mic,
  Images,
  Mail,
  ChartGantt,
  UsersRound,
} from "lucide-react";

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
  variant: "default" | "outline" | "brand";
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
        src: "/img/mesh-954.png",
        alt: "About She Sharp",
        href: "/about",
      },
      children: [
        {
          title: "Our History",
          href: "/about#timeline",
          description: "A deep dive into our journey since 2014",
          icon: ChartGantt,
        },
        {
          title: "Our People",
          href: "/about#team",
          description: "Meet the team behind She Sharp",
          icon: UsersRound,
        },
      ],
    },
    {
      title: "Mentorship",
      href: "/mentorship",
      icon: GraduationCap,
      image: {
        src: "/img/mesh-954.png",
        alt: "Meet Our Mentors",
        href: "/mentorship#mentors-list",
      },
      children: [
        {
          title: "About the Programme",
          href: "/mentorship",
          description: "Learn about our mentorship programme",
          icon: BookOpen,
        },
        {
          title: "Become a Mentee",
          href: "/mentorship/join",
          description: "Join the programme and get matched with a mentor",
          icon: Sparkles,
        },
        {
          title: "Become a Mentor",
          href: "/mentorship/become-a-mentor",
          description: "Apply to share your expertise and guide others",
          icon: Award,
        },
      ],
    },
    {
      title: "Events",
      href: "/events",
      icon: Calendar,
    },
    {
      title: "Get Involved",
      href: "/join-our-team",
      icon: HandHeart,
      image: {
        src: "/img/mesh-152.png",
        alt: "Donate",
        href: "/donate",
      },
      children: [
        {
          title: "Volunteer with Us",
          href: "/join-our-team",
          description: "Join our team and make a difference",
          icon: UserPlus,
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
      href: "/resources",
      icon: Library,
      image: {
        src: "/img/mesh-152.png",
        alt: "Resource Library",
        href: "/resources",
      },
      children: [
        {
          title: "Photo Gallery",
          href: "/resources/photo-gallery",
          description: "Browse albums from events and community moments",
          icon: Images,
        },
        {
          title: "In the Press",
          href: "/resources/in-the-press",
          description: "News and media coverage featuring She Sharp",
          icon: FileText,
        },
        {
          title: "Podcasts",
          href: "/resources/podcasts",
          description: "Listen to She Sharp Talks and featured episodes",
          icon: Mic,
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
      title: "Join Membership",
      href: "/membership",
      variant: "brand",
    },
  ],
};
