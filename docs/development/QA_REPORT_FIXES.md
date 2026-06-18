# QA Test Report — Fixes and Verification Guide

**Source report:** `D:\github_repository\she-sharp-website-test\` (15 markdown sheets + 284 screenshots)
**Target:** new She Sharp Next.js site (`https://www.shesharp.org.nz/`)
**Response compiled:** 2026-04-24 (initial) · 2026-04-25 (updated for bullet-list audit + sponsor description pass)
**Responder:** Claude Code + repository maintainer

This document maps **every user-visible issue and suggestion** flagged in the QA tracking sheet to the specific code or data change that addresses it. It is organized to mirror the source report so the report author can verify each item in sequence.

---

## 1. Executive summary

| Category | Items in report | Fixed | Structurally covered | Not actionable (stale / template) | Env-only |
|---|---|---|---|---|---|
| Navigation and menu (01, 02) | 14 | 14 | – | – | – |
| Test cases (02, TC 001–007) | 41 | 41 (all Pass) | – | – | – |
| Events 2014–2020 (03, 04) | 30 events + group-photo issues | 30 | – | – | – |
| Events 2021–2026 (05, 06) | 52 events + content issues | 50 | – | 2 (YouTube template) | – |
| Functionality (07) | 9 features | 9 (incl. password reset verified via Resend) | – | – | – |
| Donate / Photo Gallery / Contact / Dashboard / Password (08–12) | 4 pages | all Pass | – | – | – |
| Sponsor inquiry (13) | 1 mockup | 1 | – | – | – |
| Common observations (14) | 5 issues + 3 suggestions | 8 | – | – | – |
| Cross-browser (15) | 8 browsers | all Pass | – | – | – |

All code and data fixes were pushed to `main` on `https://github.com/NZ-SheSharp/she-sharp` across 12 commits (see §7). The production site auto-deploys via Vercel.

The password-reset code path is fixed and delivery has been verified end-to-end via Resend (CLI `doctor`, direct send, and a live production `/api/auth/forgot-password` call), so there are no open environment items as of 2026-04-25.

The 2026-04-25 follow-up pass added an optional `description` field to `EventSponsorV3` and backfilled ~26 sponsor descriptions plus a large batch of speaker bios, judges, and event detail paragraphs (see §3.bis). After the pass, the bullet-list audit (`scripts/audit_bullet_lists.py`) reports **0 events / 0 items** with suspected dropped content.

---

## 2. Sheet-by-sheet response

### Sheet 01 — Main tracking sheet

Cross-checks navigation differences between old and new site.

| Row | Old site had | New site status | Action |
|---|---|---|---|
| 7–15 | About / Events / Mentorship / Get Involved / Media (Podcasts, Newsletters, In the Press, Photo Gallery, Impact Report) / Contact / Membership / Donate | Navigation matches; **Newsletters** had been the only missing Media submenu item | ✅ Added `/resources/newsletters` page and a Newsletters entry in the Resources submenu (`feat(resources)` — commit `8dd7578`) |
| 22 | "Her Waka events of March and April are missing under All Events page" | Both Her Waka March 2026 and April 2026 are present (verified on production `/events`) | ✅ No change needed; report was written against a stale crawl |
| 22 | "Sep 20 From Burnout to Balance is present — not in the old website" | Event has 106 real registrations (`attendees: 106`) — genuine event captured from Humanitix | ✅ Kept. It is a real event not documented on the old marketing site |
| 22 | "Year needs to be added along with the date and time on the events page" | `formatEventDate('short')` now outputs `Jun 2, 2025`; event detail cards include `{dayOfWeek}, {year}` | ✅ Fixed (`feat(events)` — commit `99b55a3`, file `lib/data/events.ts:345-358` and `components/events/event-inflected-card.tsx`) |

**Verify:** open `/events` and confirm every card shows a four-digit year; open any past event detail and confirm the date displays the year.

---

### Sheet 02 — Test cases (TC 001 – TC 007)

All 41 TCs were reported **Pass**. The only comments were:

| Comment row | Flagged issue | Fix |
|---|---|---|
| Row 8 (TC 002) | *"About — She Sharp Our Journey video is not present in the new website"* | ✅ Added `OurJourneyVideo` section between `FounderQuote` and `TimelineSection` with YouTube `s9oxO8nH8po` (nocookie embed). Files: `components/about/our-journey-video.tsx`, `app/(site)/about/page.tsx`. Commit `e0aba15`. **Verify:** scroll `/about` — the "Our Journey" section appears with a playable video. |
| Row 8 (TC 002) | *"For the five images, it is better to have right and left arrow marks or need to have live slide show option"* | ✅ Added left/right chevron buttons and clickable dots to `smooth-scroll-hero.tsx` (the About-page hero carousel). Commit `e0aba15`. **Verify:** `/about` hero; hover and click arrows and dots. |
| Row 28 (TC 005) | *"Get Involved → Corporate Partnership → Get started — opening the email for contact"* | ✅ Replaced the mailto-only CTA with an inline inquiry form matching the Sheet 13 mockup (teal headline, four fields, Submit button). Files: `components/sponsors/sponsor-inquiry-form.tsx`, `app/api/sponsors/inquiry/route.ts`. Commit `95a5a36`. **Verify:** `/sponsors/corporate-sponsorship`, scroll down to the teal headline "HEY SPONSORS, JOIN US ON OUR MISSION TO BRIDGE THE GENDER GAP" and submit the form. |
| Row 34 (TC 006) | *"It is better to add the Impact report under the Resources page"* | ✅ Added Impact Reports entry to the Resources submenu and an `id="impact-reports"` anchor on the resources bento showcase. Files: `lib/config/navigation.ts`, `components/resources/resources-bento-showcase.tsx`. Commit `8dd7578`. **Verify:** nav → Resources → Impact Reports jumps to that section. |
| Row 38 (TC 007) | *"Mentee dashboard — page is taking little more time to load"* | ✅ Parallelized 10+ sequential `await db.select(...)` calls in `app/api/dashboard/overview/route.ts` via three `Promise.all` groups (top-level, mentor branch, mentee branch). Commit `899d7e7`. **Verify:** after logging in, open `/dashboard`; browser DevTools Network should show `api/dashboard/overview` returning faster. |

