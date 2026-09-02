/**
 * The CI guard over the on-site newsletter archive.
 *
 * Run: npx tsx scripts/mailchimp/archive-guard.test.ts
 *
 * WHY THIS EXISTS. `lib/data/newsletter-archive/` holds 179 sent emails, and a
 * sent email is not a page this organisation may republish as-is: it carries
 * Mailchimp's unsubscribe footer, its referral badge, a per-recipient `e=`
 * parameter, and — in two campaigns — click-tracking links keyed to a real
 * subscriber. `extract-archive.ts` removes all of that, but the extractor needs
 * the private vault and therefore **cannot run on CI**. So the thing CI has to
 * defend is the committed file, not the run that produced it, and this reads
 * the files rather than trusting the generator.
 *
 * It also carries the join PR 3 depends on: every Mailchimp URL on
 * `/resources/newsletters` must resolve to an archived campaign. Those URLs
 * were written by hand over five years in three different shapes; a card that
 * stops resolving is exactly the kind of break that shows up as a 404 on the
 * live site months later.
 *
 * Needs no database, no network and no vault, which is why it belongs in the
 * `verify-image-paths` job with the other offline data checks.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

import { NEWSLETTER_ARCHIVE } from "@/lib/data/newsletters-archive";
import {
  NEWSLETTER_MANUAL,
  NEWSLETTER_RETRACTED,
  getAllNewsletters,
} from "@/lib/data/newsletters-manual";
import {
  NEWSLETTER_ISSUE_PREFIX,
  localiseArchivedHtml,
  pathForCampaign,
  resolveIssue,
} from "@/lib/newsletter/archive";
import { OWN_MAILBOXES } from "../email/own-mailboxes";
import { ALLOWED_ADDRESSES, scanSanitised } from "./archive-html";
import { WITHHELD_ASSETS } from "./withheld-images";
import {
  ARCHIVE_HTML_DIR,
  ARCHIVE_INDEX_PATH,
  buildArchiveLookup,
  readArchiveIndex,
  resolveCampaignByArchiveUrl,
} from "./archive-index";

let failures = 0;

function check(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ok - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}${detail ? `:\n${detail}` : ""}`);
  }
}

/** Caps a failure list so one systemic break does not print 179 identical lines. */
function first(lines: string[], limit = 12): string {
  const shown = lines.slice(0, limit).map((line) => `      ${line}`);
  if (lines.length > limit) shown.push(`      … and ${lines.length - limit} more`);
  return shown.join("\n");
}

console.log("Newsletter archive guard\n");

// ---------------------------------------------------------------------------
// The archive is present and its index describes exactly what is on disk.
// ---------------------------------------------------------------------------

check(
  "lib/data/newsletter-archive/ exists with an index",
  existsSync(ARCHIVE_HTML_DIR) && existsSync(ARCHIVE_INDEX_PATH),
  `      ${ARCHIVE_HTML_DIR} is missing. Regenerate it with the vault:\n` +
    "        MAILCHIMP_VAULT_DIR=…/mailchimp/2026-08-28-api \\\n" +
    "          npx tsx scripts/mailchimp/extract-archive.ts --export 2026-08-28-api"
);

if (failures > 0) {
  console.error("\nCannot continue without the archive.");
  process.exit(1);
}

const indexText = readFileSync(ARCHIVE_INDEX_PATH, "utf8");
const index = readArchiveIndex();
const onDisk = readdirSync(ARCHIVE_HTML_DIR).filter((name) => name.endsWith(".html"));

check(
  "every indexed campaign has a file, and every file is indexed",
  (() => {
    const indexed = new Set(index.entries.map((entry) => entry.file));
    return (
      onDisk.length === indexed.size && onDisk.every((name) => indexed.has(name))
    );
  })(),
  first([
    `${onDisk.length} .html file(s) on disk, ${index.entries.length} indexed`,
    ...onDisk.filter((n) => !index.entries.some((e) => e.file === n)).map((n) => `orphan: ${n}`),
    ...index.entries.filter((e) => !onDisk.includes(e.file)).map((e) => `missing: ${e.file}`),
  ])
);

