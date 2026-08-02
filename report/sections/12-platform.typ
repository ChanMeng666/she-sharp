// Page 21 — the mentorship platform.
//
// This is the page with the BEST provenance in the report and the WEAKEST story,
// and the layout has to hold both of those at once.
//
// Best provenance: every figure here was read out of the live member-platform
// database, not a spreadsheet. Weakest story: `mentorship_relationships` and
// `meetings` are empty tables, and intake was paused on 19 June. A funder who
// discovers that themselves has caught us; a funder who reads it here has been
// told. So the pause is stated in the body copy, not buried in a source note.
//
// NOT A FUNNEL — deliberately. The obvious stage sequence (37 accounts -> 33
// profiles -> 9 pairs -> 21 meetings) is NON-MONOTONIC, and `funnel()` keeps its
// geometry truthful rather than clamping, so it would draw an hourglass. Worse,
// a funnel shape ASSERTS a conversion story, and two of those stages are
// placeholders standing in for empty tables. Horizontal bars state the same
// numbers and claim nothing about flow between them.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": stat-card, chart-card, source-note
#import "../lib/charts.typ": bar-h
#import "../data/report-data.typ": D
#import "../data/copy.typ": platform-narrative

#let platform-page() = sheet(title: "The member platform")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700, platform-narrative)
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #grid(
      columns: (1fr, 1fr, 1fr),
      column-gutter: gutter-card,
      stat-card(D.platform.users-h1, "Accounts created"),
      stat-card(D.platform.mentor-roles, "Active mentors"),
      stat-card(D.platform.mentee-roles, "Active mentees"),
    )
  ]

  // "At 1 August", not "at 30 June". Two of the four bars — mentor and mentee
  // profiles — are whole-table counts read on 1 August, as is the active-roles
  // pair in the tiles above. Only "accounts created" is scoped to the half-year.
  // One row of figures, three different scopes, and the heading was quietly
  // asserting a single one.
  #chart-card(
    "On the platform at 1 August 2026",
    bar-h(
      (
        ("Accounts created", D.platform.users-h1),
        ("Mentor profiles", D.platform.mentor-profiles),
        ("Mentee profiles", D.platform.mentee-profiles),
        ("Mentees waiting to be matched", D.platform.waiting-queue),
      ),
      max: 40,
    ),
    note: [Counts of records in the live database, not a conversion sequence — a
      mentor profile and a mentee profile are different populations and do not
      flow into one another. Accounts created is scoped to 1 January – 30 June;
      the profile and waiting-queue counts are whole-table figures read on
      1 August 2026.],
  )

  #source-note[
    // The previous wording claimed these were "the same group at three stages"
    // and that "the gaps are people who have not finished signing up". Neither
    // is established. 26 counts records CREATED IN H1; 24 and 23 are whole-table
    // counts at 1 August, scoped to neither the half-year nor to those 26 — and
    // two accounts predate the period. A non-activated record is equally an
    // expired invitation code (the batch import issued 25 with a seven-day
    // expiry and recorded no redemptions), a decline, or a duplicate. Recasting
    // a drop-off as an administrative lag is the flattering reading, and the
    // data does not support choosing it.
    *Why the mentor count differs by page.* Twenty-six mentor records were
    created during the half-year — that is the figure quoted at the front of this
    report. As at 1 August, twenty-four accounts hold an active mentor role and
    twenty-three have completed a profile. The platform does not record why the
    remainder have not activated.

    Read directly from the member-platform database on 1 August 2026. Mentorship
    matching had not begun before the half-year closed, so no pairs and no
    meetings are recorded against this period; both are reported as nil rather
    than estimated. Applications were paused on 19 June 2026. That pause is
    documented and fully reversible — the forms still exist and the runbook for
    reopening them is four steps long — but the record of the decision does not
    state a reason, and this report does not supply one.
  ]
]
