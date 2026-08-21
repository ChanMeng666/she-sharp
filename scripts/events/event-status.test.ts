/**
 * Tests for the event lifecycle report.
 *
 * These run against the REAL repository data on purpose. The whole value of
 * `event-status.ts` is that it answers "what is left to do for Thursday?" from
 * files rather than from memory, so the failure that matters is not a broken
 * function — it is a correct function reading a source that has quietly moved:
 * a poster rebuilt under a new suffix, a deck slug that no longer matches its
 * event, a state file whose shape changed under its owner's hand. A fixture
 * would be immune to every one of those, which is the same as being blind to
 * them.
 *
 * Two events carry the branches between them:
 *
 *   `event-lesmills-03-september-2026` — upcoming, fully prepared, and the only
 *   event whose artwork was rebuilt with `--suffix v2`. It is the case that
 *   proves a freshly rebuilt poster set still reads as complete.
 *
 *   `she-sharp-and-myob-working-smarter` — past, with a photo album, attendance
 *   figures and no deck. It is the case that proves an event that has been and
 *   gone is not accused of missing the work it no longer needs.
 *
 * Assertions are behavioural, never on prose: the printed wording is meant to be
 * rewritten whenever it reads badly.
 *
 * Run: npx tsx scripts/events/event-status.test.ts
 */

import assert from "node:assert";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAllEvents, getEventBySlug } from "@/lib/data/events";
import { deckForEvent } from "@/lib/deck/index-meta";
import type { EventV3 } from "@/types/event";

import { statusForEvent, type EventStatusReport, type StatusCheck } from "./event-status";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

const UPCOMING_SLUG = "event-lesmills-03-september-2026";
const PAST_SLUG = "she-sharp-and-myob-working-smarter";

/**
 * The clock these two events are judged against.
 *
 * Between 30 July and 3 September 2026 one of them is past and the other is
 * still to come, which is the whole point of the pair. Without a fixed date the
 * upcoming half of this file would quietly become a second test of the past
 * half on 4 September, and CI would fail on the calendar rather than on a
 * change. `--all` below deliberately uses the real clock instead, because the
 * invariants it asserts hold on any day.
 */
const AS_OF = new Date("2026-08-21T12:00:00+12:00");

let passed = 0;
function check(name: string, fn: () => void) {
  fn();
  passed += 1;
  console.log(`ok - ${name}`);
}

function eventOrThrow(slug: string): EventV3 {
  const event = getEventBySlug(slug);
  assert.ok(event, `${slug} is missing from the merged event list`);
  return event;
}

function checkById(report: EventStatusReport, id: string): StatusCheck {
  const found = report.checks.find((entry) => entry.id === id);
  assert.ok(found, `${report.slug} has no "${id}" check`);
  return found;
}

const upcoming = statusForEvent(eventOrThrow(UPCOMING_SLUG), AS_OF);
const past = statusForEvent(eventOrThrow(PAST_SLUG), AS_OF);

// --- the shape every report owes ------------------------------------------

check("every check carries a fix when, and only when, it is missing", () => {
  for (const event of getAllEvents()) {
    const report = statusForEvent(event);
    for (const entry of report.checks) {
      if (entry.state === "missing") {
        assert.ok(entry.fix, `${report.slug}/${entry.id} is missing with no command to fix it`);
      } else {
        assert.equal(entry.fix, null, `${report.slug}/${entry.id} is ${entry.state} but offers a fix`);
      }
      assert.ok(entry.detail.trim().length > 0, `${report.slug}/${entry.id} has no detail`);
    }
    assert.equal(
      report.missingCount,
      report.checks.filter((entry) => entry.state === "missing").length,
      `${report.slug} miscounts its own missing checks`,
    );
  }
});

check("check ids are unique and stable within a report", () => {
  const ids = upcoming.checks.map((entry) => entry.id);
  assert.equal(new Set(ids).size, ids.length, "duplicate check id");
  assert.deepEqual(
    past.checks.map((entry) => entry.id),
    ids,
    "past and upcoming events must report the same checks in the same order",
  );
});

// --- the upcoming, fully-prepared event -----------------------------------

