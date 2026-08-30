# The newsletter back catalogue

**GENERATED. Do not hand-edit anything in this directory.**

179 sent Mailchimp campaigns, July 2019 → August 2026, one HTML file per
campaign plus `index.json`. Written by
`scripts/mailchimp/extract-archive.ts`, guarded by
`scripts/mailchimp/archive-guard.test.ts` on every pull request.

```bash
MAILCHIMP_VAULT_DIR=…/she-sharp-slack-archive/mailchimp/2026-08-28-api \
  npx tsx scripts/mailchimp/extract-archive.ts --export 2026-08-28-api
npx tsx scripts/mailchimp/archive-guard.test.ts
```

## Why it is committed

51 of the 59 newsletter cards on `/resources/newsletters` open a page hosted by
**Mailchimp**, and the founder is cancelling the paid subscription. Mailchimp
documents nothing about what a downgrade or a pause does to those hosted pages —
its plan-change help page and its campaign-archive help page each say nothing
about the other, checked 2026-08-30 — so the honest response to the unknown is
the cheap ordering rather than a prediction: **archive first, cancel second.**
`docs/deployment/MAILCHIMP_CANCELLATION.md` §3 and §4.

The vault that holds the source is gitignored and lives in a private
repository, so CI cannot regenerate these files. That is why they are committed
rather than built: the guard defends the file, not the run that produced it.

## Why here and not `lib/data/json/`

`lib/data/json/` holds derived **aggregates** — counts, vocabularies, crosswalks
— under a leak guard (`lib/data/mailchimp.test.ts`) that exists to keep free
text and per-contact identifiers out. These are the newsletters themselves:
8.0 MB of body HTML, deliberately full of free text — **0.58 MB once git has
packed it**, because 179 renders of four Mailchimp templates delta-compress
almost completely away. A different kind of thing
belongs under a different guard, and folding them in would mean loosening the
one that protects the audience archive.

## What was changed on the way in

Every rule, and the evidence behind it, is in `scripts/mailchimp/archive-html.ts`.
In short:

| | |
|---|---|
| Source field | `archive_html`, **not** `html` — the archive render has Mailchimp's merge tags already resolved. `html` carries them unresolved in all 179 bodies |
| Removed | the unsubscribe / preferences footer, the forward-to-a-friend widget, the "Powered by Mailchimp" referral badge, and the 75 chrome images they sit on |
| Removed | every `e=` parameter. On the footer links it is the literal `[UNIQID]`; on seven links it was a live subscriber hash |
| De-linked | 7 `list-manage.com/track/click` links in campaigns `c186979078` and `9db594f92d`. The destination is not recoverable offline and following one would register a click on a real person's record. The anchor text and styling survive; the href does not |
| De-linked | a named individual's personal `mailto:` in the footer of 14 consecutive 2024–25 issues |
| Rewritten | `shesharp.nz@gmail.com` → `info@shesharp.org.nz` in 7 bodies. She Sharp's own historic mailbox, almost certainly dead |
| Kept | `careers@flexware.co.nz` in one 2022 job advert — a company role address, published as public business contact information |
| Kept and **marked** | every image `src` (`data-mc-asset`, `data-mc-sha256`) and every Mailchimp archive URL (`data-mc-campaign`) |

## The markers, and what is left to do with them

| Attribute | On | Means |
|---|---|---|
| `data-mc-asset` | 884 `<img>` | the vault-relative file that image resolves to. **PR 2** re-hosts these on Vercel Blob and rewrites `src` |
| `data-mc-sha256` | the same | that file's sha256, so the re-host can be verified rather than assumed |
| `data-mc-asset-lost` | 1 `<img>` | the one image that was already gone before this archive existed — a Google user-content URL in the 2020-09-16 issue, HTTP 403. Recorded in `KNOWN_LOSSES` in `campaign-images.ts`. Do not try to recover it |
| `data-mc-campaign` | 142 `<a>`, 24 `<meta property="og:url">` | the campaign id that URL resolves to. **PR 3** repoints these on-site |
| `data-mc-campaign-self` | all 166 of them | the link points at the issue it is inside — the "View this email in your browser" preheader, and the `og:url` in the head |
| `data-mc-delinked` | 21 `<a>` | the href was removed on purpose. `opaque-track-click` (7) or `personal-address` (14) |
| `data-mc-legacy-domain` | 75 `<a>` | points at `shesharp.co.nz`, the pre-2026 domain |

**177 `<img src>` occurrences, in 36 files, carry no marker.** They sit inside
`<!--[if mso]>` conditional comments — Outlook-only fallbacks that a browser
never fetches — and a comment is not an element, so no DOM rule reaches them.
145 point at `mcusercontent.com`, 12 at `dim.mcusercontent.com`, 19 at a
third-party bucket and 1 at `cdn-images.mailchimp.com`. PR 2 has to decide
between stripping the MSO blocks outright (they do nothing on a web page) and
rewriting them with a text pass; leaving them is the only option that keeps a
Mailchimp URL in a file, even an unfetched one.

**There are no issue-to-issue cross-links.** Every one of the 166 archive
markers is a self-link. That was worth measuring rather than assuming: the
147 raw `mailchi.mp` references in the corpus read like a web of cross-links
and are not one.

Three things PR 3 inherits and this PR deliberately did not decide:

1. Each body is a **complete HTML document** — its own `<head>`, `<style>`,
   `<title>` and Open Graph tags, including a `<link>` to `fonts.googleapis.com`
   in some issues. Serving one inside a site page means deciding what to do with
   all of that.
2. One subject line in `index.json` is Mailchimp's stored template and contains
   `*|FNAME|*` (campaign `f4a4bab4d6`, 5 June 2023). It is kept verbatim because
   that is what was sent; a card title has to handle it.
3. `MAILCHIMP_CONFIG.archiveUrl` — the "Open full archive" button and the
   footer's "Read past issues" — is already wrong today, on a paid plan: it
   returns the 20 most recent campaigns, not the back catalogue.
   `docs/deployment/MAILCHIMP_CANCELLATION.md` §4.

## `index.json`

The join between a card on the site and a file here. Three keys, tried in
order, resolve all **51 distinct** Mailchimp URLs in
`lib/data/newsletters-archive.ts` and `lib/data/newsletters-manual.ts`; the
resolver is `resolveCampaignByArchiveUrl()` in
`scripts/mailchimp/archive-index.ts`, and the guard asserts every one still
joins.

**51 distinct URLs across 52 card entries.** The retracted `2026-02` card shares
the March 2026 campaign's URL, because the legacy Webflow site pointed February
at the March send. `NEWSLETTER_RETRACTED` suppresses it at render time, so the
grid shows 51 Mailchimp cards, not 52. Count URLs, not entries.

**`YYYY-MM` is not a key here, and PR 3 must not treat it as one.** The 179
campaigns span 74 months and **55 of those months hold more than one** — eight
in August 2022. Most of the 179 are event announcements, reminders and
apologies rather than monthly issues, which is also why only **51 of the 179**
are reachable from a card on the site today; the other 128 have no card at all,
and whether to expose them is PR 3's decision. The campaign id is the key; the
existing `/resources/newsletters/[issue]` route keys on `YYYY-MM` through
`lib/newsletter/issues-registry.ts` and covers only the three 2026 issues
rendered in this repo.

One of the 180 sent campaigns, `a487b3025c`, has **neither** `html` nor
`archive_html` in the vault and therefore no file here. It is listed in
`campaignsWithoutBody` so the gap is recorded rather than inferred from a count.
