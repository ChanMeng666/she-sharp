// Page 12 — the questions this record raises, and nothing else.
//
// Deliberately questions and not recommendations. This document's authority
// comes from being counted rather than argued, and a page of advice at the end
// would invite the reader to discount the pages before it. Each question names
// the finding it comes from so it can be traced back.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, reading

#let D = json("/report-internal/data/record.json")
#let _pct(a, b) = str(calc.round(100 * a / b)) + "%"

#let _q(n, question, from) = block(
  above: 0pt, below: gap-block, width: 100%, breakable: false,
  grid(
    columns: (10mm, 1fr),
    column-gutter: 4mm,
    align: (right + top, left + top),
    text(font: display, size: 20pt, weight: display-weight,
      stretch: display-stretch, fill: peri, n),
    {
      block(above: 0pt, below: 1.6mm, width: 100%, {
        set par(leading: lead-body)
        text(font: body-font, size: size-meta, weight: 500, fill: ink, question)
      })
      block(above: 0pt, below: 0pt, width: 100%, {
        set par(leading: 0.62em)
        text(font: body-font, size: size-source, fill: ink-500, from)
      })
    },
  ),
)

#let questions() = sheet(title: "What this leaves us to decide")[
  #let once = D.people.repeatDistribution.find(b => b.instances == 1).people
  #let now = D.list.byYear.last()
  #let filed = D.finance.filed

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      Six questions the record puts to the team. None of them is answered here,
      and none of them can be answered by more data — each needs a decision.
    ]
  ]

  #_q("01",
    [Is a first event meant to lead to a second? #_pct(once, D.people.unique) of
     everyone we have ever reached came once. If that is by design, the reach
     figures are the right ones to publish. If it is not, nothing in the
     organisation is currently set up to change it.],
    [From: who comes back.])

  #_q("02",
    [What happens to the ten people waiting to be mentored? They applied, were
     approved, and intake closed. This is the one finding in the report that a
     single decision resolves.],
    [From: the mentorship cycle.])

  #_q("03",
    [Do we want to keep the mentorship figures on the website? They are the
     largest gap between what we publish and what we hold, and they sit on the
     page that invites people to apply.],
    [From: claim against record.])

  #_q("04",
    [Was 2024 the peak, or was 2025 the anomaly? Registrations and filed income
     both roughly halved in the same year. The record shows the coincidence and
     cannot explain it; the people who ran both years can.],
    [From: reach, and the money as filed.])

  #_q("05",
    [What is the surplus for? Six filed years, six surpluses,
     #str(calc.round((filed.fold(0, (a, f) => a + f.income) - filed.fold(0, (a, f) => a + f.expenditure)) / 1000))k
     cumulative. Reserves are a legitimate choice; not having made the choice
     deliberately is a different thing.],
    [From: the money as filed.])

  #_q("06",
    [Who owns measurement? Four of the eight absences on the previous page are
     decisions nobody has taken, and they will still be open next year unless
     somebody is named.],
    [From: what nothing measures.])

  #reading[
    Regenerate this document with `npx tsx scripts/internal-report/build-record.ts`
    followed by `pwsh report-internal/build.ps1`. It takes about a minute and
    every figure in it moves to the latest export.
  ]
]