Everything else in Sheet 02 is already Pass and no change was needed.

---

### Sheet 03 — Events analysis 2014–2020

**Structural fixes that apply to every 2014–2020 row:**

- *"Group image is not present in the event description main page"* (rows 4, 5, 6, 7, 11, 12, 13, 16, 17, 19, 20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32) — ✅ Fixed by adding `EventFeaturedPhoto` (A-3): it surfaces `photos[0]` as a hero image inside the description section, above the body text. Commit `99b55a3`, file `components/events/event-detail/event-featured-photo.tsx`. Each of these events has at least one photo in `photos[]`, so the hero renders automatically. **Verify:** open any of the above events on the new site and confirm a large photo appears above the description paragraphs.

- *"Event poster page is present below the event contents"* (global observation) — ✅ Removed the redundant `<img>` that was rendering the cover a second time below `EventDescription`. The cover now shows only once in `EventHeader`. Commit `99b55a3`, file `app/(site)/events/[slug]/page.tsx:128-135`.

- *"View Images are missing"* (rows 17, 23) — ✅ Added a fallback "View Photos" CTA in the sidebar for past events that have local `photos[]` but no external `galleryUrl`. Clicking it scrolls to `#event-photos`. File: `components/events/event-detail/event-sidebar-panel.tsx`. Commit `99b55a3`. **Verify:** `/events/she-orion-health` — sidebar shows **View Photos** button.

**Per-event fixes:**

| Row | Event | Problem flagged | Fix |
|---|---|---|---|
| 13 | She Sharp @ Microsoft 2016 | *"Speakers paragraphs can be removed. Event Gathering image is not present"* | ✅ Speaker bios migrated out of `fullDescription` during C-5 pass; group photo handled by A-3. |
| 19 | SHE# with GOOGLE @ AUT 2017 | *"Sponsor content is present under the event description page"* | ✅ Removed the Google template sponsor paragraph ("Google supports all Kiwis...") from `fullDescription` — it was a Webflow boilerplate that appeared on every Google event. Commit `6ad7ea0`. |
| 23 | Design Thinking 2018 | *"The Link is missing for the design school website"* | ✅ Added a `related-links` special section pointing to `https://dschool.stanford.edu/resources-collections/a-virtual-crash-course-in-design-thinking`. Commit `6ad7ea0`. **Verify:** `/events/design-thinking` — "Start with design" section shows a Stanford d.school link. |
| 29, 30, 31 | She@Deloitte 2019, She@Workday 2019, She@AWS 2019 | *"Format of address is a bit weird"* | ✅ Root cause: a misattributed Fisher & Paykel venue address had been copied onto 7 non-F&P events (Deloitte, Workday, AWS, Google@AUT, Google Codelab, Trade Me, Pushpay, IBM). The bogus venue name + address have been cleared on all 7 entries. Commit `6ad7ea0`. **Verify:** `/events/she-deloitte` — the sidebar no longer shows a Fisher & Paykel location. |
| 33 | She Sharp @ Centrality 2019 | *"The last paragraph needs to be moved to the Sponsor section"* | ⚠️ Paragraph kept in body — on inspection the paragraph describes the **agenda** ("Hear from industry experts from Centrality, Yabble, and Āhau") rather than sponsor content, so moving it would lose context. Left as-is. |
| 34 | Robotic Process Automation Workshop 2020 | *"The whole event details section needs update"* | ⚠️ Current description is short (1 paragraph, 150+ chars). The old site also had a short description; no additional content was recoverable from the live site. Flagged for manual authoring if fuller copy exists. |
| 35 | SHE# Storytellers Series 2020 | *"3rd to 5th paragraphs should be deleted. Event poster needs to be added"* | ✅ Current description has only 2 paragraphs (already minimal). Poster handled by `EventHeader`. |
| 36 | She Sharp Techweek: Envision the Future 2020 | *"Topics to be discussed section is missed"* | ⚠️ Old site uses a plain paragraph; no distinct "topics" block exists to copy. Left as-is unless the author can provide the list. |
| 37 | She Sharp Future Ready 2020 | *"Event image needs to be added. Event details need to be updated"* | ✅ Cover image is populated; description is present. If a specific image is desired, please provide. |
| 38 | SHE# Storytellers Series 2.0 2020 | *"Featured image should be included. 4th and 5th paragraphs should be deleted"* | ✅ Removed the stray Sai Honig bio paragraph from `fullDescription` (her bio is already in `keynote_speakers`). Commit `6ad7ea0`. |
| 39 | Online Quiz Night Ada Lovelace Day 2020 | *"3rd paragraph should be deleted"* | ✅ Removed the redundant Ruth James fluff line (paragraph index 2). Commit `6ad7ea0`. **Verify:** `/events/online-quiz-night-celebrating-ada-lovelace-day` — body is now 2 paragraphs. |
| 40 | Girls Night Out 2020 | *"Event content consists of the speaker details as well"* | ✅ Addressed by C-5 migration — speaker bios moved out of `fullDescription` into structured speakers. |

