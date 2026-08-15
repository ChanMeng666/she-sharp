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

export const footerConfig = {
  sections: [
    {
      title: "Programmes",
      links: [
        { name: "HER WAKA", href: "https://herwaka.shesharp.org.nz/" },
      ],
    },
    {
      title: "Mentorship",
      links: [
        { name: "About the Programme", href: "/mentorship" },
        { name: "Become a Mentee", href: "/mentorship/mentee" },
        { name: "Become a Mentor", href: "/mentorship/mentor" },
      ],
    },
    {
      title: "Events",
      links: [
        { name: "All Events", href: "/events" },
        { name: "Event Slides", href: "/slides" },
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

  /**
   * Read off the New Zealand Charities Register, not from memory. Verified
   * 2026-08 at register.charities.govt.nz/Charity/CC57025.
   *
   * `name` is the LEGAL name as registered — "She Sharp", two words. That
   * settles a question the organisation's own records could not: a 2016
   * meeting resolved to use "SheSharp" as one word, but the entity was never
   * registered that way. So prose should say "She Sharp"; "She#" is the
   * visual mark, not the name.
   *
   * It also settles a second one. A 2024 sponsorship draft described She Sharp
   * as a "non-charitable organisation". It is a registered charity and has
   * been since 4 June 2019 — status Registered, nationwide.
   *
   * The register also lists a postal address. It is a private residence and is
   * deliberately not reproduced here or anywhere else in this codebase.
   */
  charityInfo: {
    name: "She Sharp",
    registrationNumber: "CC57025",
    registrationLink: "https://register.charities.govt.nz/Charity/CC57025",
    /** ISO date the charity was entered on the register. */
    registeredSince: "2019-06-04",
    nzbn: "9429047458970",
  },
};