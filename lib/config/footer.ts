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

export interface ContactInfo {
  email: string;
  location: string;
}

export const footerConfig = {
  contactInfo: {
    email: "hello@shesharp.org.nz",
    location: "Auckland, New Zealand",
  } as ContactInfo,

  stats: [
    { label: "Members", value: "2200+" },
    { label: "Sponsors", value: "50+" },
    { label: "Events Since 2014", value: "84+" },
  ] as FooterStats[],

  sections: [
    {
      title: "About",
      links: [
        { name: "About Us", href: "/about" },
      ],
    },
    {
      title: "Mentorship",
      links: [
        { name: "About the Program", href: "/mentorship" },
        { name: "Meet Our Mentors", href: "/mentorship#mentors-list" },
        { name: "Become a Mentee", href: "/mentorship/join" },
        { name: "Become a Mentor", href: "/mentorship/become-a-mentor" },
      ],
    },
    {
      title: "Events",
      links: [
        { name: "All Events", href: "/events" },
      ],
    },
    {
      title: "Get Involved",
      links: [
        { name: "Volunteer with Us", href: "/join-our-team" },
        { name: "Corporate Partnership", href: "/sponsors/corporate-sponsorship" },
        { name: "Donate", href: "/donate" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Resources Hub", href: "/resources" },
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
    {
      name: "Mailchimp",
      href: "https://us3.campaign-archive.com/home/?u=1bcf1c40837f51b409973326f&id=31bd05e8eb",
      icon: "mailchimp",
    },
  ] as SocialLink[],

  legalLinks: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
  ] as FooterLink[],

  simplifiedNavLinks: [
    { name: "About", href: "/about" },
    { name: "Mentorship", href: "/mentorship" },
    { name: "Events", href: "/events" },
    { name: "Donate", href: "/donate" },
    { name: "Join Our Team", href: "/join-our-team" },
    { name: "Resources", href: "/resources" },
  ] as FooterLink[],

  charityInfo: {
    name: "She Sharp",
    registrationNumber: "CC57025",
    registrationLink: "https://register.charities.govt.nz/Charity/CC57025",
  },
};