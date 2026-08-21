# The phases in full

One section per phase. Each has the same five lines, and they are the five
questions worth asking before you start it:

- **Gate** — what must already be true. If it does not hold, that is the answer;
  say so and stop.
- **Hand to** — the skill that owns the work. Follow it; do not summarise it.
- **Leaves behind** — the artefact, and where it lands.
- **Then check** — how you know the phase is finished. Usually one line of
  `event-status.ts` flipping to `done`.
- **What goes wrong** — the failure that has actually happened here.

The week markers are guidance. **`event-status.ts` is the truth**, and an event
booked with three weeks' notice runs the same order in less time.

---

## T-6w — Intake

**Gate.** A Slack planning channel exists for the event. Nothing before this
point is a repo job: the date, the venue and the partner are still being agreed
by people, in Slack.

**Hand to.** `/sync-event-from-slack`.

Start at its **Step 0** whenever the ask is broad ("any new events?"), not at
Step 1. The triage prints one row per channel with an `action` column, and two
of those actions matter here:

- `create?` — an event channel with no mapping yet. **Confirm the slug with the
  organiser before creating anything**; the slug is permanent, it is the name of
  the asset folder, and the feedback code is derived from it.
- `exists? (≈slug @source)` — a page for this channel is **already published from
  another data file**. Do not create a second one. Events live across
  `events-custom.json` *and* `shesharp_events_v3.json`, and only the first is
  skill-managed; this guard is what stops the "the 2025 event is missing"
  illusion becoming a duplicate page.

**Leaves behind.** A record in `lib/data/json/events-custom.json` and the event's
assets in `public/img/events/<slug>/`. One folder per event, slug as the
directory name.

**Then check.** `Event data` goes `done`. For an upcoming event that means the
description, time, venue, speakers, registration link and **a headshot for every
named speaker** are all present — the report lists the specific gaps by name.

**What goes wrong.** Two things, both about reading position. The sync skill
keeps **two** positions and they are not the same number: what the triage has
*scanned* and what has actually been *read*. A gap between them is an unread
backlog, and `event-status.ts` reports it as `Slack missing` with the exact
`fetch-channel.ts … --state` command. Four separate misses came from that gap,
one of them the events lead asking for a page change. Second: never copy an
access code, a door code or a private link out of Slack and into the repo. The
June 2026 hackathon page leaked registration codes and the fix cost a git
history rewrite plus a rotation of every code.

---

## T-6w — Refresh the archive

**Gate.** The channel's payload was fetched this session. This is the sync
skill's own **Step 7.6** and it belongs to the same sitting as the intake — it is
listed separately here only because it is the step everyone forgets.

**Hand to.** `/sync-event-from-slack` Step 7.6:

```powershell
npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts --archive D:/github_repository/she-sharp-slack-archive
npx tsx .claude/skills/sync-event-from-slack/scripts/refresh-archive.ts --archive D:/github_repository/she-sharp-slack-archive --apply
```

Dry run is the default and writes nothing.

**Leaves behind.** Nothing in this repo. The archive is a **separate, private
repository**: commit it there, on its own, never as part of the event PR.

**Then check.** Nothing in `event-status.ts` reports on this — which is exactly
why it needs saying. The manifest records what has been **read**; the archive's
`raw/` records what has been **transcribed**. Every sync moves the first and not
the second.

**What goes wrong.** Until this step existed, the archive aged silently while all
three read-state gates stayed green, because none of them looks at it. And
nothing from the archive may be copied into this repo — it holds verbatim DMs,
attendee spreadsheets, a storeroom door code and a partly-live ticket-code
series. Carry the fact, never the text.

---

## T-5w — The event artwork

**Gate.** Date, venue and title are confirmed **in the event record**, not in
somebody's memory of the channel. `/make-event-poster` reads all three from
`events-custom.json`, which is what makes it impossible for the poster and the
website to disagree.

**Hand to.** `/make-event-poster`, steps 1–6.

**Leaves behind.** Five files in `public/img/events/<slug>/` — `humanitix.jpg`,
`social.jpg` + `.webp`, `story`, `square`, `poster`. The `social` WebP doubles as
the website's cover image; pointing `coverImage.url` at it is a **separate
change** to a public page, and is said out loud rather than done silently.