check(
  "the index's own totals agree with its entries",
  index.campaignsArchived === index.entries.length &&
    index.campaignsSent === index.entries.length + index.campaignsWithoutBody.length,
  `      sent ${index.campaignsSent}, archived ${index.campaignsArchived}, ` +
    `entries ${index.entries.length}, without a body ${index.campaignsWithoutBody.length}`
);

// ---------------------------------------------------------------------------
// The files are what the generator wrote. A hand-edit to a GENERATED file is
// silent otherwise: it survives review, and the next extraction run discards it.
// ---------------------------------------------------------------------------

const bodies = new Map<string, string>();
const tampered: string[] = [];
for (const entry of index.entries) {
  const text = readFileSync(join(ARCHIVE_HTML_DIR, entry.file), "utf8");
  bodies.set(entry.file, text);
  const sha = createHash("sha256").update(text, "utf8").digest("hex");
  if (sha !== entry.sha256 || Buffer.byteLength(text, "utf8") !== entry.bytes) {
    tampered.push(`${entry.file}: index says ${entry.bytes} bytes / ${entry.sha256.slice(0, 12)}…`);
  }
}
check(
  "no archived body has been hand-edited since it was generated",
  tampered.length === 0,
  first(tampered)
);

// ---------------------------------------------------------------------------
// The sanitisation rules. This is the part that must go red when somebody
// commits a body that still carries Mailchimp's plumbing.
// ---------------------------------------------------------------------------

const violations: string[] = [];
for (const [file, text] of bodies) {
  for (const violation of scanSanitised(text, "body")) {
    violations.push(`${file} — ${violation.rule}: ${violation.detail}`);
  }
}
check(
  "no archived body carries a Mailchimp subscription link, a script, a merge tag, a recipient id, or an unlisted address",
  violations.length === 0,
  first(violations) +
    "\n\n      Every rule and the reason for it is in scripts/mailchimp/archive-html.ts." +
    "\n      Regenerate rather than hand-fixing: the extractor applies the same scan."
);

check(
  "index.json carries no unlisted address and no recipient id",
  scanSanitised(indexText, "index").length === 0,
  first(scanSanitised(indexText, "index").map((v) => `${v.rule}: ${v.detail}`))
);

const unresolvedMarkers: string[] = [];
for (const [file, text] of bodies) {
  const count = (text.match(/data-mc-campaign="unresolved"/g) ?? []).length;
  if (count > 0) unresolvedMarkers.push(`${file}: ${count}`);
}
check(
  "every Mailchimp archive URL inside a body resolves to a campaign",
  unresolvedMarkers.length === 0,
  first(unresolvedMarkers) +
    "\n      An unresolved marker means PR 3 has a link it cannot repoint on-site."
);

// ---------------------------------------------------------------------------
// The five images withheld from re-hosting. A pre-publication screen found ten
// content images containing school-age children; five must never be given a
// permanent URL. PR 2's re-host is a mechanical rewrite over
// `img[data-mc-asset]`, so the exclusion holds only for as long as none of them
// carries that attribute — which is what these two checks are.
// ---------------------------------------------------------------------------

const wronglyMarked: string[] = [];
for (const [file, text] of bodies) {
  for (const match of text.matchAll(/data-mc-asset="([^"]+)"/g)) {
    if (WITHHELD_ASSETS.has(match[1])) wronglyMarked.push(`${file}: ${match[1]}`);
  }
}
check(
  `none of the ${WITHHELD_ASSETS.size} withheld images carries a re-host marker`,
  wronglyMarked.length === 0,
  first(wronglyMarked) +
    "\n      An image on the WITHHELD_IMAGES list in scripts/mailchimp/withheld-images.ts" +
    "\n      must never carry `data-mc-asset`, because PR 2 re-hosts everything that does." +
    "\n      Removing an entry from that list is a judgement about a photograph of a child."
);

const conflated: string[] = [];
for (const [file, text] of bodies) {
  for (const tag of text.matchAll(/<img\b[^>]*>/g)) {
    const withheld = tag[0].includes("data-mc-asset-withheld");
    const lost = tag[0].includes("data-mc-asset-lost");
    const marked = /data-mc-asset="/.test(tag[0]);
    if ((withheld && lost) || (withheld && marked) || (lost && marked)) {
      conflated.push(`${file}: withheld=${withheld} lost=${lost} marked=${marked}`);
    }
  }
}
check(
  "withheld, lost and re-hostable are mutually exclusive on every image",
  conflated.length === 0,
  first(conflated) +
    "\n      `data-mc-asset-lost` means the image is gone; `data-mc-asset-withheld`" +
    "\n      means it was kept out of the re-host on purpose. An element carrying" +
    "\n      both, or either alongside `data-mc-asset`, makes the two unreadable."
);