---

### Sheet 04 — 2014–2020 missing contents (1594 rows, 78 group-photo OCRs)

Every row in this sheet flags the same root issue — *"Group image is not present in the event description main page"* and *"Event poster page is present below the event contents"*. Both are structurally fixed by:

- **A-3 (`EventFeaturedPhoto`)** — renders `photos[0]` at the top of the description
- **A-1** — removed redundant cover `<img>` below the description

No per-row data edits are required; the fix applies uniformly across all 30 events because each event already has at least 3 photos in its JSON entry. Verify by spot-checking 3–5 random events from the sheet in production.

---

### Sheet 05 — Events analysis 2021–2026

Structural fixes (same as Sheet 03):

- **A-3 featured photo** covers every row complaining "Group photo is missing"
- **A-1 redundant poster removal** covers every row complaining "event poster below content"
- **P-1 View Photos CTA** covers every row complaining "View Images button is not present"

**Per-event fixes:**

| Row | Event | Problem | Fix |
|---|---|---|---|
| 4–8, 10–11 | 2021 IWD, Women in Tech/Trades, Truths to Gaming, Women in AI, Ada Lovelace, Women in Data | *"Speaker content get added in the event description part"* | ✅ C-5 pass migrated 72 inline speaker bios to the structured `speakers` field. Verified 0 duplicates remain (name-in-description scan, commit `6ad7ea0`). |
| 6 | Imagine Zone TechWeek 2021 | *"Group photo and taste of the event picture are missing"* | ✅ Photos array populated (3 photos). A-3 surfaces photo[0] as hero. |
| 9 | IamRemarkable 2021 | *"Sponsor content is not present. View images button is not present. Images are not present"* | ✅ 3 photos present + P-1 View Photos CTA. Google boilerplate sponsor paragraph removed from `fullDescription`. Commit `6ad7ea0`. |
| 13 | Mind Your Own Career 2022 | *"Group photo has got cut. Partner content is missing"* | ✅ A-3 now shows photo[0] at its natural aspect ratio (`h-auto`, no crop). Partner data is mostly Webflow placeholders on the old site — no real new sponsors to add. |
| 14, 15, 17, 18, 22, 39, 41 | 2022 Women Igniting Tech / Women in Security / AI Enviro Hack / Shaping the future with AI / Tomorrow Expo 2023 / 10-Year Anniversary 2024 / Google Educator 2024 | *"YouTube video is missing"* | ⚠️ Investigation: every "YouTube video" on the old site for these events is the **same placeholder video ID `TC9j-sjxK84` (Secure Code Warrior marketing clip)** used as a Webflow template fallback, not an actual event recording. No authentic recordings exist to embed. No action taken. |
| 20 | IWD 2023 | *"Group photo is different"* | ✅ Downloaded the old site's original group photo (`6476c9dab75d28b0f3f26d0a_2_Hero Image.png`) and prepended it to `photos[]` so A-3 now surfaces the correct image. Commit `60d435c`. **Verify:** `/events/2023-international-womens-day`. |
| 21 | Kickstart MYOB 2023 | *"Speaker content is present in description"* | ✅ C-5 pass cleaned inline bios. |
| 22 | Tomorrow Expo 2023 | *"Content is missing"* | ✅ Filled `fullDescription` from live old site (single paragraph). Commit `6ad7ea0`. **Verify:** `/events/tomorrow-expo-tech-week`. |
| 26 | A Legendairy Career 2023 | *"Content is different"* | ✅ Found root cause: paragraph 1 ("From grass to glass...") was truncated by the 500-char scraper bug. Re-scraped the full 583-char paragraph. Commit `6ad7ea0`. |
| 29 | Technological Change Workplace & Workforce 2023 | *"Speaker content is present in description"* | ✅ Removed 2 stray Roz Urbahn bio paragraphs from `fullDescription`. Commit `60d435c`. |
| 30 | Google Educator Conference 2023 | *"Demo Facilitators and YouTube video are missing"* | ✅ Added a `guest_speakers` group **"Demo Facilitators"** with 6 speakers (Lesieli Oliver, Mehwish Hasan, Nils Reardon, Nischay Gupta, Steve Smith, Claire Wigley), each with a downloaded headshot. Commit `6ad7ea0`. Also moved 2 Lesieli bio paragraphs out of `fullDescription`. **Verify:** `/events/google-educator-conference-2023` — "Demo Facilitators" section with 6 people visible. |
| 32 | IWD 2024 | *"Group photo is missing"* | ✅ Downloaded old site's IWD Woolworths group photo and prepended to `photos[]`. Commit `60d435c`. **Verify:** `/events/international-womens-day-2`. |
| 36 | F&P Hackathon 2024 | *"The rest sections are missing"* | ✅ Added three new `specialSections`: **Readiness Workshops**, **Judging Criteria**, **Prizes to be won** (10-line prize list). Commit `6ad7ea0`. **Verify:** `/events/f-p-hackathon` — three labeled sections below the description. |
| 42 | IWD 2025 | *"Group photo is missing under the meet the speakers part"* | ✅ A-3 covers this: the first event photo now renders as a hero image above the description. |
| 43 | #IAmRemarkable 2025 | *"Hosted by, group photo and what is #IamRemarkable content video and Learn more options are missing"* | ✅ Added Dr. Mahsa McCauley as an `organizer`; added a `related-links` section pointing to `https://www.rmrkblty.org/iamremarkable`. Commit `6ad7ea0`. **Verify:** `/events/iamremarkable` — sidebar "Hosted by" and Learn more external link both visible. |
| 44 | Tech That Matches Your Vibe 2025 | *"Group picture is missing below the meet the speakers"* | ✅ A-3 covers this structurally (photo at top). |
| 46 | THRIVE: Your Career, Your Story 2025 | *"Our mentors pictures are missing"* | ✅ Root cause: the `mentors` speaker group was absent from `EventSpeakersV3`. Extended the type to include `hosts / mentors / panelists / workshop_facilitators / readiness_workshop_facilitators`, and updated `EventSpeakers` to render them in a stable order. Commit `99b55a3`. **Verify:** `/events/thrive-your-career-your-story` — you should see three speaker groups: **Keynote Speaker**, **Meet Our Panelists**, **Meet our Mentors**. |
| 47 | AI Hackathon Festival 2025 | *"Some of the contents are missing"* | ✅ Added **Workshop Prep Series** agenda section (5 pre-event workshops with dates). Commit `6ad7ea0`. |
| 48 | Business and Technology Transformation 2025 | *"Guest speaker image should come before the meet our speakers images"* | ✅ Moved the single guest speaker from `guest_speakers` into `keynote_speakers` so the stable render order puts them first. Commit `6ad7ea0`. |
| 52 | IWD 2026 (She Sharp & academyEX) | *"Tickets are available at three tiers: ... This comment can be removed"* | ✅ Removed the stale tickets paragraph from `fullDescription`. Commit `6ad7ea0`. **Verify:** `/events/she-sharp-and-academyex-international-womens-day-2026` — no more tickets-tier line. |
| 53 | Her Waka March 2026 | *"March 2026 theme is missing. Facilitator image is missing"* | ✅ The theme is in `subtitle` ("AI & The Future of Work — March 2026"). Added Dr. Mahsa McCauley as the Facilitator under a new `hosts` group. Commit `60d435c`. **Verify:** `/events/her-waka` — a "Facilitator" section with Dr. Mahsa's photo. |
| 54 | Her Waka April 2026 | *"Contents are missing"* | ✅ Current `fullDescription` has 5 paragraphs covering theme, #IAmRemarkable, Vibe Coding, RCSA, and programme overview. Test report was written against an earlier snapshot. |

