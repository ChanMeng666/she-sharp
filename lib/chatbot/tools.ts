/**
 * Tool definitions for the She Sharp chatbot agent.
 *
 * Each tool wraps existing, live data-access helpers and returns a compact,
 * token-budget-friendly shape. The model decides when to call them, which keeps
 * the base prompt small while still answering deep/long-tail questions across
 * the full (and growing) event catalogue, mentor directory, and team.
 */

import { tool } from "ai";
import { z } from "zod";
import {
  getUpcomingEvents,
  getPastEvents,
  getEventBySlug,
  getAllEvents,
  formatEventDate,
  getEventDisplayTime,
  getAllSpeakersFromEvent,
} from "@/lib/data/events";
import type { EventV3 } from "@/types/event";
import { mentors } from "@/lib/data/mentors";
import {
  teamMembers,
  getTeamMembersByRole,
  searchTeamMembers,
} from "@/lib/data/team";
import type { TeamRole } from "@/types/team";

const MAX_LIST = 8;

/**
 * Build a lowercase searchable haystack for an event, including sponsor names,
 * city and category — so a query like "MYOB Tech That Matches" matches an event
 * sponsored by MYOB even when "MYOB" isn't in the title.
 */
function eventHaystack(e: EventV3): string {
  const d = e.detailPageData;
  const sponsors = [...(d.sponsors?.main ?? []), ...(d.sponsors?.other ?? [])]
    .map((s) => s.name)
    .join(" ");
  return [
    e.title,
    e.shortDescription,
    ...(d.fullDescription ?? []),
    sponsors,
    d.location?.city ?? "",
    d.category ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

/** Token-scored search: events matching the most query words rank first. */
function scoredSearch(events: EventV3[], query: string): EventV3[] {
  const tokens = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
  if (tokens.length === 0) return [];
  return events
    .map((e) => {
      const hay = eventHaystack(e);
      const score = tokens.reduce((n, t) => (hay.includes(t) ? n + 1 : n), 0);
      return { e, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.e);
}

/** Compact one event for list results. */
function summariseEvent(e: EventV3) {
  const loc = e.detailPageData.location;
  return {
    slug: e.slug,
    title: e.title,
    date: formatEventDate(e, "long"),
    city: loc.city || (loc.format === "online" ? "Online" : ""),
    format: loc.format,
    shortDescription: e.shortDescription?.trim() || "",
    url: `/events/${e.slug}`,
  };
}

export const chatbotTools = {
  findEvents: tool({
    description:
      "Search and list She Sharp events. Use for questions like 'what events are coming up', 'any events in Auckland', or 'past AI/cybersecurity events'. Returns a compact list with a slug and url for each event.",
    inputSchema: z.object({
      query: z
        .string()
        .optional()
        .describe("Keyword to match in event title or description"),
      city: z
        .string()
        .optional()
        .describe("Filter by city, e.g. 'Auckland', 'Wellington'"),
      timeframe: z
        .enum(["upcoming", "past", "all"])
        .optional()
        .describe(
          "Restrict to upcoming, past, or all events. Defaults to 'all' when a query is given (so past events are searchable), otherwise 'upcoming'."
        ),
      limit: z.number().int().min(1).max(MAX_LIST).optional(),
    }),
    execute: async ({ query, city, timeframe, limit = MAX_LIST }) => {
      // When searching by keyword, default to all events so past events are
      // findable; when just listing, default to upcoming.
      const effectiveTimeframe = timeframe ?? (query ? "all" : "upcoming");
      let events: EventV3[];
      if (query) {
        // Token-scored search across all events, then narrow by timeframe.
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        events = scoredSearch(getAllEvents(), query).filter((e) => {
          const d = new Date(e.date);
          if (effectiveTimeframe === "upcoming") return d >= now;
          if (effectiveTimeframe === "past") return d < now;
          return true;
        });
      } else if (effectiveTimeframe === "past") {
        events = getPastEvents();
      } else if (effectiveTimeframe === "all") {
        events = getAllEvents();
      } else {
        events = getUpcomingEvents();
      }

      if (city) {
        const c = city.toLowerCase();
        events = events.filter((e) =>
          e.detailPageData.location.city?.toLowerCase().includes(c)
        );
      }

      return {
        count: events.length,
        events: events.slice(0, limit).map(summariseEvent),
      };
    },
  }),

  getEventDetails: tool({
    description:
      "Get full details for a single event by its slug: date, time, venue, speakers, registration link, and gallery. Use the slug returned by findEvents or shown in the knowledge base.",
    inputSchema: z.object({
      slug: z.string().describe("The event slug, e.g. 'she-sharp-and-myob'"),
    }),
    execute: async ({ slug }) => {
      const e = getEventBySlug(slug);
      if (!e) {
        return { found: false, message: `No event found with slug "${slug}".` };
      }
      const loc = e.detailPageData.location;
      const speakers = getAllSpeakersFromEvent(e)
        .slice(0, 12)
        .map((s) =>
          [s.name, s.title, s.company].filter(Boolean).join(", ")
        );
      const sponsors = [
        ...(e.detailPageData.sponsors?.main ?? []),
        ...(e.detailPageData.sponsors?.other ?? []),
      ]
        .map((s) => s.name)
        .filter(Boolean)
        .slice(0, 12);

      return {
        found: true,
        title: e.title,
        date: formatEventDate(e, "full"),
        time: getEventDisplayTime(e) || "Time TBA",
        location: {
          format: loc.format,
          venue: loc.venueName || "",
          address: loc.address || "",
          city: loc.city || "",
        },
        description: (e.detailPageData.fullDescription ?? [])
          .join(" ")
          .slice(0, 800),
        speakers,
        sponsors,
        registrationUrl: e.detailPageData.registrationUrl || "",
        galleryUrl: e.detailPageData.galleryUrl || "",
        url: `/events/${e.slug}`,
      };
    },
  }),

  getMentors: tool({
    description:
      "Look up She Sharp mentors, optionally filtered by industry or area of expertise. Returns name, role, company, industry and expertise.",
    inputSchema: z.object({
      industry: z
        .string()
        .optional()
        .describe(
          "Industry filter, e.g. 'Technology', 'Healthcare', 'Finance', 'Business & Management'"
        ),
      expertise: z
        .string()
        .optional()
        .describe("Expertise keyword, e.g. 'Cloud', 'Product Management', 'AI'"),
      limit: z.number().int().min(1).max(MAX_LIST).optional(),
    }),
    execute: async ({ industry, expertise, limit = MAX_LIST }) => {
      let list = mentors;
      if (industry) {
        const q = industry.toLowerCase();
        list = list.filter((m) => m.industry.toLowerCase().includes(q));
      }
      if (expertise) {
        const q = expertise.toLowerCase();
        list = list.filter(
          (m) =>
            m.expertise.some((x) => x.toLowerCase().includes(q)) ||
            m.role.toLowerCase().includes(q)
        );
      }
      return {
        count: list.length,
        mentors: list.slice(0, limit).map((m) => ({
          name: m.name,
          role: m.role,
          company: m.company,
          industry: m.industry,
          expertise: m.expertise,
          yearsOfExperience: m.yearsOfExperience,
        })),
      };
    },
  }),

  getTeamMembers: tool({
    description:
      "Look up She Sharp team members by name or role (e.g. 'Founder and Chair', 'Event Manager', 'Mentoring Programme Lead'). Returns name, roles, a short bio and LinkedIn.",
    inputSchema: z.object({
      name: z.string().optional().describe("Full or partial member name"),
      role: z.string().optional().describe("Team role to filter by"),
      limit: z.number().int().min(1).max(MAX_LIST).optional(),
    }),
    execute: async ({ name, role, limit = MAX_LIST }) => {
      let list = teamMembers.filter((m) => m.name);
      if (name) {
        list = searchTeamMembers(name);
      } else if (role) {
        list = getTeamMembersByRole(role as TeamRole);
        if (list.length === 0) {
          // Loose fallback when the role label isn't an exact match.
          const q = role.toLowerCase();
          list = teamMembers.filter((m) =>
            m.roles?.some((r) => r.toLowerCase().includes(q))
          );
        }
      }
      return {
        count: list.length,
        members: list.slice(0, limit).map((m) => ({
          name: m.name,
          roles: m.roles,
          bio: (m.description || "").split("\n")[0].slice(0, 280),
          linkedin: m.linkedin || "",
        })),
      };
    },
  }),
};
