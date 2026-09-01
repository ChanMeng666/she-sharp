# The Mailchimp and Humanitix APIs

She Sharp got API keys for both of its two platform accounts on 2026-08-27, and
over the following two days pulled everything either API would give. This
document is the reference for that work: the clients, the scripts, the exact
commands, what each pull costs, and the boundaries a future session must not
cross.

**One sentence matters more than the rest of the document. Neither API is a
superset of the hand export, and the failure mode to guard against is somebody
reading "we have API keys now" and stopping the manual exports.** Six of the
eighteen Humanitix reports in the vault exist only because somebody downloaded
them, and Mailchimp's `CONFIRM_TIME` — the column the whole consent reading in
`MAILCHIMP_ARCHIVE.md` rests on — has no API equivalent. What is written below
is an *addition* to the Reports-screen and Audience-export procedures, never a
replacement for either.

---

## What exists

| Module | Runs where | Does |
|---|---|---|
| `lib/mailchimp/client.ts` | local tooling only | Typed `fetch` wrapper over the Marketing API v3 |
| `lib/humanitix/client.ts` | `app/` **and** scripts | Typed `fetch` wrapper over the Public API v1 — the PII-free half of it, only |
| `scripts/mailchimp/fetch-api.ts` | by hand | The archival pull. 31 always-on files plus seven opt-in tiers |
| `scripts/mailchimp/fetch-assets.ts` | by hand | Downloads the 677 gallery images an `--include assets` run only inventoried |
| `scripts/mailchimp/build-campaigns.ts` | by hand | API pull → the committed `lib/data/json/mailchimp/campaigns.json` |
| `scripts/mailchimp/recent-openers.ts` | by hand | Per-recipient opens → a hashed ramp cohort in `tmp/` |
| `scripts/mailchimp/manifest.ts` | by hand | The **CSV** manifest builder. Refuses an API vault — see trap 2 |
| `scripts/mailchimp/vault.ts` | library | Vault resolution, hashing, `argValue` |
| `scripts/humanitix/fetch-api.ts` | by hand | The archival pull, including the attendee endpoints |
| `scripts/humanitix/api-counts.ts` | by hand | `getTicketCount()` — the one live sold figure, from a PII call whose body is discarded |
| `scripts/humanitix/verify-live-events.ts` | by hand | Site event records vs. the live account; prints, never edits |
| `scripts/humanitix/manifest.ts` | by hand | Same split, same refusal |
| `scripts/humanitix/vault.ts` | library | As above |
| `scripts/email/suppression.ts` | by hand | `pull-mailchimp` folds Mailchimp's live unsubscribes into the suppression register |
| `app/api/events/ticket-status/route.ts` | production | The only runtime consumer of either API |

---

## Credentials

**Mailchimp Marketing API v3.** Server prefix `us3`, audience `31bd05e8eb`
("She#"). The key in use is labelled `she-sharp-repo-2026-08`, created
2026-08-27, and **expires 2027-08-27** — Mailchimp now forces a one-year expiry
on new keys and there is no "never" option. `MAILCHIMP_API_KEY` is **local
tooling only**: nothing under `app/` reads it and nothing may.

The key's own suffix *is* the hostname. `resolveServerPrefix()` parses `us3` off
the end of `<32 hex>-us3` rather than defaulting, because a guessed prefix sends
the request to another tenant's shard, which answers **401** —
indistinguishable from a revoked key, and the wrong thing to spend an afternoon
debugging. `MAILCHIMP_SERVER_PREFIX` overrides it, and is only needed for a key
with no suffix.

**A second Mailchimp key from 2020 exists, never expires, and was deliberately
not revoked.** The Humanitix → Mailchimp integration reports "Connected to She
Sharp", which reads like an OAuth account link rather than that key — but nobody
has proven it, and revoking a key that turns out to be the integration's would
silently break the tag sync that has been running for six years. Leave it until
somebody establishes what it authenticates. It is Tier 1 in
`SECURITY/credentials-to-rotate.md` in the private repo alongside the account
password.

