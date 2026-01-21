/**
 * Membership data for She Sharp membership page
 */

import {
  Users,
  Calendar,
  BookOpen,
  Award,
  Rocket,
  Heart,
  Sparkles,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface MembershipBenefit {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface MembershipTierFeature {
  name: string;
  included: boolean;
}

export interface MembershipTier {
  id: "free" | "basic" | "premium";
  name: string;
  price: number;
  currency: string;
  interval: "year" | "month";
  description: string;
  features: MembershipTierFeature[];
  isPopular?: boolean;
  ctaText: string;
  ctaHref: string;
}

export const membershipBenefits: MembershipBenefit[] = [
  {
    icon: Users,
    title: "1-on-1 Mentor Sessions",
    description:
      "Get personalized guidance from experienced mentors in tech who understand your journey.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Matching",
    description:
      "Our intelligent matching system connects you with mentors who align with your goals and interests.",
  },
  {
    icon: Calendar,
    title: "Priority Event Access",
    description:
      "Be first in line for workshops, networking events, and exclusive member-only gatherings.",
  },
  {
    icon: BookOpen,
    title: "Premium Resources",
    description:
      "Access curated learning materials, career guides, and industry insights to accelerate your growth.",
  },
  {
    icon: Rocket,
    title: "Career Development",
    description:
      "Receive tailored career advice, resume reviews, and interview preparation support.",
  },
  {
    icon: Heart,
    title: "Supportive Community",
    description:
      "Join a vibrant network of women in tech who celebrate each other's successes.",
  },
];

export const membershipTiers: MembershipTier[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "NZD",
    interval: "year",
    description: "Get started with basic access to the She Sharp community.",
    features: [
      { name: "Access to public events", included: true },
      { name: "Community newsletter", included: true },
      { name: "View mentor profiles", included: true },
      { name: "Basic learning resources", included: true },
      { name: "1-on-1 mentor sessions", included: false },
      { name: "Priority event registration", included: false },
      { name: "Premium resources", included: false },
      { name: "Certificate of completion", included: false },
    ],
    ctaText: "Get Started",
    ctaHref: "/sign-up",
  },
  {
    id: "basic",
    name: "Basic",
    price: 50,
    currency: "NZD",
    interval: "year",
    description: "Enhanced access with more resources and event benefits.",
    features: [
      { name: "Access to public events", included: true },
      { name: "Community newsletter", included: true },
      { name: "View mentor profiles", included: true },
      { name: "Basic learning resources", included: true },
      { name: "1-on-1 mentor sessions", included: false },
      { name: "Priority event registration", included: true },
      { name: "Premium resources", included: true },
      { name: "Certificate of completion", included: false },
    ],
    ctaText: "Join Basic",
    ctaHref: "/sign-up",
  },
  {
    id: "premium",
    name: "Premium",
    price: 100,
    currency: "NZD",
    interval: "year",
    description: "Full access to mentorship and all She Sharp benefits.",
    features: [
      { name: "Access to public events", included: true },
      { name: "Community newsletter", included: true },
      { name: "View mentor profiles", included: true },
      { name: "Basic learning resources", included: true },
      { name: "1-on-1 mentor sessions", included: true },
      { name: "Priority event registration", included: true },
      { name: "Premium resources", included: true },
      { name: "Certificate of completion", included: true },
    ],
    isPopular: true,
    ctaText: "Join Premium",
    ctaHref: "/sign-up",
  },
];