**Then check.** `Poster set` and `Cover image` both go `done`. The cover check is
stricter than it looks: it fails if the record names a file that is not on disk,
and separately if the file has no `alt` text.

**What goes wrong.** File format is an upload constraint, not a preference.
**Humanitix rejects WebP outright** — discovered by whoever is trying to publish
the event, not by whoever made the file. And the picture and the words are made
separately on purpose: a generator asked for a poster returns invented signage
that is the right shape from three metres and gibberish from one, and cannot be
corrected when the venue changes.

---

## T-4w — The speaker campaign

**Gate.** Every speaker has a headshot **in the event record**.
`build-event-poster.ts` refuses a speaker poster without one, and correctly: a
speaker poster is a poster of a person, and there is no version of it without a
face. The fix is a photograph in `events-custom.json` — where the event page
shows it too — never a stock photo, a logo, or anything generated.

**Hand to.** `/make-event-poster` **step 7**, and read its
`references/speaker-posters.md` first.

```powershell
npx tsx scripts/events/build-event-poster.ts <slug> --plate tmp/plates/<chosen>.png --speaker all --lineup
```

Both flags run in one invocation; the poster skill splits them into two commands
so the hooks file can be attached to the speaker run. Either is fine.

**Leaves behind.** Three JPEGs per person (`speaker-<name>-social|story|square`)
plus `lineup-social` in the same event folder.

**Then check.** `Speaker set` goes `done` — "4 of 4 speakers + line-up tile". A
half-built set is reported with the missing people named, which is the whole
value of the check.

**What goes wrong.** `--speaker all` **does not stop at the first refusal**;
everyone who can be built is built and the rest are listed at the end. Pass those
back plainly. Also: the build prints **one name size shared by the whole run**,
and rebuilding a single poster later needs `--name-size <that number>` to match
the set it belongs to.

**Why this phase exists at all.** This is the set that carries the event through
the weeks before it — a new face per post rather than the same picture five
times, while the link, the date and the venue stay identical. Post the line-up
tile first, then one speaker a week.

---

## T-3w — Promotion to the mailing list

**Gate.** The Resend segment has real contacts. **It does not today.** The roster
records no imports, the broadcast ledger records no broadcasts, and the
newsletter people actually receive still goes out from **Mailchimp**.

**Hand to.** `/promote-event`, which resolves the event, builds the spec, and
hands over to `/email-the-community` **from its Step 3**.

**Leaves behind.** `tmp/specs/announce-<slug>.json`, then — once there is a list
— a Resend draft, then a scheduled broadcast, recorded in the broadcast ledger.

**Then check.** `Announcement` goes `done`. Note the check's own honesty: a
broadcast key is free-form, so a populated ledger with no matching key reports
`n/a` rather than accusing anyone of forgetting. Only an **empty** ledger is
unambiguous.

**What goes wrong.** Say "blocked", not "not done yet". Then offer the real
choice — run `/update-mailing-list` first, send as a labelled rehearsal, or stop
— and let the organiser pick. Do not quietly broadcast to a list of one as though
it were a campaign.

**The line that must not be crossed.** The audience here is a Resend segment and
nothing else. Never a registrant list, never a Humanitix export, never a database
query. Someone who bought a ticket asked about *that event*, not to hear from She
Sharp again.

---

## T-2w — The registrants

**Gate.** A Humanitix export with an **attendee email** column, saved in `tmp/`
or named `*.local.csv` (both gitignored). No column, no send, and nothing in this
repo can recover it — the export was made without "Include attendee email" and
the only fix is a re-export.

**Hand to.** `/send-event-emails`, stage `welcome`.

**Leaves behind.** Real email in real inboxes, and a ledger of sha256 hashes at
`.claude/skills/send-event-emails/state/event-emails.json`. That ledger is the
only thing committed. No database row, no Resend contact, no list import.

**Then check.** `Emails` names the stages sent and the stages outstanding.