**Humanitix Public API.** Key created 2026-08-27, sent as the `x-api-key`
header, 200 requests per minute, read-only. Unlike the Mailchimp key, this one
**is** set on Vercel production — `app/api/events/ticket-status/route.ts` needs
it to show "Sold out" and "Registration closed" on upcoming event pages.

> The header of `scripts/humanitix/fetch-api.ts` still says the key "must not be
> set in Vercel". That was true when it was written and is now wrong;
> `.env.example` carries the correct version. The rule it was reaching for is
> the PII boundary below, not the key.

`.env.example` documents `MAILCHIMP_API_KEY`, `MAILCHIMP_SERVER_PREFIX`,
`MAILCHIMP_LIST_ID`, `MAILCHIMP_VAULT_DIR` and `HUMANITIX_API_KEY`.
`HUMANITIX_VAULT_DIR` is read by `scripts/humanitix/vault.ts` but is **not** in
`.env.example` — set it by hand, or export it inline as every command below
does.

---

## The PII boundary, which is the point of the design

`HUMANITIX_ARCHIVE.md` states that the whole privacy design "rests on the
running application having no path to a real email address". That is not a
convention anybody has to remember. It is enforced by **what does not exist**.

`lib/humanitix/client.ts` implements four endpoints: `listEvents`, `getEvent`,
`getCheckInCount`, `listTags`. Every one returns event metadata or a count, and
no attendee. It **deliberately does not implement** `/v1/events/{id}/orders` or
`/v1/events/{id}/tickets`, or any of the write endpoints.

**A function that does not exist cannot be imported from `app/` by mistake.
That absence is the mechanism, not a comment asking for restraint.** Do not add
`listTickets` in passing because the file happened to be open, and do not
re-export the transport — exporting `humanitixFetch` would hand every future
caller an unrestricted path to *any* endpoint from `lib/`, including the four
the file exists to keep out of reach.

The capability still exists, in the one place a person has to run it by hand.
`scripts/humanitix/fetch-api.ts`, `scripts/humanitix/api-counts.ts` and — since
2026-09-01 — `scripts/humanitix/orders-api.ts` each carry their own minimal copy
of the transport: the same header, the same retry rule, the same rate budget.
`scripts/` is imported by nothing in `app/`, `lib/` or `components/`, so the
duplication buys a boundary that a shared module would dissolve. Copying sixty
lines is the cheaper of the two options.

**Three copies is not two too many; they differ in the one way that matters.**
`fetch-api.ts` writes rows **verbatim** into the vault and therefore must not
have a field allowlist — a checksum over a mapped object proves only what the
mapper kept. `api-counts.ts` keeps a pagination envelope's `total` and drops the
rows entirely. `orders-api.ts` reads `/orders` through a **required** `keep`
allowlist, implemented as a `JSON.parse` reviver, so `accessCode`, `mobile`,
`additionalFields[]` and the postal address never enter the process at all. The
allowlist is required rather than defaulted for the reason the client gives
about `acquireSlot()`: a limiter you have to remember is a limiter somebody
forgets. Its two callers are `export-optins.ts` (opt-in harvest, route 2) and
`check-optin-switch.ts` (which keeps two fields and no address).

The Mailchimp client draws the same line more softly, because the shape of the
data differs. `listMembers()` applies a narrow `fields` projection **by
default** — id, address, status, `timestamp_opt`, `last_changed`,
`unsubscribe_reason`, `member_rating`, `tags`. The full member object carries
`ip_signup`, `ip_opt`, `location{lat,lng,country,timezone}` and `merge_fields`
(name, phone, street address), and narrowing by default means asking for those
back has to be typed out on purpose at a call site a reviewer can see.
`getEmailActivity()` excludes `ip` **unconditionally**: an IP against an open
timestamp is a read-location record and nothing needs one.

