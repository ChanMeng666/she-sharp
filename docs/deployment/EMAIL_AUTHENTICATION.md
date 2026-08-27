# Email Authentication (SPF, DKIM, DMARC)

**Last verified:** 2026-07-31 (live DNS queried against `1.1.1.1`)

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
| DKIM rotation, webhook signing secret | **Resend dashboard** | — |
| `RESEND_WEBHOOK_SECRET`, `EMAIL_UNSUBSCRIBE_SECRET` | you | **Vercel** |

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
resend._domainkey…         TXT    p=MIGfMA0…            (1024-bit RSA)
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

1. Pick a quiet window — **after** a monthly broadcast, never before one.
2. In Cloudflare, set the `resend._domainkey` record's TTL to 300 (it is likely
   on "Auto") so the change propagates in minutes rather than hours.
3. Rotate / re-add the domain at 2048-bit in the Resend dashboard.
4. Publish the new TXT **immediately**.
5. Wait for Resend to show Verified, send a test, confirm `DKIM: PASS`.

Do this at `p=none` or `p=quarantine`, where a botched rotation degrades. At
`p=reject` it drops mail on the floor.

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

Before importing anything:

1. In Mailchimp, export **all four** statuses, not one. (Audience → All contacts
   → Export Contacts produces one file per status.)
2. Import **only** `Subscribed` into Resend, through
   `/update-mailing-list` — its consent gate is the point.
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
4. Also set those contacts `unsubscribed` in Resend if they are ever imported by
   another route — the local register protects the scripts, the Resend flag
   protects broadcasts.
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

**Having an API key does not retire the manual export.** Mailchimp's API has no
equivalent of `CONFIRM_TIME` — 1,560 contacts carry it in the CSV against 129
for the nearest API field, `timestamp_signup` — and the archive's reading of
consent rests on that column. The API is a second, independent reading of the
account; it is not the download. (Same on Humanitix, for a blunter reason:
`/payouts`, `/access-codes` and `/discounts` are 404. Full detail for both in
`docs/development/PLATFORM_APIS.md`.)

Three things the import session will otherwise have to rediscover:

- **Consent** is route 1 of `consent-rules.md`. Record `--consent-source
  "Mailchimp audience 'She#' — website newsletter sign-up; per-contact
  OPTIN_TIME preserved in the 2026-08-17 export archive"`, `--consent-date
  2026-08-17`.
- **`--for-import` will not drop rows.** It filters on an opt-in column only
  when one is mapped, and the export has none — the file *is* the opt-in.
- **`--column-map` is mandatory**: the export uses `Email Address`,
  `First Name`, `Last Name`.

And one decision to take before, not after: `RESEND_NEWSLETTER_SEGMENT_ID` today
points at a segment named **"Newsletter Pilot"**, which is the name 1,560 real
subscribers would land under. Resend has no segment update endpoint, so renaming
means delete and recreate — which drops membership.

### The subscribe funnel is Mailchimp too — not just the sending

Easy to miss, and it breaks the migration quietly if you do. `MAILCHIMP_CONFIG`
in `lib/data/newsletters.ts` holds a Mailchimp `subscribeUrl` and `archiveUrl`,
and it is referenced in **16 places** across the site — the footer sign-up, the
newsletters page, the mentorship pages, several CTA sections.

So today: **every new subscriber the website acquires goes into Mailchimp.**

Meanwhile `POST /api/newsletter/subscribe` (honeypot + rate-limited, writes to
the Resend audience) exists but **no component calls it** — it is reachable only
by URL. Grep confirms the only references are in generated `.next` type files.

That means switching the *sending* to Resend without switching the *funnel*
leaves you with two lists that drift apart from day one: new sign-ups keep
landing in Mailchimp and never receive the Resend broadcast. Do both, in this
order:

1. Wire the existing `/api/newsletter/subscribe` route to a real form.
2. Repoint the 16 `MAILCHIMP_CONFIG.subscribeUrl` links at it.
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
4. **Deal with the live Humanitix → Mailchimp integration.** Easier to miss than
   the funnel, because it is configured in *Humanitix* and nothing in this repo
   mentions it: Humanitix pushes event contacts into the `She#` audience by
   itself. Left connected when the audience is retired, it keeps feeding a dead
   list, and the sign-ups it collects are lost rather than merely misplaced. Two
   settings were changed on 2026-08-27 — "Sync contacts who haven't opted-in"
   switched **off**, and the checkout opt-in question switched **on** for the
   September event — which fixes the consent shape but not the destination. It
   must be repointed at Resend or switched off before step 5.
