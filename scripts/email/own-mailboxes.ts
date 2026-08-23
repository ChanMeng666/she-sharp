/**
 * Every `@shesharp.org.nz` mailbox the organisation is known to have had, and
 * what the 2026-08-23 delivery probe found when it wrote to each one.
 *
 * Two scripts read this list and they need it to agree:
 *
 * - `probe-mailboxes.ts` sends to each address and compares the outcome with
 *   `expected`, so a rerun is a diff rather than a fresh investigation.
 * - `suppression.ts sync` uses it to keep these addresses **out** of the
 *   committed do-not-contact register. Seven of them hard-bounce, which makes
 *   the bounce webhook record a real opt-out row for each — correct for the
 *   runtime table, wrong for a register that means "a member of the public
 *   asked us to stop". She Sharp cannot opt out of its own mail.
 *
 * The narrative, and who reads what, is in
 * `docs/development/EMAIL_ADDRESSES.md`.
 */

/** Whether the mailbox accepted mail on the last run. */
export type MailboxExpectation = "exists" | "missing";

export interface OwnMailbox {
  /** Local part; the domain is always `shesharp.org.nz`. */
  local: string;
  /** Why it is on the list. */
  note: string;
  /** Verdict from the 2026-08-23 run. */
  expected: MailboxExpectation;
  /** A real person's inbox — only probed with `--include-personal`. */
  personal?: boolean;
}

export const OWN_MAILBOXES: OwnMailbox[] = [
  // Published on the site before 2026-08. Seven of these were fiction: they
  // were invented by page templates in 2025 and never created in Workspace.
  { local: "hello", note: "was the contact page's headline address", expected: "missing" },
  { local: "conduct", note: "was the code of conduct reporting route", expected: "missing" },
  { local: "security", note: "was the vulnerability disclosure address", expected: "missing" },
  { local: "support", note: "was a second general address on the security page", expected: "missing" },
  { local: "privacy", note: "was the photograph-removal route on every event page", expected: "missing" },
  { local: "accessibility", note: "was the accessibility feedback address", expected: "missing" },
  { local: "legal", note: "was the legal notices address", expected: "missing" },
  { local: "governance", note: "on the volunteer code of conduct; exists, reader unknown", expected: "exists" },

  // The mailboxes the organisation actually uses.
  { local: "info", note: "general enquiries; on the business cards", expected: "exists" },
  { local: "events", note: "attendee questions; the ticketing account login", expected: "exists" },
  { local: "mentoring", note: "the mentorship programme", expected: "exists" },
  { local: "industry", note: "sponsorship and partnerships", expected: "exists" },
  { local: "people", note: "volunteer and ambassador applications", expected: "exists" },
  { local: "website", note: "technical; the Google account behind Resend", expected: "exists" },
  { local: "newsletter", note: "the marketing From; accepts mail, nobody holds the password", expected: "exists" },
  { local: "marketing", note: "exists; no owner on record since 2025", expected: "exists" },
  { local: "finance", note: "invoices; exists", expected: "exists" },
  { local: "podcast", note: "exists; credentials were posted in a public channel", expected: "exists" },
  { local: "admin", note: "a mailbox, distinct from the site's seed admin login", expected: "exists" },

  // Referenced by configuration or history rather than by a page.
  { local: "unsub", note: "the notional EMAIL_UNSUBSCRIBE_MAILTO; missing, so leave that unset", expected: "missing" },
  { local: "workshops", note: "2021 schools programme; retired", expected: "missing" },

  { local: "mahsa", note: "the founder's own mailbox", expected: "exists", personal: true },
];

/** Every address in the list, personal inboxes included. */
export function ownMailboxAddresses(domain = "shesharp.org.nz"): string[] {
  return OWN_MAILBOXES.map((m) => `${m.local}@${domain}`);
}