`scripts/mailchimp/fetch-api.ts --include members` is the one sanctioned
exception, and it passes **no** `fields` on purpose. Those are the columns the
CSV export carries, the account is being cancelled, and a guard that narrows the
last reading anybody will ever take is not protecting the data — it is deleting
it. What protects it is where the file goes: the gitignored vault, classified
`person-network` in the manifest, never `lib/data/json/`. **Do not "fix" that
call site back to `listMembers()`.**

`scripts/email/suppression.ts pull-mailchimp` goes narrower still — address,
status, `last_changed`, `unsubscribe_reason` — and excludes `members.id`, which
is the md5 of the address and reverses against any candidate list. Nothing in a
script that writes to a committed file should hold one.

---

## Where the data lives

The private `she-sharp-slack-archive` repository is the master. `private/` in
this repo is a **cache**: it is gitignored, so git does not back it up and
`git clean -xdf` deletes it. Pulls should write straight to the archive.

| Vault | Files | Size | Holds |
|---|---|---|---|
| `mailchimp/2026-08-17/` | 5 CSVs | — | The hand export. Still load-bearing |
| `mailchimp/2026-08-27-api/` | 375 JSON | 30 MB | First pass: campaigns, reports, growth, content, engagement |
| `mailchimp/2026-08-28-api/` | 884 JSON + 677 images | 484 MB + 547 MB | The maximal pull — every tier |
| `humanitix/2026-08-17/` | 18 CSVs | — | The hand export. Still load-bearing |
| `humanitix/2026-08-28-api/` | 179 JSON | 82 MB | 59 events, 4,169 orders, 5,259 tickets, 63 check-in counts |

`portableVaultPath()` in both `manifest.ts` modules decides what goes into the
committed manifest's `vaultPath`. Inside `private/` it writes a repo-relative
path; inside another git repository it walks up to the deepest `.git` and writes
*that repository's* name plus the path within it. The failure being avoided is
`D:/github_repository/…` in a committed file — true on exactly one machine,
silently wrong everywhere else, and a local filesystem layout leaked into a
public repo. The previous test was `dir.includes("private") ? … : dir`, which
fell into the `: dir` branch for every run against the archive repo.

The API vaults are **JSON, verbatim**. Nothing in `lib/data/json/` is written by
a pull except an append-only `exports[]` entry in the manifest, recording each
file's sha256, the endpoint it answers, and its PII class — so a pull stays
auditable on CI, where the data itself can never be.

---

## Running a pull

Every command takes an explicit vault directory. Point it at the archive repo,
not at `private/`.

### Mailchimp

```bash
export MAILCHIMP_VAULT_DIR="D:/github_repository/she-sharp-slack-archive/mailchimp/2026-08-28-api"

# What it would cost. One live request; writes nothing.
npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-28-api --dry-run
npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-28-api --dry-run \
  --include content,engagement,assets,templates,members,recipients,activity

# The default pull: 31 files, 32 requests.
npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-28-api

# Everything.
npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-28-api \
  --include content,engagement,assets,templates,members,recipients,activity

# The gallery images themselves — a separate decision, and resumable.
npx tsx scripts/mailchimp/fetch-assets.ts --export 2026-08-28-api

# Rebuild the committed campaign archive from the pull.
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-28-api --check
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-28-api
npx tsx scripts/mailchimp/build-campaigns.ts --export 2026-08-28-api --check  # must be empty

# The ramp cohort for a first Resend send. Hashes only; output to tmp/.
npx tsx scripts/mailchimp/recent-openers.ts --export 2026-08-28-api \
  --subscribed-export 2026-08-17 --since 2026-02-27

# Fold Mailchimp's live unsubscribes into the suppression register. Monthly.
npx tsx scripts/email/suppression.ts pull-mailchimp --dry-run
npx tsx scripts/email/suppression.ts pull-mailchimp
```

The export id **must** match `<YYYY-MM-DD>-api`, and must never be the CSV
export's id. The vault is flat at `<vaultRoot>/<exportId>/` with no `api/`
folder nested inside a CSV export's directory: `resolveVaultDir()` maps one
export id to one directory, `manifest.ts --append` and `appendExportEntry()`
both dedupe on export id, and sharing an id would not merge the two records —
it would clobber the CSV one.

