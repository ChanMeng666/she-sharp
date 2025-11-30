export interface FooterLink {
  name: string;
  href: string;
}

export interface FooterSection {
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  name: string;
  href: string;
  icon: string; // Will be used for icon component selection
}

export interface FooterStats {
  label: string;
  value: string;
}

export const footerConfig = {
  stats: [
    { label: "Members", value: "2200+" },
    { label: "Sponsors", value: "50+" },
    { label: "Events Since 2014", value: "84+" },
  ] as FooterStats[],

  sections: [
    {
      title: "About",
      links: [
        { name: "Our Mission", href: "/about" },
        { name: "Meet the Team", href: "/about#team" },
        { name: "Impact Report", href: "/media/impact-report" },
      ],
    },
    {
      title: "Mentorship",
      links: [
        { name: "About the Program", href: "/mentorship" },
        { name: "Meet Our Mentors", href: "/mentorship/mentors" },
        { name: "Become a Mentee", href: "/mentorship/join" },
        { name: "Become a Mentor", href: "/mentorship/become-a-mentor" },
      ],
    },
    {
      title: "Get Involved",
      links: [
        { name: "All Events", href: "/events" },
        { name: "Volunteer with Us", href: "/join-our-team" },
        { name: "Corporate Partnership", href: "/sponsors/corporate-sponsorship" },
        { name: "Donate", href: "/donate" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Podcasts", href: "/media/podcasts" },
        { name: "Newsletters", href: "/media/newsletters" },
        { name: "Photo Gallery", href: "/media/photo-gallery" },
        { name: "In the Press", href: "/media/news-and-press" },
        { name: "Contact Us", href: "/contact" },
      ],
    },
  ] as FooterSection[],

  socialLinks: [
    {
      name: "Spotify",
      href: "https://open.spotify.com/show/3CQf214DtzML2jqvVIxCqT?si=0a5a6166658e4d4&nd=1&dlsi=a92939a2789f44e0",
      icon: "spotify",
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/shesharpnz/",
      icon: "instagram",
    },
    {
      name: "Facebook",
      href: "https://www.facebook.com/shesharpnz/",
      icon: "facebook",
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/company/shesharpnz/posts/?feedView=all",
      icon: "linkedin",
    },
    {
      name: "X",
      href: "https://x.com/shesharpnz",
      icon: "x",
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/channel/UCfNDV1btAhwWwEXSyxNd5_Q",
      icon: "youtube",
    },
  ] as SocialLink[],

  legalLinks: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    // { name: "Accessibility", href: "/accessibility" },
    // { name: "Security Policy", href: "/security-policy" },
    // { name: "Code of Conduct", href: "/code-of-conduct" },
    // { name: "Ambassador Code of Conduct", href: "/volunteers/code-of-conduct" },
  ] as FooterLink[],

  charityInfo: {
    name: "She Sharp",
    registrationNumber: "CC57025",
    registrationLink: "https://register.charities.govt.nz/Charity/CC57025",
  },
};