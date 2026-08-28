/**
 * Pre-send gates for outgoing She Sharp email.
 *
 * Every sending script renders a `MessageSpec` and then runs the rendered HTML
 * and text through `runEmailGates` before a single message leaves the machine.
 * Gates are deliberately dumb string checks — they catch the failure modes that
 * are invisible in a local preview but obvious (and unfixable) in a subscriber's
 * inbox: Gmail clipping, Outlook breaking on WebP, relative URLs that resolve to
 * nothing outside the site, missing unsubscribe links, leaked API keys.
 *
 * `fail` blocks the send. `warn` is advisory (subject length, single-CTA
 * discipline). `redactionCandidates` blocks nothing at all: it is a list of
 * "you probably did not mean to publish this" strings for a human to eyeball in
 * the plan block before approving.
 */

import type { MessageSpec } from "./message";
import {
  SENDING_DOMAIN,
  extractAddress,
  isApprovedSender,
  isOnSendingDomain,
  listApprovedSenders,
} from "./senders";

export type GateLevel = "fail" | "warn";

/**
 * Which render is being checked. `"broadcast"` is what actually ships and is
 * therefore the strict default; `"preview"` relaxes only the checks that a
 * preview render cannot satisfy by construction.
 */
export type GateMode = "broadcast" | "preview";

export interface GateResult {
  id: string;
  level: GateLevel;
  message: string;
}

export interface GateReport {
  /** True when nothing failed; warnings do not block a send. */
  ok: boolean;
  sizeKb: number;
  failures: GateResult[];
  warnings: GateResult[];
  /** Human-readable one-liners for the plan block's `Redactions:` line. */
  redactionCandidates: string[];
}

/** Gmail clips messages larger than ~102KB; stay comfortably under. */
const GMAIL_CLIP_KB = 100;

/** Image formats every major client (including Outlook) can render. */
const SAFE_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png"]);

/**
 * The only Resend merge tags we allow into rendered HTML.
 *
 * `RESEND_UNSUBSCRIBE_URL` was removed when the newsletter moved off Resend
 * broadcasts: nothing emits it any more, templates carry
 * `UNSUBSCRIBE_URL_PLACEHOLDER` instead, and leaving it permitted meant a
 * template that still had the old tag would sail through this gate and deliver
 * an inert string where the opt-out link belongs.
 *
 * `contact.first_name` stays, because Resend still substitutes it on the
 * broadcast path that `/email-the-community` uses today. It is NOT substitutable
 * on the batch path — `build-batch.ts` refuses any surviving triple-brace tag
 * for exactly that reason, which is the right place for the check, since this
 * gate is shared with the broadcast path where the tag is legitimate.
 */
const ALLOWED_MERGE_TAGS = new Set(["contact.first_name"]);

/** Credential shapes that must never appear in an email body. */
const SECRET_PATTERNS: { label: string; re: RegExp }[] = [
  { label: "Resend API key (re_…)", re: /\bre_[A-Za-z0-9_-]{10,}/ },
  { label: "Slack token (xox…)", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },
  { label: "OpenAI key (sk-…)", re: /\bsk-[A-Za-z0-9]{20,}/ },
  { label: "Bearer token", re: /Bearer\s+[A-Za-z0-9._-]{16,}/ },
  { label: "URL query token (?token=…)", re: /[?&]token=/ },
];

/** Words that put a nearby uppercase token under suspicion of being a code. */
const CODE_KEYWORDS = ["code", "promo", "voucher", "discount", "access", "passcode"];

/** How many characters either side of a keyword count as "nearby". */
const CODE_PROXIMITY = 60;

/** Caps how many offenders a single gate message enumerates. */
const MAX_LISTED = 5;

/** Joins offenders into a short, readable list with an overflow hint. */
function listOffenders(values: string[]): string {
  const shown = values.slice(0, MAX_LISTED).join(", ");
  const extra = values.length - MAX_LISTED;
  return extra > 0 ? `${shown} (+${extra} more)` : shown;
}

/** Deduplicates while preserving first-seen order. */
function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

