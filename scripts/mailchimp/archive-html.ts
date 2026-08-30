/**
 * Turns one Mailchimp campaign body into an HTML file this repository can hold.
 *
 * WHY THERE IS A SANITISER AT ALL
 * ------------------------------
 * The newsletter back catalogue is not on She Sharp's site. 51 of the 59 cards
 * on `/resources/newsletters` open a **Mailchimp-hosted** page, and the founder
 * is about to cancel the paid subscription. Mailchimp documents nothing about
 * what a downgrade or a pause does to those hosted pages — checked 2026-08-30
 * against both of its own help pages — so the honest response is the cheap
 * ordering rather than a prediction: archive first, cancel second. See
 * `docs/deployment/MAILCHIMP_CANCELLATION.md` §3 and §4.
 *
 * What comes out of the vault is a *sent email*, and a sent email is not a page
 * this organisation may republish as-is. It carries Mailchimp's unsubscribe
 * footer, its rewards badge, a recipient-identifying `e=` parameter, and — in
 * two campaigns — click-tracking links keyed to a real person. This module is
 * the one place those are removed, and `archive-guard.test.ts` is the CI check
 * that none of them came back.
 *
 * WHY `archive_html` AND NOT `html`
 * ---------------------------------
 * Each `content/<id>.json` in the vault holds both. They have complementary
 * defects, measured over all 180 files on 2026-08-30:
 *
 *              | `html` | `archive_html`
 *   non-empty  |   179  |   179
 *   merge tags |   179  |     0      (`*|UNSUB|*` and 22 others)
 *   list-manage|     2  |   179
 *
 * `archive_html` is Mailchimp's own archive render, with the merges already
 * resolved — which is why every body of it contains `list-manage.com`: that is
 * the resolved footer, and the footer is the thing this module deletes. Reading
 * `html` instead would trade one deletable block for 179 files of unresolved
 * merge tags in the middle of the copy.
 *
 * WHAT IS DELIBERATELY LEFT ALONE
 * -------------------------------
 * Image `src` attributes and `mailchi.mp` cross-links between issues stay, and
 * are **marked** with `data-mc-*` attributes instead. Re-hosting the images on
 * Vercel Blob is PR 2 and repointing the cross-links on-site is PR 3; both are
 * mechanical rewrites over a marker, and a marker is machine-findable in a way
 * that a guess made here would not be.
 *
 * It knows nothing about the vault and reads no files, so the CI guard can
 * import it on a checkout that has neither.
 */
import * as cheerio from "cheerio";

import { isWithheldAsset } from "./withheld-images";

/**
 * Every email address allowed to survive into a generated file.
 *
 * The corpus holds exactly seven distinct addresses across 180 bodies. Four are
 * She Sharp role mailboxes and stay; `careers@flexware.co.nz` is a company role
 * address inside a 2022 job advert and stays, because public business contact
 * information in a job listing is what it was published as. The other two are
 * handled by {@link PERSONAL_ADDRESS} and {@link HISTORIC_ADDRESS}.
 *
 * The four `@shesharp.org.nz` locals are cross-checked against `OWN_MAILBOXES`
 * by the guard: publishing an invitation to write to a mailbox that does not
 * exist is the failure `scripts/email/published-addresses.test.ts` was written
 * for, and an archive page is as publishable a surface as any other.
 */
export const ALLOWED_ADDRESSES = [
  "info@shesharp.org.nz",
  "events@shesharp.org.nz",
  "industry@shesharp.org.nz",
  "newsletter@shesharp.org.nz",
  "careers@flexware.co.nz",
] as const;

/**
 * A named individual's personal address, in a `mailto:` CTA button that ran in
 * the footer of fourteen consecutive monthly issues (2024-09 → 2025-05).
 *
 * De-linked rather than rewritten: the button keeps its text and its styling
 * and stops being a link. Re-publishing a private person's address permanently,
 * on a public site, years after they held that role, is not warranted — and the
 * archive still records it, verbatim, in the private vault.
 */
export const PERSONAL_ADDRESS = "shae.parsons@hotmail.com";