// ---------------------------------------------------------------------------
// The addresses that DO survive must be mailboxes that accept mail. Publishing
// an invitation to write to a dead address is the failure
// scripts/email/published-addresses.test.ts was written for, twice.
// ---------------------------------------------------------------------------

const liveLocals = new Set(
  OWN_MAILBOXES.filter((mailbox) => mailbox.expected === "exists").map((mailbox) => mailbox.local)
);
const deadAllowed = ALLOWED_ADDRESSES.filter((address) => {
  const [local, domain] = address.split("@");
  return domain === "shesharp.org.nz" && !liveLocals.has(local);
});
check(
  "every She Sharp address on the archive allow-list is a mailbox the probe found",
  deadAllowed.length === 0,
  first(deadAllowed.map((a) => `${a} is not marked 'exists' in scripts/email/own-mailboxes.ts`))
);

// ---------------------------------------------------------------------------
// The join PR 3 needs. 51 cards on /resources/newsletters open a Mailchimp URL;
// each one must land on an archived campaign, or re-pointing it on-site is
// guesswork.
// ---------------------------------------------------------------------------

const lookup = buildArchiveLookup(index.entries);
const archivedIds = new Set(index.entries.map((entry) => entry.id));

// DISTINCT urls, not card entries. The two files hold 52 entries whose issue
// was published at a Mailchimp page and 51 distinct URLs: the retracted
// `2026-02` card shares the March 2026 campaign's URL, because the legacy site
// pointed February at the March send. Counting entries would put 52 in a PR
// description and a doc, and the number a reader can verify is 51.
//
// Read from `source`, NOT from `url`. `url` is the on-site path now, so a
// check written against it would find zero Mailchimp URLs and pass while
// asserting nothing — the failure mode this repo has already been bitten by
// twice. `source` is where the issue was published, kept verbatim for exactly
// this: the campaign id on each card is re-derived from it below rather than
// trusted.
const siteUrls = [
  ...new Set(
    [...NEWSLETTER_ARCHIVE, ...NEWSLETTER_MANUAL]
      .map((issue) => issue.source)
      .filter(
        (url): url is string =>
          Boolean(url) && /mailchi\.mp|campaign-archive\.com|eepurl\.com/.test(url as string)
      )
  ),
];

const unjoinable = siteUrls.filter((url) => {
  const id = resolveCampaignByArchiveUrl(lookup, url);
  return id === null || !archivedIds.has(id);
});
check(
  `all ${siteUrls.length} distinct Mailchimp newsletter URLs join to an archived campaign`,
  unjoinable.length === 0,
  first(unjoinable.map((url) => `no archived campaign for ${url}`)) +
    "\n      The three join keys are documented in lib/newsletter/archive-index.ts." +
    "\n      A card that cannot be joined stays pointed at Mailchimp after the cancellation."
);

// ---------------------------------------------------------------------------
// The site no longer links to Mailchimp, and everything it links to instead
// exists.
//
// These two are the point of the whole archive. 51 of the 59 rendered cards
// opened a `mailchi.mp` or `us3.campaign-archive.com` page; Mailchimp
// documents nothing about what a cancelled subscription does to those pages,
// so the entire back catalogue sat behind a billing change. Re-pointing them
// once is not the same as keeping them re-pointed: the obvious way to undo it
// is to paste a Mailchimp link into the file, the way every issue before
// August 2026 was added.
// ---------------------------------------------------------------------------

const rendered = getAllNewsletters();
const MAILCHIMP_HOST = /mailchi\.mp|campaign-archive\.com|eepurl\.com|list-manage\.com/i;