/** Extracts every `src`/`href` attribute value, with the owning tag name. */
function extractAttributeUrls(html: string): { tag: string; attr: string; value: string }[] {
  const out: { tag: string; attr: string; value: string }[] = [];
  const tagRe = /<([a-z][a-z0-9]*)\b([^>]*)>/gi;
  const attrRe = /\b(src|href)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRe.exec(html)) !== null) {
    const tag = tagMatch[1].toLowerCase();
    const attrs = tagMatch[2];
    let attrMatch: RegExpExecArray | null;
    attrRe.lastIndex = 0;
    while ((attrMatch = attrRe.exec(attrs)) !== null) {
      out.push({
        tag,
        attr: attrMatch[1].toLowerCase(),
        value: (attrMatch[2] ?? attrMatch[3] ?? "").trim(),
      });
    }
  }
  return out;
}

/** URL values that legitimately are not absolute https links. */
function isExemptUrl(value: string): boolean {
  if (value.length === 0) return true;
  if (value.startsWith("#")) return true;
  if (/^(mailto:|tel:)/i.test(value)) return true;
  // A merge tag stands in for a real https URL supplied by Resend at send time.
  if (value.startsWith("{{{")) return true;
  return false;
}

/** Lowercased file extension of a URL path, ignoring query string and hash. */
function urlExtension(value: string): string | null {
  const path = value.split(/[?#]/, 1)[0];
  const segment = path.slice(path.lastIndexOf("/") + 1);
  const dot = segment.lastIndexOf(".");
  if (dot <= 0 || dot === segment.length - 1) return null;
  return segment.slice(dot + 1).toLowerCase();
}

/**
 * Every absolute http(s) URL appearing anywhere in the rendered message.
 * Trailing sentence punctuation is stripped so a URL ending a sentence still
 * matches host rules (e.g. "…vercel.app." must still read as a .vercel.app host).
 */
function extractUrls(haystack: string): string[] {
  const matches = haystack.match(/https?:\/\/[^\s"'<>)\]]+/gi) ?? [];
  return unique(matches.map((url) => url.replace(/[.,;:!?]+$/, "")));
}

/** Counts emoji (Extended_Pictographic) code points in a string. */
function countEmoji(value: string): number {
  return (value.match(/\p{Extended_Pictographic}/gu) ?? []).length;
}

/** size-100kb — Gmail clips oversized messages, hiding the unsubscribe link. */
function gateSize(sizeKb: number): GateResult[] {
  if (sizeKb <= GMAIL_CLIP_KB) return [];
  return [
    {
      id: "size-100kb",
      level: "fail",
      message:
        `Rendered HTML is ${sizeKb.toFixed(1)}KB, over the ${GMAIL_CLIP_KB}KB budget. ` +
        `Gmail clips messages above ~102KB, hiding the footer and unsubscribe link. ` +
        `Trim copy or images.`,
    },
  ];
}

/** absolute-urls — relative or http:// links break once the mail leaves the site. */
function gateAbsoluteUrls(urls: { value: string }[]): GateResult[] {
  const bad = unique(
    urls
      .map((u) => u.value)
      .filter((value) => {
        if (isExemptUrl(value)) return false;
        if (!value.toLowerCase().startsWith("https://")) return true;
        return /localhost|127\.0\.0\.1/i.test(value);
      })
  );
  if (bad.length === 0) return [];
  return [
    {
      id: "absolute-urls",
      level: "fail",
      message:
        `Every src/href must be an absolute https:// URL (mailto:, tel:, #anchors ` +
        `and {{{merge tags}}} excepted). Offending: ${listOffenders(bad)}`,
    },
  ];
}

/** image-format — Outlook cannot render WebP and shows a broken-image box. */
function gateImageFormat(urls: { tag: string; attr: string; value: string }[]): GateResult[] {
  const images = urls.filter((u) => u.tag === "img" && u.attr === "src" && !isExemptUrl(u.value));
  const webp: string[] = [];
  const other: string[] = [];

  for (const img of images) {
    const ext = urlExtension(img.value);
    if (ext === "webp") {
      webp.push(img.value);
    } else if (ext === null || !SAFE_IMAGE_EXTENSIONS.has(ext)) {
      other.push(ext === null ? `${img.value} (no file extension)` : img.value);
    }
  }

  const results: GateResult[] = [];
  if (webp.length > 0) {
    results.push({
      id: "image-format",
      level: "fail",
      message:
        `WebP image(s) found. Outlook (all desktop versions) cannot decode WebP and ` +
        `renders a broken-image placeholder — re-export as JPEG. Offending: ` +
        `${listOffenders(unique(webp))}`,
    });
  }
  if (other.length > 0) {
    results.push({
      id: "image-format",
      level: "fail",
      message:
        `Images must be .jpg/.jpeg/.png. Offending: ${listOffenders(unique(other))}`,
    });
  }
  return results;
}

/**
 * unsubscribe — marketing mail without a one-click opt-out is not sendable.
 *
 * Only the broadcast render ships, and only it carries the
 * `{{{RESEND_UNSUBSCRIBE_URL}}}` merge tag; the preview render deliberately
 * swaps that tag for an inert placeholder so a reviewer can open the file.
 * Enforcing this gate against a preview would therefore block previewing every
 * marketing email — so preview renders are exempt.
 */
function gateUnsubscribe(
  html: string,
  spec: MessageSpec,
  mode: GateMode
): GateResult[] {
  if (spec.category !== "marketing") return [];
  if (mode === "preview") return [];
  const hasMergeTag = html.includes("{{{RESEND_UNSUBSCRIBE_URL}}}");
  const hasHrefUnsubscribe = /href\s*=\s*["']https:\/\/[^"']*unsubscrib/i.test(html);
  const hasLabelledLink = /<a\b[^>]*href\s*=\s*["']https:\/\/[^"']*["'][^>]*>[^<]*unsubscrib/i.test(
    html
  );
  if (hasMergeTag || hasHrefUnsubscribe || hasLabelledLink) return [];
  return [
    {
      id: "unsubscribe",
      level: "fail",
      message:
        `category="marketing" requires an unsubscribe link: either the ` +
        `{{{RESEND_UNSUBSCRIBE_URL}}} merge tag or an https:// opt-out link in the footer.`,
    },
  ];
}

/** merge-tags — an unsubstituted or misspelled tag ships literal braces to inboxes. */
function gateMergeTags(html: string): GateResult[] {
  const results: GateResult[] = [];
  const tripleRe = /\{\{\{([^{}]*)\}\}\}/g;
  const unknown: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = tripleRe.exec(html)) !== null) {
    const name = match[1].split("|")[0].trim();
    if (!ALLOWED_MERGE_TAGS.has(name)) unknown.push(match[0]);
  }
  if (unknown.length > 0) {
    results.push({
      id: "merge-tags",
      level: "fail",
      message:
        `Unknown merge tag(s): ${listOffenders(unique(unknown))}. Allowed: ` +
        `{{{contact.first_name|fallback}}}. The unsubscribe URL is no longer a ` +
        `merge tag — templates emit UNSUBSCRIBE_URL_PLACEHOLDER and the send ` +
        `path substitutes a signed per-recipient URL.`,
    });
  }

  const withoutTriples = html.replace(tripleRe, "");
  const stray = unique(withoutTriples.match(/\{\{[^{}]*\}\}/g) ?? []);
  if (stray.length > 0 || /\{\{|\}\}/.test(withoutTriples)) {
    results.push({
      id: "merge-tags",
      level: "fail",
      message:
        `Double-brace template syntax found — Resend needs triple braces and will ` +
        `deliver {{…}} literally. Offending: ${
          stray.length > 0 ? listOffenders(stray) : "stray {{ or }} braces"
        }`,
    });
  }
  return results;
}

/** secret-scan — a credential pasted into copy would be broadcast verbatim. */
function gateSecrets(haystack: string): GateResult[] {
  const hits = SECRET_PATTERNS.filter((p) => p.re.test(haystack)).map((p) => p.label);
  if (hits.length === 0) return [];
  return [
    {
      id: "secret-scan",
      level: "fail",
      message:
        `Possible credential in the message body: ${hits.join(", ")}. ` +
        `Remove it and rotate the key if it was ever committed or sent.`,
    },
  ];
}

/** subject-length — long subjects truncate on mobile; emoji pile-ups read as spam. */
function gateSubject(spec: MessageSpec): GateResult[] {
  const results: GateResult[] = [];
  if (spec.subject.length > 50) {
    results.push({
      id: "subject-length",
      level: "warn",
      message: `Subject is ${spec.subject.length} chars; ≤50 survives mobile truncation.`,
    });
  }
  const emoji = countEmoji(spec.subject);
  if (emoji > 1) {
    results.push({
      id: "subject-length",
      level: "warn",
      message: `Subject has ${emoji} emoji; keep it to at most one.`,
    });
  }
  return results;
}

/** preheader-length — the inbox snippet should extend the subject, not repeat it. */
function gatePreheader(spec: MessageSpec): GateResult[] {
  const preheader = spec.preheader;
  if (!preheader) return [];
  const results: GateResult[] = [];
  if (preheader.length > 120) {
    results.push({
      id: "preheader-length",
      level: "warn",
      message: `Preheader is ${preheader.length} chars; inboxes cut it around 120.`,
    });
  }
  if (preheader.trim() === spec.subject.trim()) {
    results.push({
      id: "preheader-length",
      level: "warn",
      message: `Preheader duplicates the subject — use it to add a second hook instead.`,
    });
  }
  return results;
}

/**
 * from-identity — a From this organisation is not authorised to send as.
 *
 * The highest-value gate once the domain reaches DMARC `p=reject`: a typo such
 * as `info@shesharp.co.nz` fails alignment and is discarded by the receiver
 * with no bounce and no error, so the send looks successful and simply never
 * arrives. Catching it here turns a silent loss into a blocked send.
 */
function gateFromIdentity(spec: MessageSpec): GateResult[] {
  if (isApprovedSender(spec.from)) return [];
  const address = extractAddress(spec.from);
  const onDomain = isOnSendingDomain(spec.from);
  return [
    {
      id: "from-identity",
      level: "fail",
      message: onDomain
        ? `From address "${address}" is not an approved sender. Approved: ` +
          `${listApprovedSenders().join(", ")} (see lib/email/senders.ts).`
        : `From address "${address}" is not on ${SENDING_DOMAIN}. Resend signs ` +
          `with d=${SENDING_DOMAIN}, so any other domain loses DMARC alignment ` +
          `and is dropped without a bounce.`,
    },
  ];
}

/**
 * reply-to-domain — replies must land in a She Sharp mailbox.
 *
 * A volunteer's personal address as the Reply-To on organisational mail both
 * reads as a phishing pattern to filters and quietly routes members' personal
 * information to an account the organisation does not control.
 */
function gateReplyToDomain(spec: MessageSpec): GateResult[] {
  if (!spec.replyTo || isOnSendingDomain(spec.replyTo)) return [];
  return [
    {
      id: "reply-to-domain",
      level: "fail",
      message:
        `Reply-To "${spec.replyTo}" is not on ${SENDING_DOMAIN}. Route replies ` +
        `to a team mailbox (info@, mentoring@, website@) instead.`,
    },
  ];
}

/** Characters Resend accepts in a tag name or value. */
const TAG_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;

/**
 * tag-charset — Resend rejects tags outside `[A-Za-z0-9_-]`.
 *
 * The API returns an opaque error for this, and only after the send has already
 * been committed to. Checking locally costs nothing.
 */
function gateTagCharset(spec: MessageSpec): GateResult[] {
  const offenders = (spec.tags ?? [])
    .flatMap((tag) => [tag.name, tag.value])
    .filter((value) => !TAG_PATTERN.test(value));
  if (offenders.length === 0) return [];
  return [
    {
      id: "tag-charset",
      level: "fail",
      message:
        `Invalid tag name/value: ${listOffenders(unique(offenders))}. Resend ` +
        `allows ASCII letters, digits, "_" and "-" only (max 256 chars).`,
    },
  ];
}

/**
 * no-reply-path — mail nobody can answer.
 *
 * Gmail weights two-way conversation heavily, so an unrepliable From with no
 * Reply-To is a small standing cost to reputation. Advisory: some internal mail
 * legitimately wants no reply path.
 */
function gateNoReplyPath(spec: MessageSpec): GateResult[] {
  const address = extractAddress(spec.from);
  if (!address.startsWith("noreply@") || spec.replyTo) return [];
  return [
    {
      id: "no-reply-path",
      level: "warn",
      message:
        `From is ${address} with no Reply-To, so replies bounce. Set replyTo ` +
        `to a monitored mailbox.`,
    },
  ];
}

/** single-cta — competing buttons split clicks; one ask per email. */
function gateSingleCta(spec: MessageSpec): GateResult[] {
  const buttons = spec.blocks.filter((b) => b.type === "button").length;
  if (buttons <= 1) return [];
  return [
    {
      id: "single-cta",
      level: "warn",
      message: `${buttons} button blocks found; a single primary CTA converts better.`,
    },
  ];
}

/**
 * Collects strings that look like they were never meant to be published.
 * These block nothing — they are surfaced so a human can confirm each one.
 */
function collectRedactionCandidates(
  html: string,
  text: string,
  spec: MessageSpec
): string[] {
  const haystack = `${html}\n${text}`;
  const candidates: string[] = [];

  // Discount / access codes: an uppercase token sitting next to a code word.
  const keywordRe = new RegExp(`\\b(${CODE_KEYWORDS.join("|")})\\b`, "gi");
  const tokenRe = /\b[A-Z0-9]{6,12}\b/g;
  const seenCodes = new Set<string>();
  let keywordMatch: RegExpExecArray | null;
  while ((keywordMatch = keywordRe.exec(text)) !== null) {
    const start = Math.max(0, keywordMatch.index - CODE_PROXIMITY);
    const window = text.slice(start, keywordMatch.index + CODE_PROXIMITY);
    let tokenMatch: RegExpExecArray | null;
    tokenRe.lastIndex = 0;
    while ((tokenMatch = tokenRe.exec(window)) !== null) {
      const token = tokenMatch[0];
      if (CODE_KEYWORDS.includes(token.toLowerCase())) continue;
      if (seenCodes.has(token)) continue;
      seenCodes.add(token);
      candidates.push(
        `Possible access/discount code "${token}" near "${keywordMatch[0]}" — ` +
          `internal codes must not be published.`
      );
    }
  }

  // Meeting links carrying a passcode.
  const zoomRe = /zoom\.us\/j\/[^\s"'<>]*pwd=/i;
  for (const url of extractUrls(haystack)) {
    if (zoomRe.test(url)) {
      candidates.push(`Zoom join link with embedded passcode: ${url}`);
    }
  }
  const meetRe = /https?:\/\/meet\.google\.com\/[^\s"'<>]+/gi;
  let meetMatch: RegExpExecArray | null;
  const seenMeet = new Set<string>();
  while ((meetMatch = meetRe.exec(haystack)) !== null) {
    const window = haystack.slice(
      Math.max(0, meetMatch.index - 120),
      meetMatch.index + meetMatch[0].length + 120
    );
    if (!/passcode/i.test(window)) continue;
    const url = meetMatch[0].replace(/[.,;:!?]+$/, "");
    if (seenMeet.has(url)) continue;
    seenMeet.add(url);
    candidates.push(`Google Meet link with a passcode nearby: ${url}`);
  }

  // Internal/editable/infrastructure URLs.
  for (const url of extractUrls(haystack)) {
    let host = "";
    try {
      host = new URL(url).hostname.toLowerCase();
    } catch {
      host = "";
    }
    if (/(?:drive|docs)\.google\.com\/[^\s"'<>]*\/edit/i.test(url)) {
      candidates.push(`Editable Google Docs/Drive link (grants edit access): ${url}`);
    }
    if (host.endsWith("sharepoint.com")) {
      candidates.push(`SharePoint link (usually internal-only): ${url}`);
    }
    if (host.startsWith("admin.")) {
      candidates.push(`Admin host link: ${url}`);
    }
    if (host.endsWith(".vercel.app")) {
      candidates.push(`Preview deployment URL (not the public domain): ${url}`);
    }
    if (host.endsWith("slack.com") && /\/archives\//i.test(url)) {
      candidates.push(`Slack channel/message archive link (internal): ${url}`);
    }
    if (/[?&](invite|key)=/i.test(url)) {
      candidates.push(`URL carrying an invite/key parameter: ${url}`);
    }
  }

  // Third-party email addresses in the copy. `runEmailGates` does not know the
  // recipient, so the message's own addresses stand in as the allow-list.
  const ownAddresses = new Set(
    [spec.replyTo, spec.contactEmail, spec.from.match(/[^\s<>]+@[^\s<>]+/)?.[0]]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase())
  );
  const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  for (const address of unique(haystack.match(emailRe) ?? [])) {
    const lower = address.toLowerCase();
    if (lower.endsWith("@shesharp.org.nz")) continue;
    if (ownAddresses.has(lower)) continue;
    candidates.push(
      `Third-party email address in the body: ${address} — confirm it is meant to be shared.`
    );
  }

  return unique(candidates);
}

/**
 * Runs every pre-send gate over a rendered message.
 *
 * @param html The rendered HTML exactly as it would be sent.
 * @param text The plain-text alternative.
 * @param spec The spec the message was rendered from.
 * @param opts.mode Which render this is. Defaults to `"broadcast"` — the strict
 *   setting — so a caller that forgets to pass it is never under-checked.
 * @returns A report; `ok === false` must block the send.
 */
export function runEmailGates(
  html: string,
  text: string,
  spec: MessageSpec,
  opts: { mode?: GateMode } = {}
): GateReport {
  const mode: GateMode = opts.mode ?? "broadcast";
  const sizeKb = Buffer.byteLength(html, "utf8") / 1024;
  const attributeUrls = extractAttributeUrls(html);

  const results: GateResult[] = [
    ...gateSize(sizeKb),
    ...gateAbsoluteUrls(attributeUrls),
    ...gateImageFormat(attributeUrls),
    ...gateUnsubscribe(html, spec, mode),
    ...gateMergeTags(html),
    ...gateSecrets(`${html}\n${text}`),
    ...gateFromIdentity(spec),
    ...gateReplyToDomain(spec),
    ...gateTagCharset(spec),
    ...gateNoReplyPath(spec),
    ...gateSubject(spec),
    ...gatePreheader(spec),
    ...gateSingleCta(spec),
  ];

  const failures = results.filter((r) => r.level === "fail");
  const warnings = results.filter((r) => r.level === "warn");

  return {
    ok: failures.length === 0,
    sizeKb,
    failures,
    warnings,
    redactionCandidates: collectRedactionCandidates(html, text, spec),
  };
}

/**
 * Renders a gate report for a terminal.
 *
 * @param report The report from `runEmailGates`.
 * @returns A multi-line, ✓/✗-prefixed summary safe to print verbatim.
 */
export function formatGateReport(report: GateReport): string {
  const lines: string[] = [
    `Email gates — ${report.sizeKb.toFixed(1)}KB rendered`,
  ];

  for (const failure of report.failures) {
    lines.push(`  ✗ ${failure.id}: ${failure.message}`);
  }
  for (const warning of report.warnings) {
    lines.push(`  ! ${warning.id}: ${warning.message}`);
  }
  if (report.failures.length === 0) {
    lines.push(
      report.warnings.length === 0
        ? "  ✓ all gates passed"
        : "  ✓ no blocking failures (warnings above are advisory)"
    );
  }

  if (report.redactionCandidates.length > 0) {
    lines.push(`  Redactions to confirm (${report.redactionCandidates.length}):`);
    for (const candidate of report.redactionCandidates) {
      lines.push(`    · ${candidate}`);
    }
  }

  return lines.join("\n");
}