### Humanitix

```bash
export HUMANITIX_VAULT_DIR="D:/github_repository/she-sharp-slack-archive/humanitix/2026-08-28-api"

# One request (GET /v1/events); prints the cost of every tier.
npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-28-api --dry-run

# Events + tags only: 2 files, 2 requests, no personal data.
npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-28-api

# The full pull, including the attendee endpoints.
npx tsx scripts/humanitix/fetch-api.ts --export 2026-08-28-api \
  --include orders,tickets,check-ins

# Reconcile the site's event records against the live account. Prints only.
npx tsx scripts/humanitix/verify-live-events.ts
npx tsx scripts/humanitix/verify-live-events.ts --upcoming-only
npx tsx scripts/humanitix/verify-live-events.ts --check-ins
npx tsx scripts/humanitix/verify-live-events.ts --with-counts   # see below
npx tsx scripts/humanitix/verify-live-events.ts --offline       # no key needed
```

`verify-live-events.ts` is **not in CI and must not be added to it**.
`.github/workflows/verify.yml` runs offline with no secrets and all five of its
jobs depend on that; a gate that fails when somebody else's API is slow is a
gate people learn to re-run until it passes.

`--with-counts` states its own price. The sold figure exists on exactly one
endpoint — `GET /v1/events/{id}/tickets`, the attendee list — and getting it
means asking for a page of attendees and throwing the page away.
`scripts/humanitix/api-counts.ts` asks for `pageSize=1` (the API minimum; there
is no `pageSize=0`), so **one real ticket comes back over the wire** with a
name, an address and an access code on it. The body is parsed with a reviver
that drops the `tickets` key entirely, so the object the module holds cannot
carry an attendee even if a later edit logs it. Nothing is written to disk. The
flag is off by default so that a plain run stays a PII-free tool anyone can run
at any time.

---

## What each tier costs

### Mailchimp

31 files always, in 32 requests (one per file, plus one `GET /lists` to verify
the audience before anything is written). Seven tiers are opt-in,
comma-separated and freely combinable. **They are opt-in for the COST, not for the
sensitivity** — the vault is the vault whichever tiers ran, and the manifest
states per file what each one exposes. Deciding by flag which PII reaches a
gitignored directory would be a guard that reads like one and protects nothing.

| Tier | Endpoint(s) | Requests | Bytes | PII class |
|---|---|---|---|---|
| `content` | `/campaigns/{id}/content` | 180 | 19.1 MB | `person-identifying` |
| `engagement` | 4 report breakdowns + `send-checklist` | 5 × 180 | 6.5 MB | `email-only` |
| `activity` | `/reports/{id}/email-activity` | 180+ | 38.0 MB | `person-sensitive` |
| `recipients` | `sent-to`, `open-details`, `unsubscribed`, `abuse-reports`, `advice` | 5 × 180+ | **396.5 MB** | `person-identifying` |
| `members` | `/lists/{id}/members?status=` | 1 per page per status (8) | 17.4 MB | `person-network` |
| `templates` | `/templates` + per-template default content | 1 + 125 | 0.3 MB | `none` |
| `assets` | `/file-manager/files` | 1 | 1.2 MB | `none` (metadata only) |

Sizes are what the 2026-08-28 pull actually wrote, measured from the committed
manifest — 884 files and 484 MB of JSON in total, of which `recipients` alone is
four fifths. `fetch-assets.ts` on top of that downloads 677 images, 547 MB.

`--dry-run` costs the per-campaign tiers from a **live** count of sent
campaigns, never from a number in the file. The previous version said "209
campaigns, so roughly 214 requests"; the account holds 180 sent campaigns, and
that gap is the whole reason a dry run exists. One projected request buys the
real figure. The count is still a floor — `paginate()` asks for 1000 rows a
page, and `activity` and `recipients` both exceed that on the sends that reached
more than 1000 people, so those two lines say so rather than reading as exact.

