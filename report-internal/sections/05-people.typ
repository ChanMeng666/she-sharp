// Page 5 — how many of them come back.
//
// This is the page the organisation has never had. Every outward figure She
// Sharp publishes is a reach number — people met, seats filled, contacts held —
// and none of them distinguishes a community from a turnstile. The distribution
// below is the distinction, and it is not flattering.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, chart-lede, reading, finding
#import "/report-internal/lib/charts.typ": columns-stacked, columns, key

#let D = json("/report-internal/data/record.json")
#let _pct(a, b) = str(calc.round(100 * a / b)) + "%"

#let people() = sheet(title: "Who comes back")[
  #let years = D.events.byYear.filter(y => y.year >= 2021)
  #let dist = D.people.repeatDistribution
  #let once = dist.find(b => b.instances == 1).people
  #let twice-plus = D.people.unique - once
  #let five-plus = dist.filter(b => b.instances >= 5).fold(0, (a, b) => a + b.people)

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      #str(D.people.unique) distinct people have registered for a She Sharp
      event since 2020. #text(weight: 600)[#str(once) of them — #_pct(once, D.people.unique)
      — did it once and never again.] #str(twice-plus) have come back at least
      once, and #str(five-plus) have registered for five events or more. The
      most frequent single person has registered for #str(D.people.maxInstancesPerPerson).
    ]
  ]

  #chart-lede[
    Each year's distinct people, split by whether the record has seen them
    before. 2020 is omitted: it is the first year of the archive, so everyone in
    it is new by construction.
  ]
  #block(above: 0pt, below: gap-line, width: 100%)[
    #columns-stacked(
      years.map(y => (str(y.year), (y.newPeople, y.returningPeople))),
      hues: (brand, peri),
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #key((("First time in the record", brand), ("Been before", peri)))
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      The returning share sits between #_pct(years.sorted(key: y => y.returningPeople / y.people).first().returningPeople, years.sorted(key: y => y.returningPeople / y.people).first().people) and
      #_pct(years.sorted(key: y => y.returningPeople / y.people).last().returningPeople, years.sorted(key: y => y.returningPeople / y.people).last().people)
      in every year since 2021. It is the most stable number in this report, and
      it has not improved as the organisation has grown — each year has been
      largely a new audience. "Returning" here also means returning *in the
      archive*: someone whose first event was in 2018 counts as new the first
      time they appear after 2020, so the true share is a little higher than
      shown and cannot be recovered.
    ]
  ]

  #chart-lede[
    How many events each person has ever registered for. Bars beyond four are
    grouped, because past that the counts are small enough that a single very
    frequent attendee would be identifiable.
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #columns(
      (
        ("1", dist.find(b => b.instances == 1).people),
        ("2", dist.find(b => b.instances == 2).people),
        ("3", dist.find(b => b.instances == 3).people),
        ("4", dist.find(b => b.instances == 4).people),
        ("5–9", dist.filter(b => b.instances >= 5 and b.instances <= 9).fold(0, (a, b) => a + b.people)),
        ("10+", dist.filter(b => b.instances >= 10).fold(0, (a, b) => a + b.people)),
      ),
      hue: brand,
      highlight: "1",
    )
  ]
  #block(above: 0pt, below: gap-block, width: 100%)[
    #reading[
      The shape is the finding: the distribution is not a bell, it is a cliff.
      Nothing in the organisation currently distinguishes the #str(five-plus)
      people on the right from the #str(once) on the left — they receive the
      same emails and see the same pages.
    ]
  ]

  #block(above: 0pt, below: 0pt, width: 100%)[
    #grid(
      columns: (1fr, 1fr), column-gutter: gutter-card,
      finding(
        str(once),
        [people have exactly one registration in seven years of record.],
        caveat: [The single largest group in the archive by a wide margin.],
      ),
      finding(
        str(five-plus),
        [people have registered for five events or more.],
        caveat: [The core the organisation actually retains. Small enough to
          name individually, which no system currently does.],
        hue: indigo,
      ),
    )
  ]
]