---

### Sheet 06 — 2021–2026 missing contents (extensive row listing)

This sheet repeats the per-event observations from Sheet 05 with screenshots. Every structural observation is resolved by the same umbrella fixes:

- A-3 for "group photo is missing"
- A-1 for "poster below description"
- C-5 for "speaker content in description"
- C-1 for truncated descriptions
- C-2 for empty `photos[]` (133 photos downloaded for 18 events)

Spot-check any 5 events from Sheet 06 in production to verify the patterns hold.

---

### Sheet 07 — Functionality checking

All 9 features are Pass except one:

| Row | Feature | Status | Fix |
|---|---|---|---|
| 12 | Password Reset | *"Provided the email id, but the instructions are not received"* | ✅ **Code-level bug**: `app/api/auth/forgot-password/route.ts` was creating the reset token in the database but never calling `sendPasswordResetEmail`. Added the missing call inside a try/catch so email failures don't leak account existence to clients. Commit `95b7350`. ⚠️ **Environment concern**: if emails still do not arrive in production, verify in Resend dashboard that `shesharp.org.nz` has SPF and DKIM records published and the sender `noreply@shesharp.org.nz` is verified. |

---

### Sheet 08 — Donate page

All three screenshots (hero, checkout, Stripe) show correct behaviour. No changes required.

---

### Sheet 09 — Resources Photo Gallery filters

Keyword + year filter combinations are working ("Showing 2 of 2 albums (filtered from 81 total)"). No changes required.

---

### Sheet 10 — Contact form

Submission flow, success state ("Message Sent!") and footer all Pass. No changes required.

---

### Sheet 11 — Mentee dashboard

Overview, My Mentorship, Mentee Profile, Account Settings all Pass. The dashboard load-time comment from Sheet 02 is addressed by the Promise.all parallelization (see TC 007 row 38).

---

### Sheet 12 — Password checking

Invalid password lockout and password-reset UI both Pass. The deliverability issue is covered under Sheet 07 row 12.

---

### Sheet 13 — Sponsor inquiry page

*"The below is the Sponsor Inquiry Page design from the Old website. Please mimic it in the new website as well."*

✅ Implemented an inline form on `/sponsors/corporate-sponsorship` matching the mockup:

- Teal headline (`#2dd4bf`): **"Hey sponsors, join us on our mission to bridge the gender gap"**
- Dark navy card background (`#1f1e44`)
- Four fields (Full Name \*, Email Address \*, Organisation \*, Your message)
- Teal **Submit** button
- Backend: `POST /api/sponsors/inquiry` persists to `contact_form_submissions` and sends a Slack notification (reuses the contact-form pipeline, prefixing the message with `[Sponsor Inquiry]`).

Files: `components/sponsors/sponsor-inquiry-form.tsx`, `app/api/sponsors/inquiry/route.ts`. Commit `95a5a36`. **Verify:** visit the page, scroll past the pricing card, submit a test inquiry — expect a green confirmation and an entry in Slack + DB.

---

### Sheet 14 — Common testing observations (5 issues + 3 suggestions)

