// =============================================================================
// She Sharp — 2026 Half-Year Report
// =============================================================================
//
// The entry document. It does three things and nothing else: applies the
// document-level setup, runs the provenance gate, and calls each section in
// page order.
//
// EVERY section is a scoped `#page()` call, so this list IS the page map — the
// page count is structural, not emergent (RULE 5 in report/PITFALLS.md). The one
// deliberate exception is the founder's letter, which flows across pages 3–4;
// its own header comment explains why.
//
// Build:  pwsh report\build.ps1 [-Png] [-Final]
// =============================================================================

#import "lib/layout.typ": report-setup
#import "lib/metrics.typ": assert-final-clean
#import "data/report-data.typ": D, report-title, org-name
#import "data/events.typ": event-by-slug
#import "data/sources.typ": sector-all-metrics

#import "sections/01-cover.typ": cover
#import "sections/02-contents.typ": contents
#import "sections/03-founder-letter.typ": founder-letter-pages
#import "sections/05-glance.typ": glance
#import "sections/06-team.typ": team-page
#import "sections/07-chapter-her-waka.typ": chapter-her-waka-page
#import "sections/08-her-waka.typ": her-waka-shape, her-waka-numbers
#import "sections/09-event-page.typ": event-page
#import "sections/10-chapter-youth.typ": chapter-youth-page
#import "sections/22-youth-series.typ": youth-series-page
#import "sections/11-chapter-community.typ": chapter-community-page
#import "sections/12-platform.typ": platform-page
#import "sections/13-matching.typ": matching-page
#import "sections/14-partners.typ": partners-page
#import "sections/15-voices.typ": voices-page
#import "sections/23-who-was-in-the-room.typ": who-was-in-the-room-page
#import "sections/16-sector.typ": sector-page
#import "sections/17-outlook.typ": outlook-page
#import "sections/18-whats-next.typ": whats-next-page
#import "sections/19-thanks.typ": thanks-page
#import "sections/20-methodology.typ": methodology-page
#import "sections/21-back-cover.typ": back-cover-page

// PDF metadata. `keywords` deliberately omits the marketing claims.
#set document(
  title: org-name + " — " + report-title,
  author: org-name,
  keywords: ("She Sharp", "impact report", "women in STEM", "New Zealand", "HER WAKA"),
)

// The provenance gate. In a FINAL build this panics, naming every metric still
// marked placeholder / estimate / projected. Bound to `_` because it returns the
// stale list — calling it bare would render that array onto page 1.
#let _ = assert-final-clean(D)

// The sector metrics live OUTSIDE `D`, so the walk above never reaches them.
// Everything in there is verified today, but `data/sources.typ` flags the hole
// itself: a future non-verified addition would sail straight through a FINAL
// build. One line closes it.
#let _ = assert-final-clean(sector-all-metrics)

#show: report-setup

// ── 1 ───────────────────────────────────────────────────────────────────────
#cover()
// ── 2 ───────────────────────────────────────────────────────────────────────
#contents()
// ── 3–4 ─────────────────────────────────────────────────────────────────
#founder-letter-pages()
// ── 5 ───────────────────────────────────────────────────────────────────────
#glance()
// ── 6 ───────────────────────────────────────────────────────────────────────
#team-page()
// ── 7 ───────────────────────────────────────────────────────────────────────
#chapter-her-waka-page()
// ── 8–9 ─────────────────────────────────────────────────────────────────
#her-waka-shape()
#her-waka-numbers()
// ── 10–13 · the four HER WAKA cohorts ───────────────────────────────────────
#event-page(event-by-slug("her-waka"))
#event-page(event-by-slug("her-waka-april-2026"))
#event-page(event-by-slug("her-waka-may-2026"))
#event-page(event-by-slug("her-waka-june-2026"))
// ── 14 ──────────────────────────────────────────────────────────────────────
#chapter-youth-page()
// ── 15 · both school workshops on ONE page ───────────────────────────────
// Deliberately not two `event-page()` calls — see the header of
// sections/22-youth-series.typ for why the shared template was the wrong fit
// for these two sessions specifically.
#youth-series-page()
// ── 16 ──────────────────────────────────────────────────────────────────────
#chapter-community-page()
// ── 17–19 · the three partner-hosted evenings ───────────────────────────
#event-page(event-by-slug("she-sharp-and-academyex-international-womens-day-2026"))
#event-page(event-by-slug("she-sharp-candice-murray-own-your-energy"))
#event-page(event-by-slug("making-linkedin-work-for-you-with-stuart-little"))
// ── 20 ──────────────────────────────────────────────────────────────────────
#platform-page()
// ── 21 ──────────────────────────────────────────────────────────────────────
#matching-page()
// ── 22 ──────────────────────────────────────────────────────────────────────
#partners-page()
// ── 23 ──────────────────────────────────────────────────────────────────────
#voices-page()
// ── 24 · closes the community chapter, does not open the next ──────────
#who-was-in-the-room-page()
// ── 25 ──────────────────────────────────────────────────────────────────────
#sector-page()
// ── 26 ──────────────────────────────────────────────────────────────────────
#outlook-page()
// ── 27 ──────────────────────────────────────────────────────────────────────
#whats-next-page()
// ── 28 ──────────────────────────────────────────────────────────────────────
#thanks-page()
// ── 29–30 · methodology runs to two sheets ──────────────────────────────
#methodology-page()
// ── 31 ──────────────────────────────────────────────────────────────────────
#back-cover-page()