const offSite = rendered.filter(
  (issue) =>
    MAILCHIMP_HOST.test(issue.url) ||
    issue.url !== `${NEWSLETTER_ISSUE_PREFIX}/${issue.id}`
);
check(
  `all ${rendered.length} rendered newsletter cards open this site, not Mailchimp`,
  offSite.length === 0,
  first(offSite.map((issue) => `${issue.id} -> ${issue.url}`)) +
    `\n      Every card's url must be ${NEWSLETTER_ISSUE_PREFIX}/<its own id>. Put the` +
    "\n      Mailchimp page in `source` and the campaign id in `campaign` instead;" +
    "\n      the route serves the archived body from lib/data/newsletter-archive/."
);

const unservable = rendered.filter((issue) => {
  const resolved = resolveIssue(issue.id);
  if (!resolved) return true;
  return resolved.kind === "campaign" && !archivedIds.has(resolved.campaignId);
});
check(
  `all ${rendered.length} card paths resolve to an archived campaign or a registry issue`,
  unservable.length === 0,
  first(unservable.map((issue) => `${issue.id} (campaign ${issue.campaign ?? "none"})`)) +
    "\n      resolveIssue() in lib/newsletter/archive.ts decides what the route serves." +
    "\n      A card that resolves to nothing is a 404 the grid links to."
);

// A card that drops `source` skips both the join check above and the
// re-derivation below, and the whole suite still exits 0 — measured, on the
// first version of this file. So the pair is asserted directly: an issue that
// names an archived campaign has to say where it was published.
const halfRecorded = rendered.filter(
  (issue) => Boolean(issue.campaign) !== Boolean(issue.source)
);
check(
  "every card records either both a campaign and a source, or neither",
  halfRecorded.length === 0,
  first(
    halfRecorded.map(
      (issue) =>
        `${issue.id}: campaign ${issue.campaign ?? "none"}, source ${issue.source ?? "none"}`
    )
  ) +
    "\n      `source` is the URL the campaign id is re-derived from. Without it" +
    "\n      the id is an unchecked hand-written hex string. An issue built AND" +
    "\n      sent from this repo has neither, and renders from" +
    "\n      lib/newsletter/issues-registry.ts."
);

const misjoined = rendered.filter((issue) => {
  if (!issue.source || !MAILCHIMP_HOST.test(issue.source)) return false;
  return issue.campaign !== resolveCampaignByArchiveUrl(lookup, issue.source);
});
check(
  "every card's campaign id is the one its own source URL resolves to",
  misjoined.length === 0,
  first(
    misjoined.map(
      (issue) =>
        `${issue.id}: declared ${issue.campaign}, source resolves to ` +
        `${resolveCampaignByArchiveUrl(lookup, issue.source as string)}`
    )
  ) +
    "\n      The campaign id is a hand-written hex string; this re-derives it from" +
    "\n      the URL the legacy site actually served, so a typo cannot quietly serve" +
    "\n      the wrong month to everyone who clicks that cover."
);

const claimed = new Map<string, string[]>();
for (const issue of rendered) {
  if (!issue.campaign) continue;
  claimed.set(issue.campaign, [...(claimed.get(issue.campaign) ?? []), issue.id]);
}
const shared = [...claimed].filter(([, ids]) => ids.length > 1);
check(
  "no two rendered cards claim the same archived campaign",
  shared.length === 0,
  first(shared.map(([campaign, ids]) => `${campaign} claimed by ${ids.join(", ")}`)) +
    "\n      pathForCampaign() has to name one canonical path per campaign, and a" +
    "\n      campaign claimed twice makes that a coin toss."
);

// Retraction has to suppress a URL as well as a card, now that the card IS a
// URL. `2026-02` still carries the March 2026 campaign, because that is what
// the legacy site linked; what must not happen is
// /resources/newsletters/2026-02 serving the March issue under February's name.
const liveRetractions = NEWSLETTER_RETRACTED.filter((entry) => resolveIssue(entry.id));
check(
  `all ${NEWSLETTER_RETRACTED.length} retracted id(s) resolve to a 404`,
  liveRetractions.length === 0,
  first(liveRetractions.map((entry) => `${entry.id} still resolves`)) +
    "\n      CAMPAIGN_BY_ISSUE_ID is built from getAllNewsletters(), which drops" +
    "\n      NEWSLETTER_RETRACTED. If this fails, something reads the raw arrays."
);