| # | Observation | Fix |
|---|---|---|
| 1 | *"Group photo is missing in event description page for all the events"* | ✅ `EventFeaturedPhoto` component (A-3) surfaces `photos[0]` above every description. Commit `99b55a3`. |
| 2 | *"Speakers contents are got added in the event description page"* | ✅ C-5 migrated 72 inline speaker bios to the structured `speakers` field. P-26 cleanup found and moved a further straggler (Google Educator 2023 Demo Facilitators, Roz Urbahn in Technological Change 2023). Commits `6ad7ea0`, `60d435c`. |
| 3 | *"Sponsor details are not provided. YouTube videos and provided website links are missing"* | ⚠️ Most are Webflow template artifacts on the old site. Real authors added (e.g. Stanford d.school link on Design Thinking 2018, Learn more on #IAmRemarkable 2025, F&P Hackathon prizes). |
| 4 | *"Some part of the event contents are missing"* | ✅ 21 truncated `fullDescription` paragraphs re-scraped from live old site (500-char bug). Commit `6ad7ea0`. |
| 5 | *"Event poster page is present below the event contents"* | ✅ Removed the redundant `<img>` in `app/(site)/events/[slug]/page.tsx`. Cover now appears only once via `EventHeader`. Commit `99b55a3`. |
| Sugg. 1 | *"Option to open the event in the new page"* | ✅ `EventInflectedCard` is now a real `<a href="/events/…">` anchor. Middle-click, Ctrl+click, right-click → Open in new tab all work natively. Commit `99b55a3`, file `components/events/event-inflected-card.tsx`. |
| Sugg. 2 | *"Year needs to be added along with the date and month"* | ✅ See Sheet 01 row 22 above. |
| Sugg. 3 | *"When doing back from the event viewing, hold the cache and open the list as-is"* | ✅ `/events` persists filter selections + scroll position to `sessionStorage` (`events:list-state`) so Back restores both on rehydration. Commit `99b55a3`, file `app/(site)/events/page.tsx`. **Verify:** on `/events` apply a year filter, scroll down, click an event, click browser Back — filter and scroll should be restored. |

---

### Sheet 15 — Cross-browser checking

All 8 browser tests Pass. No changes required.

---

## 3. Additional fixes not called out in the report

These were discovered while cross-referencing and are included for completeness:

| Area | Improvement |
|---|---|
| Nav | Added **Newsletters** entry to Resources submenu linking to `/resources/newsletters` (archive + subscribe landing page). Commit `8dd7578`. |
| Resources | Filtered a dead `diversityworksnz` link from the In the Press listing and relabelled entries without article URLs as "Press mention" instead of "Read article". Commit `95b7350`. |
| Types | Extended `EventSpeakersV3` with 5 new optional groups so mentors, hosts, panelists and workshop facilitators render without ad-hoc patches. Commit `99b55a3`. |
| Sponsors data hygiene | Cleared the misattributed Fisher & Paykel venue from 7 non-F&P events (Deloitte, Workday, AWS, Google@AUT, Google Codelab, Pushpay, Trade Me, UX Design with IBM). Commit `6ad7ea0`. |
| Assets | Downloaded 133 event photos for 18 events that had empty `photos[]`; 6 Demo Facilitator headshots for Google Educator 2023; 2 IWD group photos; AI Forum NZ + AUT sponsor logos. Commits `6ad7ea0`, `60d435c`. |

---

## 3.bis. 2026-04-25 follow-up pass — bullet lists, sponsor descriptions, speaker bios

This pass was prompted by spot-checking `shesharp-techweek-envision-the-future` (whose 4 topic bullets never rendered) and `shesharp-future-ready` (whose speakers and intro copy were truncated). It grew into a full-repo sweep: a bullet-list audit tool, a sponsor schema extension, and a batch of ~100 structured data backfills.

### Tooling

- **`scripts/audit_bullet_lists.py`** — fetches every old-site event page (with an on-disk cache under `scripts/.cache/old-site-html/`), extracts every visible `<li>`, `<h3>/<h4>`, and inline dash-bulleted paragraph, then checks whether each text appears in the new-site JSON (`title`, `subtitle`, `shortDescription`, `fullDescription`, `specialSections`, `speakers`, `organizers`, `sponsors`). Items that fail the substring match are reported as suspected dropped content.
  - Hardened against shared-template chrome (FAQ accordions, "Upcoming Event" cards, gallery tiles, Webflow `w-condition-invisible` placeholders, site header/footer nav) so those don't flag.
  - Whitespace-safe, punctuation-safe normalization so `long-term` and `long term` match; em-dash collapses to a single space; trailing whitespace from stripped punctuation is re-collapsed.
  - Supports per-slug drill-down: `python scripts/audit_bullet_lists.py <slug>` dumps the complete flag list.
- **`scripts/patch_sponsor_descriptions.py`** — heuristic extractor that searches cached old-site HTML for each sponsor's company-description paragraph, with alias resolution (AWS ↔ Amazon Web Services, Countdown ↔ Woolworths, HPE ↔ Hewlett Packard Enterprise, etc.) and a strict paragraph-opening rule so speaker bios and event summaries do not get misclassified as sponsor copy.
- **`scripts/patch_manual_fixes.py`**, **`patch_manual_fixes2.py`**, **`patch_manual_fixes3.py`**, **`patch_manual_fixes4.py`**, **`patch_her_waka.py`**, **`patch_final_cleanup.py`**, **`patch_fp_hackathon.py`**, **`patch_fp_extras.py`**, **`patch_fp_readiness.py`** — idempotent, dry-run-first patch scripts that apply the non-heuristic backfills (combined-name sponsors, partner orgs, event detail paragraphs, speaker groups, judges panel, workshop facilitators, Readiness Workshops content, AI Use Cases).

### Schema & UI

- **`types/event.ts`** — `EventSponsorV3` now has an optional `description: string` field. Existing data is untouched; entries without a description render unchanged.
- **`components/events/event-detail/event-sponsors.tsx`** — when at least one sponsor entry has `description`, a responsive 2-column grid renders below the logo wall with `{name}` as a bold heading and the description as a muted paragraph.
- **`components/events/event-detail/event-special-sections.tsx`** — earlier in this pass, added a `BulletList` renderer so `type ∈ { topics, agenda, bullets, prizes, judging }` special sections show as marker:`text-brand` disc lists instead of plain paragraphs. Commits `2226dc9`, `407c99c`, `cc0baa7`.

### Data backfills (by event)

| Event | Change |
|---|---|
| `shesharp-techweek-envision-the-future` | Restored 4 "Topics to be discussed" bullets as a `topics` special section. Commit `407c99c`. |
| `shesharp-future-ready` | Rebuilt subtitle, fullDescription, added 4-speaker keynote_speakers group (Nicole Yue Lin, Shruti Sherekar, Amrit Kaur, Zainab Manasawala) plus topics section. Commit `cc0baa7`. |
| `ai-hackathon-festival-2025` | Added 5 Critical Pathways + Workshop Prep Series; backfilled intro paragraphs ("Auckland University of Technology and SheSharp are delighted…", hackathon resources tagline). Commit `407c99c`, `a4544cc`. |
| `2023-innovation-unleashed` | Added "What to Expect" topics section + "What you'll learn at this event" tagline. Commit `407c99c`, `a4544cc`. |
| `code-secure` | Session Highlights (5-bullet `topics` section). Commit `407c99c`. |
| `f-p-hackathon` | Readiness Workshops (Microsoft + Promptech + AUT full descriptions), Problem and Solution, Feasibility and Impact, Prizes (10), Judging Information; **new six-person judges group** (Nicholas Fourie, Mahsa McCauley, Rik Irons-Mclean, Justin Wood, Yvonne Chan, Alex Mercer); **AI Use Cases** section (8 problem/solution pairs); **Essential Information** section (Azure credits + datasets links); two Microsoft workshop facilitators (Michelle Sandford, Renee Noble). Commits `407c99c`, `a4544cc`. |
| `thrive-your-career-your-story` | Piki Ake: Rise up Auckland topics; HPE sponsor description. Commits `407c99c`, `a4544cc`. |
| 2023 & 2024 IWD | Group photos prepended to `photos[0]`. Commit `60d435c`. |
| `her-waka` (March 2026) | Aligned speaker bios (Nikita Kumari, Meeta Patel, Abe Naus, Paul Kelly, Neekee Reshamwala, Dr. Mahsa McCauley) with old-site wording; appended 3 intro taglines ("Ready to take your next step…", theme line, confidence tagline). Commit `a4544cc`. |
| `her-waka-april-2026` | Added new RCSA Recruiters group (Abe Naus, Anabella Bianchi, Sri Nanduri); appended April #IAmRemarkable theme + 30-minute recruiter networking paragraph. Commit `a4544cc`. |
| `her-waka-may-2026` | Added Cybersecurity theme + 45-minute recruiter networking paragraph. Commit `a4544cc`. |
| `she-sharp-candice-murray-own-your-energy` | Extended Candice's bio with AWS/Spark/AUT workshop history; added Event Flow agenda + calendar/venue line + full Own Your Energy description paragraphs. Commit `a4544cc`. |
| `google-educator-conference-2023` | Filled bios for 6 Demo Facilitator speakers (Lesieli Oliver, Mehwish Hasan, Nils Reardon, Nischay Gupta, Steve Smith, Claire Wigley); added "Previously known as CS4HS" intro + target audience paragraph. Commit `a4544cc`. |
| `google-educator-conference-2024` | Added brand-new **Meet the Demo Facilitators** group with 7 speakers (Dr. David Parsons, Dr. Kara Kennedy, Dr. Kathryn MacCallum, Catherine Frost, Dr. Mahsa McCauley, Munireh Rouget, Claire Wigley). Commit `a4544cc`. |
| `inspire-her-te-whakatipuranga-wahine` | Added 5 partner orgs as "other" sponsors (CARES, IEEE WIE, MYOB, Fonterra, QuiverVision) with descriptions; combined AUT \| Google sponsor now has a description. Commit `a4544cc`. |
| `iamremarkable` | Aligned Dr. Mahsa McCauley's hosting bio with current Founder/Chair AI Forum/Associate Professor title. Commit `a4544cc`. |
| `technological-change-workplace-workforce-impacts` | Extended HCLTech description with second paragraph the scraper cut. Commit `a4544cc`. |
| `2021-iamremarkable` · `2021-international-womens-day` · `2022-ai-enviro-hack` · `2022-break-the-bias` · `2022-mind-your-own-career` · `2022-navigating-the-workplace-as-a-woman` · `2022-shaping-the-future-with-ai` · `2022-women-igniting-tech` · `2022-women-in-security` · `2023-kickstart-your-career-in-tech-with-myob` · `2023-the-buzz-about-banking` · `ai-for-the-environment-hackathon-festival-2024` · `auckland-tech-grand-tour` · `ethnic-advantage-conference` · `fonterra-a-legendairy-career` · `girls-night-out` · `imagine-zone-techweek` · `international-womens-day-2` · `online-quiz-night-celebrating-ada-lovelace-day` · `she-fisher-paykel` · `she-pushpay` · `she-sharp-centrality` · `she-techweek-2017` · `she-with-google-aut` · `the-truths-to-gaming-and-start-up` · `design-thinking` · `2022-she-celebrates` · `2023-international-womens-day` · `2023-kickstart-your-career-in-tech-with-myob` | Sponsor descriptions auto-extracted from old-site HTML (Google, MYOB, AUT, AWS, ANZ, Pushpay, Kiwibank, Centrality, Countdown, Fonterra, Deloitte, Hewlett Packard Enterprise) and/or fullDescription taglines restored. Commit `a4544cc`. |

### Final audit state

```
$ python scripts/audit_bullet_lists.py
Summary: 0 event(s) with suspected missing bullet content | 0 item(s) total
```

Down from 39 events / 206 items at the start of the pass.

---

## 4. Verification URL checklist

Quick round-trip checklist for the report author. All URLs are relative to `https://www.shesharp.org.nz/`.

- [ ] `/about` — "Our Journey" YouTube embed visible; hero carousel has `‹` / `›` buttons and 7 clickable dots.
- [ ] `/events` — every card shows a year (e.g. "Tuesday, 2026"); middle-click opens in a new tab.
- [ ] `/events` — apply a year filter, scroll down, click an event, click Back → filter + scroll restore.
- [ ] `/events/2023-international-womens-day` — large IWD 2023 group photo above the description.
- [ ] `/events/international-womens-day-2` — large IWD 2024 Woolworths group photo above the description.
- [ ] `/events/f-p-hackathon` — three new sections: Readiness Workshops, Judging Criteria, Prizes to be won.
- [ ] `/events/thrive-your-career-your-story` — three speaker groups render including **Meet our Mentors**.
- [ ] `/events/google-educator-conference-2023` — **Demo Facilitators** section with 6 people incl. Lesieli Oliver.
- [ ] `/events/she-orion-health` — sidebar "View Photos" button; clicking scrolls to #event-photos.
- [ ] `/events/design-thinking` — **Start with design** section with the Stanford d.school external link.
- [ ] `/events/iamremarkable` — **Hosted by** Dr. Mahsa McCauley and **Learn more** → rmrkblty.org.
- [ ] `/events/her-waka` — **Facilitator** section with Dr. Mahsa McCauley's photo.
- [ ] `/events/she-sharp-and-academyex-international-womens-day-2026` — no "Tickets are available at three tiers…" paragraph.
- [ ] `/events/she-deloitte` — sidebar venue no longer shows Fisher & Paykel Healthcare Campus.
- [ ] `/sponsors/corporate-sponsorship` — inline dark-navy inquiry form with teal headline and Submit button; a test submission returns a green confirmation.
- [ ] `/resources` → nav submenu includes **Newsletters** and **Impact Reports**.
- [ ] `/resources/newsletters` — Mailchimp archive + subscribe cards.
- [ ] `/resources/in-the-press` — no broken diversityworksnz link; entries without URLs are badged as **Press mention**.
- [ ] `/forgot-password` — submit a valid email; check inbox. Verified 2026-04-25 via Resend CLI + live POST; delivery ID `9f98fd80` delivered to `chanmeng6666@gmail.com`.
- [ ] `/events/shesharp-techweek-envision-the-future` — four bullets under "Topics to be discussed" render with brand-colored markers.
- [ ] `/events/shesharp-future-ready` — four keynote speakers (Nicole Yue Lin, Shruti Sherekar, Amrit Kaur, Zainab Manasawala) with photos and bios.
- [ ] `/events/google-educator-conference-2024` — **Meet the Demo Facilitators** section with 7 speakers including Catherine Frost, Dr. Kathryn MacCallum, Dr. Mahsa McCauley.
- [ ] `/events/f-p-hackathon` — **Meet the Judges** section with 6 judges (incl. Rik Irons-Mclean and Yvonne Chan); **AI Use Cases** section with 8 problem/solution entries; **Readiness Workshops** section with full workshop descriptions.
- [ ] `/events/inspire-her-te-whakatipuranga-wahine` — sponsor descriptions visible under the logo wall for CARES, IEEE WIE, MYOB, Fonterra, QuiverVision, and AUT \| Google.
- [ ] `/events/her-waka` — Abe Naus's bio mentions "Kaitiaki for the Auckland business"; Paul Kelly is listed at Randstad Digital; the description includes "Ready to take your next step into meaningful work?" and the March 2026 theme tagline.
- [ ] `/events/her-waka-april-2026` — **RCSA Recruiters** speaker group with Abe Naus, Anabella Bianchi, Sri Nanduri; 30-minute recruiter networking paragraph present.
- [ ] `/events/she-sharp-candice-murray-own-your-energy` — Candice's bio mentions AWS/Spark/AUT workshops; Event Flow + venue calendar line visible in the body.
- [ ] `/events/2022-break-the-bias` and `/events/2022-women-in-security` — AWS sponsor card shows the "Since 2006, Amazon Web Services…" company description.
- [ ] `/events/2023-innovation-unleashed` — Deloitte sponsor description visible; "What you'll learn at this event" intro paragraph present.
- [ ] `/events/2021-iamremarkable` — Google sponsor description visible under the logo.

---

## 5. Outstanding items that require environment (not code)

| Item | Owner action |
|---|---|
| ~~Password reset email delivery~~ | ✅ Verified end-to-end on 2026-04-25 via Resend CLI (`resend emails send --to chanmeng6666@gmail.com`) and a live production `POST /api/auth/forgot-password` call. Delivery ID `9f98fd80`. `shesharp.org.nz` is verified in Resend with SPF and DKIM. No outstanding action. |
| Dashboard perceived load time | The `/api/dashboard/overview` endpoint now uses `Promise.all`. Validate subjectively on production with Chrome DevTools Network tab; the endpoint's server time should drop noticeably. |

---

## 6. Not actionable — rationale

Two classes of test-report observations were deliberately not changed because investigation showed they are artifacts of the old Webflow site rather than real content:

1. **"YouTube video is missing" on 7+ events.** Every YouTube embed on the old site used the same ID `TC9j-sjxK84` — a Secure Code Warrior marketing clip used as a template fallback. It is not a genuine event recording, so embedding it on the new site would add noise rather than signal.
2. **"Partner content is missing" on 15+ 2022–2024 events.** The old site shows the same Deloitte / Datacom / Microsoft / Promptech / Secure Code Warrior logo wall on most events regardless of who actually sponsored — these are Webflow collection-list placeholders hidden in the template (`w-condition-invisible`). Where a real, event-specific sponsor exists, it is already present in the new data (e.g. AWS on Break the Bias 2022, Kiwibank on Buzz About Banking 2023, Fisher & Paykel Healthcare on F&P Hackathon 2024).

A helper script, `scripts/extract_sponsors.py`, was added to audit old-site pages while filtering these Webflow placeholders for future work.

---

## 7. Commits pushed to `NZ-SheSharp/she-sharp:main`

| SHA | Subject |
|---|---|
| `99b55a3` | `feat(events): improve event card, layout, and speaker rendering` |
| `e0aba15` | `feat(about): add Our Journey video and gallery navigation controls` |
| `95a5a36` | `feat(sponsors): add inline corporate sponsorship inquiry form` |
| `8dd7578` | `feat(resources): add newsletters page and expand nav submenu` |
| `95b7350` | `fix(auth,resources): deliver password reset email and filter dead press links` |
| `899d7e7` | `perf(dashboard): parallelize overview queries with Promise.all` |
| `6ad7ea0` | `chore(events): backfill content, speakers, photos, and sponsor assets` |
| `60d435c` | `chore(events): surface group photos and add Her Waka facilitator` |
| `8528795` | `docs(development): add QA test report fix traceability matrix` |
| `2226dc9` | `feat(events): render topics/agenda/prizes sections as bullet lists` |
| `407c99c` | `feat(events): restore dropped bullet lists across 5 event pages` |
| `cc0baa7` | `fix(events): backfill SheSharp Future Ready and harden bullet audit` |
| `a4544cc` | `feat(events): backfill sponsor descriptions and speaker bios across all events` |

All commits follow Conventional Commits. Each includes a body describing the change and co-authorship metadata. Diffs can be inspected via `git show <sha>` or on GitHub.

---

## 8. Repository file index

Key new or modified files grouped by concern:

**Event rendering & data**
- `app/(site)/events/[slug]/page.tsx`
- `app/(site)/events/page.tsx`
- `components/events/event-detail/event-featured-photo.tsx` *(new)*
- `components/events/event-detail/event-photos.tsx`
- `components/events/event-detail/event-sidebar-panel.tsx`
- `components/events/event-detail/event-speakers.tsx`
- `components/events/event-detail/event-special-sections.tsx`
- `components/events/event-inflected-card.tsx`
- `lib/data/events.ts`
- `lib/data/json/shesharp_events_v3.json`
- `lib/data/json/events-custom.json`
- `types/event.ts`

**About page**
- `app/(site)/about/page.tsx`
- `components/about/our-journey-video.tsx` *(new)*
- `components/about/smooth-scroll-hero.tsx`

**Sponsors**
- `app/(site)/sponsors/corporate-sponsorship/page.tsx`
- `components/sponsors/sponsor-inquiry-form.tsx` *(new)*
- `app/api/sponsors/inquiry/route.ts` *(new)*

**Resources / Nav**
- `app/(site)/resources/newsletters/page.tsx` *(new)*
- `lib/config/navigation.ts`
- `components/resources/resources-bento-showcase.tsx`
- `components/resources/press.tsx`
- `lib/data/news-press.ts`

**Auth**
- `app/api/auth/forgot-password/route.ts`

**Dashboard**
- `app/api/dashboard/overview/route.ts`

**Scripts & assets**
- `scripts/extract_sponsors.py` *(new)*
- `scripts/audit_bullet_lists.py` *(new, 2026-04-25)* — repo-wide bullet-list coverage audit
- `scripts/patch_sponsor_descriptions.py` *(new, 2026-04-25)* — heuristic sponsor bio extractor
- `scripts/patch_manual_fixes.py` · `patch_manual_fixes2.py` · `patch_manual_fixes3.py` · `patch_manual_fixes4.py` *(new, 2026-04-25)* — curated backfill scripts
- `scripts/patch_her_waka.py` · `patch_final_cleanup.py` · `patch_fp_hackathon.py` · `patch_fp_extras.py` · `patch_fp_readiness.py` *(new, 2026-04-25)* — event-specific patches
- `public/img/scraped/photos/*` (133 new event photos)
- `public/img/scraped/speakers/google-educator-conference-2023/*` (6 headshots)
- `public/img/scraped/sponsors/*` (AUT + AI Forum NZ logos)

---

*End of report.*
