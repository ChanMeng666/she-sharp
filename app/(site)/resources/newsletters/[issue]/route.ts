/**
 * On-site "view in browser" route for a monthly newsletter issue.
 *
 * Serves the exact rendered email HTML (preview mode) so the on-site view has
 * pixel parity with the inbox version. Unlisted during the pilot: nothing links
 * to it, it is excluded from the sitemap, and it is marked noindex/nofollow.
 */

import { getIssue } from "@/lib/newsletter/issues-registry";
import { renderNewsletter } from "@/lib/newsletter/render";
import { issueIdSchema } from "@/lib/newsletter/schema";

/** GET /resources/newsletters/:issue — the rendered email HTML for the issue. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ issue: string }> }
): Promise<Response> {
  const { issue: issueId } = await params;

  // Reject anything that is not a well-formed "YYYY-MM" id before touching the
  // registry, so bad paths 404 rather than surfacing a parse error.
  if (!issueIdSchema.safeParse(issueId).success) {
    return new Response("Not found", { status: 404 });
  }

  const issue = getIssue(issueId);
  if (!issue) {
    return new Response("Not found", { status: 404 });
  }

  const { html } = await renderNewsletter(issue, "preview");

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
