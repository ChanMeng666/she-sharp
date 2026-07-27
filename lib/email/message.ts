/**
 * Portable email message model shared by every She Sharp sending script.
 *
 * A `MessageSpec` is the single, engine-agnostic description of one outgoing
 * email: who it is from, what it says, and which rendering engine turns it into
 * HTML. Content is expressed as a small closed set of `Block`s so the same spec
 * can be rendered through the transactional inline-HTML layout
 * (`lib/email/layout.ts`) or through the react-email announcement template
 * (`emails/announcement.tsx`) without rewriting copy.
 *
 * Trust model: every block field is treated as untrusted plain text and is
 * HTML-escaped at render time, EXCEPT `info.html`, `warning.html` and
 * `MessageSpec.footerExtra`, which are declared to already be HTML.
 */

import { z } from "zod";

/**
 * One unit of email body content.
 *
 * `paragraph.text` supports `[label](url)` inline links and blank-line
 * separated sub-paragraphs; `info.html` / `warning.html` are raw HTML.
 */
export type Block =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "button"; text: string; url: string }
  | { type: "info"; html: string }
  | { type: "warning"; html: string }
  | { type: "success"; text: string }
  | { type: "details"; rows: { label: string; value: string }[] }
  | { type: "link"; label?: string; url: string }
  | { type: "divider" };

/** A fully specified outgoing email, before rendering. */
export interface MessageSpec {
  /** Idempotency key prefix, kebab-case, e.g. "contact-reply-12". */
  key: string;
  /** Which renderer turns the blocks into HTML. */
  engine: "layout" | "react";
  /** Sending intent — drives the unsubscribe gate and the audience rules. */
  category: "transactional" | "marketing";
  /** RFC-ish From header: `Name <local@domain>` or a bare address. */
  from: string;
  replyTo?: string;
  subject: string;
  preheader?: string;
  /** H1 of the branded layout / the headline of the announcement template. */
  title: string;
  blocks: Block[];
  /** Extra HTML appended inside the footer (declared to be HTML). */
  footerExtra?: string;
  /** Overrides the default "Questions?" contact address in the footer. */
  contactEmail?: string;
  /** Resend tags attached to the send. */
  tags?: { name: string; value: string }[];
  /** Cover photo shown under the masthead. Only honoured by engine="react". */
  cover?: { url: string; alt: string } | null;
}

/** kebab-case idempotency key, e.g. "contact-reply-12". */
const keyPattern = /^[a-z0-9][a-z0-9-]*$/;

/**
 * `Name <local@domain>` or a bare `local@domain`. Deliberately loose on the
 * display name (it may contain spaces, dots, ampersands) and strict-enough on
 * the address to catch typos like a missing TLD.
 */
const fromPattern = /^(?:[^<>]+\s<[^@<>\s]+@[^@<>\s.]+(?:\.[^@<>\s.]+)+>|[^@<>\s]+@[^@<>\s.]+(?:\.[^@<>\s.]+)+)$/;

const detailRowSchema = z.object({
  label: z.string().min(1),
  value: z.string(),
});

/** Discriminated-union schema mirroring {@link Block}. */
export const blockSchema: z.ZodType<Block> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string().min(1) }),
  z.object({ type: z.literal("heading"), text: z.string().min(1) }),
  z.object({
    type: z.literal("button"),
    text: z.string().min(1),
    url: z.string().url(),
  }),
  z.object({ type: z.literal("info"), html: z.string().min(1) }),
  z.object({ type: z.literal("warning"), html: z.string().min(1) }),
  z.object({ type: z.literal("success"), text: z.string().min(1) }),
  z.object({
    type: z.literal("details"),
    rows: z.array(detailRowSchema).min(1),
  }),
  z.object({
    type: z.literal("link"),
    label: z.string().min(1).optional(),
    url: z.string().url(),
  }),
  z.object({ type: z.literal("divider") }),
]);

/** Schema mirroring {@link MessageSpec}. */
export const messageSpecSchema: z.ZodType<MessageSpec> = z.object({
  key: z
    .string()
    .regex(keyPattern, "must be kebab-case (lowercase letters, digits, hyphens)"),
  engine: z.enum(["layout", "react"]),
  category: z.enum(["transactional", "marketing"]),
  from: z
    .string()
    .regex(fromPattern, 'must look like "Name <local@domain>" or "local@domain"'),
  replyTo: z.string().email().optional(),
  subject: z.string().min(1).max(200),
  preheader: z.string().optional(),
  title: z.string().min(1),
  blocks: z.array(blockSchema).min(1),
  footerExtra: z.string().optional(),
  contactEmail: z.string().email().optional(),
  tags: z
    .array(z.object({ name: z.string().min(1), value: z.string().min(1) }))
    .optional(),
  cover: z
    .object({ url: z.string().url(), alt: z.string().min(1) })
    .nullable()
    .optional(),
});

/**
 * Validates an unknown value as a `MessageSpec`.
 *
 * @param raw Parsed JSON (or an object literal) describing the message.
 * @returns The validated spec.
 * @throws Error listing every zod issue as `path: message`, so a script author
 *   sees all problems at once instead of fixing them one round-trip at a time.
 */
export function parseMessageSpec(raw: unknown): MessageSpec {
  const result = messageSpecSchema.safeParse(raw);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `  - ${path}: ${issue.message}`;
    })
    .join("\n");
  throw new Error(`Invalid MessageSpec:\n${issues}`);
}

/** Strips `[label](url)` markdown down to `label (url)` for plain text. */
function inlineLinksToText(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");
}

/** Crudely flattens declared-HTML fields (info/warning) into readable text. */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Builds the plain-text alternative directly from the blocks.
 *
 * Generating from the source blocks (rather than reverse-parsing the rendered
 * HTML) keeps the text part stable no matter which engine produced the HTML.
 *
 * @param blocks The message body blocks.
 * @returns Plain text with blank lines between blocks (no trailing newline).
 */
export function blocksToText(blocks: Block[]): string {
  const parts: string[] = [];

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph":
        parts.push(inlineLinksToText(block.text.trim()));
        break;
      case "heading":
        parts.push(block.text.trim().toUpperCase());
        break;
      case "button":
        parts.push(`${block.text.trim()}: ${block.url}`);
        break;
      case "info":
      case "warning":
        parts.push(htmlToText(block.html));
        break;
      case "success":
        parts.push(block.text.trim());
        break;
      case "details":
        parts.push(
          block.rows.map((row) => `${row.label}: ${row.value}`).join("\n")
        );
        break;
      case "link": {
        if (!block.label) {
          parts.push(block.url);
          break;
        }
        const label = block.label.trim().replace(/:$/, "");
        parts.push(`${label}: ${block.url}`);
        break;
      }
      case "divider":
        parts.push("---");
        break;
    }
  }

  return parts.filter((part) => part.length > 0).join("\n\n");
}
