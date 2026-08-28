/**
 * Renders a `MessageSpec` into sendable HTML + plain text.
 *
 * Two engines share one content model:
 *  - "layout": the transactional inline-HTML system in `lib/email/layout.ts`
 *    (purple gradient header, white body card, navy footer). Used for 1:1 and
 *    small operational sends.
 *  - "react": the react-email `AnnouncementEmail` template, which matches the
 *    monthly newsletter's visual system. Used for announcements and anything
 *    that needs a cover photo or Resend merge tags.
 *
 * Escaping contract: every block field is escaped as untrusted text EXCEPT
 * `info.html`, `warning.html` and `spec.footerExtra`, which the message model
 * declares to already be HTML.
 */

import * as React from "react";
import { render } from "@react-email/render";
import {
  brandedEmailLayout,
  brandButton,
  infoBox,
  warningBox,
  successBadge,
  detailsCard,
  linkBox,
  BRAND,
} from "./layout";
import type { Block, MessageSpec } from "./message";
import { blocksToText } from "./message";
import { UNSUBSCRIBE_URL_PLACEHOLDER } from "./unsubscribe-headers";
import { AnnouncementEmail } from "@/emails/announcement";

export interface ComposeResult {
  html: string;
  text: string;
  sizeKb: number;
  engine: "layout" | "react";
}

export interface ComposeOptions {
  /** Merge-tag behaviour of the react engine. Ignored by the layout engine. */
  mode?: "broadcast" | "preview";
  /** When non-empty, a review banner is injected at the top of the HTML. */
  draftBanner?: string[];
  /** Personalizes `{firstName}` under the layout engine. */
  recipient?: { firstName?: string | null; email?: string };
}

/** Mirrors the default contact address baked into `brandedEmailLayout`. */
const DEFAULT_CONTACT_EMAIL = "mentoring@shesharp.org.nz";

/** Banner palette — the same on-brand, client-safe pair used for drafts. */
const BANNER_BG = "#f7e5f3";
const BANNER_BORDER = "#9b2e83";

/** Escapes untrusted text for interpolation into HTML. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Converts `[label](url)` markdown links in already-escaped text into anchors.
 * Runs after escaping so a URL's `&` is correctly `&amp;` inside the href.
 */
function linkifyEscaped(escaped: string): string {
  return escaped.replace(
    /\[([^\]]+)\]\(([^)\s]+)\)/g,
    `<a href="$2" style="color: ${BRAND.purpleDark}; text-decoration: underline;">$1</a>`
  );
}

/** Substitutes the literal `{firstName}` placeholder, defaulting to "there". */
function personalize(value: string, firstName: string): string {
  return value.split("{firstName}").join(firstName);
}

/** Applies `{firstName}` personalization to every text-bearing block field. */
function personalizeBlocks(blocks: Block[], firstName: string): Block[] {
  return blocks.map((block): Block => {
    switch (block.type) {
      case "paragraph":
      case "heading":
      case "success":
        return { ...block, text: personalize(block.text, firstName) };
      case "button":
        return { ...block, text: personalize(block.text, firstName) };
      case "info":
      case "warning":
        return { ...block, html: personalize(block.html, firstName) };
      case "details":
        return {
          ...block,
          rows: block.rows.map((row) => ({
            label: personalize(row.label, firstName),
            value: personalize(row.value, firstName),
          })),
        };
      case "link":
      case "divider":
        return block;
    }
  });
}

