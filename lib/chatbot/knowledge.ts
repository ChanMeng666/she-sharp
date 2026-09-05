/**
 * Builds the compact, always-on knowledge context injected into the chatbot
 * agent's instructions on every request.
 *
 * This covers the high-frequency facts (org overview, stats, mentorship policy,
 * the next few upcoming events, and entry points for sponsors/donate/volunteer/
 * resources) so common questions are answered instantly without a tool call.
 * Deep or long-tail data (full event details, mentor directory, team bios) is
 * fetched on demand through the tools in `./tools`.
 *
 * Because it is rebuilt per request from the live data modules, newly added
 * events automatically appear here with zero manual maintenance.
 */

import { getUpcomingEvents, formatEventDate } from "@/lib/data/events";
import { teamMembers } from "@/lib/data/team";
import { globalStats } from "@/lib/data/stats";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";
import {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  CHARITY_REGISTRATION,
} from "@/lib/seo/site";

/** Render the nearest upcoming events as compact one-line bullets. */
function renderUpcomingEvents(limit: number): string {
  const upcoming = getUpcomingEvents(limit);
  if (upcoming.length === 0) {
    return "No upcoming events are currently scheduled. Suggest the visitor browse past events at /events or subscribe to the newsletter.";
  }
  return upcoming
    .map((e) => {
      const loc = e.detailPageData.location;
      const place =
        loc.format === "online"
          ? "Online"
          : [loc.venueName, loc.city].filter(Boolean).join(", ") ||
            "New Zealand";
      return `- "${e.title}" — ${formatEventDate(e, "long")}, ${place}. Link: /events/${e.slug}`;
    })
    .join("\n");
}

/** Build the full knowledge context string for the system prompt. */
export function buildKnowledgeContext(): string {
  const mentorshipOpen = isMentorshipOpen();
  const namedTeam = teamMembers.filter((m) => m.name);
  const teamCount = namedTeam.length;
  // Surface the founder/chair directly — it's the most common org question.
  const founder = namedTeam.find((m) =>
    m.roles?.some((r) => /founder/i.test(r))
  );

  return `# She Sharp — Knowledge Base (live data)

## Organisation
${SITE_NAME}: ${SITE_DESCRIPTION}
Founded in 2014${founder ? ` by ${founder.name} (Founder & Chair)` : ""}, based in Auckland, serving women in STEM across New Zealand. Registered NZ charity (Charities Register ${CHARITY_REGISTRATION}). Canonical site: ${SITE_URL}. Contact: ${GENERAL_EMAIL}. For other team members, use the getTeamMembers tool.

## Key statistics
- ${globalStats.members.current}+ active members
- ${globalStats.events.total}+ events since 2014
- ${globalStats.sponsors.current}+ corporate sponsors/partners
- Mentorship: ${globalStats.mentorship.mentors}+ mentors, ${globalStats.mentorship.mentees}+ mentees, ${globalStats.mentorship.successRate}% success rate
- ${globalStats.impact.workshopAttendees}+ workshop attendees reached, ${globalStats.impact.careerTransitions}+ career transitions

## Programmes
- Mentorship Programme: 1-on-1 mentoring with AI-powered matching. Overview: /mentorship
- THRIVE: leadership development programme
- Events: networking, workshops, conferences, panels (often monthly, online and in-person across NZ)

## Mentorship policy
- Mentee places cover 1-on-1 mentor sessions, AI matching, event access and learning resources.
- Mentor participation: FREE — experienced professionals apply to give back.
- NEVER quote a membership price, fee or dollar amount for mentorship or membership, and never say it is free. No price is approved for publication. If a visitor asks what it costs, say the programme is not running for the rest of 2026 so there is nothing to pay, and that fees for any future intake have not been announced. Direct them to ${GENERAL_EMAIL} if they need a definite answer.
- Matching considers goals, skills, industry and preferences.
- ${teamCount} team members run the organisation; ${globalStats.mentorship.mentors}+ mentors in the network.
- APPLICATION STATUS: ${
    mentorshipOpen
      ? "Applications are currently OPEN. Mentees apply at /mentorship/mentee, mentors at /mentorship/mentor."
      : "New applications are currently PAUSED (temporarily closed). Do NOT tell visitors to fill in the application forms. Instead, explain how the programme works, invite them to subscribe to the newsletter (footer) or follow She Sharp socials to be notified when applications re-open, and point them to /mentorship for the overview."
  }

## Upcoming events (next ${5})
${renderUpcomingEvents(5)}

## Ways to get involved (entry points — share the relevant link)
- Browse all events: /events
- Sponsor / corporate partnership: /sponsors/corporate-sponsorship
- Donate: /donate
- Volunteer / join the team / become an Ambassador: /join-our-team
- Resources hub (podcasts, newsletters, photo galleries, press): /resources
- About the team & history: /about

## Tools available to you
Use the tools to answer questions that need data beyond the summary above:
- findEvents: search/list events (by keyword, city, or upcoming/past) — use this for "what events…", "any events in Auckland", "past AI events", etc.
- getEventDetails: full details for ONE event by slug (time, venue, speakers, registration link). Use the slug from findEvents or the upcoming list above.
- getMentors: look up mentors by industry or expertise.
- getTeamMembers: look up team members by name or role.`;
}