/**
 * She Sharp's own historic mailbox, in seven bodies from 2020-05 → 2021-03
 * ("Questions? Feedback? drop us a line at…", and a refund contact).
 *
 * Rewritten rather than de-linked, because the invitation to write in is the
 * organisation's own and still stands — but the mailbox is almost certainly
 * dead, and a dead published address is exactly what
 * `scripts/email/published-addresses.test.ts` exists to stop.
 */
export const HISTORIC_ADDRESS = "shesharp.nz@gmail.com";
export const HISTORIC_ADDRESS_REPLACEMENT = "info@shesharp.org.nz";

/** How `campaign-images.json` classifies one image URL. */
export type ArchiveImageClass =
  | "gallery-original"
  | "mailchimp-chrome"
  | "content-not-in-gallery"
  | "third-party";

/** What the crosswalk knows about one image URL in a body. */
export interface ArchiveImage {
  classification: ArchiveImageClass;
  /** Vault-relative path of the downloaded file, or null when the image is lost. */
  file: string | null;
  sha256: string | null;
}

export interface SanitiseOptions {
  /** The campaign this body belongs to, so a self-link can be told from a cross-link. */
  campaignId: string;
  /** The `campaign-images.json` crosswalk, keyed by the URL as it appears in the body. */
  imageByUrl: (url: string) => ArchiveImage | undefined;
  /** Resolves a `mailchi.mp` / `campaign-archive.com` / `eepurl.com` URL to a campaign id. */
  campaignIdForArchiveUrl: (url: string) => string | null;
}

/** Everything the sanitiser changed, so a run reports rather than asserts silently. */
export interface SanitiseStats {
  scriptsRemoved: number;
  footerBlocksRemoved: number;
  footerNodesRemoved: number;
  chromeImagesRemoved: number;
  emptiedAnchorsRemoved: number;
  trackClickDelinked: number;
  personalAddressDelinked: number;
  historicAddressRewritten: number;
  recipientParamsStripped: number;
  imagesMarked: number;
  imagesUnknown: number;
  imagesLost: number;
  imagesWithheld: number;
  archiveLinksMarked: number;
  archiveLinksUnresolved: number;
  legacyDomainLinks: number;
}

export interface SanitiseResult {
  html: string;
  stats: SanitiseStats;
}

/**
 * Hosts whose links are Mailchimp's own plumbing rather than She Sharp's copy:
 * the unsubscribe/preferences footer, the forward-to-a-friend widget, and the
 * "Email Marketing Powered by Mailchimp" rewards badge.
 */
function isFooterHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "list-manage.com" ||
    h.endsWith(".list-manage.com") ||
    h === "forward-to-friend.com" ||
    h.endsWith(".forward-to-friend.com") ||
    h === "login.mailchimp.com"
  );
}

/** Hosts that carry a link from one archived issue to another. */
function isArchiveHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "mailchi.mp" ||
    h.endsWith(".mailchi.mp") ||
    h === "eepurl.com" ||
    h.endsWith(".campaign-archive.com") ||
    h === "campaign-archive.com"
  );
}

/**
 * Mailchimp's click-tracking redirector. The destination is NOT recoverable
 * offline — the URL carries only an opaque link id — and following one would
 * register a click on a real recipient's record, because the `e=` parameter on
 * these is a live subscriber hash rather than the `[UNIQID]` placeholder the
 * footer links carry.
 *
 * Two campaigns are affected: `c186979078` (5 links, hash `b077303923`) and
 * `9db594f92d` (2 links, hash `9630a01798`). Both are de-linked — the anchor
 * text survives, the href does not.
 */
function isTrackClick(url: URL): boolean {
  return isFooterHost(url.hostname) && url.pathname.startsWith("/track/click");
}

/** The old Webflow domain, kept as a marker so PR 3 can repoint it knowingly. */
function isLegacyDomain(host: string): boolean {
  const h = host.toLowerCase();
  return h === "shesharp.co.nz" || h.endsWith(".shesharp.co.nz");
}

function parseUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

