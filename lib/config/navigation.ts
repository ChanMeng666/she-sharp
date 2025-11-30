import { LucideIcon, Calendar, Users, Heart, Mic, Mail, FileText, Award, BookOpen, HandHeart, Building2, GraduationCap } from "lucide-react";

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
  variant: "default" | "outline";
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
        alt: "Meet Our Mentors",
        href: "/mentorship/mentors",
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
        alt: "Photo Gallery",
        href: "/media/photo-gallery",
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
