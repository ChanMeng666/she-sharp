import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

/**
 * Paths that should never be crawled or surfaced in search / AI answers.
 * Covers authenticated app surfaces, API routes, and auth flows.
 */
const DISALLOWED_PATHS = [
  "/dashboard/",
  "/api/",
  "/sign-in",
  "/sign-up",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verify-invitation",
  "/auth/",
];

/**
 * AI / LLM crawlers we explicitly welcome so the site can be cited in
 * generative engines (ChatGPT, Claude, Perplexity, Google AI Overviews, etc.).
 * Listing them individually also gives us a per-bot lever to throttle later.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Claude-Web",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Amazonbot",
  "Meta-ExternalAgent",
  "Bytespider",
];

/**
 * Generates /robots.txt: allow general crawling (minus private surfaces),
 * explicitly authorize major AI crawlers, and advertise the sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED_PATHS,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