/**
 * Removes the per-recipient `e=` parameter from one URL.
 *
 * In `archive_html` it is usually the literal `[UNIQID]`, which is harmless but
 * meaningless; on the seven `track/click` links it is a real subscriber hash.
 * Both go: a stored value that identifies a recipient has no business in a
 * committed file, and the guard checks for `?e=` rather than for the hashes,
 * because a check that enumerates the two known hashes would pass on a third.
 */
function stripRecipientParam(raw: string): { url: string; stripped: boolean } {
  const url = parseUrl(raw);
  if (!url || !url.searchParams.has("e")) return { url: raw, stripped: false };

  url.searchParams.delete("e");
  let out = url.toString();
  // `new URL().toString()` keeps a bare `?` when the last param goes.
  if (out.endsWith("?")) out = out.slice(0, -1);
  return { url: out, stripped: true };
}

/**
 * Sanitises one `archive_html` body.
 *
 * @param html - The body exactly as the vault holds it.
 * @param options - The campaign id and the two lookups this module cannot do itself.
 * @returns The generated HTML and a count of every change made.
 */
export function sanitiseArchiveHtml(html: string, options: SanitiseOptions): SanitiseResult {
  const $ = cheerio.load(html);
  const stats: SanitiseStats = {
    scriptsRemoved: 0,
    footerBlocksRemoved: 0,
    footerNodesRemoved: 0,
    chromeImagesRemoved: 0,
    emptiedAnchorsRemoved: 0,
    trackClickDelinked: 0,
    personalAddressDelinked: 0,
    historicAddressRewritten: 0,
    recipientParamsStripped: 0,
    imagesMarked: 0,
    imagesUnknown: 0,
    imagesLost: 0,
    imagesWithheld: 0,
    archiveLinksMarked: 0,
    archiveLinksUnresolved: 0,
    legacyDomainLinks: 0,
  };

  // 1. Scripts. Zero of the 180 bodies contain one; removing them anyway costs
  //    nothing and means the guard is asserting an invariant rather than an
  //    accident of what Mailchimp happened to send.
  stats.scriptsRemoved = $("script").length;
  $("script").remove();
  $("*").each((_, element) => {
    // `.each()` over `*` is typed as AnyNode because the document node can
    // reach it; only elements carry attributes.
    if (!("attribs" in element)) return;
    for (const name of Object.keys(element.attribs)) {
      if (/^on[a-z]+$/i.test(name)) $(element).removeAttr(name);
    }
  });

  // 2. The Mailchimp footer. Its anchors are the only reliable marker across
  //    the four template generations in this corpus — the containing block is
  //    `#canspamBarWrapper` in the 2019 templates, `div.mceText` in the new
  //    editor's, and `td.mcnTextContent` in between — so the block is found
  //    FROM the anchor rather than by a selector that would have to know all
  //    four. `track/click` is excluded here and handled below: it is a content
  //    link that happens to sit on the same host, and removing its container
  //    would delete real copy.
  const FOOTER_BLOCKS = "#canspamBarWrapper, div.mceText, td.mcnTextContent";
  $("a[href]").each((_, element) => {
    const url = parseUrl($(element).attr("href") ?? "");
    if (!url || !isFooterHost(url.hostname) || isTrackClick(url)) return;
    // A footer holds two or three of these anchors and `.each()` iterates over a
    // snapshot, so the second one is visited after its block has already been
    // detached. Removing a detached subtree is harmless but counting it is not:
    // it would report three footers where the page had one.
    if ($(element).closest("html").length === 0) return;

    const block = $(element).closest(FOOTER_BLOCKS);
    if (block.length > 0) {
      block.remove();
      stats.footerBlocksRemoved++;
    } else {
      // A footer-host link outside any recognised block: the forward-to-friend
      // and rewards-badge icons in the social row. The icon is the whole link,
      // so removing the anchor removes the widget and nothing else.
      $(element).remove();
      stats.footerNodesRemoved++;
    }
  });

  // The 2019 template ships a `<style>` block whose only rules target the
  // footer bar that has just gone.
  $("style").each((_, element) => {
    if ($(element).html()?.includes("canspamBar")) $(element).remove();
  });

  // 3. Mailchimp's own furniture. `campaign-images.json` classifies 75 of the
  //    545 image URLs as `mailchimp-chrome` — social icons and the rewards
  //    badge. They are Mailchimp's artwork, not She Sharp's, and PR 2 must not
  //    re-host them. Where the icon was the entire content of a link, the now
  //    empty anchor goes too, or the page keeps an invisible clickable gap.
  $("img[src]").each((_, element) => {
    const src = $(element).attr("src") ?? "";
    if (options.imageByUrl(src)?.classification !== "mailchimp-chrome") return;

    const parent = $(element).parent("a");
    $(element).remove();
    stats.chromeImagesRemoved++;
    if (parent.length > 0 && parent.children().length === 0 && parent.text().trim() === "") {
      parent.remove();
      stats.emptiedAnchorsRemoved++;
    }
  });

  // 4. The two address decisions that touch links. The third address,
  //    `careers@flexware.co.nz`, is deliberately untouched.
  $("a[href]").each((_, element) => {
    const href = $(element).attr("href") ?? "";
    if (!href.toLowerCase().startsWith("mailto:")) return;

    if (href.toLowerCase().includes(PERSONAL_ADDRESS)) {
      // Drop the href, keep the element: the button's purple styling lives on
      // the anchor, so unwrapping it would change the page as well as the link.
      $(element).removeAttr("href").attr("data-mc-delinked", "personal-address");
      stats.personalAddressDelinked++;
      return;
    }
    if (href.toLowerCase().includes(HISTORIC_ADDRESS)) {
      $(element).attr("href", href.replace(HISTORIC_ADDRESS, HISTORIC_ADDRESS_REPLACEMENT));
      stats.historicAddressRewritten++;
    }
  });

  // 5. The opaque click-tracking links. See {@link isTrackClick}.
  $("a[href]").each((_, element) => {
    const url = parseUrl($(element).attr("href") ?? "");
    if (!url || !isTrackClick(url)) return;
    $(element).removeAttr("href").attr("data-mc-delinked", "opaque-track-click");
    stats.trackClickDelinked++;
  });

  // 6. Markers for PR 2 and PR 3, and the `e=` strip. One pass over every
  //    URL-bearing attribute so nothing is reached by two different rules.
  const URL_ATTRS = ["href", "src", "background", "srcset", "action"] as const;
  $("*").each((_, element) => {
    const node = $(element);
    for (const attr of URL_ATTRS) {
      const value = node.attr(attr);
      if (!value) continue;
      const { url, stripped } = stripRecipientParam(value);
      if (stripped) {
        node.attr(attr, url);
        stats.recipientParamsStripped++;
      }
    }

    const tag = "tagName" in element ? element.tagName.toLowerCase() : undefined;
    if (tag === "img") {
      const src = node.attr("src") ?? "";
      const image = options.imageByUrl(src);
      if (!image) {
        stats.imagesUnknown++;
      } else if (isWithheldAsset(image.file)) {
        // Withheld BEFORE the marker is written, never removed afterwards. PR 2
        // selects `img[data-mc-asset]`, so an image that never gets that
        // attribute cannot be re-hosted by it — the exclusion is structural
        // rather than a note somebody has to remember to read. A deliberately
        // different marker from `data-mc-asset-lost`: that one is gone, this one
        // is a decision, and the two must stay tellable apart.
        // See `withheld-images.ts` for the list and the reason for each entry.
        node.attr("data-mc-asset-withheld", "1");
        stats.imagesWithheld++;
      } else if (image.file && image.sha256) {
        node.attr("data-mc-asset", image.file).attr("data-mc-sha256", image.sha256);
        stats.imagesMarked++;
      } else {
        // The single known loss: a Google user-content URL in the 2020-09-16
        // issue, HTTP 403 since before this archive existed. Marked so PR 2
        // reports it rather than rediscovering it as a broken fetch.
        node.attr("data-mc-asset-lost", "1");
        stats.imagesLost++;
      }
      return;
    }

    // The `<head>` of every 2020–2021 body carries `<meta property="og:url">`
    // pointing at the campaign's own `eepurl.com` short link — a Mailchimp URL
    // that would be served from shesharp.org.nz once these pages are on-site,
    // and one that dies with the account. It is not an anchor, so the rule
    // above never sees it; it gets the same marker so PR 3 can find every
    // Mailchimp URL with one selector rather than two.
    if (tag === "meta") {
      const property = node.attr("property")?.toLowerCase();
      const content = node.attr("content") ?? "";
      const metaUrl = property === "og:url" ? parseUrl(content) : null;
      if (metaUrl && isArchiveHost(metaUrl.hostname)) {
        const id = options.campaignIdForArchiveUrl(metaUrl.toString());
        node.attr("data-mc-campaign", id ?? "unresolved");
        if (id === options.campaignId) node.attr("data-mc-campaign-self", "1");
        if (id) stats.archiveLinksMarked++;
        else stats.archiveLinksUnresolved++;
      }
      return;
    }

    if (tag !== "a") return;
    const url = parseUrl(node.attr("href") ?? "");
    if (!url) return;

    if (isArchiveHost(url.hostname)) {
      const id = options.campaignIdForArchiveUrl(url.toString());
      if (id) {
        node.attr("data-mc-campaign", id);
        if (id === options.campaignId) node.attr("data-mc-campaign-self", "1");
        stats.archiveLinksMarked++;
      } else {
        node.attr("data-mc-campaign", "unresolved");
        stats.archiveLinksUnresolved++;
      }
    } else if (isLegacyDomain(url.hostname)) {
      node.attr("data-mc-legacy-domain", "1");
      stats.legacyDomainLinks++;
    }
  });

  // 7. Backstop. Anything on a footer host that survived steps 2–5 is unwrapped
  //    (anchors keep their text) or removed (images). Nothing in the corpus
  //    reaches this today; it exists so that a template shape this module has
  //    never seen degrades into a de-linked page rather than into a published
  //    unsubscribe link.
  $("a[href]").each((_, element) => {
    const url = parseUrl($(element).attr("href") ?? "");
    if (url && isFooterHost(url.hostname)) {
      $(element).removeAttr("href").attr("data-mc-delinked", "mailchimp-host");
      stats.footerNodesRemoved++;
    }
  });
  $("img[src]").each((_, element) => {
    const url = parseUrl($(element).attr("src") ?? "");
    if (url && isFooterHost(url.hostname)) {
      $(element).remove();
      stats.footerNodesRemoved++;
    }
  });

  let out = $.html();

  // 8. Comments. The fourteen issues carrying the personal address hold a
  //    SECOND copy of it inside an `<!--[if mso]>` VML button fallback, which
  //    is a comment node and therefore invisible to every DOM rule above. Text
  //    substitution over comment bodies is the narrowest fix: the address goes,
  //    the Outlook fallback keeps its shape, and nothing outside a comment is
  //    touched.
  out = out.replace(/<!--[\s\S]*?-->/g, (comment) => {
    let next = comment;
    if (next.includes(PERSONAL_ADDRESS)) {
      next = next.replace(new RegExp(`mailto:${PERSONAL_ADDRESS}[^"'\\s>]*`, "g"), "#");
      next = next.split(PERSONAL_ADDRESS).join("");
    }
    if (next.includes(HISTORIC_ADDRESS)) {
      next = next.split(HISTORIC_ADDRESS).join(HISTORIC_ADDRESS_REPLACEMENT);
    }
    return next;
  });

  // 9. Any remaining plain-text mention. `shesharp.nz@gmail.com` is written out
  //    as the visible link text as well as the href in all seven bodies, so the
  //    href rewrite alone would leave the dead address on the page.
  if (out.includes(HISTORIC_ADDRESS)) {
    out = out.split(HISTORIC_ADDRESS).join(HISTORIC_ADDRESS_REPLACEMENT);
  }
  if (out.includes(PERSONAL_ADDRESS)) {
    out = out.split(PERSONAL_ADDRESS).join("");
  }

  return { html: `${out.trimEnd()}\n`, stats };
}