`--include` **refuses** an unrecognised value rather than ignoring it. The
previous form was `argValue(argv, "--include") === "activity"`, so
`--include Activity` and `--include activity,content` both read as false and the
run went ahead looking successful while fetching nothing extra.

### Humanitix

2 files always (`events.json`, `tags.json`), 2 requests. Three opt-in tiers,
each costing at least 59 requests:

| Tier | Endpoint | Requests | Files | Rows | PII class |
|---|---|---|---|---|---|
| `orders` | `/v1/events/{id}/orders` | 59+ | 59 | 4,169 | `access-secret` |
| `tickets` | `/v1/events/{id}/tickets` | 59+ | 59 | 5,259 | `access-secret` |
| `check-ins` | `/v1/events/{id}/check-in-count` | 63 (exact) | 59 | 63 | `aggregate` |

`orders` and `tickets` are floors: both page at 100 rows, and how many pages an
event needs is not knowable without asking — which is the request the dry run is
avoiding. `check-ins` is exact, because the endpoint takes one date and returns
one object: the account's 59 events carry 64 `dates[]` entries, of which 63 are
live. Deleted dates are skipped; **disabled ones are kept** — `disabled` means
Humanitix stopped selling for that session, not that it did not happen, and
three of this account's dates are in that state with tickets against them.

A full three-tier pull is ~250 requests and takes a few minutes. The rate
budget, not the network, sets the wall-clock time.

`orders/` and `tickets/` are the **most sensitive files in this project**: names,
emails, mobiles, street addresses, dates of birth, the free-text dietary,
accessibility and photo-consent answers (health information, in a file named
after an event), `qrCodeData` — a working admission token — and a **live
`accessCode` on nearly every row**. They are classified `access-secret` rather
than `person-sensitive` for that last reason. On 2026-06-11 three access codes
reached a committed JSON file and had to be rotated with a git history rewrite;
a leaked code cannot be un-leaked by a later edit. Three rules follow, none
negotiable:

1. **`private/` only.** Nothing derived from `orders/` or `tickets/` may be
   summarised into `lib/data/json/` either — `lib/data/humanitix.test.ts` fails
   CI if an address or a code-shaped value reaches it.
2. **No body in any message.** Errors name the status code and the event id,
   both Humanitix's own identifiers. Progress lines print counts. Nothing prints
   a row.
3. **The manifest says plainly what each file holds.**

---

## What the APIs cannot do

### Humanitix — six reports the API has no route to

Probed 2026-08-27. Every one of these returned **404**, per-event variants
included:

| Report in the vault | API route | Result |
|---|---|---|
| `payout-report` — 48 settlements, one masked bank account | `/v1/payouts`, `/v1/events/{id}/payouts` | 404 |
| `access-codes-report` — 124 live codes with remaining capacity | `/v1/access-codes`, `/v1/events/{id}/access-codes` | 404 |
| `discount-report` — 13 codes | `/v1/discounts`, `/v1/events/{id}/discount-codes` | 404 |
| `AffiliateCodesOrders-*` | — | no equivalent |
| `top-purchasers-report` | — | derivable from tickets, not served |
| `earnings-by-ticket-type-report` | — | derivable from tickets, not served |

`/v1/tags` returns **0** — this account groups nothing inside Humanitix. The
empty response is stored anyway, so that "we asked, and there was nothing here"
is recorded rather than reasoned about again next year.

There is also **no live sold or registered count** on any PII-free endpoint.
`GET /v1/events` carries `totalCapacity`, `markedAsSoldOut` and a per-ticket-type
availability flag, and that is all. The site's `attendees` figure — which by
`CONTENT_RULES.md` holds *registrations* — cannot be reconciled against a live
number without `--with-counts` and the attendee endpoint behind it.

**Somebody who stops the manual exports loses the settlement record and the code
registry, and will not notice until an income reconciliation goes wrong months
later.**

