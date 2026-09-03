---
name: tweak-event-slides
description: Make one small, low-risk change to an existing She Sharp slide deck and ship it straight to `main` — no branch, no PR, no preview pass. Use when a deck already exists at `/present/<slug>` and someone wants a word changed, a photo swapped, a QR slide added for a link, or a late speaker put on the panel slide — phrases like "change the title on slide 12", "fix the typo on the hackathon deck", "swap the photo on the closing slide", "add a QR slide for the signup link", "add the new speaker to the Les Mills deck", "the founder wants the subtitle reworded", "quick change to the slides", "改一下幻灯片的文案", "给幻灯片加一页二维码", "换掉那张图", "临时加个嘉宾", "幻灯片改个标题", "小改动，直接上线". Built for the hour before the doors open: it runs three offline checks (about a minute) and pushes, so the change is live in roughly three more. Deliberately narrow — it refuses anything that touches a component, a stylesheet, a skin, a slide type or the deck's structure, and hands those to `build-event-slides`, which is also where a NEW deck is built. Assumes the deck already exists; `build-event-slides` puts it there.
---

# Change one thing on a deck that already exists

Three facts shape everything below.

- **Speed is the feature.** This skill exists because a founder changes their
  mind about a line of copy an hour before the room fills, and `build-event-slides`
  is a nine-step process ending in a pull request. That is the right shape for
  building a deck and the wrong shape for changing a word. Here there is no
  branch, no PR, no reviewer and no preview pass.
- **There is no reviewer, so the checks in Step 3 are the review.** `verify.yml`
  runs on `pull_request` only. Pushing to `main` bypasses **every** CI job this
  repo has. The three commands in Step 3 are not a formality left over from a
  slower process — with the PR gone they are the entire remaining safety net,
  and they take under a minute between them.
- **The scope gate is the whole safety model.** Everything else here assumes the
  change is genuinely small. Step 0 is what makes that true, and it runs *before*
  you open a file, not after.

Commands are PowerShell-first. The person you are working with may not write
code; the deck file is yours to edit, not theirs to read.

## When to apply

- "There's a typo on the title slide of the hackathon deck."
- "Change the subtitle to 'Diversity and AI for Impact, one year on'."
- "Swap the photo on the closing slide for the one from last night."
- "Add a QR slide for the signup form — here's the link."
- "Keryn's dropped out and Ben's taking her slot, update the panel slide."
- "改一下 Les Mills 那个幻灯片的结束语。"
- "给黑客松幻灯片加一页二维码，链接是……"

## When NOT to apply

| The ask is | Use instead |
|---|---|
| A deck for an event that has none yet | `build-event-slides` |
| Restructuring the deck — reordering the day, cutting a chapter, more than about three new slides | `build-event-slides` |
| Changing the look — skin, weave, accent, palette, geometry, motion | `build-event-slides` |
| A new slide *type*, a layout component, anything in `components/` or `styles/` | Normal development, with a PR |
| An event fact that is wrong on the website too — a time, a venue, a person's title | Fix `lib/data/json/events-custom.json`; see Step 2 |
| A poster, banner or social graphic | `make-event-poster` |
| Pulling event details out of a Slack channel | `sync-event-from-slack` |

## Step 0 — The scope gate

Decide this before you open anything. If the change is not clearly on the
allow-list, say so plainly and hand over — *"that one changes the shape of the
deck rather than the words on it, so I'd rather do it the careful way; it takes
longer but it gets a preview and a review"* — and stop.

**Allowed to touch:**

- `lib/deck/decks/<slug>.ts` — the one deck being changed
- `lib/deck/index-meta.ts` — **only** via `scripts/deck/sync-registry.ts`
- `public/img/events/<slug>/*` — a new or replaced image for this event
  (every asset an event owns lives in its own slug-named folder)
- `lib/data/json/events-custom.json` — a fact correction, in its own commit

**Stop and hand over if the change needs:**