5. Only then retire the Mailchimp records.

### Keep the Mailchimp DNS records

Leave `k2._domainkey` and `k3._domainkey` in Cloudflare until the Resend
newsletter has shipped cleanly two or three times. They are CNAMEs, they cost
nothing, they authenticate no one but Mailchimp, and while they are there a
rollback is "send from Mailchimp again" rather than "wait for DNS". Remove them
only when you are certain, and note the removal in this file.

### Ramp, don't switch

The first Resend broadcast should not be the whole list. Send to a few hundred
of the most engaged (recent openers) first, confirm inbox placement in Gmail,
Outlook and at least one corporate domain, then widen. Resend's shared IPs are
warm, and your *domain* reputation carries across — but the sending pattern is
new, and a sudden first-time spike from a new platform is exactly the shape
filters are built to notice.

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

**Nothing has been sent and nobody has been imported.** As at 2026-08-27 the
Resend list still holds one test contact; the import still goes through
`/update-mailing-list`, its plan block and a human approval.

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

Resend dashboard, after each broadcast: complaint rate **< 0.1%**, hard bounce
rate **< 2%**, and delivery rate against the Mailchimp baseline. If any is out
of bounds, stop and clean the list before the next issue — that is the
pre-committed trigger in the next section.

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
unsubscribe, and Resend broadcasts attach `List-Unsubscribe` themselves. Volume
is two orders of magnitude below the Gmail/Microsoft 5,000-per-day bulk-sender
threshold.

**Split marketing onto `news.shesharp.org.nz` if any one of these fires:**

- a broadcast's complaint rate exceeds **0.10%**, or
- a single send exceeds **~1,000 recipients**, or
- a broadcast's hard-bounce rate exceeds **2%**.

**Transactional mail stays on the root domain permanently, under every
scenario.** It is the mail that must never fail, so it belongs on the
best-authenticated identity available.

---

## What the code does

| Concern | Where |
|---|---|
| Sender identities, per stream | `lib/email/senders.ts` |
| Stream routing, `List-Unsubscribe`, tags, opt-out check | `lib/email/service.ts` |
| Signed one-click unsubscribe tokens | `lib/email/unsubscribe-token.ts` |
| RFC 8058 endpoint (POST) + confirmation page | `app/api/email/unsubscribe/route.ts`, `app/(site)/email/unsubscribe/` |
| Bounce / complaint capture | `app/api/webhooks/resend/route.ts`, `lib/email/webhook-verify.ts` |
| Opt-out storage | `lib/db/schema.ts` → `email_optouts`, `lib/email/optouts.ts` |
| Pre-send gates (From identity, Reply-To domain, tag charset) | `lib/email/gates.ts` |
| Offline register + reconciliation | `scripts/email/suppression.ts` (`sync`) |
| Checks | `npx tsx lib/email/hardening.test.ts` |