### Mailchimp — the counts match, and one column does not survive

The API and the CSV agree exactly. `/lists/{id}/members?status=` returns the
same partition down to the five archived 2020 test rows, with `transactional`
being the API's name for the CSV's `nonsubscribed`. The IPs agree too, once you
know the field names **invert** between the two surfaces:

| CSV column | API field | Populated |
|---|---|---|
| `OPTIN_IP` | `ip_opt` | 861 / 861 — joined per address across 1,551 shared contacts, disagreeing on **none** |
| `CONFIRM_IP` | `ip_signup` | 0 / 0 |
| `OPTIN_TIME` | `timestamp_opt` | 1,559 / 1,554 |
| `CONFIRM_TIME` | `timestamp_signup` | **1,560 / 129** |

Checking for signup IPs against `ip_signup` reads zero of 1,555 and looks
exactly like the API withholding them. It is not. It is the wrong field.

**`CONFIRM_TIME` is the one that does not survive.** The consent reading in
`MAILCHIMP_ARCHIVE.md` — confirm equals opt-in on 1,431 contacts while
`CONFIRM_IP` is empty on all of them, the signature of single rather than double
opt-in — rests on a column no pull can produce. **Keep exporting by hand.**

Left open rather than guessed at: `OPTIN_TIME` and `timestamp_opt` disagree on
the **date** for 220 of 1,551 shared contacts. The likeliest explanation is
account-local time against UTC. **This is unverified** and must be described
that way until somebody checks it against a contact whose sign-up moment is
independently known.

Templates and landing-page *content* are also still missing: the API does not
carry them, and the account-level export ZIP remains the only source.

---

## Rate limits

The two APIs publish different *kinds* of limit, and the clients differ
accordingly. This is the substantive difference between the two files.

**Mailchimp: 10 simultaneous connections per account**, 429 on the 11th. That is
a connection count, so a semaphore is both necessary and sufficient.
`MAX_CONCURRENT_REQUESTS = 8` leaves headroom for anything else holding a
connection — a second script, a dashboard export — without the two colliding.

**Humanitix: 200 requests per minute.** That is a rate, and against a rate a
semaphore alone is neither necessary nor sufficient: six concurrent requests to
a fast endpoint can exceed 200/minute, and one concurrent request to a slow one
wastes the budget. So `lib/humanitix/client.ts` has **both** — a semaphore of 6
bounding in-flight sockets, and a minimum-interval throttle at 80% of the
published rate (160/min, ~375 ms between request *starts*) which is the thing
actually enforcing the limit. The 20% held back absorbs the skew between our
request clock and the server's window boundaries, and leaves budget for the
Humanitix web console on the same key.

> The 200/min figure comes from Humanitix's docs. The OpenAPI document carries
> no rate-limit fields and no live 429 has been observed, so neither the limit
> nor whether a 429 carries `Retry-After` is confirmed. Both clients handle
> `Retry-After` if it appears.

Both gates live **inside** the single `fetch` wrapper, not as a helper callers
wrap around their own `Promise.all`. A limiter you have to remember is a limiter
somebody forgets, and the shape that forgets it — `Promise.all` over 180
campaign reports, or over one check-in count per event date — is exactly the
shape these integrations need. Putting the gate at the one point every request
passes through makes the naive call site correct. There is no unguarded path to
`fetch` in either file.

Retries: 5 attempts, exponential backoff from 500 ms capped at 20 s, jittered.
Jitter matters because the gate releases up to 8 requests at once; without it
they would back off in lockstep and re-collide. **429 and 5xx only.** No other
4xx is ever retried — a 401 retried five times is five chances to trip an
account lockout, and a 400 retried is five identical rejections. After a 429,
Humanitix's `deferRateBudget()` pushes *every* caller's budget out, because the
rate limit is per key: one request being told to wait means all of them were
over the line.

