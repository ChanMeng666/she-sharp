# Email Authentication (SPF, DKIM, DMARC)

**Last verified:** 2026-07-31 (live DNS queried against `1.1.1.1`);
`resend._domainkey` replaced and re-verified **2026-08-28**, when the domain
moved to the She Sharp–owned Resend team — see
[Resend account migration](#resend-account-migration-2026-08-28).

> **Picking this up cold? Read these three first:**
> 1. [Outstanding work](#outstanding-work) — everything not done, with what
>    blocks each item. The actionable list.
> 2. [Two traps](#two-traps) — the changes that break sending immediately.
> 3. [Migrating the newsletter from Mailchimp to Resend](#migrating-the-newsletter-from-mailchimp-to-resend)
>    — the live newsletter is **still on Mailchimp**; this is the reason the rest
>    of this work exists.
>
> **Applied 2026-07-31:** Stage 1 (DMARC Management + `rua`), Stage 2a (Google
> in root SPF), the sending-stream code, both Vercel env vars, and the Resend
> bounce/complaint webhook. **Blocked:** Google DKIM (Stage 2b) — needs Workspace
> super-admin, which the maintainer does not have. Do **not** go past
> `p=quarantine` until that lands.

The DNS records that decide whether She Sharp email reaches inboxes are all
hosted in Cloudflare, but their values come from three different services and
were recorded nowhere. This file is that record, plus the staged plan for moving
the domain from monitoring to enforcement.

Written in response to Resend's [The New DMARC is
Here](https://resend.com/blog/the-new-dmarc-is-here) (2026-07-17), which
announced DMARCbis — RFC 9989/9990/9991. What changed: `pct`, `rf` and `ri` are
removed; `t=` (testing), `np=` (non-existent subdomain policy) and `psd=` are
added; and policy discovery moves from the Public Suffix List to a DNS Tree
Walk. Existing records stay valid.

---

## Who owns what

**DNS is on Cloudflare** (`art.ns.cloudflare.com`, `ashley.ns.cloudflare.com`).
Every record below is edited in the Cloudflare dashboard — but three of them
have their *value* generated somewhere else, because only the service that signs
the mail can produce its own key.

| Record | Value comes from | Edited in |
|---|---|---|
| `_dmarc`, root SPF, TLS-RPT | you | **Cloudflare** |
| `google._domainkey` | **Google Admin** (generates the key pair) | Cloudflare |
| `resend._domainkey`, `send.` SPF + MX | **Resend** (generates the key pair) | Cloudflare |
| DKIM rotation, webhook signing secret | **Resend dashboard** — team **shesharp**, owned by `website@shesharp.org.nz` (Pro) | — |
| `RESEND_WEBHOOK_SECRET`, `EMAIL_UNSUBSCRIBE_SECRET` | you | **Vercel** |

**Resend is owned by She Sharp, not by the maintainer.** Since 2026-08-28 the
domain lives in the Resend team **shesharp** (`website@shesharp.org.nz`, Pro:
Transactional 50,000/month renewing on the 27th; Marketing still Free). It was
moved off the maintainer's personal team with Resend's Domain Claim flow — see
"Resend account migration (2026-08-28)" below for the method and the DNS delta.

The `include:_spf.1stdomains.co.nz` inside the root SPF is a **leftover from the
old web host** (1stDomains → isx.net.nz → voyager.co.nz), not a sign of where DNS
lives. See "Legacy SPF include" below — it is probably removable.

> **Vercel env vars — do not use stdin.** Use the `--value` flag:
> ```powershell
> vercel env add NAME production --value $v --no-sensitive --force --yes
> ```
> Piping (`printf … |`, `< file`) can silently store an empty string, and since
> CLI ≥54 defaults new vars to type **Sensitive**, `vercel env pull` returns
> sensitive vars as `""` — an empty read is then indistinguishable from an empty
> value, so you cannot tell whether it worked. `--no-sensitive` makes the value
> readable and therefore verifiable, which matches every other secret in this
> project (`RESEND_API_KEY`, `AUTH_SECRET`, `CRON_SECRET` are all readable).
> Always pull and compare afterwards.
>
> This project has no Vercel Git connection, so a **new commit** is required for
> new env vars to take effect; the dashboard "Redeploy" button will not pick
> them up.

### Mailbox access — what you actually need

The maintainer signs in as **`website@shesharp.org.nz`** and cannot open the
other `@shesharp.org.nz` mailboxes. Almost none of this needs them, because
three different things get confused here:

| | Needs a mailbox login? |
|---|---|
| **Sending as** `info@` via Resend | **No.** Resend signs with the domain's DKIM key. The address never has to be opened to send from it — which is exactly how this site spent a year sending as `hello@`, a mailbox that had never been created. Sending works; the reply is what bounces. |
| **Reply-To** `info@` / `mentoring@` | **No.** The point is that replies reach *the team*, not the maintainer. Both were confirmed to be real Google Workspace inboxes with a named reader on 2026-08-23 — see `docs/development/EMAIL_ADDRESSES.md`. Never set a Reply-To that has not been. |
| **Enabling Google DKIM** | **No mailbox — but yes, Google Workspace super-admin** on `admin.google.com`. See below. |
| **Collecting DMARC reports** | **No.** Cloudflare receives them on its own domain. |

**The one real dependency is super-admin, and as of 2026-07-31 we do not have
it** — `website@shesharp.org.nz` cannot open `admin.google.com`. Consequences:

| Stage | Console | Status |
|---|---|---|
| 1 — DMARC Management + `rua` | Cloudflare | **Done 2026-07-31** |
| 2a — add Google to root SPF | Cloudflare | **Done 2026-07-31** |
| 2b — **Google DKIM** | Google Admin | **Blocked — needs a super admin** |
| 3 — `np=reject`, then quarantine | Cloudflare | Pending ~2 weeks of reports |
| 4 — `p=reject` | Cloudflare | Gated on 2b |
| Bounce/complaint webhook | Resend + Vercel | **Done 2026-07-31** |
| Code + env vars | Vercel | **Done 2026-07-31** |
| Resend DKIM 1024 → 2048 rotation | Resend + Cloudflare | Pending — schedule before quarantine |

So **everything except 2b (and therefore 4) can be done without Google**, and
that is most of the value. See "If nobody will grant super admin" in Stage 2 for
the fallback — stopping permanently at `p=quarantine` — and for the text to send
whoever administers the Workspace.

Everything outside Google is owned by `website@` already (see
`MIGRATION_TO_SHESHARP_ORG.md`).

> **Do not put an address in `EMAIL_UNSUBSCRIBE_MAILTO` you cannot verify.**
> The one-click HTTPS URL alone satisfies RFC 8058 and the Gmail/Yahoo rules.
> Some clients prefer a `mailto:`, so pointing one at an unmonitored or
> non-existent alias means opt-out requests bounce — worse than not offering
> one. Leave it empty unless someone confirms the inbox is real and watched.

---

## Current state (as measured)

**Applied 2026-07-31:** Stage 1, Stage 2a, the code, both Vercel env vars, and
the Resend bounce/complaint webhook (endpoint
`https://www.shesharp.org.nz/api/webhooks/resend`, listening for
`email.bounced`, `email.complained`, `email.failed`, `email.delivery_delayed`).

The live records now read:

```
shesharp.org.nz            TXT    v=spf1 include:_spf.google.com \
                                        include:_spf.1stdomains.co.nz ~all
_dmarc.shesharp.org.nz     TXT    v=DMARC1; p=none; \
                                  rua=mailto:0061f6fe…@dmarc-reports.cloudflare.net;
resend._domainkey…         TXT    p=MIGfMA0…oQ2d+CqK/… (1024-bit RSA, replaced
                                                        2026-08-28 — see below)
send.shesharp.org.nz       TXT    v=spf1 include:amazonses.com ~all
send.shesharp.org.nz       MX     feedback-smtp.us-east-1.amazonses.com
k2._domainkey…             CNAME  dkim2.mcsv.net        (Mailchimp)
k3._domainkey…             CNAME  dkim3.mcsv.net        (Mailchimp)
shesharp.org.nz            MX     aspmx.l.google.com …  (Google Workspace)
google._domainkey…                DOES NOT EXIST
_bimi / _mta-sts / _smtp._tls     DO NOT EXIST
```

### Three senders, two of them authenticated

| Sender | Used for | From | DMARC today |
|---|---|---|---|
| **Resend** | transactional + the newsletter pilot | `noreply@` | **Passes** — aligned DKIM *and* aligned SPF (Return-Path `send.shesharp.org.nz`) |
| **Mailchimp** | the live monthly newsletter | `newsletter@` | **Passes** — aligned DKIM (`k2`/`k3`). SPF does not align (Return-Path is `rsgsv.net`), so DKIM is carrying it alone |
| **Google Workspace** | humans (`info@`, `mentoring@`, …) | various | **Fails both** ← the gap |

Progress against the two original problems:

1. ~~**No `rua`**~~ — **fixed 2026-07-31.** Cloudflare DMARC Management is
   collecting. First reports land within ~24h; the dashboard is at
   Email → DMARC Management.
2. **Google Workspace DKIM is still missing** — *partly* addressed. Stage 2a
   added `include:_spf.google.com`, so human mail now passes SPF with aligned
   identity and therefore passes DMARC on direct delivery. What is still absent
   is aligned **DKIM**: Gmail signs with Google's default `d=*.gappssmtp.com`
   key, which does not align and counts for nothing. Forwarded mail therefore
   still has no passing mechanism. Needs a Workspace super admin — see Stage 2b.

Note what is **not** a problem: both bulk senders already authenticate cleanly,
so tightening DMARC does not endanger the newsletter on either platform.

---

## Two traps

> **Never set `aspf=s`.** Resend's Return-Path is `send.shesharp.org.nz`, which
> aligns with `shesharp.org.nz` only under *relaxed* alignment. Strict SPF
> alignment breaks every Resend send immediately.

> **Never add `include:amazonses.com` to the root SPF.** It is unnecessary (SPF
> is evaluated against the Return-Path, which already passes on the `send.`
> subdomain), it authorises the entire shared SES estate — every AWS customer —
> to send with a `shesharp.org.nz` Return-Path, and it burns a DNS lookup.

---

## SPF lookup budget: 4 of 10

SPF permits **10 DNS lookups**. Exceeding it is a `permerror`, which is a hard
SPF failure. Measured 2026-07-31, after adding Google:

| Include | Lookups |
|---|---|
| `_spf.google.com` — now a **flat** record, no nested includes | 1 |
| `_spf.1stdomains.co.nz` → self + `_spf.mail.isx.net.nz` + `_spf.smtp.voyager.co.nz` | 3 |
| **Total** | **4** |

**Six lookups of headroom.** Note this cost only 1, not the 4 that older guides
assume: Google used to chain `_netblocks`, `_netblocks2` and `_netblocks3`, and
has since flattened `_spf.google.com` to bare `ip4:`/`ip6:` ranges. Re-measure
rather than trusting the arithmetic — includes change under you:

```
dig +short TXT _spf.google.com @1.1.1.1
```

Recount before adding any `include:`. Cloudflare's DMARC Management also carries
an SPF lookup-count check.

### Legacy SPF include — probably removable

`include:_spf.1stdomains.co.nz` authorises the **old web host's** mail servers
(chain: `_spf.1stdomains.co.nz` → `_spf.mail.isx.net.nz` →
`_spf.smtp.voyager.co.nz` + three `/27` blocks). Since the migration, nothing in
this codebase sends through them — all mail goes via Resend or Google Workspace.

**Do not remove it on that reasoning alone.** After two weeks of Stage 1 reports,
check whether anything is still sending from those IPs (a contact form on an old
site, a legacy cron, a mailbox nobody remembers). If nothing is, drop the
include:

```
v=spf1 include:_spf.google.com ~all
```

That takes the budget from 4/10 to **1/10** and removes three networks' worth of
authorised senders. This is exactly the kind of question the aggregate reports
exist to answer — which is why it waits for them.

---

## Rollout

Each step is gated on evidence from the previous one. Do not skip ahead.

### Stage 1 — Visibility (day 0, zero risk)

**Use Cloudflare DMARC Management.** It is free on every plan for domains using
Cloudflare DNS, it lives in the same console as the records themselves, and it
parses the XML into a dashboard of sending sources with their SPF/DKIM results.
No third-party account, no mailbox to maintain, nothing to self-host.

Cloudflare dashboard → the domain → **Email → DMARC Management → Enable**. It
scans for an existing `_dmarc` record and appends its own `rua` to it.

> **It does not touch your MX.** Reports are delivered to a Cloudflare address on
> Cloudflare's own domain (`…@dmarc-reports.cloudflare.net`), so Google
> Workspace keeps receiving all mail for `shesharp.org.nz`. Do **not** confuse
> this with enabling Cloudflare **Email Routing** on the apex, which *does*
> replace MX records and would break inbound mail.
>
> Confirm it immediately after enabling:
> ```
> dig +short MX shesharp.org.nz @1.1.1.1
> ```
> The five `aspmx.l.google.com` entries must still be there and nothing
> `cloudflare` should appear. If they changed, revert before doing anything else.

The resulting record should read (Cloudflare fills in its own address):

```
v=DMARC1; p=none; rua=mailto:<cloudflare-token>@dmarc-reports.cloudflare.net; ri=86400
```

No `pct=` (removed in RFC 9989). No `adkim`/`aspf` — relaxed is the default and
the default is what works here.

**Not `ruf=`.** RFC 9991 makes failure reports opt-in, and they carry recipient
addresses and message headers. Leave it unset permanently.

*Optional second copy — needs Workspace admin, so skip it by default.* If you
want the raw XML archived somewhere you control, a super admin can create a
Google Group `dmarc@shesharp.org.nz` ("Who can post: Anyone on the web", no
moderation — a Group costs no licence); then append
`,mailto:dmarc@shesharp.org.nz` to the `rua`. **Not required.** Cloudflare's
dashboard is the working tool, and this step is the only part of Stage 1 that
touches Google at all — leaving it out keeps Stage 1 entirely inside Cloudflare.

*Verify:* `dig +short TXT _dmarc.shesharp.org.nz @1.1.1.1` shows the `rua`, then
wait 72 hours and check the Cloudflare dashboard for sources.

*Deep dives:* drop a specific report's raw XML into
[checkdmarc.email](https://checkdmarc.email) (Resend's free open-source parser)
when something in the dashboard needs unpacking.

### Stage 2 — Close the enforcement blocker (days 1–3)

Google Workspace mail is the only unauthenticated sender on the domain. Two
independent fixes; **2a you can do alone, 2b needs a Workspace super admin.**

#### Stage 2a — SPF (Cloudflare only, no admin needed)

**Cloudflare** → DNS → replace the root TXT:

```
v=spf1 include:_spf.google.com include:_spf.1stdomains.co.nz ~all
```

This alone takes Google-sent mail from failing *both* checks to passing SPF with
aligned identity — which is enough for DMARC to pass on direct delivery. It is
a strict improvement over today and costs nothing.

`~all` stays for now. Under DMARC there is no difference between `~all` and
`-all`, and `-all` materially increases breakage on forwarded mail (mailing
lists, `.forward` rules) — real risk for a community organisation.

#### Stage 2b — DKIM (needs Google Workspace super admin)

**Google Admin** → Apps → Google Workspace → Gmail → Authenticate email →
`shesharp.org.nz` → Generate new record (**2048-bit**, prefix `google`) →
publish the TXT at `google._domainkey.shesharp.org.nz` in Cloudflare → back in
the Google console, click **Start authentication**.

**Why Google and not Cloudflare:** DKIM signing happens inside Google's mail
servers, so only Google can generate the private half of the key. You copy the
public half out of the Google console into Cloudflare. Cloudflare hosts the
record; Google owns the key. There is no way to do this from the DNS side.

**"Doesn't Gmail already sign my mail?"** It does — with Google's *default* key,
`d=<something>.gappssmtp.com`. That domain is not `shesharp.org.nz`, so the
signature **does not align** and contributes nothing to DMARC. Only a custom
key generated for the domain counts. This is the single most common reason a
Workspace domain cannot reach enforcement.

**Why SPF alone is not enough:** SPF is evaluated against the connecting IP, so
it fails the moment a message is forwarded — an alumni address, a `.forward`
rule, a mailing list. DKIM travels with the message and survives all three.
Without 2b, that forwarded fraction of human mail has no passing mechanism.

> A 2048-bit value is ~400 characters and a single DNS TXT *string* caps at 255
> bytes. Cloudflare handles the split itself, so paste the whole value into one
> field and do not chop it up by hand. Confirm with
> `dig +short TXT google._domainkey.shesharp.org.nz @1.1.1.1` — a truncated key
> looks like a valid record while every signature silently fails.

*Verify both:* send from `info@shesharp.org.nz` in Gmail to a personal Gmail →
**Show original** → all three of `SPF: PASS`, `DKIM: 'PASS' with domain
shesharp.org.nz`, `DMARC: 'PASS'`. Repeat via a Resend path (trigger a password
reset). Both must pass before Stage 4.

#### If nobody will grant super admin

Then **stop at `p=quarantine` and stay there.** That is a defensible permanent
position, not a failure:

- Do Stage 1, Stage 2a and Stage 3 — all Cloudflare, all yours. That is the bulk
  of the value: you gain visibility, you close the non-existent-subdomain hole
  with `np=reject`, and spoofed mail starts going to Junk instead of the inbox.
- **Do not go to `p=reject`.** At quarantine, a forwarded message from `hello@`
  lands in someone's spam folder. At reject it is destroyed. Without aligned
  DKIM you have no second mechanism to catch it, and you will not find out.
- Read the Stage 1 reports before even the quarantine step: they show exactly
  how much of your mail is arriving via forwarders. If that number is
  effectively zero, quarantine is comfortable; if it is not, that is your
  evidence for the admin request below.

**The ask is small — send this to whoever administers the Workspace:**

> Could you enable DKIM signing for shesharp.org.nz in the Google Admin console?
> It's Apps → Google Workspace → Gmail → Authenticate email → Generate new
> record (2048-bit), then send me the TXT value to publish in Cloudflare, and
> click "Start authentication" once I confirm it's live.
>
> Right now our mail is signed with Google's default gappssmtp.com key, which
> doesn't count for DMARC, so we can't protect the domain from being spoofed in
> phishing emails to our donors and mentees. Takes about five minutes and
> changes nothing about how mail is sent or received.

Alternatively they can grant `website@shesharp.org.nz` the **Super Admin** role
(Admin console → Directory → Users → website@ → Admin roles and privileges),
which also unblocks the DKIM key rotation this document schedules annually.

### Stage 3 — Enforce, in two steps

**Day ~14 — `np=reject`** (free protection, no risk):

```
v=DMARC1; p=none; np=reject; rua=mailto:<cloudflare-token>@dmarc-reports.cloudflare.net; ri=86400
```

`np` (new in DMARCbis) applies only to subdomains that do not exist in DNS at
all. `send.` exists and is unaffected. No legitimate mail can come from a
non-existent subdomain, which closes the `billing.shesharp.org.nz` /
`secure.shesharp.org.nz` spoofing trick.

*Gate:* two weeks of reports show no sending from an unrecognised subdomain.

**Day ~30 — quarantine:**

```
v=DMARC1; p=quarantine; sp=quarantine; np=reject; rua=mailto:<cloudflare-token>@dmarc-reports.cloudflare.net; ri=86400
```

*Gate — all three, across 2+ weeks of reports:*
1. Every source is identified. Expect exactly three: Google, Amazon SES
   (Resend), and forwarders. Anything else must be explained first.
2. Google Workspace mail passes DMARC. **Aligned DKIM pass is the goal**; if
   only SPF passes (Stage 2b was not done), quarantine is still reasonable —
   but read the forwarder rows first and accept that whatever share of mail
   arrives via forwarders will land in Junk.
3. No third-party sender is hiding in the failures. Look specifically for
   Humanitix, Stripe, Slack, or a mail-merge tool sending as `@shesharp.org.nz`.

`sp` defaults to `p`, so `sp=quarantine` is redundant — set it anyway, so a
future edit to `p=` cannot change subdomain policy as a side effect.

Also at this point: **rotate the Resend DKIM key from 1024 to 2048-bit** (see
below). Do it before `p=reject`, never after.

### Stage 4 — Reject (day ~60–90)

```
v=DMARC1; p=reject; sp=reject; np=reject; rua=mailto:<cloudflare-token>@dmarc-reports.cloudflare.net; ri=86400
```

Then flip the root SPF to `-all`.

*Gate — hard prerequisite plus evidence:*
0. **Stage 2b is done.** Google Workspace mail must show an aligned DKIM pass.
   Do not reach this stage on SPF alone: at reject, a forwarded message from
   `hello@` is destroyed rather than filed in Junk, and nothing tells you it
   happened. If DKIM is still unavailable, stay at quarantine indefinitely —
   see "If nobody will grant super admin" in Stage 2.
1. 30 days at quarantine, zero legitimate mail quarantined, zero "did you send
   this / it went to spam" reports from mentors, mentees or donors.

Optionally bridge with `t=y` for two weeks — DMARCbis's replacement for the
removed `pct=` ramp. Receiver support is uneven, so treat it as a declaration of
intent, not as protection. The evidence gate above is what actually protects
you.

---

## Resend DKIM rotation (1024 → 2048)

1024-bit RSA is below current NIST guidance and some receivers down-weight it.
The rotation carries real transient risk: the selector stays `resend._domainkey`,
so there is an unavoidable window where the published key and the signing key
disagree and **every Resend message fails DKIM**.

1. Pick a quiet window — **after** a monthly newsletter send, never before one.
2. In Cloudflare, set the `resend._domainkey` record's TTL to 300 (it is likely
   on "Auto") so the change propagates in minutes rather than hours.
3. Rotate / re-add the domain at 2048-bit in the Resend dashboard.
4. Publish the new TXT **immediately**.
5. Wait for Resend to show Verified, send a test, confirm `DKIM: PASS`.

Do this at `p=none` or `p=quarantine`, where a botched rotation degrades. At
`p=reject` it drops mail on the floor.

**The 2026-08-28 account move replaced the key but did not rotate it** — the new
team issued another **1024-bit** RSA key. Everything above is still outstanding.

---

## Resend account migration (2026-08-28)

`shesharp.org.nz` moved out of the maintainer's personal Resend team
(`chanmeng6666@gmail.com`) into the She Sharp–owned team **shesharp**
(`website@shesharp.org.nz`, **Pro** — Transactional 50,000/month renewing on the
27th; Marketing still on the Free plan). The organisation now owns its own
sending account, which was the point.

**Method: Resend's Domain Claim flow**, driven from the `resend` CLI —
`domains claim create` → publish the TXT it returns → `domains claim verify` →
poll `domains claim get` until `completed` → update DKIM in DNS →
`domains verify`.

| | Old team | New team **shesharp** |
|---|---|---|
| Domain id | `86d3a2e3-3178-4bc1-a3dd-7cb4561eaee4` (now `failed` there) | `0e8e0ee5-3dd9-437b-a08d-a595d1f4e487` |
| Region | us-east-1 | us-east-1 — **deliberately the same** |
| Return-Path | `send.shesharp.org.nz` | `send.shesharp.org.nz` — unchanged |
| Webhook | → `https://www.shesharp.org.nz/api/webhooks/resend` | `facbd62e-7c3e-47fa-abf1-0d36b37cd71c`, same URL, same four events, **new `whsec_` secret** |
| Contacts | 2 test addresses | **0 — nothing was imported** |

Segments and topics do **not** travel with a claim; they were recreated. Their
new ids are in `.claude/skills/update-mailing-list/references/resend-roster-cli.md`
and in `docs/development/EMAIL_OPERATIONS.md`.

The old team was cleared out after the move, so its full pre-migration state —
including both Cloudflare zone dumps — lives only in the private archive repo at
`resend/2026-08-28-account-migration/` in `she-sharp-slack-archive`. No
credentials are stored there.

### The DNS delta was exactly one record

Only `resend._domainkey` TXT changed — the old value began
`p=MIGfMA0…DX0GQAjj8McjI29YZE64vIM…`, the new one begins
`p=MIGfMA0…oQ2d+CqK/AK1XsgAds2Ef…` (218 characters, still 1024-bit RSA).

**Why only one:** the claim was created with `--region us-east-1
--custom-return-path send`, so the `send.` SPF and MX values the new team asked
for came back **byte-identical** to the ones already published. That is the
reusable trick — match the region and the Return-Path subdomain of the old
setup and a domain move becomes a single-record DNS change.

Unchanged, and deliberately left alone: `send.shesharp.org.nz` TXT
(`v=spf1 include:amazonses.com ~all`), `send.shesharp.org.nz` MX
(`feedback-smtp.us-east-1.amazonses.com`), root SPF, root MX (Google
Workspace), `_dmarc` (still `p=none`), and Mailchimp's `k2`/`k3._domainkey`
CNAMEs. A temporary apex TXT `resend-domain-verification=…` was added for the
claim and deleted afterwards. The DKIM record's TTL was lowered 3600 → 300 for
the swap.

### Why the swap was safe without waiting a full TTL

**SPF alignment held throughout.** The Return-Path stayed
`send.shesharp.org.nz`, which aligns with `shesharp.org.nz` under relaxed
alignment — so during the window where a resolver still had the *old* DKIM key
cached and messages were being signed with the *new* one, DMARC still passed on
the SPF leg. Add `p=none`, and the worst case was a temporary DKIM-only failure
with no policy consequence. Do not read this as "DKIM swaps are safe": it is
safe *because* the Return-Path did not move at the same time.

### Vercel production env vars updated

> **This is a record of what the 2026-08-28 account migration changed, not a
> description of current configuration.** `RESEND_NEWSLETTER_SEGMENT_ID` and
> `RESEND_NEWSLETTER_TOPIC_ID` were superseded a day later, when the consent
> record moved into the database. Nothing in the repo reads them any more and
> they are gone from `.env.example`; they are **still set on Vercel production**
> pending the maintainer's approval to remove — outstanding-work item 8g.

`RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `RESEND_NEWSLETTER_SEGMENT_ID`,
`RESEND_NEWSLETTER_TOPIC_ID`. **Deliberately not touched:**
`EMAIL_UNSUBSCRIBE_SECRET`, `EMAIL_FROM`, and `lib/email/senders.ts` — the four
sending streams and every From address are unchanged, which is the whole reason
subscribers see no difference.

---

## Optional extras

**TLS-RPT** — free, five minutes, protects *inbound* mail:

```
_smtp._tls.shesharp.org.nz  TXT  "v=TLSRPTv1; rua=mailto:tlsrpt@shesharp.org.nz"
```

Unlike DMARC reports, Cloudflare does not collect these — the `rua` must be a
real inbox, which means a super admin has to create the address. **Skip it**
unless someone is going to read the reports; it protects inbound mail only and
Google's MX already negotiates TLS.

**MTA-STS** — last, or not at all. Needs a policy file hosted at
`https://mta-sts.shesharp.org.nz/.well-known/mta-sts.txt` (a second Vercel
domain plus a route), and it is the one item here where a mistake breaks
*inbound* mail. Google's MX already negotiates TLS. If you do it, start at
`mode=testing` and stay there a month.

**BIMI — skip.** The Gmail checkmark needs a Verified Mark Certificate, roughly
USD 1,000–1,500/year plus a registered trademark. Not a defensible spend for a
volunteer non-profit. The free half (a `_bimi` record with no `a=` tag and an
SVG Tiny P/S logo) is ignored by Gmail and protects nothing.

---

## Migrating the newsletter from Mailchimp to Resend

The reason this work exists. The goal is that the newsletter keeps landing in
the inbox — not Promotions, not Spam — through a change of sending platform.

> **Status, 2026-08-29 — the path is built; the move has not happened.**
>
> **Built:** the marketing consent record now lives in this project's database
> (`newsletter_subscribers`, migration `0032`, **applied to production**), not in
> Resend; the subscribe funnel writes to it with double opt-in; and the send path
> is `scripts/email/recipients-from-db.ts` → `scripts/newsletter/build-newsletter-batch.ts`
> → a human running the printed `resend emails batch` commands. The newsletter no
> longer goes through a Resend **broadcast** — it goes through the transactional
> **batch** API, which is why every message now has to carry its own
> `List-Unsubscribe` pair. Reasoning and costs:
> [`../development/EMAIL_PLATFORM_STRATEGY.md`](../development/EMAIL_PLATFORM_STRATEGY.md).
>
> **Also built, later the same day:** the import. `newsletter_subscribers` holds
> **1,545** rows — 1,560 read from the 2026-08-17 `subscribed` export, **15**
> held back by the suppression register, 0 malformed — every one carrying a real
> `confirmedAt` from the export's `CONFIRM_TIME`. The register was topped up
> first (2,138 → **2,144**), and `reconcile` reports no drift.
>
> **Not done: the send.** **Nothing has been sent.** The live newsletter **still
> goes out from Mailchimp**, the Humanitix → Mailchimp integration still feeds
> the Mailchimp audience, and the first real send is a separate, explicitly
> approved step that must be **ramped**, not fired at all 1,545 at once. The ramp
> and the retirement order below are still ahead of us; only the list-hygiene and
> import half is behind.

### Do these two things in separate months

**Do not tighten DMARC and switch ESP in the same window.** If deliverability
dips you will not know which change caused it, and the fix for each is
different. Suggested order:

1. **Month 1 — DMARC only.** Stage 1 (visibility) and Stage 2a. Nothing about
   the newsletter changes; Mailchimp keeps sending. You end the month with
   reports that tell you what your baseline actually is.
2. **Month 2 — ESP only.** Migrate the newsletter to Resend at `p=none`, where
   a mistake degrades rather than destroys. Compare open/bounce/complaint rates
   against the Mailchimp baseline you now have.
3. **Month 3+ — resume tightening.** Stage 3, once the Resend send is boring.

### The From address does not change

`She Sharp <newsletter@shesharp.org.nz>`, From and Reply-To — identical to what
Mailchimp sends today. Gmail and Outlook weight reputation partly per sending
identity, and that address carries years of opens, replies and "not spam"
signals. The infrastructure underneath is already changing; changing the visible
sender at the same time would start a cold bulk identity on precisely the send
where that hurts most. Encoded in `lib/email/senders.ts` (`marketing` stream).

### The one thing most likely to go wrong: list hygiene

Mailchimp has spent years quietly accumulating a suppression list — every hard
bounce, every unsubscribe, every complaint. **That history does not live in the
CSV export of your subscribers.** Export the audience, import it into Resend,
and you will mail a few hundred addresses Mailchimp had already stopped mailing.
Bounces and complaints spike on your first Resend send, against a domain
reputation that has no Resend history to absorb it. This is how ESP migrations
fail, and it fails on send one.

**Status: done, on 18 August 2026.** The export was taken on 2026-08-17 and is
archived — see `docs/development/MAILCHIMP_ARCHIVE.md`. The real numbers, which
this section previously had to guess at:

| Mailchimp status | Contacts | What it is |
|---|---|---|
| `Subscribed` | **1,560** | The list. The only file that may be imported |
| `Unsubscribed` | 803 | Left. 7 of them by filing a spam complaint |
| `Nonsubscribed` | 782 | **Never subscribed at all** — see below |
| `Cleaned` | 544 | Hard-bounced. Mailchimp's word for dead |

Note the fourth. Mailchimp exports **four** statuses, not three, and
`Nonsubscribed` is not a lapse in consent but an absence of one: transactional
contacts the account holds and may not market to. Left out of the suppression
register they would look like fresh addresses to the next import.

Before importing anything — **this was carried out on 2026-08-29**; it is kept as
the procedure because the same shape applies to any future audience carry-over:

1. In Mailchimp, export **all four** statuses, not one. (Audience → All contacts
   → Export Contacts produces one file per status.)
2. Import **only** `Subscribed`, into `newsletter_subscribers`, with
   `scripts/email/import-mailchimp-subscribers.ts` — which refuses the other
   three by filename rather than trusting whoever runs it. (This step used to
   read "into Resend, through `/update-mailing-list`"; the destination changed
   on 2026-08-29 and the tool with it.)
3. Feed the other three into the suppression register so nothing can re-add
   them. `add-file` exists for exactly this: 2,129 addresses is not a job for
   `add`, and a half-finished suppression list is worse than none because it
   reads as complete.
   ```powershell
   $V = "private/mailchimp/2026-08-17"
   npx tsx scripts/email/suppression.ts add-file "$V/unsubscribed_....csv"  --column "Email Address" --reason "mailchimp-unsubscribed"    --dry-run
   npx tsx scripts/email/suppression.ts add-file "$V/cleaned_....csv"       --column "Email Address" --reason "mailchimp-cleaned"         --dry-run
   npx tsx scripts/email/suppression.ts add-file "$V/nonsubscribed_....csv" --column "Email Address" --reason "mailchimp-never-subscribed" --dry-run
   # then again without --dry-run, and confirm by round-trip:
   npx tsx scripts/email/suppression.ts list                     # expect 2129
   npx tsx scripts/email/suppression.ts check <an unsubscribed address>   # exit 0
   npx tsx scripts/email/suppression.ts check <a subscribed address>      # exit 1
   ```
   Only hashes are written; no address reaches disk or the terminal.
4. ~~Also set those contacts `unsubscribed` in Resend~~ — **moot since
   2026-08-29.** There is no Resend contact list any more, so the local register
   and the `newsletter_subscribers` status are the only two flags, and both are
   ours.
5. **Top the register up from the API immediately before the import, every
   time.** The three files above are a snapshot of one afternoon, and the list
   kept moving after it: the first run of
   ```bash
   npx tsx scripts/email/suppression.ts pull-mailchimp --dry-run   # then without
   ```
   on 2026-08-27 took the register from 2,129 to **2,138** — three unsubscribes
   and six hard bounces from the ten days since the export, every one of which
   an import built on that export would have emailed. It is incremental
   (`--since <ISO>`, or `--full` to re-walk) and needs `MAILCHIMP_API_KEY`.

   **The rule proved itself two days later.** The run immediately before the
   2026-08-29 import took the register 2,138 → **2,144**: six *more* people had
   unsubscribed or hard-bounced in those two days, and all six were among the
   fifteen rows the import then held back — so skipping the top-up would have
   mailed six people who had just left. The gap between an export and an import
   is never zero, so neither is the top-up.

**Having an API key does not retire the manual export.** Mailchimp's API has no
equivalent of `CONFIRM_TIME` — 1,560 contacts carry it in the CSV against 129
for the nearest API field, `timestamp_signup` — and the archive's reading of
consent rests on that column. The API is a second, independent reading of the
account; it is not the download. (Same on Humanitix, for a blunter reason:
`/payouts`, `/access-codes` and `/discounts` are 404. Full detail for both in
`docs/development/PLATFORM_APIS.md`.)

Three things that were true of the Mailchimp carry-over and would be true of any
repeat of it:

- **Consent** is route 1 of `consent-rules.md`. It is recorded on every row as
  `--consent-source "Mailchimp audience 'She#' — website newsletter sign-up;
  per-contact OPTIN_TIME preserved in the 2026-08-17 export archive"`, which the
  importer requires and will not run without.
- **The export's own columns are the contract.** `import-mailchimp-subscribers.ts`
  reads `Email Address`, `First Name`, `Last Name` and `CONFIRM_TIME` by name —
  no column map, because a fixed export shape is safer than a mapping somebody
  has to get right under time pressure. It fails loudly if `Email Address` is
  missing.
- **There is no opt-in column to filter on, and that is not a gap** — the
  `subscribed` file *is* the opt-in. (The older advice here was about
  `normalize-recipients.ts --for-import` / `--column-map`, which is the
  general-CSV path and is not what carried this list over.)

**The segment-name question is dead, not merely settled — history only.** It was
once an open item: Resend has no segment update endpoint, so renaming means
delete and recreate, which drops membership, and `RESEND_NEWSLETTER_SEGMENT_ID`
pointed at a segment called "Newsletter Pilot" — the name 1,560 real subscribers
would have landed under. The 2026-08-28 account move recreated every segment from
scratch and renamed it to "Newsletter". A day later the consent record moved into
the database, so **no segment was ever the import target**: the 1,545 rows landed
in `newsletter_subscribers`. The segment still exists in the account, holds
nobody, and is item 8g.

### The subscribe funnel was Mailchimp too — not just the sending

**Done 2026-08-29.** Kept here because it was easy to miss and it would have
broken the migration quietly.

`MAILCHIMP_CONFIG` in `lib/data/newsletters.ts` held a Mailchimp `subscribeUrl`
and `archiveUrl`. `subscribeUrl` was used in **six** places across the site —
the footer sign-up, the newsletters page, and four mentorship surfaces
(`app/(site)/mentorship/page.tsx`, `become-cta-section.tsx`,
`how-it-works-section.tsx`, `mentorship-cta-section.tsx`) — with `archiveUrl`
used once, on the newsletters page.

> **A figure this document had wrong.** It said "16 places" here and again in
> Outstanding-work item 8b. Sixteen was never the number of links: there were
> **6** `subscribeUrl` references plus **1** `archiveUrl`, across six files.
> `EMAIL_PLATFORM_STRATEGY.md` §5 had it right ("Six components").

So until 2026-08-29: **every new subscriber the website acquired went into
Mailchimp.** Meanwhile `POST /api/newsletter/subscribe` existed but **no
component called it** — it was reachable only by URL, and it wrote to the Resend
audience.

Switching the *sending* without switching the *funnel* would have left two lists
drifting apart from day one: new sign-ups landing in Mailchimp and never
receiving the Resend send. Both are now done:

1. ~~Wire the existing `/api/newsletter/subscribe` route to a real form.~~
   **Done.** The route no longer writes to Resend. It writes a `pending` row to
   `newsletter_subscribers` — the database is now the marketing consent record —
   and sends a confirmation email. The person becomes mailable only by pressing
   the button on `/newsletter/confirm`, which POSTs to
   `/api/newsletter/confirm`. **POST, not GET, deliberately**: link scanners and
   inbox previewers fetch every URL in a message, and a GET that confirms would
   let a prefetcher manufacture consent. Tokens are single-use and expire after
   seven days. Pages: `app/(site)/newsletter/subscribe/`,
   `app/(site)/newsletter/confirm/`.
2. ~~Repoint the 16 `MAILCHIMP_CONFIG.subscribeUrl` links at it.~~ **Done** — all
   six now point at `/newsletter/subscribe`, and `subscribeUrl` has been
   **deleted** from `MAILCHIMP_CONFIG` so a seventh cannot appear by copy-paste.
   `archiveUrl` stays; see the next item.
3. Decide what `archiveUrl` becomes. **Half-settled as of the August 2026
   issue:** issues built in this repo now get a card in
   `lib/data/newsletters-manual.ts` whose `url` is the on-site
   `/resources/newsletters/<id>` render, so the public archive grid no longer
   depends on Mailchimp for new months. What is still open is the
   `MAILCHIMP_CONFIG.archiveUrl` button ("Open full archive") — it remains the
   only way to reach the pre-2026-08 back catalogue, so it cannot be dropped
   until those issues are re-hosted or the button is repointed at
   `/resources/newsletters` itself. The per-issue route stays `noindex` and out
   of `app/sitemap.ts` deliberately; that is not a blocker.
4. **Deal with the live Humanitix → Mailchimp integration. Still outstanding, and
   the 29 August import made it urgent.** Easier to miss than the funnel, because
   it is configured in *Humanitix* and nothing in this repo mentions it:
   Humanitix pushes event contacts into the `She#` audience by itself. Two
   settings were changed on 2026-08-27 — "Sync contacts who haven't opted-in"
   switched **off**, and the checkout opt-in question switched **on** for the
   September event — which fixes the consent shape but **not** the destination.
   Nothing has been repointed. The audience it feeds is now a stale copy of a
   list we hold ourselves, so every opt-in it collects from here lands where no
   send will ever read it: those sign-ups are lost rather than merely misplaced,
   and they are lost silently. Repoint it or switch it off before step 5.
5. Only then retire the Mailchimp records.

### Keep the Mailchimp DNS records

Leave `k2._domainkey` and `k3._domainkey` in Cloudflare until the Resend
newsletter has shipped cleanly two or three times. They are CNAMEs, they cost
nothing, they authenticate no one but Mailchimp, and while they are there a
rollback is "send from Mailchimp again" rather than "wait for DNS". Remove them
only when you are certain, and note the removal in this file.

### Ramp, don't switch

The first Resend send should not be the whole list. Send to a few hundred of the
most engaged (recent openers) first, confirm inbox placement in Gmail, Outlook
and at least one corporate domain, then widen. Resend's shared IPs are warm, and
your *domain* reputation carries across — but the sending pattern is new, and a
sudden first-time spike from a new platform is exactly the shape filters are
built to notice.

Since 2026-08-29 this is no longer a "broadcast" but a batch send, and widening
is now safe by construction: `build-newsletter-batch.ts` skips anyone whose hash
appears in a previous run's manifest (`--exclude-hashes`), so a second, wider run
cannot double-mail the first cohort.

**One gap to close before the ramp can actually use the warm cohort.**
`recipients-from-db.ts` narrows with `--limit` (the first N mailable
subscribers) and `--only` (one address). It has **no `--restrict-to-hashes`** —
that flag is on `normalize-recipients.ts`, the CSV path. So the recent-openers
cohort `scripts/mailchimp/recent-openers.ts` produces cannot yet be applied to a
database-backed send. `--limit` is a ramp by row order, not by engagement, which
is not the same thing and should not be mistaken for it.

**The list this asks for can now be built.** It could not before: who opened
what is per-campaign recipient activity, which the CSV export does not carry and
which the Mailchimp UI would have surrendered only as a couple of hundred
hand-driven downloads — so it was recorded as skipped by decision, and "recent
openers" stayed an instruction with no way to follow it. The API key closes that
gap:

```bash
npx tsx scripts/mailchimp/fetch-api.ts --export 2026-08-27-api --include activity
npx tsx scripts/mailchimp/recent-openers.ts --export 2026-08-27-api \
  --subscribed-export 2026-08-17 --since 2026-02-27
# then, on the import CSV:
npx tsx scripts/email/normalize-recipients.ts … --restrict-to-hashes tmp/mailchimp/recent-openers.json
```

Two things to hold on to. The output is `hashEmail()` digests in `tmp/`, never
addresses — per-recipient open data is the most sensitive thing in the account,
and the only question the ramp list is ever asked is "is this row in the warm
cohort?". And it is **intersected with the `subscribed` CSV before it is
written**, which makes it a subset of the consented list by construction: it can
only ever **narrow**. An open is not consent. A `nonsubscribed` contact who
opened a receipt, or an `unsubscribed` one who opened an old newsletter, is
still out — `consent-rules.md` governs widening a list, and nothing here widens
anything.

**The list has moved. Nothing has been sent.** As at 2026-08-29 the
**`newsletter_subscribers` table holds 1,545 rows** — 1,560 read from the
2026-08-17 `subscribed` export, **15** held back by the suppression register, 0
malformed. The Resend list still holds **0 contacts** and always did: the account
moved to the She Sharp–owned team on 2026-08-28 and not even a test address was
carried over, and the database superseded it the following day. The live
newsletter still goes out from Mailchimp, so Mailchimp still holds the *sending*
relationship even though it no longer holds the only copy of the list. Anyone who
unsubscribes from a real newsletter does so there — which is why
`suppression.ts pull-mailchimp` is still a monthly job, not a migration step that
has been ticked off.

What changed on 2026-08-29 is **where an import has to land**: the consent record
is `newsletter_subscribers`, so a Resend audience is no longer the destination.
The import still goes through `/update-mailing-list`, its plan block and a human
approval, and it still has to record `--consent-source` and `--consent-date` —
which are now real columns on the row (`consent_source`, `consent_date`,
`consent_ip`, `consent_user_agent`) rather than a note in a script's output.

> **The bulk-import path now exists, and has been run once.**
> `scripts/email/import-mailchimp-subscribers.ts` writes rows carrying an
> existing consent record rather than a fresh confirmation click:
> `source = 'mailchimp-import'`, a `consentSource` sentence naming the audience
> and the export, and `confirmedAt` taken from the export's `CONFIRM_TIME` —
> which all 1,560 rows carried, so the double opt-in it records is an act that
> happened in Mailchimp, not one we invented. No sign-up IPs were imported.
>
> It defaults to a **dry run** and needs `--apply` spelled out; it **refuses the
> `unsubscribed` / `cleaned` / `nonsubscribed` exports by filename**; and it
> prints counts and truncated hashes, never an address, so its output is safe in
> a plan block or a PR. Every other script here defaults to doing the thing —
> this one does not, because you cannot un-import consent, only delete rows and
> lose the provenance with them.
>
> It is the **Mailchimp carry-over**, not a general CSV importer. A sign-up sheet
> from an event still has no route into the table; `/update-mailing-list` says so
> rather than improvising one.

### What actually improves by moving

Worth knowing so you can tell whether the migration worked:

- **SPF starts aligning.** Mailchimp's Return-Path is `rsgsv.net`, which does
  not align, so DMARC rests on DKIM alone. Resend's Return-Path is
  `send.shesharp.org.nz` — after the move, both mechanisms align. Strictly more
  robust.
- **Bounces and complaints become visible in-repo.** The Resend webhook writes
  them to `email_optouts` automatically; with Mailchimp that history was locked
  in a dashboard nobody reads.
- **One less unauthenticated surface** once Mailchimp is retired.

### Watch these on the first three sends

Resend dashboard, after each send: complaint rate **< 0.1%**, hard bounce rate
**< 2%**, and delivery rate against the Mailchimp baseline. If any is out of
bounds, stop and clean the list before the next issue — that is the
pre-committed trigger in the next section.

**These are now harder to read than they were, and that is a cost of the batch
API.** A Resend *broadcast* summarised its own rates on one screen; a batch send
is ~16 requests of ordinary emails, so the rates have to come from the tags:
`build-newsletter-batch.ts` stamps every message `stream:marketing` **and**
`newsletter:<YYYY-MM>`, and the second one is what isolates a single issue in
Resend's analytics. `email_optouts` is the in-repo cross-check — the webhook
writes to it on every bounce and complaint.

**The Mailchimp baseline is now in the repo**, at
`lib/data/json/mailchimp/campaigns.json`: 180 sends and 188,796 emails from
2019-07 to 2026-08, **37.9% unique open** — or **33.1%** with Apple's proxy
opens excluded — 881 hard bounces, 797 unsubscribes and 4 abuse reports across
the whole history. Before this file the only campaign statistics anywhere were
figures somebody had transcribed into a `.docx`.

Two traps in comparing against it. **Pick one open-rate figure and stay on it**:
the proxy-excluded series equals the headline series exactly for every campaign
sent before 2022, because Apple Mail Privacy Protection did not exist yet, and
diverges afterwards — so an open rate from 2020 and one from 2024 are not the
same measurement, and **open rates cannot be compared across 2021**. And read
`growth[].subscribed` as a stock, not a flow: 86 months of end-of-month list
size, peaking at **1,742 in 2025-11** and standing at **1,555** in 2026-08. The
list has been shrinking through 2026, which is the trend any post-migration
number lands on top of.

---

## Sending-domain architecture: one domain, with a pre-committed trigger

Transactional and marketing mail both send from `shesharp.org.nz`. This is
deliberate.

Splitting marketing onto `news.shesharp.org.nz` was considered and rejected: a
cold subdomain starts at "unknown sender", which is mildly negative rather than
neutral, and a few hundred recipients a month would never warm it out of that
state. The domain's strongest positive signal is real humans holding two-way
conversations from Google Workspace, and that cannot be moved. The marketing
path is also unusually clean already — `lib/email/audience.ts` throws on
marketing to Tier ≥1, `lib/email/gates.ts` blocks any marketing send without an
unsubscribe, and every marketing message carries `List-Unsubscribe` /
`List-Unsubscribe-Post`. **That last one changed on 2026-08-29**: Resend
broadcasts used to attach the pair themselves, and the batch API does not, so
`buildStreamHeaders()` in `lib/email/service.ts` and
`lib/email/unsubscribe-headers.ts` now emit it for the `marketing` stream. Volume
is two orders of magnitude below the Gmail/Microsoft 5,000-per-day bulk-sender
threshold.

**Split marketing onto `news.shesharp.org.nz` if any one of these fires:**

- a send's complaint rate exceeds **0.10%**, or
- a single send exceeds **~1,000 recipients**, or
- a send's hard-bounce rate exceeds **2%**.

**Transactional mail stays on the root domain permanently, under every
scenario.** It is the mail that must never fail, so it belongs on the
best-authenticated identity available.

### Decision 2026-08-29 — the recipient-count arm fires, and we are not splitting

The first real newsletter send will be at most **1,545 recipients** — the size of
the imported list, now measured rather than estimated — which trips the middle
trigger above on send one. (A *ramped* first send is smaller still; the trigger
fires on the full-list send whenever it comes.) **The decision is not to split.** This is
recorded as a decision so a future session reads it as settled rather than as an
obligation somebody forgot.

**Why.** Splitting would mean changing the From domain in the same month as
switching ESP *and* moving the list in-house — three simultaneous variables, in
exactly the situation this document already warns about in "Do not tighten DMARC
and switch ESP in the same window". If deliverability dips you have to be able to
say which change caused it, and the fix for each is different. Worse, the split
would burn the one asset the migration is built to preserve: `newsletter@shesharp.org.nz`
carries years of opens, replies and "not spam" signals, and a cold subdomain
starts at "unknown sender". Doing it on the very first send from a new platform
puts a cold identity where the risk is highest, to mitigate a risk that has not
yet been measured. The trigger was written before the send existed; the send is
the thing that will tell us whether the trigger was right.

**What this does and does not change.**

- The **complaint-rate (>0.10%) and hard-bounce-rate (>2%) arms are untouched**
  and still fire. Those measure real damage. Nothing here weakens them.
- The **recipient-count arm is deferred, not deleted.** It is a proxy for volume
  risk, and the honest answer is that ~1,560 a month is still two orders of
  magnitude under the bulk-sender thresholds. **Revisit it once the send is
  boring** — after two or three clean issues with the rates in bounds, decide on
  evidence rather than on a number chosen in advance.
- Nothing is foreclosed. Resend Pro allows 10 domains, and the split remains a
  few DNS records and one constant in `lib/email/senders.ts`.

The tension this resolves is written up as risk 3 in
[`../development/EMAIL_PLATFORM_STRATEGY.md`](../development/EMAIL_PLATFORM_STRATEGY.md) §6.

---

## What the code does

| Concern | Where |
|---|---|
| Sender identities, per stream | `lib/email/senders.ts` |
| Stream routing, `List-Unsubscribe`, tags, opt-out check | `lib/email/service.ts` |
| `List-Unsubscribe` / `-Post` header pair, shared by the single-send and batch paths | `lib/email/unsubscribe-headers.ts` |
| Signed one-click unsubscribe tokens | `lib/email/unsubscribe-token.ts` |
| RFC 8058 endpoint (POST) + confirmation page | `app/api/email/unsubscribe/route.ts`, `app/(site)/email/unsubscribe/` |
| **The marketing consent record** — subscribe, double opt-in, every exit route | `lib/db/schema/system.ts` → `newsletter_subscribers`, `lib/newsletter/subscribers.ts` |
| Subscribe funnel (public) | `app/(site)/newsletter/{subscribe,confirm}/`, `app/api/newsletter/{subscribe,confirm}/route.ts` |
| Newsletter send path — nothing here sends, it prints the commands | `scripts/email/recipients-from-db.ts` → `scripts/newsletter/build-newsletter-batch.ts` |
| Bounce / complaint capture | `app/api/webhooks/resend/route.ts`, `lib/email/webhook-verify.ts` |
| Opt-out storage | `lib/db/schema.ts` → `email_optouts`, `lib/email/optouts.ts` |
| Pre-send gates (From identity, Reply-To domain, tag charset) | `lib/email/gates.ts` |
| Offline register + reconciliation | `scripts/email/suppression.ts` (`sync`) |
| The one path exempt from `MAINTENANCE_MODE` | `proxy.ts` → `MAINTENANCE_EXEMPT_PATH` |
| Checks | `npx tsx lib/email/hardening.test.ts`, `npx tsx lib/newsletter/subscribers.test.ts` |

**Streams.** `transactional` (recipient-triggered, never suppressed) ·
`notification` (recurring, unrequested — carries one-click unsubscribe and
honours opt-outs) · `marketing` (the newsletter, from `newsletter@`, replying to
`info@` — since 2026-08-29 it carries its own unsubscribe headers and is covered
by `isSuppressed()`, both of which Resend broadcasts used to handle) ·
`internal` (to She Sharp's own mailboxes).

> **`/api/email/unsubscribe` answers during maintenance mode.** It is the single
> `MAINTENANCE_EXEMPT_PATH` in `proxy.ts` — an exact match, not a prefix, so no
> sibling route under `/api/` inherits the exemption. The reason: with Resend's
> hosted unsubscribe page out of the picture this endpoint is the *only* opt-out
> route we offer, and an unsubscribe link that returns 503 does not delay an
> opt-out — it converts it into a spam complaint, against an account-wide 0.08%
> ceiling that would take password resets down with the newsletter. See
> `docs/deployment/MAINTENANCE_MODE.md`.

Every send is tagged `stream:<name>`, so Resend's analytics separate the
reputation streams even though they share a domain. That is the instrumentation
the split trigger above depends on.

---

## Outstanding work

Everything not yet done, with what is actually blocking it. Nothing here is
forgotten or deliberately skipped unless it says so.

| # | Task | Blocked on | Do it when |
|---|---|---|---|
| 1 | **Read the first DMARC reports** — Cloudflare → Email → DMARC Management. Confirm every source is recognised (expect only Google, Amazon SES, forwarders). | ~24h after 2026-07-31 | Now, then weekly |
| 2 | **Stage 3a — `np=reject`** | 2 weeks of clean reports | ~2026-08-14 |
| 3 | **Resend DKIM 1024 → 2048** | a quiet window **after** a newsletter send | Before quarantine, never after `p=reject` |
| 4 | **Stage 3b — `p=quarantine`** | reports show every source identified, no third-party sender hiding in the failures | ~2026-08-30 |
| 5 | **Stage 2b — Google DKIM** | ⚠️ **Workspace super-admin.** `website@` cannot open `admin.google.com`. Request text is in Stage 2, and it is folded into `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` so the admin does one sitting rather than two. | Whenever an admin is available |
| 6 | **Stage 4 — `p=reject`** + root SPF `-all` | **hard-gated on #5** | Not before #5 |
| 7 | **Decide the legacy SPF include** — drop `include:_spf.1stdomains.co.nz` if reports show nothing sends from those IPs (budget 4/10 → 1/10) | the reports from #1 | With #4 |
| 8 | **Migrate the newsletter sending off Mailchimp** — see the section above. **The send path is built** (29 Aug 2026): `recipients-from-db.ts` → `build-newsletter-batch.ts` → a human runs the printed `resend emails batch` commands, off the transactional batch API rather than a Resend broadcast. **List hygiene is done** (18 Aug 2026): all four statuses exported and archived, and the non-subscribers are in the suppression register — **2,138 as at 2026-08-27**, not the 2,129 the export gave, so run `suppression.ts pull-mailchimp` immediately before the import rather than trusting the file. **The ramp cohort is no longer blocked** (27 Aug 2026): `scripts/mailchimp/recent-openers.ts` builds it from the API — but see #8e, it cannot yet be applied to a database-backed send. **The import is done** (29 Aug 2026): `newsletter_subscribers` holds **1,545** rows — 1,560 read, 15 held back by the register, which had been topped up to **2,144** first. What remains is **the send itself**, and it must be **ramped** — the whole 1,545 in one burst is the shape this document spends a section warning against. **Nothing has been sent.** | must NOT share a month with #2/#4; a ramped first cohort needs **#8e** | A month with no DMARC change |
| 8b | ~~**Migrate the subscribe funnel**~~ — **Done 29 Aug 2026.** `/api/newsletter/subscribe` now writes a `pending` row to `newsletter_subscribers` and sends a confirmation email; the person becomes mailable only by pressing the button on `/newsletter/confirm` (POST, never GET — a link scanner must not be able to confirm). All **six** `MAILCHIMP_CONFIG.subscribeUrl` links now point at `/newsletter/subscribe`, and `subscribeUrl` has been deleted from the config. (This row previously said "16 links"; there were 6, plus 1 `archiveUrl`.) | — | **Done** |
| 8c | **Decide `MAILCHIMP_CONFIG.archiveUrl`'s replacement.** Partly done: since 2026-08 each new issue is listed in `lib/data/newsletters-manual.ts` pointing at its on-site render (still `noindex`, by design). What remains is the "Open full archive" button, which is the only route to the pre-2026-08 back catalogue. | the back catalogue re-hosted, or the button repointed at `/resources/newsletters` | With #8 |
| 8d | **Repoint or switch off the Humanitix → Mailchimp contact integration — still outstanding, and now the most urgent of these.** Configured in Humanitix, invisible from this repo, and it pushes event contacts into the `She#` audience on its own. "Sync contacts who haven't opted-in" was switched **off** and the checkout opt-in question **on** (both 2026-08-27), which fixes the consent shape but **not** the destination — nothing has been repointed. The 29 Aug import is what sharpened this: the audience it feeds is no longer where the list lives, so every opt-in Humanitix collects from here lands in a copy that is already stale and that nobody will send from. Those sign-ups are lost rather than merely misplaced, and the loss is silent. | — | **Now** — ahead of the first send, not after it |
| 8e | **Teach `recipients-from-db.ts` to take a hash allow-list.** `normalize-recipients.ts` has `--restrict-to-hashes`, which is how the warm cohort from `recent-openers.ts` is applied; the database path has only `--limit` (first N rows) and `--only` (one address). Until this exists, "ramp to the recent openers" cannot be done from the subscriber table — `--limit` ramps by row order, which is not the same thing. **Now the only thing standing between the imported list and a properly ramped first send**, since the CSV path it lives on is no longer how a send is built. | — | Before the first ramped send |
| 8f | ~~**Build the bulk-import path into `newsletter_subscribers`.**~~ — **Done, and run, 29 Aug 2026.** `scripts/email/import-mailchimp-subscribers.ts` carried the Mailchimp list over: 1,560 read, **15** held back by the suppression register, 0 malformed, **1,545 rows written**, each with `source = 'mailchimp-import'`, a provenance sentence in `consent_source`, and a real `confirmedAt` from the export's `CONFIRM_TIME`. Dry-run by default; `--apply` must be spelled out. It is the **Mailchimp carry-over only** — a general opt-in CSV importer (routes 2–4 of `consent-rules.md`) still does not exist, and `/update-mailing-list` still says so. | — | **Done** |
| 8g | **Decommission the Resend Marketing objects — half done, 29 Aug 2026.** **Done, in code:** `lib/newsletter/resend-api.ts`, `scripts/newsletter/setup-resend.ts`, `scripts/newsletter/seed-pilot-contacts.ts` and its example CSV are deleted, and the two env vars are out of `.env.example`. No code in this repo can read a segment or a topic. That was the urgent half: the risk was never a dormant object in a console but a script here that would run, print those ids and present dead configuration as current. **Still to do, and both external:** delete the segment `95d452f5-2eed-4ad4-b18e-5ff5a89a576b` and the topic `08e59693-29dc-4556-8357-866dea047c6f` in the Resend account (both hold 0 contacts), and remove `RESEND_NEWSLETTER_SEGMENT_ID` / `RESEND_NEWSLETTER_TOPIC_ID` from **Vercel production**. Finding either id in a Vercel env var is not evidence the migration was reverted. | the maintainer's approval — both are actions on a live account | Any time; nothing depends on it |
| 9 | **Retire the Mailchimp DNS records** (`k2`/`k3._domainkey`) | 2–3 clean Resend sends **and** #8b | After #8 proves out |
| 10 | ~~**Confirm someone reads `newsletter@`**~~ — **answered 2026-08-23: no.** Nobody on the team had its password on 2026-08-17, and a direct question in Slack went unanswered. It is no longer the Reply-To (that is now `info@`); it remains the From, which is correct and must not change. Naming an owner is item 3 on `WORKSPACE_MAILBOX_CHECKLIST.md`. | — | **Done** |
| 11 | **`EMAIL_UNSUBSCRIBE_MAILTO`** — **keep it empty.** The intended target, `unsub@`, was probed on 2026-08-23 and hard-bounced: it does not exist. The HTTPS one-click URL alone satisfies RFC 8058 and both bulk-sender rulebooks, and a mailto into a weekly-read inbox would leave opt-outs unactioned for days — a compliance problem, not a convenience one. | — | **Decided: no** |
| 12 | **TLS-RPT** (`_smtp._tls`) | needs a real inbox to receive reports (super-admin to create) | Optional, low value |
| 13 | **MTA-STS** | a second Vercel domain + route | Optional — the only item here whose misconfiguration breaks *inbound* mail |
| 14 | **BIMI** | a VMC (~USD 1,000–1,500/yr + trademark) | **Deliberately skipped** — not a defensible non-profit spend |
| 15 | **Split marketing onto `news.`** — **the recipient-count arm fires on send one (~1,560) and we decided on 2026-08-29 not to split**; see "Decision 2026-08-29" above for the reasoning. The complaint and bounce arms are untouched and still fire. | the two rate arms (complaints >0.10%, hard bounces >2%); the recipient-count arm is **deferred by decision**, to be revisited on evidence | Only if a rate arm fires — or when the send is boring and the count arm can be re-decided |

**Sequencing rule that governs several of these:** never change the ESP and the
DMARC policy in the same month. If deliverability dips you must be able to say
which one caused it, and the fix for each is different.

---

## Cadence

- **Weeks 1–4:** open Cloudflare → Email → DMARC Management weekly (~5 minutes)
  and confirm every sending source is one you recognise.
- **Ongoing:** folded into `/monthly-newsletter`, which already runs monthly
  with a human in the loop — check last month's digest for unrecognised sources,
  and the last newsletter send's complaint (<0.1%) and bounce (<2%) rates.
- **Monthly:** `npx tsx scripts/email/suppression.ts sync` to fold runtime
  bounces and complaints into the committed register, and — while Mailchimp is
  still the live sender — `npx tsx scripts/email/suppression.ts pull-mailchimp`
  to fold in the opt-outs and hard bounces that happen over there. Also before
  any import, whenever that falls.
- **Annually:** rotate DKIM keys, recount the SPF lookup budget, confirm the
  `rua` addresses still work.

---

## Verification commands

```bash
dig +short TXT _dmarc.shesharp.org.nz @1.1.1.1
dig +short TXT shesharp.org.nz @1.1.1.1
dig +short TXT google._domainkey.shesharp.org.nz @1.1.1.1
dig +short TXT resend._domainkey.shesharp.org.nz @1.1.1.1
```

On Windows PowerShell, `Resolve-DnsName -Name <name> -Type TXT -Server 1.1.1.1`.

**After any DNS change, re-check MX.** The one way to break inbound mail here is
to enable Cloudflare **Email Routing** (which replaces MX) while reaching for
DMARC Management (which does not):

```
dig +short MX shesharp.org.nz @1.1.1.1     # five aspmx.l.google.com entries
```

**Authentication, end to end:** Gmail → open the message → ⋮ → **Show original**
→ confirm SPF, DKIM and DMARC all say PASS. Check a Google Workspace send *and*
a Resend send; they authenticate by different mechanisms and fail independently.

**Code:**

```bash
npx tsx lib/email/hardening.test.ts   # tokens, sender identities, gates, Svix
npx tsc --noEmit
CI=true npx next build
```

**The live webhook, without waiting for a real bounce.** Copy the signing secret
from the Resend dashboard, then sign a synthetic event and POST it at
production. This exercises the deployed secret, the signature check, the handler
and the database write in one go — send the correctly-signed request (expect
`200 {"received":true}`) *and* the same body with a forged signature (expect
`400`), then delete the row it created from `email_optouts`. Written out in the
session that built this; the shape is:

```
signed payload = "{svix-id}.{svix-timestamp}.{raw body}"
signature      = base64(HMAC-SHA256(signed payload, base64decode(secret without "whsec_")))
headers        = svix-id, svix-timestamp, svix-signature: "v1,<signature>"
```

Always clean up the test row — `email_optouts` should return to 0 rows if you
have no real opt-outs yet.