// ---------------------------------------------------------------------------
// What the route actually serves.
//
// The bodies on disk are allowed to carry Mailchimp URLs — the extractor marks
// them rather than removing them, so the join stays auditable. What may not
// carry one is the HTML the route hands a browser: an `og:url` naming
// eepurl.com is this page telling a crawler it lives on a host that is about to
// stop answering, and a share button whose query string carries the campaign's
// mailchi.mp page shares a dead link. Those 42 share buttons were the ones
// nobody had counted — the extractor's marker pass cannot see them, because the
// host in the href is facebook.com.
// ---------------------------------------------------------------------------

const LIVE_MAILCHIMP_URL =
  /https?:\/\/(?:[a-z0-9-]+\.)*(?:mailchi\.mp|eepurl\.com|campaign-archive\.com|list-manage\.com)/i;
const served: string[] = [];
for (const [file, html] of bodies) {
  const out = localiseArchivedHtml(html);
  for (const m of out.matchAll(/(?:href|content|src)="([^"]*)"/gi)) {
    const value = decodeURIComponent(m[1].replace(/&amp;/g, "&").replace(/\+/g, " "));
    if (LIVE_MAILCHIMP_URL.test(value)) served.push(`${file}: ${m[1].slice(0, 110)}`);
  }
}
check(
  "no served body carries a Mailchimp URL, including inside a share link's query string",
  served.length === 0,
  first(served) +
    "\n      localiseArchivedHtml() in lib/newsletter/archive.ts rewrites these on" +
    "\n      the way out; the file on disk is never edited, because its sha256 is in" +
    "\n      index.json. A new one here means a shape the rewriter has not seen."
);

// Checked against the CARD, not against pathForCampaign's own answer. The
// og:url check below compares each body to `pathForCampaign(id)`, so on its
// own it cannot see that function change its mind — measured: making
// pathForCampaign return the hex path for everything left the whole suite
// green. This is the independent half.
const wrongPreference = rendered.filter(
  (issue) => issue.campaign && pathForCampaign(issue.campaign) !== issue.url
);
check(
  "a campaign with a card is canonical at the card's readable path",
  wrongPreference.length === 0,
  first(
    wrongPreference.map(
      (issue) =>
        `${issue.id}: card is ${issue.url}, pathForCampaign says ` +
        `${pathForCampaign(issue.campaign as string)}`
    )
  ) +
    "\n      Each carded campaign is reachable at two paths — its card id and its" +
    "\n      hex id — and the readable one has to be the one every rewritten link" +
    "\n      and every og:url names, or the two compete instead of one deferring."
);

const wrongCanonical = index.entries.filter((entry) => {
  const out = localiseArchivedHtml(bodies.get(entry.file) as string);
  const og = /<meta[^>]*property="og:url"[^>]*content="([^"]*)"/i.exec(out);
  return og ? !og[1].endsWith(pathForCampaign(entry.id)) : false;
});
check(
  "each served body declares its own canonical path in og:url",
  wrongCanonical.length === 0,
  first(wrongCanonical.map((e) => `${e.file} should declare ${pathForCampaign(e.id)}`)) +
    "\n      The route is noindex by header and has no Next metadata, so og:url is" +
    "\n      the only thing the document says about where it lives. A campaign with a" +
    "\n      card is reachable at two paths and must name the readable one."
);
// ---------------------------------------------------------------------------
// Re-hosted images
//
// The point of the archive is that it outlives the Mailchimp account. A body
// whose text survives but whose pictures still load from `mcusercontent.com`
// outlives it only halfway.
// ---------------------------------------------------------------------------

const imageMap = JSON.parse(
  readFileSync(join(ARCHIVE_HTML_DIR, "images.json"), "utf8")
) as { base: string; entries: { asset: string; sourceSha256: string; blobPath: string }[] };
const hostedPaths = new Set(imageMap.entries.map((e) => e.blobPath));

const MC_IMAGE_HOST =
  /(?:dim\.)?mcusercontent\.com|cdn-images\.mailchimp\.com|gallery\.mailchimp\.com/;