`app/api/events/ticket-status/route.ts` adds its own 6-second wall-clock cap on
top, because five retries with backoff can run tens of seconds — past a
serverless function's limit — and the page must degrade rather than be killed
mid-flight.

---

## Five traps, each of which cost something

**1. The vault stores VERBATIM payloads, not mapped objects.** `getGrowthHistory`
was written from Mailchimp's published docs, which list `existing`, `imports`
and `optins`. The us3 shard sends all three as hard zero and puts the real
series in seven fields the docs do not mention. A vault written through the
mapper stored **86 months of zeroes under a correct-looking checksum**. A sha256
over a mapped object proves what our mapper kept, not what the API said. This is
why `fetchRawForArchive()` and `fetchEnvelopeForArchive()` exist and why the
pull uses them.

The one exception is `--include activity`, which goes through the mapped
`getEmailActivity()` **on purpose**, because that accessor's unconditional `ip`
exclusion is the guard keeping read-location records out of the vault.

`fetchEnvelopeForArchive()` is the sibling that keeps the envelope: `/reports/
{id}/open-details` reports `total_opens` and `total_proxy_excluded_opens` beside
its members array, and neither is derivable from the rows. It pages to
exhaustion and splices later pages into the first page's envelope — the largest
send went to 1,779 people, so a single `count: 1000` request would have stored
1,000 of them under a `total_items` of 1,779 and looked complete to anything
that did not compare the two numbers.

**2. `manifest.ts --append` is the CSV builder.** It and `fetch-api.ts` write to
the same `exports[]` array keyed on the same export id, and the append *replaces*
a matching entry rather than merging it. Run against a JSON vault it finds no
CSVs, classifies nothing, and silently overwrites a complete `method: "api-*"`
entry — its `api` block, its endpoint list, every file and hash — with
`files: []`. **An empty entry is worse than no entry: it reads as "this export
was recorded and contained nothing."** It happened on the Humanitix side on
2026-08-28 and was caught only because an unrelated assertion about the CSV
spine happened to exist. Both builders now refuse a directory that holds `.json`
and no `.csv`, and name the tool that should have been used.

**3. An error must carry its status as a number.** Humanitix's transport
originally put the status only in the message prose, so the first failure a
caller tried to *record* rather than abort on read `HTTP 0`. The status now
rides on the error object as well as in the sentence — parsing it back out of
prose is the kind of thing that silently becomes 0 the day somebody rewords the
sentence.

**4. An archival pull records failures rather than aborting.** Humanitix answers
**500 for one date of `storytellers-series-2-0`**, a 2020 three-session series,
every time. An aborting loop cost the remaining five events their check-in
counts. So the entry becomes `{ eventDateId, error: { status } }` and the pull
continues. The status is kept and **the body is never written** — this transport
also serves the attendee endpoints, and a body echoed into a file is how personal
data escapes a place that was supposed to hold counts. A run that stops at the
first bad row leaves a directory nobody can tell apart from a complete one.

**5. Scan everything, not a sample.** A five-campaign sample said the newsletter
content was PII-free. Scanning all 180 found **seven real addresses**: five She
Sharp role mailboxes, a partner's recruitment address, and one named
individual's personal address in the footer of fourteen consecutive monthly
issues. `content/` is classified `person-identifying` because of that scan, and
`build-campaigns.ts` re-runs CI's own email and IP regexes over every campaign
title and subject line before writing, failing the build and naming the campaign
id rather than the string.

---

## What the APIs did reach

Every figure below is from the committed archive or the vault, not from memory.

**Mailchimp.** 180 sent campaigns (July 2019 – August 2026), 188,796 emails,
71,493 unique opens (**37.9%**) and 5,256 unique clicks (2.8%). `GET /lists`
reports `campaignCount: 213`, which counts drafts and deleted campaigns; neither
that nor the 209 in older notes is a count of sends.

