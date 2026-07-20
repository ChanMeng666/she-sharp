/**
 * Render a newsletter issue to HTML + plain text.
 *
 * Wraps `@react-email/render` around the `NewsletterEmail` template. Both a
 * broadcast-ready HTML string (with Resend merge tags) and a plain-text
 * fallback are produced. The rendered HTML byte size is checked against
 * Gmail's ~102KB message-clipping threshold and rejected early if exceeded,
 * so an oversized issue fails loudly at preview time rather than silently
 * getting clipped in inboxes.
 */

import * as React from "react";
import { render } from "@react-email/render";
import { NewsletterEmail } from "@/emails/newsletter";
import type { NewsletterIssueData } from "./schema";

/** Gmail clips messages larger than ~102KB; stay comfortably under. */
const GMAIL_CLIP_KB = 100;

export async function renderNewsletter(
  issue: NewsletterIssueData,
  mode: "broadcast" | "preview"
): Promise<{ html: string; text: string; sizeKb: number }> {
  const element = <NewsletterEmail issue={issue} mode={mode} />;

  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);

  const sizeKb = Buffer.byteLength(html, "utf8") / 1024;

  if (sizeKb > GMAIL_CLIP_KB) {
    throw new Error(
      `Rendered newsletter is ${sizeKb.toFixed(1)}KB, which exceeds the ` +
        `${GMAIL_CLIP_KB}KB budget. Gmail clips messages over ~102KB, hiding ` +
        `the footer and unsubscribe link. Trim content or images for issue ` +
        `${issue.id} (mode: ${mode}).`
    );
  }

  return { html, text, sizeKb };
}
