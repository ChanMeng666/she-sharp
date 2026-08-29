import { MAILCHIMP_CONFIG } from "@/lib/data/newsletters";

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

  /**
   * Social profiles only — every entry here is a place She Sharp posts as
   * itself, and every consumer may render the whole list without filtering.
   *
   * That invariant is new. The newsletter archive used to sit in this array
   * with `icon: "mailchimp"`, and three of the five consumers had to filter it
   * back out by matching the literal string `"Mailchimp"` — `lib/seo/site.ts`,
   * `lib/deck/boilerplate.ts` and (by allow-list) `emails/components/Footer.tsx`.
   * The other two rendered it, so a mail vendor's mascot appeared in the footer
   * of every page and on /contact under "Follow us". Renaming or moving the
   * entry would have silently broken the three name matches. It now lives in
   * `newsletterArchive` below; keep this list to actual profiles so nobody has
   * to reintroduce a filter.
   */
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

  /**
   * The back catalogue of past issues, rendered as an ordinary text link.
   *
   * The href is Mailchimp's campaign archive and stays that way for now: it is
   * the only route to the issues sent before August 2026, none of which were
   * sent from this codebase. Re-hosting them here is a later phase, which is
   * why the URL is read from `MAILCHIMP_CONFIG` rather than copied — that one
   * constant in `lib/data/newsletters.ts` is the single place the destination
   * changes when it does. Subscribing is `/newsletter/subscribe`, not this.
   */
  newsletterArchive: {
    name: "Read past issues",
    href: MAILCHIMP_CONFIG.archiveUrl,
  } as FooterLink,

  /**
   * All seven policy pages, and it must stay all seven.
   *
   * Only the first three were listed here, which left the other four reachable
   * solely by landing on a policy page and using the `LegalNav` cross-links
   * inside it — two clicks, named nowhere at the top level. An accessibility
   * statement nobody can find is the one kind of page where being hard to reach
   * is itself the failure.
   */
  legalLinks: [
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Cookie Policy", href: "/cookie-policy" },
    { name: "Terms of Service", href: "/terms-of-service" },
    { name: "Accessibility", href: "/accessibility" },
    { name: "Security Policy", href: "/security-policy" },
    { name: "Code of Conduct", href: "/code-of-conduct" },
    { name: "Ambassador Code", href: "/volunteers/code-of-conduct" },
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