The open rate has a boundary in it. Apple Mail Privacy Protection pre-fetches
images, which Mailchimp counts as an open. Every campaign carries
`proxyExcludedUniqueOpens` — Mailchimp's own correction — totalling **62,531
against 71,493, i.e. 33.1%**. The two figures are *exactly equal* for every
campaign sent before 2022 and diverge hard afterwards, which is both the
evidence of where the boundary falls and the reason **an open rate cannot be
compared across 2021**. Say which of the two you used.

- **86 months** of audience size, gapless: 157 (2019-07) → peak **1,742**
  (2025-11) → **1,555** (2026-08). `subscribed` is a **stock** — members at the
  end of that month, not that month's additions — so the series is not
  monotonic. The list has been shrinking through 2026.
- **2,055 days** of daily sends/opens/clicks/subs/unsubs in `list-activity.json`.
  Growth history is monthly; this is the resolution underneath.
- **237 segments**: 214 `static` (which is what a tag is) and 23
  `campaign_static` (a past send's frozen recipient set) — matching exactly the
  23 tags already classified `campaign-segment` from the CSV.
- **125 templates**: 6 `user` (the organisation's own), 40 `base`, 79 `gallery`.
  All 125 are pulled; sorting them would put a judgement into the archive that
  the `type` field already states.
- **677 gallery images, 547 MB.** `--include assets` writes the inventory;
  `fetch-assets.ts` downloads the files. Those CDN URLs stop resolving when the
  account closes.
- **Zero automations, zero landing pages, zero customer journeys, zero interest
  categories, zero webhooks.** Each empty array is written and hashed anyway.
  After the account is gone, "we asked, and there were none" is only true if
  somebody asked.

**Humanitix.** 59 events, 63 live event dates, 4,169 orders, 5,259 tickets, 0
tags.

---

## Open items

| Item | Status |
|---|---|
| Mailchimp key expires **2027-08-27** | Mailchimp forces a one-year expiry. Nothing warns; the failure will be a 401 in a hand-run script. Renew or plan for the account to be gone first |
| The 2020 Mailchimp key | Never expires, deliberately not revoked. Establish whether the Humanitix → Mailchimp integration uses it or an OAuth link, then revoke |
| `OPTIN_TIME` vs `timestamp_opt`, 220 of 1,551 dates disagree | **Unverified.** Most likely account-local vs UTC. Do not cite either as authoritative until checked |
| Three Mailchimp gaps the 2026-08-28 pull settled are still `OPEN` in the manifest | The pull *prints* the `--close-gap` commands for `per-campaign-recipient-activity`, `saved-segments` and `automations-forms-landing-pages`; nobody ran them. The data exists in the vault; the manifest does not say so |
| Humanitix `knownGaps[]` carry no `closedBy` field at all | `HUMANITIX_ARCHIVE.md` records `event-summary` as closed on 2026-08-18, but the manifest entry has no closure marker. The two disagree |
| `HUMANITIX_VAULT_DIR` is not in `.env.example` | Read by `scripts/humanitix/vault.ts`. Set it inline or add it |
| Templates and landing-page content | Not on the API. The account-level export ZIP is still the only source, and it never arrived |
| The Humanitix payout, access-code and discount reports | No API route. The Reports screen is the only source, and 124 access codes live in it |
| `scripts/humanitix/fetch-api.ts` header says the key "must not be set in Vercel" | Stale. It is set, and the ticket-status route needs it |

---

## Related

- `docs/development/MAILCHIMP_ARCHIVE.md` — what the audience archive holds and
  the eight ways to get a number wrong out of it
- `docs/development/HUMANITIX_ARCHIVE.md` — the same, for ticketing
- `docs/development/EMAIL_OPERATIONS.md` — how mail is actually sent
- `docs/deployment/EMAIL_AUTHENTICATION.md` — the Mailchimp → Resend migration
  this feeds
- `.claude/skills/update-mailing-list/references/consent-rules.md` — the gate on
  every send. Nothing here overrides it, and **an open is not consent**
- `she-sharp-slack-archive/mailchimp/README.md`,
  `she-sharp-slack-archive/humanitix/README.md` — the raw files and their rules