check("the Les Mills event reads as upcoming and prepared", () => {
  assert.equal(upcoming.isUpcoming, true);
  assert.ok(upcoming.daysUntil >= 0, "an upcoming event cannot be in the past");
  for (const id of ["slack", "event-data", "cover", "deck", "feedback"]) {
    assert.equal(checkById(upcoming, id).state, "done", `${id} should be done`);
  }
});

check("a poster set rebuilt with --suffix v2 still counts as complete", () => {
  // The guard is only meaningful while the suffixed files are the ones on disk;
  // assert that first, so a future re-export without suffixes turns this into a
  // failure to re-point rather than a test that silently proves nothing.
  const files = readdirSync(path.join(REPO_ROOT, "public", "img", "events", UPCOMING_SLUG));
  assert.ok(
    files.some((file) => /^social-v2\.(jpg|webp)$/.test(file)),
    "expected social-v2.* on disk — this test exists for the suffix rule",
  );
  assert.equal(checkById(upcoming, "posters").state, "done");
});

check("the speaker set counts every speaker and the line-up tile", () => {
  const entry = checkById(upcoming, "speaker-posters");
  assert.equal(entry.state, "done");
  const speakers = eventOrThrow(UPCOMING_SLUG).detailPageData.speakers.panel_speakers?.speakers ?? [];
  assert.ok(speakers.length > 0, "the fixture event must list speakers");
  assert.ok(
    entry.detail.includes(`${speakers.length} of ${speakers.length}`),
    `expected every speaker covered, got: ${entry.detail}`,
  );
});

check("the deck check reports what DECK_INDEX says", () => {
  const deck = deckForEvent(UPCOMING_SLUG);
  assert.ok(deck, "the fixture event must have a registered deck");
  const entry = checkById(upcoming, "deck");
  assert.equal(entry.state, "done");
  assert.ok(entry.detail.includes(String(deck.slideCount)), `slide count absent from: ${entry.detail}`);
});

check("nothing has been emailed or announced for it yet", () => {
  const emails = checkById(upcoming, "emails");
  assert.equal(emails.state, "missing");
  assert.ok(emails.fix?.includes("send-event-emails"), `unhelpful fix: ${emails.fix}`);
  assert.equal(checkById(upcoming, "announcement").state, "missing");
});

check("photos are not asked of an event that has not happened", () => {
  assert.equal(checkById(upcoming, "photos").state, "n/a");
});

// --- the past event --------------------------------------------------------

check("the MYOB event reads as past, with its attendance figures", () => {
  assert.equal(past.isUpcoming, false);
  assert.ok(past.daysUntil < 0, "a past event cannot be in the future");
  assert.ok(typeof past.attendees === "number" && past.attendees > 0, "attendees should be recorded");
  assert.ok(typeof past.checkedIn === "number" && past.checkedIn > 0, "check-ins should be recorded");
});

check("its photo album counts as a gallery", () => {
  assert.ok(eventOrThrow(PAST_SLUG).detailPageData.galleryUrl.trim().length > 0);
  assert.equal(checkById(past, "photos").state, "done");
});

check("a finished event is never accused of missing its pre-event work", () => {
  assert.equal(deckForEvent(PAST_SLUG), undefined, "the fixture event must have no deck");
  for (const id of ["posters", "speaker-posters", "deck", "announcement", "emails"]) {
    assert.notEqual(
      checkById(past, id).state,
      "missing",
      `${id} should not be outstanding work for an event that has already run`,
    );
  }
});

// --- the sources it reads --------------------------------------------------

check("every state file it reads is where it expects, or absent", () => {
  // Absent is legitimate — a ledger that has never been written does not exist
  // yet. A file that exists but cannot be parsed is what must never pass, and
  // `statusForEvent` above would already have thrown on one.
  for (const file of [
    ".claude/skills/sync-event-from-slack/state/sync-state.json",
    ".claude/skills/send-event-emails/state/event-emails.json",
    ".claude/skills/email-the-community/state/broadcasts.json",
  ]) {
    const full = path.join(REPO_ROOT, file);
    if (!existsSync(full)) console.log(`  (${file} does not exist yet — checks fall back to empty)`);
  }
  assert.ok(
    checkById(upcoming, "slack").detail.includes(UPCOMING_SLUG),
    "the Slack check should name the mapped channel",
  );
});

console.log(`\n${passed} checks passed.`);