/** One thing wrong with a generated file. */
export interface Violation {
  rule: string;
  detail: string;
}

/**
 * Image extensions that make an `@` look like an address.
 *
 * Four Slack emoji survive in the corpus as third-party content images, named
 * `1f49c@2x.png` and friends. A plain address regex reads `1f49c@2x.png` as
 * `1f49c` at the domain `2x.png` — the same false positive that made the
 * Mailchimp manifest record image rows without their URLs. Excluding the
 * extension is narrower than excluding the whole host.
 */
const IMAGE_EXTENSIONS = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i;

const ADDRESS_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Every address in a generated file that is not on {@link ALLOWED_ADDRESSES}. */
export function unlistedAddresses(html: string): string[] {
  const allowed = new Set<string>(ALLOWED_ADDRESSES);
  const found = new Set<string>();
  for (const match of html.matchAll(ADDRESS_RE)) {
    const address = match[0].toLowerCase();
    if (IMAGE_EXTENSIONS.test(address)) continue;
    if (allowed.has(address)) continue;
    found.add(address);
  }
  return [...found].sort();
}

/**
 * What is being scanned. The rules are the same but one, and that one exception
 * was found by running this check rather than by reasoning about it.
 *
 * `index` is `index.json`, whose `subject` field is Mailchimp's **stored**
 * subject line — a template, resolved per recipient at send time. One 2023
 * campaign really was sent with `*|FNAME|*, let us know what you think!` as its
 * subject, so an unresolved merge tag there is the record being faithful, not a
 * body extracted from the wrong field. Whoever renders a card title in PR 3 has
 * to decide what to do with it; deleting it here would hide the decision.
 */
