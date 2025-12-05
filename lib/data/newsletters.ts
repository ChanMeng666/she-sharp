/**
 * Newsletter data and helper functions for Mailchimp integration
 *
 * HOW TO ADD NEW NEWSLETTERS:
 * ===========================
 * 1. Go to Mailchimp Campaign Archive:
 *    https://us3.campaign-archive.com/home/?u=1bcf1c40837f51b409973326f&id=31bd05e8eb
 * 2. Click on the newsletter to get its direct URL (eepurl.com/xxx format)
 * 3. Add a new object to the newsletters array below
 * 4. Set category: "monthly" for monthly newsletters, "event" for event announcements
 * 5. Set isFeatured: true for the latest 2-3 newsletters
 */

import type {
  MailchimpNewsletter,
  MailchimpConfig,
  NewsletterCategory,
} from "@/types/newsletter";

export const MAILCHIMP_CONFIG: MailchimpConfig = {
  archiveUrl:
    "https://us3.campaign-archive.com/home/?u=1bcf1c40837f51b409973326f&id=31bd05e8eb",
  subscribeUrl:
    "https://shesharp.us3.list-manage.com/subscribe?u=1bcf1c40837f51b409973326f&id=31bd05e8eb",
};

export const newsletters: MailchimpNewsletter[] = [
  // November 2025
  {
    id: "ai-empowerment-nov-2025",
    title:
      "From Dunedin's harbour to your future: join us for AI Empowerment on Nov 21",
    date: "November 9, 2025",
    dateRaw: "2025-11-09",
    mailchimpUrl: "http://eepurl.com/jqARlY",
    category: "event",
    isFeatured: true,
  },
  {
    id: "vector-thinkathon-nov-2025",
    title:
      "Meet the Women Powering Possibility @ Vector + Think-a-thon Challenge",
    date: "November 1, 2025",
    dateRaw: "2025-11-01",
    mailchimpUrl: "http://eepurl.com/jqVk-I",
    category: "event",
    isFeatured: true,
  },

  // October 2025
  {
    id: "october-2025",
    title: "She Sharp Newsletter — October 2025",
    date: "October 31, 2025",
    dateRaw: "2025-10-31",
    mailchimpUrl: "http://eepurl.com/jqrNjA",
    category: "monthly",
    isFeatured: true,
  },
  {
    id: "vector-data-ai-oct-2025-2",
    title: "SheSharp x Vector: Data, AI, & Career Innovations on Nov 12",
    date: "October 18, 2025",
    dateRaw: "2025-10-18",
    mailchimpUrl: "http://eepurl.com/jpQW7U",
    category: "event",
  },
  {
    id: "vector-data-ai-oct-2025",
    title: "SheSharp x Vector: Data, AI, & Career Innovations on Nov 12",
    date: "October 17, 2025",
    dateRaw: "2025-10-17",
    mailchimpUrl: "http://eepurl.com/jpMVao",
    category: "event",
  },

  // September 2025
  {
    id: "september-2025",
    title: "She Sharp Newsletter — September 2025",
    date: "September 30, 2025",
    dateRaw: "2025-09-30",
    mailchimpUrl: "http://eepurl.com/jnRb5U",
    category: "monthly",
  },
  {
    id: "cybersecurity-reminder-sep-2025",
    title: "Still Deciding? Don't Miss Our Women in Cybersecurity Workshop!",
    date: "September 17, 2025",
    dateRaw: "2025-09-17",
    mailchimpUrl: "http://eepurl.com/jniIss",
    category: "event",
  },
  {
    id: "cybersecurity-workshop-sep-2025",
    title: "Women in Cybersecurity Workshop — Learn, Compete & Win",
    date: "September 6, 2025",
    dateRaw: "2025-09-06",
    mailchimpUrl: "http://eepurl.com/jmINWM",
    category: "event",
  },

  // August 2025
  {
    id: "august-2025",
    title: "She Sharp Newsletter — August 2025",
    date: "August 31, 2025",
    dateRaw: "2025-08-31",
    mailchimpUrl: "http://eepurl.com/jlY3NA",
    category: "monthly",
  },
  {
    id: "last-chance-aug-2025",
    title: "Last chance to register — don't miss out!",
    date: "August 28, 2025",
    dateRaw: "2025-08-28",
    mailchimpUrl: "http://eepurl.com/jl7lzs",
    category: "event",
  },
  {
    id: "fonterra-aug-2025",
    title: "She Sharp x Fonterra: From farm to future — join us 3 Sept",
    date: "August 18, 2025",
    dateRaw: "2025-08-18",
    mailchimpUrl: "http://eepurl.com/jlp9tM",
    category: "event",
  },

  // July 2025
  {
    id: "july-2025",
    title: "She Sharp Newsletter — July 2025",
    date: "August 1, 2025",
    dateRaw: "2025-08-01",
    mailchimpUrl: "http://eepurl.com/jkeLDY",
    category: "monthly",
  },
  {
    id: "ai-hackathon-qa-jul-2025",
    title: "Join Us Live – AI Hackathon Q&A Tomorrow @ 12PM!",
    date: "July 14, 2025",
    dateRaw: "2025-07-14",
    mailchimpUrl: "http://eepurl.com/ji-8LM",
    category: "event",
  },
  {
    id: "july-event-2025",
    title: "July Event",
    date: "July 4, 2025",
    dateRaw: "2025-07-04",
    mailchimpUrl: "http://eepurl.com/jiq--2",
    category: "event",
  },

  // June 2025
  {
    id: "june-2025",
    title: "She Sharp Newsletter — June 2025",
    date: "June 30, 2025",
    dateRaw: "2025-06-30",
    mailchimpUrl: "http://eepurl.com/jh8SGA",
    category: "monthly",
  },

  // May 2025
  {
    id: "may-2025",
    title: "She Sharp Newsletter — May 2025",
    date: "May 28, 2025",
    dateRaw: "2025-05-28",
    mailchimpUrl: "http://eepurl.com/jfDcOE",
    category: "monthly",
  },
  {
    id: "perfect-fit-may-2025",
    title: "Are you ready to find your perfect fit in tech?",
    date: "May 9, 2025",
    dateRaw: "2025-05-09",
    mailchimpUrl: "http://eepurl.com/jeaslo",
    category: "event",
  },

  // April 2025
  {
    id: "april-2025",
    title: "She Sharp Newsletter — April 2025",
    date: "May 6, 2025",
    dateRaw: "2025-05-06",
    mailchimpUrl: "http://eepurl.com/jd1TVU",
    category: "monthly",
  },

  // March 2025
  {
    id: "iamremarkable-mar-2025",
    title: "Celebrate your success with #IAmRemarkable",
    date: "March 26, 2025",
    dateRaw: "2025-03-26",
    mailchimpUrl: "http://eepurl.com/jaUZPQ",
    category: "event",
  },
  {
    id: "march-2025",
    title: "She Sharp Newsletter — March 2025",
    date: "March 25, 2025",
    dateRaw: "2025-03-25",
    mailchimpUrl: "http://eepurl.com/jaLXUE",
    category: "monthly",
  },
];

/**
 * Get newsletters sorted by date (newest first)
 */
export function getLatestNewsletters(limit?: number): MailchimpNewsletter[] {
  const sorted = [...newsletters].sort(
    (a, b) => new Date(b.dateRaw).getTime() - new Date(a.dateRaw).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

/**
 * Get featured newsletters
 */
export function getFeaturedNewsletters(
  limit?: number
): MailchimpNewsletter[] {
  const featured = newsletters.filter((n) => n.isFeatured);
  return limit ? featured.slice(0, limit) : featured;
}

/**
 * Get newsletters by category
 */
export function getNewslettersByCategory(
  category: NewsletterCategory
): MailchimpNewsletter[] {
  return newsletters.filter((n) => n.category === category);
}

/**
 * Get newsletter statistics
 */
export function getNewsletterStats(): {
  total: number;
  monthlyCount: number;
  eventCount: number;
} {
  return {
    total: newsletters.length,
    monthlyCount: newsletters.filter((n) => n.category === "monthly").length,
    eventCount: newsletters.filter((n) => n.category === "event").length,
  };
}