**What goes wrong.** **A half-sent stage is the one state with a wrong way to
recover.** Restarting re-mails everyone who already got it; the ledger exists so
the run resumes from the next unrecorded chunk instead. `event-status.ts` reports
a partial stage ahead of an unsent one for exactly this reason.

**The judgement call this phase needs.** Four emails about a two-hour evening is
too many. For a single-session event, `welcome` + `day-before` is usually the
whole programme. A stage nobody asked for is not sent.

---

## T-1w — The slides

**Gate.** A run sheet in the event data. The deck reads it live — the deck file
does not copy the title, speakers, sponsors or timings, it *reads* them on every
build.

**Hand to.** `/build-event-slides`. It wants a branch and a pull request, and its
Step 7 previews the deck at four screen shapes before anyone sees it.

**Leaves behind.** `lib/deck/decks/<slug>.ts`, registered automatically, live at
`/present/<slug>` once merged.

**Then check.** `Deck` goes `done` and names the slide count. A regular evening
is about 25 slides.

**What goes wrong.** **There are no preview deploys.** Whatever was verified
locally in its Step 7 is the only verification there is, which is why that step
is not optional and why the production URL gets loaded once after the merge.

And the failure that is invisible from the front of the room: **a deck slug IS
its event slug**, and the feedback code is derived from it. A deck built against
the wrong event collects the wrong event's feedback while looking perfectly
correct on screen. `deck.test.ts` fails `feedback-qr-event-mismatch` as an error,
never a warning.

---

## T-7d and T-1d — The reminders

**Gate.** For `week-before`: an agenda outline, and how to get there. For
`day-before`: the room, the level or the join link, **and an on-the-day contact**.
Ask for them. Never invent a room number.

**Hand to.** `/send-event-emails`, stages `week-before` then `day-before`.

**Leaves behind.** Two more ledger entries.

**Then check.** `Emails` lists them as sent.

**What goes wrong.** A passcode-bearing meeting link is a code, and codes do not
go in email — link the public page instead. And every stage email carries one
line saying **why** the recipient received it, naming the event and the date;
that line is what makes the message self-evidently fulfilment rather than a
campaign, to the reader and to a spam filter alike.

---

## T-1h — The late change

**Gate.** The deck already exists at `/present/<slug>`, and the change is small:
a word, a photo, a QR slide, a late speaker on the panel slide.

**Hand to.** `/tweak-event-slides`. Straight to `main`, no branch, no PR, no
preview pass — speed is the feature, and the narrowness is what pays for it.

**Leaves behind.** A commit on `main`, live about three minutes later.

**Then check.** Its Step 3 — three offline commands, under a minute between them.
`verify.yml` runs on **pull requests only**, so a push to `main` has no CI at
all. Those three commands are the entire review.

**What goes wrong.** The scope creeps. If satisfying a check would mean
restructuring the deck, that is the signal the change was never small: revert and
hand back to `/build-event-slides`. And never leave `main` red — this repo
deploys from `main` on every push, so a broken `main` blocks everyone.

---

## T+0 — The night itself

**Gate.** None. There is nothing to run.

**What the organiser needs**, and it is `/build-event-slides` Step 9 that hands
it over: the deck URL, a PDF backup printed from `<url>?print=1` for the venue
whose wifi fails, the one-page run sheet for whoever is clicking, and **the
feedback link in plain text** — `shesharp.org.nz/f/<code>`, read off the deck's
own feedback slide — pasted into the venue chat.

**Then check.** Nothing. The `/f/<code>` QR has been live since the event record
existed; the code is derived from the slug, so there is no step that "turns it
on".

**What goes wrong.** One deployment-level trap worth a line in the run sheet:
`MAINTENANCE_MODE=true` takes the **feedback form** down too, because the
proxy's matcher covers `/f/*` and `/events/*/feedback`.

---

## T+1d — Thanks and feedback

**Gate.** A feedback form URL. For a She Sharp event that is
`shesharp.org.nz/f/<code>` from the report's `Feedback` line — no form, no
button.

**Hand to.** `/send-event-emails`, stage `thank-you`. It also wants the album URL
if there is one (`galleryUrl` from the event record) and carries one **link** to
subscribe — a link, never a subscription.