const stillOnMailchimp: string[] = [];
const offMap: string[] = [];
for (const [file, html] of bodies) {
  for (const m of html.matchAll(/<(?:img|meta|link)\b[^>]*>/gi)) {
    const attr = /(?:\bsrc|\bcontent|\bhref)="([^"]+)"/.exec(m[0]);
    if (!attr) continue;
    const url = attr[1].replace(/&amp;/g, "&");
    if (MC_IMAGE_HOST.test(url)) {
      stillOnMailchimp.push(`${file}: ${url}`);
    } else if (url.startsWith(`${imageMap.base}/`)) {
      const rest = url.slice(imageMap.base.length + 1);
      if (!hostedPaths.has(rest)) offMap.push(`${file}: ${rest}`);
    }
  }
}

check(
  "no body still loads an image from a Mailchimp host",
  stillOnMailchimp.length === 0,
  first(stillOnMailchimp) +
    "\n      Re-run scripts/mailchimp/rehost-archive-images.ts --apply." +
    "\n      A reference left here dies with the account this archive exists to outlive."
);

check(
  "every hosted image URL is recorded in images.json",
  offMap.length === 0,
  first(offMap) +
    "\n      A body pointing at an object the map does not record has no provenance —" +
    "\n      nothing says which vault file it came from, or that it was cleared for publication."
);

// This check exists because its absence was measured. Withholding used to be
// enforced per MARKED occurrence, and the markers were incomplete: ALL FIVE
// withheld images still had at least one unmarked `<img src>` loading them live,
// including a whole-class photograph of primary-school children. A guard that
// asks what an earlier pass wrote down cannot see what it failed to write down,
// so this one asks the file instead.
const withheldInMap = imageMap.entries.filter((e) => WITHHELD_ASSETS.has(e.asset));
check(
  "no withheld image is in the hosted map",
  withheldInMap.length === 0,
  first(withheldInMap.map((e) => `${e.asset} -> ${e.blobPath}`)) +
    "\n      A Blob URL is immutable for a year. See scripts/mailchimp/withheld-images.ts."
);

// ---------------------------------------------------------------------------
// Completeness — the direction every check above this line faces away from.
//
// Everything so far asks "is what we published correct?". Nothing asked "did we
// publish everything?", and on 2026-09-02 that was measured: the back catalogue
// was complete, but only by luck of nobody having re-run the extractor with a
// send it did not card. The card files are the annotating pass; a check keyed on
// them inherits their blind spot and exits 0 — the lesson `withheld-images`
// learned the expensive way. So these two ask `index.json`, which is derived
// from what Mailchimp actually sent and knows nothing about what we chose to
// show.
//
// KNOWN LIMIT, stated rather than papered over: `index.json` carries the
// SUBJECT line, not Mailchimp's internal campaign title, so an issue whose
// subject omits the word "newsletter" is invisible to the coverage check. All
// 60 to date contain it — including "She Sharp Newsletter — We are back for
// 2025 💜", the one whose subject names no month. Matching the archive-URL slug
// instead was tried and is worse: Mailchimp carries the slug over when a
// campaign is duplicated, so the July 2025 *event* EDM sits on a
// `she-sharp-newsletter-march2025` URL.
// ---------------------------------------------------------------------------

/**
 * Sent newsletters that deliberately have no card, each keyed to the send that
 * supersedes it. Both are same-day corrections: Mailchimp cannot edit a
 * campaign once it is away, so a botched send is followed by a second one, and
 * the archive holds both. Carding both would put the same issue on the page
 * twice under one month.
 */
const DUPLICATE_SENDS: Record<string, string> = {
  "29d7d47e2e":
    "April 2026, first attempt. Went out subject-lined 'Newsletter - April " +
    "2026 v0.2' from a stale ambassador address that displayed the sender as " +
    "'A'. Superseded the same day by b94b03986b, which is the 2026-04 card.",
  d39f030ee6:
    "June 2026, first attempt. Correct body, but the subject line still read " +
    "'She Sharp Newsletter - May 2026' — a month old on arrival. Superseded " +
    "the same day by e9835f97b7, which is the 2026-06 card.",
};

const cardedCampaigns = new Set(
  rendered.map((issue) => issue.campaign).filter(Boolean) as string[]
);
const looksLikeNewsletter = (subject: string) => /newsletter/i.test(subject);

