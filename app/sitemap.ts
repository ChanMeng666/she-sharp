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
  { path: "/community", priority: 0.5, changeFrequency: "yearly" },
  { path: "/events", priority: 0.9, changeFrequency: "weekly" },
  {
    path: "/events/google-educator-conference",
    priority: 0.6,
    changeFrequency: "yearly",
  },
  { path: "/mentorship", priority: 0.8, changeFrequency: "monthly" },
  { path: "/mentorship/mentor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentorship/mentee", priority: 0.7, changeFrequency: "monthly" },
  // NOTE: /mentorship/{mentor,mentee}/apply are deliberately absent. They are
  // gated form pages that redirect to their parent outside the registration
  // window, and their layouts set `robots: { index: false }`. Listing a noindex
  // URL in the sitemap is a contradiction GSC reports as "Submitted URL marked
  // 'noindex'" — so they must not come back here even when the window reopens.
  //
  // /present/* is absent for the same reason: event presentation decks are
  // internal host tooling, are served `robots: { index: false }` by
  // `app/present/layout.tsx`, and must never be listed here.
  //
  // /events/*/feedback and its /f/<code> alias are absent too. The feedback
  // form is one content-free page replicated across every event slug — the
  // thin-duplicate pattern GSC files under "Duplicate, Google chose a different
  // canonical" — and indexing it would invite feedback from people who never
  // attended. Note the event loop below only ever emits /events/<slug>, so
  // there is nothing to remove; this note exists to stop it being added.
  // The deck archive itself IS indexable — it is an ordinary site page. Only
  // the /present/* decks it links to carry the noindex noted above.
  { path: "/slides", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources", priority: 0.7, changeFrequency: "weekly" },
  { path: "/resources/in-the-press", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/podcasts", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/newsletters", priority: 0.6, changeFrequency: "monthly" },
  { path: "/resources/photo-gallery", priority: 0.6, changeFrequency: "monthly" },
  // The newsletter sign-up landing page. Its partners /newsletter/confirm and
  // /newsletter/reconfirm are absent and must stay absent: both are `noindex`,
  // reachable only from a token in an email, and listing one here is the
  // "Submitted URL marked 'noindex'" contradiction noted above.
  { path: "/newsletter/subscribe", priority: 0.7, changeFrequency: "monthly" },
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
  // No `lastModified` on static routes, and none on upcoming events.
  //
  // Both used to carry `new Date()`, which is the build timestamp — so every
  // deploy told Google that 25 pages had just changed. GSC's own export on
  // 2026-08-09 showed all of them stamped with the previous deploy's date. A
  // lastmod that moves on every build is a lastmod Google learns to ignore
  // site-wide, which costs the entries that DO carry a real date below.
  // Omitting the field is honest; a fabricated date is not.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const eventEntries: MetadataRoute.Sitemap = getAllEvents().map((event) => {
    const upcoming = isFutureDate(event.date);
    const eventDate = parseDateString(event.date);
    // A past event's own date is a real "last meaningfully changed" signal.
    // An upcoming event has none, so it gets no lastmod rather than a fake one.
    const lastModified =
      !Number.isNaN(eventDate.getTime()) && !upcoming ? eventDate : undefined;

    return {
      url: `${SITE_URL}/events/${event.slug}`,
      lastModified,
      changeFrequency: upcoming ? "weekly" : "yearly",
      priority: upcoming ? 0.8 : 0.5,
    };
  });

  return [...staticEntries, ...eventEntries];
}
