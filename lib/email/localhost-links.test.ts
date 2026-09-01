/**
 * Checks the loopback-link guard.
 *
 *   npx tsx lib/email/localhost-links.test.ts
 *
 * No database and no network — it imports only the pure module, deliberately,
 * so it can be a step in the `verify` job. `lib/email/hardening.test.ts` cannot
 * be, because reaching `service.ts` pulls in `lib/db/drizzle.ts`, which throws
 * at module load without a connection string.
 *
 * The first case is the real message. It is the body of one of the six
 * confirmation emails that left `noreply@shesharp.org.nz` on 2026-09-01 with a
 * `localhost:3000` confirm link, reduced to the parts that matter. A guard
 * written from a paraphrase of an incident is a guard that stops the
 * paraphrase.
 */

import assert from "node:assert/strict";

import {
  decideLoopbackLink,
  findLoopbackUrl,
  type LoopbackVerdict,
} from "./localhost-links";

let failures = 0;

function check(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ok - ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`  not ok - ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

/** The 2026-09-01 confirmation email, trimmed to the shape that matters. */
const REAL_INCIDENT_HTML = `
  <p>Someone — we hope it was you — asked to join the She Sharp newsletter.</p>
  <a href="http://localhost:3000/newsletter/confirm?t=qWw7971l4OjUIXk6iFYr5soJmO_yJNjxyKm-7z5rms0">Confirm Subscription</a>
  <p>Or copy and paste this link into your browser:</p>
  <p>http://localhost:3000/newsletter/confirm?t=qWw7971l4OjUIXk6iFYr5soJmO_yJNjxyKm-7z5rms0</p>
`;

const CLEAN_HTML = `
  <a href="https://www.shesharp.org.nz/newsletter/confirm?t=abc">Confirm Subscription</a>
  <p>https://www.shesharp.org.nz/newsletter/confirm?t=abc</p>
`;

// ------------------------------------------------------------------ detection

check("the real 2026-09-01 confirmation email is caught", () => {
  const hit = findLoopbackUrl(REAL_INCIDENT_HTML);
  assert.ok(hit, "the message that actually went out must be caught");
  assert.ok(hit.startsWith("http://localhost:3000/newsletter/confirm"));
});

check("a production message is not caught", () => {
  assert.equal(findLoopbackUrl(CLEAN_HTML), null);
});

check("the plain-text alternative is read, not just the HTML", () => {
  // The 2026-09-01 emails repeated the link as bare text. A guard that only
  // looked at href= would have passed a message whose visible copy said
  // "copy and paste this link" above a localhost URL.
  assert.ok(findLoopbackUrl(CLEAN_HTML, "Paste: http://localhost:3000/x"));
});

check("127.0.0.1 and IPv6 loopback count too", () => {
  assert.ok(findLoopbackUrl('<a href="http://127.0.0.1:3100/confirm">x</a>'));
  assert.ok(findLoopbackUrl("https://[::1]:8080/confirm"));
});

check("a port is optional and https is not a way round it", () => {
  assert.ok(findLoopbackUrl("http://localhost/confirm"));
  assert.ok(findLoopbackUrl("https://localhost:3000/confirm"));
});

check("the word alone is not a URL", () => {
  // Copy that mentions localhost — a developer-facing notification, say — is
  // not a broken link, and a guard that refuses it teaches people to route
  // around the guard.
  assert.equal(findLoopbackUrl("<p>Set BASE_URL rather than localhost.</p>"), null);
  assert.equal(findLoopbackUrl("<p>localhost:3000</p>"), null);
});

check("a host that merely contains the word is not loopback", () => {
  assert.equal(findLoopbackUrl("https://localhost.attacker.example/x"), null);
  assert.equal(findLoopbackUrl("https://notlocalhost.example/x"), null);
});

// ------------------------------------------------------------------- decision

check("deployed refuses, local warns, clean sends", () => {
  const url = "http://localhost:3000/newsletter/confirm?t=x";
  const cases: [string | null, boolean, LoopbackVerdict][] = [
    [url, true, "refuse"],
    [url, false, "warn"],
    [null, true, "send"],
    [null, false, "send"],
  ];
  for (const [found, deployed, expected] of cases) {
    assert.equal(
      decideLoopbackLink(found, deployed),
      expected,
      `found=${found ? "yes" : "no"} deployed=${deployed}`
    );
  }
});

check("a local send is never silently refused", () => {
  // Refusing locally would break the only honest way to exercise a real send,
  // and the localhost fallback in getBaseUrl() exists for exactly that case.
  assert.notEqual(decideLoopbackLink("http://localhost:3000/x", false), "refuse");
});

console.log(
  failures === 0
    ? "\nAll loopback-link checks passed."
    : `\n${failures} check(s) failed.`
);
process.exit(failures === 0 ? 0 : 1);
