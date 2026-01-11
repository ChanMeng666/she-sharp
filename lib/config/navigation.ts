import { LucideIcon, Calendar, Users, Award, BookOpen, HandHeart, Building2, GraduationCap, Sparkles, Library, UserPlus } from "lucide-react";

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
          title: "About the Program",
          href: "/mentorship",
          description: "Learn about our mentorship program",
          icon: BookOpen,
        },
        {
          title: "Become a Mentee",
          href: "/mentorship/join",
          description: "Join the program and get matched with a mentor",
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
    },
  ],
  buttons: [
    {
      title: "Join Mentorship",
      href: "/mentorship",
      variant: "brand",
    },
  ],
};
