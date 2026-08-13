import { EventsPageClient } from "@/components/events/events-page-client";
import { getAllEvents, getFeaturedEvent } from "@/lib/data/events";
import { toEventListItem } from "@/lib/data/event-list-item";

// Projected once at module scope. The browse UI below is a client component —
// it owns the search box, the year filter and "load more" — but it reads only a
// dozen fields per event, so it receives a slim projection rather than the full
// archive. That keeps ~960KB of event JSON out of the route's client bundle and
// out of the flight payload.
const featuredSource = getFeaturedEvent();
const FEATURED_EVENT = featuredSource
  ? toEventListItem(featuredSource)
  : undefined;
const ALL_EVENTS = getAllEvents().map(toEventListItem);

export default function EventsPage() {
  return (
    <EventsPageClient featuredEvent={FEATURED_EVENT} allEvents={ALL_EVENTS} />
  );
}
