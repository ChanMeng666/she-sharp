/**
 * On-site "view in browser" route for a newsletter issue.
 *
 * Serves either the exact HTML a campaign was sent as (179 archived Mailchimp
 * sends, images re-hosted on Vercel Blob) or the rendered email for an issue
 * built in this repo — in both cases the document the subscriber received,
 * which is why the response is a whole HTML page rather than a site page with
 * the newsletter inside it.
 *
 * WHY IT EXISTS AT ALL. Until this route resolved more than the three ids in
 * `issues-registry.ts`, every card on `/resources/newsletters` sent the visitor
 * to `mailchi.mp`. Mailchimp documents nothing about what happens to hosted
 * campaign pages once the subscription is cancelled, so the entire twelve-year
 * back catalogue was one billing change away from being unreadable.
 * `lib/newsletter/archive.ts` carries the resolution order and the reasoning.
 *
 * STATIC. Every servable id is prerendered — 179 campaign ids, 59 card ids and
 * the three registry ids — so the bodies are read from disk at build time and
 * never at request time. That matters on Vercel: `lib/data/newsletter-archive/`
 * is data, not code, and Next's output tracing has no reason to ship 8.7MB of
 * it into a lambda. `dynamicParams = false` makes every other id a 404 without
 * running this handler at all; the explicit 404 below is what answers in
 * `next dev`, where params are resolved live.
 *
 * NOINDEX. Set by header, as it was before: the response is not a Next page, so
 * there is no `metadata` to attach a canonical to and no parent canonical for a
 * child to inherit. The only URL the served document declares about itself is
 * its `og:url`, which `localiseArchivedHtml` rewrites from the campaign's dead
 * `eepurl.com` link to this page's own canonical path. Deliberately NOT paired
 * with a `Disallow` in `app/robots.ts` — a crawler blocked from fetching the
 * page never reads the noindex. For the same reason the route stays out of
 * `app/sitemap.ts`; only the listing page is in it.
 */

import {
  allServableIds,
  localiseArchivedHtml,
  readArchivedCampaign,
  resolveIssue,
} from "@/lib/newsletter/archive";
import { getIssue } from "@/lib/newsletter/issues-registry";
import { renderNewsletter } from "@/lib/newsletter/render";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams(): { issue: string }[] {
  return allServableIds().map((issue) => ({ issue }));
}

/** GET /resources/newsletters/:issue — the issue itself, as it was sent. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ issue: string }> }
): Promise<Response> {
  const { issue: id } = await params;

  const resolved = resolveIssue(id);
  if (!resolved) {
    return new Response("Not found", { status: 404 });
  }

  const html =
    resolved.kind === "campaign"
      ? localiseArchivedHtml(await readArchivedCampaign(resolved.campaignId))
      : await renderRegistryIssue(resolved.issueId);

  if (html === null) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/** The repo-built path: render the fixture exactly as `preview` mode sends it. */
async function renderRegistryIssue(issueId: string): Promise<string | null> {
  const issue = getIssue(issueId);
  if (!issue) return null;
  const { html } = await renderNewsletter(issue, "preview");
  return html;
}
