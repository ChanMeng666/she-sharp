# She Sharp email addresses

Every `@shesharp.org.nz` address this codebase uses, what it is for, and which
side of the line it sits on. Compiled 2026-08.

There are two categories and confusing them causes real problems:

- **Public mailboxes** — addresses a visitor is invited to write to. Defined in
  `lib/config/contact-addresses.ts`.
- **Sending identities** — what this site sends mail *as*. Defined in
  `lib/email/senders.ts`, one per stream, and that file is the single source of
  truth. Never hard-code a From or Reply-To anywhere else.

An address in one category must not be used for the other. `noreply@` should
never be printed on a page as somewhere to write to, and `hello@` should never
become a From address for bulk mail.

## Public mailboxes

| Address | For | Where it appears |
|---|---|---|
| `hello@` | General enquiries | `/contact`, the chatbot, the unsubscribe page |
| `industry@` | **Sponsorship and industry partnership** | `/sponsors/corporate-sponsorship`. Added 2026-08 — see below |
| `mentoring@` | Everything about the mentorship programme | Mentorship and recruitment email templates. Not `info@`, which is general |
| `conduct@` | Code of conduct reports | `/code-of-conduct`, the event feedback form |
| `governance@` | Trustee and governance matters | `/volunteers/code-of-conduct` |
| `security@` | Security disclosures | `/security-policy` |
| `support@` | Non-security support, paired with `security@` | `/security-policy` |
| `privacy@` | Privacy requests | `/cookie-policy`, `/privacy-policy` |
| `accessibility@` | Accessibility feedback | `/accessibility` |
| `legal@` | Legal notices | `/terms-of-service` |
| `info@` | General — legacy | `/privacy-policy` and historical event data only |

### `industry@` was missing for three years

The routing decision was made in September 2023 and stated plainly: put the
sponsorship material on the website, take the prices out, and direct the reader
to `industry@shesharp.org.nz`. It was re-confirmed in February 2026. Sixteen
other addresses were scattered through the codebase and this one appeared
nowhere — the sponsorship form posted to the general contact service and the
page offered no address at all. It is now on the sponsorship form for people
who would rather email than fill in a form.

The form itself still writes to the database and posts to Slack rather than
sending mail, which is fine; the point was that a sponsor had no way to reach
the right inbox directly.

## Sending identities

Set by stream in `lib/email/senders.ts`; see
`docs/deployment/EMAIL_AUTHENTICATION.md` for the DNS side.

| Stream | From | One-click unsubscribe | Honours opt-outs |
|---|---|---|---|
| `transactional` | `noreply@` (overridable by `EMAIL_FROM`) | No | Never — a suppressed address must still get a password reset |
| `notification` | `noreply@` | Yes (RFC 8058) | Yes |
| `marketing` | `newsletter@` | Attached by Resend | Via Resend topics |
| `internal` | `noreply@` | No | No |

`hello@` remains an approved sender, but for 1:1 mail only — contact replies
and event fulfilment. List mail goes from `newsletter@`.

`unsub@` is the List-Unsubscribe mailbox. `dmarc@` and `tlsrpt@` are DNS
reporting addresses and appear only in the deployment docs.

## Not verified here

Which of these mailboxes are actually monitored is an organisational question,
not a code one. `industry@` was confirmed live in August 2026. The others are
published on the assumption that someone reads them — worth re-checking
periodically, because an address printed on a policy page that nobody reads is
worse than no address at all.

## Related

- `lib/config/contact-addresses.ts` — the public mailboxes
- `lib/email/senders.ts` — the sending identities
- `docs/deployment/EMAIL_AUTHENTICATION.md` — SPF, DKIM, DMARC and the
  Mailchimp → Resend migration
