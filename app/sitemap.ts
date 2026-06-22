import type { MetadataRoute } from "next";
import { getAllEvents, parseDateString, isFutureDate } from "@/lib/data/events";
import { SITE_URL } from "@/lib/seo/site";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

/**
 * Public, crawlable routes with their relative priority. Excludes auth,
 * dashboard, API, and the currently-disabled /membership page.
 */
const STATIC_ROUTES: Array<{
  path: string;
  priority: number;
  changeFrequency: ChangeFrequency;
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/events", priority: 0.9, changeFrequency: "weekly" },
  {
    path: "/events/google-educator-conference",
    priority: 0.6,
    changeFrequency: "yearly",
  },
  { path: "/mentorship", priority: 0.8, changeFrequency: "monthly" },
  { path: "/mentorship/mentor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentorship/mentee", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentorship/mentor/apply", priority: 0.6, changeFrequency: "monthly" },
  { path: "/mentorship/mentee/apply", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resources/in-the-press", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/podcasts", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/newsletters", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/photo-gallery", priority: 0.6, changeFrequency: "monthly" },
  { path: "/join-our-team", priority: 0.7, changeFrequency: "monthly" },
  { path: "/donate", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
  {
    path: "/sponsors/corporate-sponsorship",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  // Legal / policy pages — low priority, rarely change.
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/cookie-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms-of-service", priority: 0.3, changeFrequency: "yearly" },
  { path: "/accessibility", priority: 0.3, changeFrequency: "yearly" },
  { path: "/security-policy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/code-of-conduct", priority: 0.3, changeFrequency: "yearly" },
  {
    path: "/volunteers/code-of-conduct",
    priority: 0.3,
    changeFrequency: "yearly",
  },
];

/**
 * Generates /sitemap.xml from the static route table plus every event page,
 * deriving lastModified and priority from each event's date.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const eventEntries: MetadataRoute.Sitemap = getAllEvents().map((event) => {
    const upcoming = isFutureDate(event.date);
    const eventDate = parseDateString(event.date);
    const lastModified =
      !Number.isNaN(eventDate.getTime()) && !upcoming ? eventDate : now;

    return {
      url: `${SITE_URL}/events/${event.slug}`,
      lastModified,
      changeFrequency: upcoming ? "weekly" : "yearly",
      priority: upcoming ? 0.8 : 0.5,
    };
  });

  return [...staticEntries, ...eventEntries];
}