**Then check.** `Emails` shows all four stages, or the ones that were actually
wanted.

**What goes wrong.** A ticked "interested in the newsletter" box on the feedback
form **is not consent** and subscribes nobody. `npx tsx
scripts/events/feedback-interests.ts <slug>` prints who ticked it so a human can
act through `/update-mailing-list`.

---

## T+3d — The digest

**Gate.** None, and there is nothing to run. `app/api/cron/event-feedback-digest`
fires daily at `0 21 * * *` and posts one aggregate per event **exactly three
days after** it ran, to `#event-feedback-notifications`.

**Then check.** The Slack channel. Three days is the deliberate window: long
enough for the tail of late responses, short enough that the event is still
fresh enough to act on.

**What goes wrong.** Nothing, usually — but **zero responses posts a "nothing
came in" note rather than staying silent**, because silence is indistinguishable
from the job failing. If that note appears, the usual cause is that the QR never
went up.

---

## T+1w — Close-out

**Gate.** The album URL is known.

Four things, in order:

1. **Flip `detailPageData.status` to `past`.** Bookkeeping. The website has
   already moved the event on its own, by date; this clears the `stale-status`
   row in `/sync-event-from-slack`'s triage. Say that plainly, or the organiser
   goes looking for a bug in a page that is behaving correctly.
2. **Set `detailPageData.galleryUrl`** to the album.
3. **Build the archive:**
   ```powershell
   npx tsx scripts/build-event-archive.mts --slug <slug>
   npx tsx scripts/verify-image-paths.ts
   ```
   `--dry-run` first if you want to see the plan. This **wipes
   `public/img/events/<slug>/archive/` before every rebuild**, so a hand-made
   photo goes *beside* it as `photo-<n>.webp`, never inside.
4. **Land the attendance figures.** This one is not a one-liner and should not be
   promised as one. `apply-humanitix-attendance.ts` reads every change out of
   `lib/data/json/humanitix/crosswalk.json`, where a human wrote down row by row
   what differs and why — so a brand-new event needs a fresh Humanitix export in
   the private vault first:
   ```powershell
   npx tsx scripts/humanitix/build-archive.ts --export <YYYY-MM-DD> --check
   npx tsx scripts/humanitix/propose-crosswalk.ts
   npx tsx scripts/data/apply-humanitix-attendance.ts            # dry run, gaps only
   npx tsx scripts/data/apply-humanitix-attendance.ts --apply
   ```
   Dry run is the default because this step changes what the public site says.
   `--corrections` (overwrite a published figure) and `--unscanned` (turn a
   placeholder `checkedIn: 0` into null) are separate deliberate acts and are
   withheld unless asked for. Full detail:
   `docs/development/HUMANITIX_ARCHIVE.md`.

**Then check.** `Photos` goes `done`. Re-run `event-status.ts --slug <slug>` and
read the whole card back — this is the last time anyone looks at this event.

**What goes wrong.** A `checkedIn` of 0 usually means **nobody scanned**, not
that nobody came; 26 of the 62 ticketed instances never ran a check-in at all.
Never publish a 0 as attendance without reading `checkInDataPresent`.

---

## T+2w — The newsletter

**Gate.** The month's issue is being written.

**Hand to.** `/monthly-newsletter`, which picks the event up on its own from the
event data and the month's real photographs.

**Then check.** Nothing in `event-status.ts` covers this — the newsletter is not
per-event state.

**What goes wrong.** The same standing caveat as T-3w: **the live newsletter
still goes out from Mailchimp.** The Resend version is piloted, not switched
over.

---

## The whole sequence, as a paragraph

Slack gives you the event; the event record gives you the artwork; the artwork
plus the speakers give you six weeks of campaign; the campaign fills a Humanitix
list nobody in this repo can see; that list gets three fulfilment emails and the
room gets a deck; the deck carries a QR that has existed since the record did; a
cron reads the room back to you three days later; and a week after that the
photographs and the numbers land on the page, where the funder report will find
them. Every arrow in that sentence is a gate, and each one is here because it was
once missed.