- any other file in `lib/deck/` — `boilerplate.ts`, `skins.ts`, `types.ts`,
  `lint.ts`, `wall-tiles.ts`, `templates/` — with ONE exception, below
- anything in `components/`, `styles/`, `app/` or `hooks/`
- a new slide *type*, or a slide type this deck does not already use
- a change to the deck's `skin`, `archive` weave or `theme`
- more than about three new slides, or removing a chapter
- a new deck

### The one exception: adding an override to `boilerplate.ts`

An organisational default can be wrong *for one venue*. Les Mills briefed health
and safety themselves, so the generic safety bullets were a second and quieter
brief on the wall; the derived mission line called She Sharp "a New Zealand
non-profit", which is audibly missing a word read aloud; and two of the social
accounts had nothing for that room to go to.

None of those is a reason to change what every deck says. Adding a new **optional
argument** to `OpeningOptions` and passing it from the one deck is in scope here,
because the blast radius is still one deck: every other deck omits the option and
renders exactly as before.

Three exist already — `safetyLines`, `missionLead`, `omitSocials` — so check
whether the one you need is there before adding a fourth.

Two conditions, both hard:

1. **The option is additive and optional.** You are not changing a default, a
   type, or an existing slide's shape. If the change would alter another deck's
   output, it is out of scope and goes to `build-event-slides`.
2. **An option that REMOVES something by name throws on a name it cannot match.**
   `omitSocials: ["Spotify"]` quietly stops working the day that entry is
   renamed in `footerConfig`, and the link returns to the projector with nobody
   told. Fail the build instead — and prove it by passing a bogus name once.

Run `npx tsx lib/deck/deck.test.ts` **and** the other deck's page after this, not
just the deck you are editing: it is the one edit in this skill that can reach
past its own slug.

## Step 1 — Find the deck

```powershell
Get-ChildItem lib/deck/decks/*.ts | Select-Object -ExpandProperty Name
```

Match the user's words against those slugs. Read back **one** line and carry on
in the same turn — this is a confirmation, not a question:

> Editing the Les Mills panel deck (`event-lesmills-03-september-2026`,
> 25 slides) — changing the closing line.

**If two decks could match, ask which.** Never guess. Editing the wrong deck is
not recoverable by the person who asked, because they cannot see the file.

If nothing matches, the deck does not exist yet: hand over to
`build-event-slides`.

## Step 2 — Make the change

Recipes for the four edits that actually happen — a word, an image, a QR slide,
a speaker — are in `references/common-tweaks.md`, with the exact field names.
Five rules govern all of them.

**Event facts stay live expressions.** Names, roles, times, venue and the title
are read from the event record at build time (`RUN_SHEET_ROWS`, `SPEAKERS`,
`deckTitleFrom(event)`). *Why:* pasting a corrected time into the deck fixes the
projector and leaves the website saying something else, and nothing will ever
tell you. A wrong fact goes into `lib/data/json/events-custom.json` — and then
into **its own commit**, `fix(events): …`, before the deck commit, because it
changes the public event page as well as the slides.

**A URL you do not have yet is `""`, never a guess.** *Why:* the slide then
renders a visible "Link not set yet" panel and the linter reports it. A guessed
URL renders a perfect-looking QR code that goes nowhere, and nobody finds out
until sixty people scan it at once.

**A new slide goes where the rhythm survives.** The linter enforces ≤2
consecutive full-frame slides, ≤4 consecutive information slides, and ≤4 in a
row of one tone. *Why:* a deck can pass every copy rule slide by slide and still
be unwatchable. If your new slide lands in the middle of a run, move it a beat
earlier or later rather than recolouring something.

**Copy limits are hard, not advisory.** Title ≤7 words. Lead ≤18 words and one
sentence. ≤5 bullets of ≤10 words, no full stops. Run-sheet labels ≤6 words.
*Why:* these are read from the back of a room, and the linter fails the check
rather than letting the stage shrink the type to fit.