export type ScanContext = "body" | "index";

/**
 * Every rule a generated file must satisfy.
 *
 * Written as data, and shared by the extractor and the CI guard, so the two can
 * never drift into disagreeing about what "sanitised" means. The extractor
 * refuses to write a file that fails one; the guard re-checks the files on
 * disk, because the thing CI has to defend against is the file, not the run
 * that produced it.
 */
export function scanSanitised(html: string, context: ScanContext = "body"): Violation[] {
  const violations: Violation[] = [];

  const patterns: Array<{ rule: string; re: RegExp; why: string; bodyOnly?: boolean }> = [
    { rule: "no-script", re: /<script\b/i, why: "executable markup in an archived page" },
    {
      rule: "no-list-manage",
      re: /list-manage\.com/i,
      why: "a live Mailchimp subscription link — unsubscribe, preferences, or click tracking",
    },
    {
      rule: "no-forward-to-friend",
      re: /forward-to-friend/i,
      why: "Mailchimp's forward widget, which posts to Mailchimp",
    },
    {
      rule: "no-rewards-badge",
      re: /login\.mailchimp\.com/i,
      why: "the 'Email Marketing Powered by Mailchimp' referral badge",
    },
    {
      rule: "no-recipient-param",
      re: /[?&](?:amp;)?e=/i,
      why: "the per-recipient `e=` parameter",
    },
    {
      rule: "no-merge-tags",
      re: /\*\|[^|\n]{1,60}\|\*/,
      why: "an unresolved Mailchimp merge tag — this body came from `html`, not `archive_html`",
      bodyOnly: true,
    },
  ];

  for (const { rule, re, why, bodyOnly } of patterns) {
    if (bodyOnly && context !== "body") continue;
    const match = re.exec(html);
    if (match) violations.push({ rule, detail: `${why}: ${excerpt(html, match.index)}` });
  }

  for (const address of unlistedAddresses(html)) {
    violations.push({
      rule: "no-unlisted-address",
      detail: `${address} is not in ALLOWED_ADDRESSES in scripts/mailchimp/archive-html.ts`,
    });
  }

  return violations;
}

/** A short window around a match, so a failure names the place and not just the rule. */
function excerpt(html: string, index: number): string {
  return html
    .slice(Math.max(0, index - 60), index + 90)
    .replace(/\s+/g, " ")
    .trim();
}