**Streams.** `transactional` (recipient-triggered, never suppressed) ·
`notification` (recurring, unrequested — carries one-click unsubscribe and
honours opt-outs) · `marketing` (broadcasts from `newsletter@`, replying to `info@`) · `internal` (to She
Sharp's own mailboxes).

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
| 3 | **Resend DKIM 1024 → 2048** | a quiet window **after** a broadcast | Before quarantine, never after `p=reject` |
| 4 | **Stage 3b — `p=quarantine`** | reports show every source identified, no third-party sender hiding in the failures | ~2026-08-30 |
| 5 | **Stage 2b — Google DKIM** | ⚠️ **Workspace super-admin.** `website@` cannot open `admin.google.com`. Request text is in Stage 2, and it is folded into `docs/deployment/WORKSPACE_MAILBOX_CHECKLIST.md` so the admin does one sitting rather than two. | Whenever an admin is available |
| 6 | **Stage 4 — `p=reject`** + root SPF `-all` | **hard-gated on #5** | Not before #5 |
| 7 | **Decide the legacy SPF include** — drop `include:_spf.1stdomains.co.nz` if reports show nothing sends from those IPs (budget 4/10 → 1/10) | the reports from #1 | With #4 |
| 8 | **Migrate the newsletter sending off Mailchimp** — see the section above. **List hygiene is done** (18 Aug 2026): all four statuses exported and archived, and the non-subscribers are in the suppression register — **2,138 as at 2026-08-27**, not the 2,129 the export gave, so run `suppression.ts pull-mailchimp` immediately before the import rather than trusting the file. **The ramp cohort is no longer blocked** (27 Aug 2026): `scripts/mailchimp/recent-openers.ts` builds it from the API. What remains is importing the 1,560 `Subscribed` through `/update-mailing-list` — nothing has been sent and nobody has been imported yet. | must NOT share a month with #2/#4 | A month with no DMARC change |
| 8b | **Migrate the subscribe funnel** — wire `/api/newsletter/subscribe` (exists, **nothing calls it**) to a form and repoint the 16 `MAILCHIMP_CONFIG.subscribeUrl` links. Without this, new sign-ups keep going to Mailchimp and never get the Resend send. | — | With #8, not after |
| 8c | **Decide `MAILCHIMP_CONFIG.archiveUrl`'s replacement.** Partly done: since 2026-08 each new issue is listed in `lib/data/newsletters-manual.ts` pointing at its on-site render (still `noindex`, by design). What remains is the "Open full archive" button, which is the only route to the pre-2026-08 back catalogue. | the back catalogue re-hosted, or the button repointed at `/resources/newsletters` | With #8 |
| 8d | **Repoint or switch off the Humanitix → Mailchimp contact integration.** Configured in Humanitix, invisible from this repo, and it pushes event contacts into the `She#` audience on its own — left connected past the retirement it feeds a dead list. "Sync contacts who haven't opted-in" was switched **off** and the checkout opt-in question **on** (both 2026-08-27), which fixes the consent shape, not the destination. | — | With #8, before #9 |
| 9 | **Retire the Mailchimp DNS records** (`k2`/`k3._domainkey`) | 2–3 clean Resend sends **and** #8b | After #8 proves out |
| 10 | ~~**Confirm someone reads `newsletter@`**~~ — **answered 2026-08-23: no.** Nobody on the team had its password on 2026-08-17, and a direct question in Slack went unanswered. It is no longer the Reply-To (that is now `info@`); it remains the From, which is correct and must not change. Naming an owner is item 3 on `WORKSPACE_MAILBOX_CHECKLIST.md`. | — | **Done** |
| 11 | **`EMAIL_UNSUBSCRIBE_MAILTO`** — **keep it empty.** The intended target, `unsub@`, was probed on 2026-08-23 and hard-bounced: it does not exist. The HTTPS one-click URL alone satisfies RFC 8058 and both bulk-sender rulebooks, and a mailto into a weekly-read inbox would leave opt-outs unactioned for days — a compliance problem, not a convenience one. | — | **Decided: no** |
| 12 | **TLS-RPT** (`_smtp._tls`) | needs a real inbox to receive reports (super-admin to create) | Optional, low value |
| 13 | **MTA-STS** | a second Vercel domain + route | Optional — the only item here whose misconfiguration breaks *inbound* mail |
| 14 | **BIMI** | a VMC (~USD 1,000–1,500/yr + trademark) | **Deliberately skipped** — not a defensible non-profit spend |
| 15 | **Split marketing onto `news.`** | the pre-committed trigger (complaints >0.10%, a send >1,000 recipients, or hard bounces >2%) | Only if the trigger fires |

**Sequencing rule that governs several of these:** never change the ESP and the
DMARC policy in the same month. If deliverability dips you must be able to say
which one caused it, and the fix for each is different.

---

## Cadence

- **Weeks 1–4:** open Cloudflare → Email → DMARC Management weekly (~5 minutes)
  and confirm every sending source is one you recognise.
- **Ongoing:** folded into `/monthly-newsletter`, which already runs monthly
  with a human in the loop — check last month's digest for unrecognised sources,
  and the last broadcast's complaint (<0.1%) and bounce (<2%) rates.
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
