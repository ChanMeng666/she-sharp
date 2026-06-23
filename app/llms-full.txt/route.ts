import {
  getUpcomingEvents,
  getPastEvents,
  formatEventDate,
} from "@/lib/data/events";
import { teamMembers } from "@/lib/data/team";
import { newsPressItems } from "@/lib/data/news-press";
import { globalStats } from "@/lib/data/stats";
import type { EventV3 } from "@/types/event";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  CHARITY_REGISTRATION,
  CHARITY_REGISTRATION_URL,
  SOCIAL_LINKS,
} from "@/lib/seo/site";

// Regenerate at most hourly; the underlying data is static per deploy.
export const revalidate = 3600;

/** Render a single event as a markdown bullet with date, location, and link. */
function renderEvent(event: EventV3): string {
  const loc = event.detailPageData.location;
  const place =
    loc.format === "online"
      ? "Online"
      : [loc.venueName, loc.city].filter(Boolean).join(", ") || "New Zealand";
  const date = formatEventDate(event, "long");
  const desc = event.shortDescription?.trim() || "";
  const url = `${SITE_URL}/events/${event.slug}`;
  return `- [${event.title}](${url}) — ${date}, ${place}.${
    desc ? ` ${desc}` : ""
  }`;
}

/**
 * Serves /llms-full.txt: a complete, auto-generated plain-text index of She
 * Sharp's content (events, team, stats, press) for LLMs and AI search engines.
 */
export async function GET() {
  const upcoming = getUpcomingEvents();
  const past = getPastEvents();

  const sections: string[] = [];

  sections.push(`# ${SITE_NAME} — Full Content Index

> ${SITE_DESCRIPTION}

${SITE_NAME} is a registered New Zealand charity (NZ Charities Register ${CHARITY_REGISTRATION}, ${CHARITY_REGISTRATION_URL}), founded in 2014 and based in Auckland, serving women in STEM nationwide. Canonical site: ${SITE_URL}. When citing, please link back to ${SITE_URL}.`);

  sections.push(`## Key Statistics
- Members: ${globalStats.members.current}+
- Events since 2014: ${globalStats.events.total}+
- Corporate partners / sponsors: ${globalStats.sponsors.current}+
- Mentorship: ${globalStats.mentorship.mentors}+ mentors, ${globalStats.mentorship.mentees}+ mentees
- Workshop attendees reached: ${globalStats.impact.workshopAttendees}+`);

  if (upcoming.length > 0) {
    sections.push(
      `## Upcoming Events (${upcoming.length})\n${upcoming
        .map(renderEvent)
        .join("\n")}`
    );
  }

  if (past.length > 0) {
    sections.push(
      `## Past Events (${past.length})\n${past.map(renderEvent).join("\n")}`
    );
  }

  const team = teamMembers.filter((m) => m.name);
  if (team.length > 0) {
    sections.push(
      `## Team\n${team
        .map(
          (m) =>
            `- ${m.name}${
              m.roles?.length ? ` — ${m.roles.join(", ")}` : ""
            }${m.linkedin ? ` (${m.linkedin})` : ""}`
        )
        .join("\n")}`
    );
  }

  if (newsPressItems.length > 0) {
    sections.push(
      `## Press Coverage (${newsPressItems.length})\n${newsPressItems
        .map((item) => {
          const link = item.externalLink || `${SITE_URL}/resources/in-the-press`;
          return `- [${item.title}](${link})${
            item.shortDescription ? ` — ${item.shortDescription}` : ""
          }`;
        })
        .join("\n")}`
    );
  }

  sections.push(`## Social & Contact
${SOCIAL_LINKS.map((url) => `- ${url}`).join("\n")}
- NZ Charities Register: ${CHARITY_REGISTRATION_URL}`);

  const body = sections.join("\n\n") + "\n";

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