/** Renders one block as inline-styled HTML for the layout engine. */
function blockToLayoutHtml(block: Block): string {
  switch (block.type) {
    case "paragraph":
      return block.text
        .split(/\n\s*\n/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map(
          (part) =>
            `<p style="margin: 0 0 16px; color: #333; font-size: 16px; line-height: 1.6;">${linkifyEscaped(
              escapeHtml(part).replace(/\n/g, "<br>")
            )}</p>`
        )
        .join("\n");
    case "heading":
      return `<h2 style="color: ${BRAND.purpleDark}; margin: 24px 0 12px;">${escapeHtml(
        block.text
      )}</h2>`;
    case "button":
      return brandButton(escapeHtml(block.text), block.url);
    case "info":
      return infoBox(block.html);
    case "warning":
      return warningBox(block.html);
    case "success":
      return successBadge(escapeHtml(block.text));
    case "details":
      return detailsCard(
        block.rows
          .map(
            (row) =>
              `<p style="margin: 0 0 8px; color: #333;"><strong>${escapeHtml(
                row.label
              )}:</strong> ${escapeHtml(row.value)}</p>`
          )
          .join("\n")
      );
    case "link":
      return block.label
        ? `<p style="margin: 0 0 4px; color: #666; font-size: 14px;">${escapeHtml(
            block.label
          )}</p>\n${linkBox(block.url)}`
        : linkBox(block.url);
    case "divider":
      return `<hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;">`;
  }
}

/**
 * Injects a review banner directly after the opening `<body>` tag.
 *
 * Used to stamp "this is a draft" on preview renders so a reviewer can never
 * mistake a forwarded preview for the real send. `lines` are emitted as HTML
 * fragments (developer-authored copy, so inline `<strong>` is allowed) and are
 * prepended rather than appended so the warning is the first thing read.
 *
 * @param html A full HTML document; if it has no `<body>` the banner is prepended.
 * @param lines Banner copy, one `<div>` per line. Empty array returns `html`.
 * @returns The HTML with the banner injected.
 */
export function withDraftBanner(html: string, lines: string[]): string {
  if (lines.length === 0) return html;

  const rows = lines
    .map(
      (line) =>
        `<div style="margin: 0 0 4px; color: #4a1a40; font-size: 14px; line-height: 1.5;">${line}</div>`
    )
    .join("");

  const banner = `<div style="max-width: 600px; margin: 0 auto; background-color: ${BANNER_BG}; border-left: 4px solid ${BANNER_BORDER}; border-top: 4px solid ${BANNER_BORDER}; padding: 16px 24px; font-family: Arial, Helvetica, sans-serif;">${rows}</div>`;

  const bodyMatch = html.match(/<body[^>]*>/i);
  if (bodyMatch && bodyMatch.index !== undefined) {
    const insertAt = bodyMatch.index + bodyMatch[0].length;
    return html.slice(0, insertAt) + banner + html.slice(insertAt);
  }
  return banner + html;
}

/**
 * Adds a one-click opt-out line to a marketing message's footer.
 *
 * Every marketing email must carry an unsubscribe link, and until now the layout
 * engine had none — so `gateUnsubscribe` refused every marketing spec unless its
 * author had remembered to hand-write the placeholder into `footerExtra`. That
 * is the wrong shape: a gate should catch the case nobody thought of, not the
 * case that is true every single time. Adding it here makes a marketing send
 * correct by construction, and leaves the gate as the backstop it was meant to
 * be.
 *
 * The placeholder is substituted per recipient by the batch builders. An author
 * who has already written their own opt-out link keeps it; nothing is duplicated.
 *
 * @param spec The message being composed.
 * @returns The footer HTML to pass to the layout, or undefined when there is none.
 */
function withUnsubscribeFooter(spec: MessageSpec): string | undefined {
  if (spec.category !== "marketing") return spec.footerExtra;

  const existing = spec.footerExtra ?? "";
  if (existing.includes(UNSUBSCRIBE_URL_PLACEHOLDER)) return existing;

  const optOut =
    `<p style="margin: 8px 0 0; font-size: 12px;">` +
    `<a href="${UNSUBSCRIBE_URL_PLACEHOLDER}" style="color: inherit;">Unsubscribe</a>` +
    ` from these emails.</p>`;

  return existing ? `${existing}
${optOut}` : optOut;
}

/**
 * Renders a spec to HTML + plain text with the engine it declares.
 *
 * @param spec The validated message spec.
 * @param opts Render mode, optional draft banner, optional recipient for
 *   `{firstName}` personalization (layout engine only — the react engine leaves
 *   personalization to Resend merge tags).
 * @returns The rendered HTML, its plain-text alternative, and the HTML size in KB.
 */
export async function composeMessage(
  spec: MessageSpec,
  opts: ComposeOptions = {}
): Promise<ComposeResult> {
  const mode = opts.mode ?? "preview";
  let html: string;
  let text: string;

  if (spec.engine === "react") {
    const element = <AnnouncementEmail spec={spec} mode={mode} />;
    const [renderedHtml, renderedText] = await Promise.all([
      render(element),
      render(element, { plainText: true }),
    ]);
    html = renderedHtml;
    text = renderedText;
  } else {
    const firstName = opts.recipient?.firstName?.trim() || "there";
    const blocks = personalizeBlocks(spec.blocks, firstName);
    const contactEmail = spec.contactEmail ?? DEFAULT_CONTACT_EMAIL;

    html = brandedEmailLayout({
      title: personalize(spec.title, firstName),
      preheader: spec.preheader ? personalize(spec.preheader, firstName) : undefined,
      bodyHtml: blocks.map(blockToLayoutHtml).join("\n\n"),
      footerExtra: withUnsubscribeFooter(spec),
      contactEmail,
    });
    // The opt-out has to reach the plain-text part too. Some clients render
    // text only, and a marketing message whose only unsubscribe link is in the
    // HTML leaves those readers with the header alone, which not every client
    // surfaces. Substituted per recipient alongside the HTML.
    const optOutText =
      spec.category === "marketing"
        ? `\n\nUnsubscribe: ${UNSUBSCRIBE_URL_PLACEHOLDER}`
        : "";
    text = `${blocksToText(blocks)}\n\nQuestions? ${contactEmail}${optOutText}`;
  }

  if (opts.draftBanner && opts.draftBanner.length > 0) {
    html = withDraftBanner(html, opts.draftBanner);
  }

  return {
    html,
    text,
    sizeKb: Buffer.byteLength(html, "utf8") / 1024,
    engine: spec.engine,
  };
}
