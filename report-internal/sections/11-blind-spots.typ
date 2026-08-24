// Page 11 — what nothing measures.
//
// A list of absences, with the reason each one is absent, because "we don't
// have that number" and "no system was ever asked to produce it" lead to
// completely different fixes. Nothing on this page is a criticism of anyone; it
// is the backlog.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, reading

#let D = json("/report-internal/data/record.json")

#let _gap(title, body, kind) = (
  {
    set par(leading: 0.66em)
    text(font: body-font, size: size-meta, weight: 700, fill: brand, title)
  },
  {
    set par(leading: 0.66em)
    text(font: body-font, size: size-micro, fill: ink-700, body)
  },
  {
    set par(leading: 0.62em)
    text(font: body-font, size: size-source, weight: 600, fill: ink-500, kind)
  },
)

#let blind-spots() = sheet(title: "What nothing measures")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      Everything above is what the systems hold. This is what they do not, and
      why. The right-hand column separates the two kinds of absence: a
      #text(weight: 600)[gap] is data that exists somewhere and has never been
      brought in; a #text(weight: 600)[decision] is a measurement nobody has
      agreed to take, where no amount of exporting will help.
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (36mm, 1fr, 20mm),
      column-gutter: 4mm,
      row-gutter: 8pt,
      .._gap(
        "Income and where it comes from",
        [Roughly ninety per cent of all income — grants, sponsorship, in-kind
         venue and catering — passes through no system this report can read.
         The filed returns give a total and nothing else.],
        "Gap",
      ),
      .._gap(
        "Employment outcomes",
        [HER WAKA is an employment programme and nothing records whether a
         participant got a job. No follow-up exists at any interval.],
        "Decision",
      ),
      .._gap(
        "Participant demographics",
        [Not collected at registration. For a programme funded to reach a
         specific population, this is the largest single omission.],
        "Decision",
      ),
      .._gap(
        "Post-event feedback",
        [No survey ran in 2026. The 2025 report carried satisfaction charts;
         there is no 2026 equivalent and no instrument to produce one.],
        "Decision",
      ),
      .._gap(
        "Volunteer and team hours",
        [A team of #str(D.team.size) people, none of them paid, and no record of
         the time given. It is the organisation's largest real input and it
         appears in no figure anywhere.],
        "Decision",
      ),
      .._gap(
        "Email engagement",
        [Opens and clicks were never exported and the account-level report never
         arrived. Sends are only evidenced indirectly, through the campaign a
         person unsubscribed from.],
        "Gap",
      ),
      .._gap(
        "Attendance before 2020",
        [Six years of events with no ticketing record. Nothing can reconstruct
         who attended them.],
        "Closed",
      ),
      .._gap(
        "Social reach",
        [Quoted in sponsorship material as impressions per event; no export, no
         archive, and no figure in this repository.],
        "Gap",
      ),
    )
  ]

  #reading[
    Four of the eight are decisions rather than gaps, which means they cannot be
    fixed by a better export — someone has to choose what to ask, when to ask
    it, and who records the answer. The two marked Gap are the cheapest: both
    are exports that exist and have not been taken.
  ]
]
