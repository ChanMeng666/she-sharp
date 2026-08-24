// Page 9 — the mentorship programme's first cycle.
//
// The only page here about something that did not happen. It is included
// because the outward figures for this programme are the largest gap between
// claim and record anywhere in the organisation, and because the pause is
// reversible: this is a decision page, not an obituary.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, reading, finding
#import "/report-internal/lib/charts.typ": columns

#let D = json("/report-internal/data/record.json")

#let mentorship() = sheet(title: "The mentorship cycle")[
  #let m = D.mentorship

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      The 2026 cycle onboarded #str(m.mentorsOnboarded) mentors and took
      #str(m.menteeSubmissions) mentee applications. It produced
      #text(weight: 600)[#str(m.pairings) pairings and #str(m.meetings) recorded
      meetings.] Intake was paused on #m.intakePaused with
      #str(m.waitingQueue) mentees still in the queue.
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      (
        ("Mentors onboarded", m.mentorsOnboarded),
        ("Mentor profiles", m.mentorProfiles),
        ("Mentee applications", m.menteeSubmissions),
        ("Waiting to match", m.waitingQueue),
        ("Pairings", m.pairings),
        ("Meetings", m.meetings),
      ),
      hue: indigo,
      gutter: 2mm,
    )
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      Not a funnel, and drawn as separate columns for that reason: mentors and
      mentees are different populations and the sequence does not flow from one
      into the next. #m.note
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #box(
      width: 100%, fill: peri-pale, radius: radius-card,
      stroke: (left: 2.5pt + indigo),
      inset: (x: 5mm, y: 4.5mm),
      {
        block(above: 0pt, below: gap-line, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: indigo, upper("Why the zero is a fact and not a gap"),
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: lead-body)
          text(font: body-font, size: size-meta, fill: ink-700)[
            Two independent sources agree on it. The `mentorship_relationships`
            and `meetings` tables in the platform database are empty, and the
            programme's own weekly digest — an automated post, not a person's
            recollection — reported zero active pairings every week through to
            the last one before the pause. Nothing was matched and then lost.
          ]
        })
      },
    )
  ]

  #reading[
    Ten people applied to be mentored, were approved, and have not been matched.
    They are the most concrete unmet commitment in this report, and unlike most
    things here it is fixable by a decision rather than by new measurement.
  ]
]