const unclaimed = index.entries.filter(
  (entry) =>
    looksLikeNewsletter(entry.subject) &&
    !cardedCampaigns.has(entry.id) &&
    !(entry.id in DUPLICATE_SENDS)
);
check(
  "every archived newsletter send is either carded or a declared duplicate",
  unclaimed.length === 0,
  first(unclaimed.map((e) => `${e.sendTime.slice(0, 10)} ${e.id} — ${e.subject}`)) +
    "\n      An issue She Sharp sent that the archive page does not list. Add a" +
    "\n      card in newsletters-manual.ts, or — if it is a corrected re-send —" +
    "\n      add it to DUPLICATE_SENDS above naming the send that supersedes it."
);

const staleDuplicates = Object.keys(DUPLICATE_SENDS).filter(
  (id) => !index.entries.some((e) => e.id === id) || cardedCampaigns.has(id)
);
check(
  "no DUPLICATE_SENDS entry is stale",
  staleDuplicates.length === 0,
  first(staleDuplicates) +
    "\n      An allow-list entry that no longer names an uncarded archived send" +
    "\n      excuses nothing and hides the next one. Delete it."
);

// A card's id is the month a reader sees, and nothing before 2026-09-02 checked
// it against the send. `2025-01` sat on a campaign sent 2025-02-28 for as long
// as the card existed, so the page showed a January issue that was never
// written and no February issue at all — which is what "the archive looks
// incomplete" turned out to mean.
//
// Two cadences are legitimate and both are in the data: an issue sent inside
// its own month (51 cards), and one that slipped and went out in the opening
// days of the next (5 cards — 1, 2, 3, 4 and 6 days in).
//
// THE DAY-OF-MONTH BOUND IS LOAD-BEARING, and it is here because the first
// version of this check passed the defect it was written for. "The month it was
// sent, or the one before" admits 2025-01 serving a send of 2025-02-28: drift is
// +1 either way, and a rule that only counts months cannot tell a late January
// issue from an on-time February one. What separates them is the day — a slipped
// issue goes out on the 1st, not the 28th, by which point the next issue is due.
// Cutting at 10 keeps every real late send with four days to spare.
//
// A genuine slip past the 10th would fail this, which is the intended cost: it
// is a fortnight late, somebody should look at it, and MONTH_EXCEPTIONS is where
// the answer gets written down rather than assumed.
const LATE_SEND_GRACE_DAYS = 10;

const MONTH_EXCEPTIONS: Record<string, string> = {
  "2023-04":
    "The deliberate 2023-04/2023-05 swap documented in newsletters-archive.ts. " +
    "This card serves the campaign subject-lined 'May 2023', sent 2023-05-22 — " +
    "22 days into the following month, so it is outside the slip window rather " +
    "than a late send.",
  "2023-05":
    "The other half of the same swap: this card serves the campaign " +
    "subject-lined 'April 2023', sent 2023-04-20, a month BEFORE its own. Both " +
    "halves are listed because the legacy site linked them that way and " +
    "re-dating a card is a content decision, not a guard's.",
};

const misdated = rendered.filter((issue) => {
  if (!issue.campaign || issue.id in MONTH_EXCEPTIONS) return false;
  const entry = index.entries.find((e) => e.id === issue.campaign);
  if (!entry) return false;
  const [sentYear, sentMonth] = entry.sendTime.slice(0, 7).split("-").map(Number);
  const sentDay = Number(entry.sendTime.slice(8, 10));
  const drift = sentYear * 12 + sentMonth - (issue.year * 12 + issue.month);
  if (drift === 0) return false;
  return !(drift === 1 && sentDay <= LATE_SEND_GRACE_DAYS);
});
check(
  "each card's month matches when its campaign was sent, allowing a slip into " +
    `the first ${LATE_SEND_GRACE_DAYS} days of the next month`,
  misdated.length === 0,
  first(
    misdated.map((issue) => {
      const entry = index.entries.find((e) => e.id === issue.campaign);
      return `${issue.id} serves ${issue.campaign} sent ${entry?.sendTime.slice(0, 10)}`;
    })
  ) +
    "\n      Either the card is on the wrong month — check Mailchimp's internal" +
    "\n      campaign title, which names a month even when the subject line does" +
    "\n      not — or the drift is deliberate and belongs in MONTH_EXCEPTIONS."
);

console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log(
  `${index.entries.length} archived newsletters, ${siteUrls.length} distinct site URLs joined, ` +
    `${rendered.length} cards served from this site, ` +
    "no Mailchimp plumbing and no unlisted address."
);