**Give a new slide an eyebrow and a note.** The eyebrow names *this* slide and
must not restate the `section`; the `note` is what the host reads in `?print=1`.
*Why:* the linter rejects an eyebrow that echoes its section, and a slide with
no host note is a slide nobody knows how to present.

**Removing a slide is a rhythm change, and what the host still needs moves into
the previous note.** Look at the two neighbours first: if both are full-frame
(`title`, `section`, `karakia`, `break`, `photo`, `prizes`), the slide you are
cutting is the only thing breaking that run and something else has to go with it.
Cutting "How This Works" from the Les Mills deck took the chapter card with it,
and the three roundtable mechanics moved into the group photo's note — the last
note before the clock starts. *Why:* notes are not projected, and the deck can
pass every copy rule and still strand the host with nothing to say.

**A time that moves is never in one place.** Change it in `events-custom.json`,
then grep the deck file AND `deck.test.ts` for the old literal: host notes,
comments and pinned assertions all hold hand-typed copies that the derived slide
does not. *Why:* on 3 September the run sheet gained a row, the agenda slide
followed it for free, and four copies of the old clock did not.

## Step 3 — The three checks

Non-negotiable. All offline — no database, no network — and under a minute
between them.

```powershell
# Only if you added or removed a slide, or changed the deck title/subtitle.
npx tsx scripts/deck/sync-registry.ts

npx tsx lib/deck/deck.test.ts            # copy, rhythm, feedback QR, the manifest
pnpm typecheck                           # a type error = a failed production deploy

# Only if you added or replaced an image.
npx tsx scripts/verify-image-paths.ts
```

What each one is standing in for:

- **`deck.test.ts`** — the copy and rhythm limits, that every image resolves
  under `public/`, that the feedback QR still points at *this* event, and that
  `index-meta.ts` still matches the decks (which is what keeps the slide count
  on `/slides` and the "View the slides" button on the event page honest).
- **`pnpm typecheck`** — `next.config.ts` sets no `ignoreBuildErrors`, so a
  mistyped field name does not fail here quietly, it fails the **production
  deploy** three minutes after you push.
- **`verify-image-paths.ts`** — a path that resolves nowhere is a blank plate on
  the projector, in a venue whose wifi you cannot rely on.

Deliberately skipped: `next build`, `pnpm lint`, the local preview, the
multi-screen screenshot pass, the PR. That is the trade this skill exists to
make.

**When a check fails on copy, rewrite the copy.** Do not read the rule name out
and do not paste the raw output — translate it. *"'Judging criteria and how the
weighting works' was two words over the limit for a title, so I've made it 'How
judging works'."*

**If satisfying a check would mean restructuring the deck, stop.** That is the
signal the change was never small. Revert with `git checkout -- <file>` and hand
over to `build-event-slides`.

## Step 4 — Ship straight to main

No approval prompt — shipping without one is the point of this skill. Print what
changed, then push.

```powershell
git branch --show-current       # must be `main`
git status --short              # stage only the deck files if anything else is dirty
git diff --stat
```

```powershell
git add lib/deck/decks/<slug>.ts lib/deck/index-meta.ts
git commit -m "fix(deck): shorten the judging title on the hackathon deck"
git push origin main
```

Conventional Commits: `fix(deck):` for a correction to an existing deck,
`fix(events):` for the event-data commit if there was one. Subject line in
English, in the imperative, naming what changed and on which deck. End the
message with the repo's trailer:

```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

**If the working tree has unrelated changes, stage only the deck files.** Never
`git add -A` here, and never `git commit -a`.

## Step 5 — Watch the deploy

Pushing to `main` triggers `.github/workflows/deploy.yml`, which prebuilds and
deploys to production. About three minutes.

```powershell
gh run list --workflow=deploy.yml --limit 1
gh run watch
```

Then load the deck once:

```
https://www.shesharp.org.nz/present/<slug>
```

**There are no preview deploys on this project.** Production is the first place
this change has ever rendered, which is why the load is not optional.

If the run fails, read the error and **fix forward immediately** — see the
failure table below. Do not leave `main` red; the next person to push inherits it.

## Guardrails (USER-APPROVED — hard rules)

1. **Never skip Step 3.** *Why:* `verify.yml` runs on pull requests only, so a
   push to `main` has no CI at all. These three commands are the entire review.
2. **Never leave `main` red.** If the deploy build fails, fix forward at once or
   revert the commit. *Why:* this repo deploys from `main` on every push, so a
   broken `main` is a site that cannot ship anything until it is fixed.
3. **Only the files on the Step 0 allow-list.** *Why:* the whole justification
   for skipping the PR is that the blast radius is one deck's copy. Touch a
   component and it is the site.
4. **Never hand-edit `registry.ts` or `index-meta.ts`.** Run
   `npx tsx scripts/deck/sync-registry.ts`. *Why:* both are generated whole, and
   `deck.test.ts` fails when they disagree with `decks/`.
5. **Never `git push --force`, never rewrite `main`'s history.** *Why:* other
   people and the deploy workflow are on this branch.
6. **Never paste an event fact into a deck file.** *Why:* the deck is a view of
   `events-custom.json`; a pasted fact makes the projector and the website
   disagree silently.
7. **Never read a linter rule name to the author.** Translate `rhythm-tone-run`
   into what it means for the room. *Why:* they are being asked to approve a
   change to their words, not to debug a tool.
8. **Stop and hand over the moment the change stops being small.** *Why:* the
   speed here is bought entirely with narrowness. Widen the scope and the trade
   stops being a good one.

## Common failure modes and how to recover

**`FAIL - index-meta.ts matches the registered decks`** — you added or removed a
slide, or changed the deck's title, without regenerating the manifest. Run
`npx tsx scripts/deck/sync-registry.ts` and commit both files.

**`rhythm-tone-run` / `rhythm-information-run`** — the new slide landed in the
middle of a run of similar slides. Move it a beat earlier or later, or make it a
different layout. Do **not** fix it by recolouring a neighbouring slide.

**A copy limit — `copy-title-too-long`, `copy-lead-too-long`, `copy-bullet-*`** —
rewrite the words shorter. Long-form material belongs on the event page behind a
QR code, never on a slide.

**`feedback-qr-event-mismatch`** — the deck's feedback code no longer matches its
own slug. This is an error, never a warning, because a code pointing at last
month's event looks perfectly correct from the front of the room while collecting
the wrong data. It means the slug or `ClosingOptions.eventSlug` was edited —
which is outside this skill's scope. Revert and hand over.

**`verify-image-paths.ts` reports a missing path** — the file is not under
`public/` at the path the deck names. Check the extension (the archive is `.webp`
almost everywhere) and that the file was actually added, not just referenced.

**The deploy build fails on a type error** — `pnpm typecheck` was skipped or run
against a stale `.next`. Fix the type, push again. If `.next` is producing
phantom errors about `app/api/**/route.js`, delete it: `rm -rf .next`.

**`git push` rejected, non-fast-forward** — someone else pushed first. Run
`git pull --rebase origin main`, re-run `npx tsx lib/deck/deck.test.ts`, push
again. Never force.

**The change is live but the deck still looks old** — the deck preloads every
image and makes no network calls after first load. Whoever has it open needs to
reload the page, once.

## What this skill does *not* do

- **Build a new deck** — `build-event-slides`, which also owns the skin, the
  weave, the accent pair, the copy pass and the multi-screen preview.
- **Restructure an existing deck** — same skill, for the same reason.
- **Change how a deck looks** — skins and CSS are `build-event-slides` and
  `docs/development/DECK_SYSTEM.md`.
- **Put an event on the website** — `sync-event-from-slack`.
- **Make artwork** — `make-event-poster`.
- **Email anyone about the change** — the people who registered are mailed from
  Humanitix -> Email campaigns; the mailing list is `email-the-community`.
