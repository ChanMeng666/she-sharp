// Page 10 — what the website says, against what the registers hold.
//
// The `claimed` column is read out of lib/data/stats.ts at build time, so this
// page cannot drift from what is actually published. Some of the gaps are
// large. One of them turns out not to be a gap at all, which is worth knowing
// before anyone quietly deletes the figure.

#import "/report/theme/theme.typ": *
#import "/report-internal/lib/page.typ": sheet, reading

#let D = json("/report-internal/data/record.json")

#let _num(v) = {
  let s = str(calc.round(v))
  let out = ""
  for (i, c) in s.clusters().enumerate() {
    out += c
    let rest = s.len() - i - 1
    if rest > 0 and calc.rem(rest, 3) == 0 { out += "," }
  }
  out
}

#let claims() = sheet(title: "Claim against record")[
  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(size: size-lede, fill: ink-700)[
      These are the figures on shesharp.org.nz, beside what the organisation's
      own registers hold. The point is not that publishing a rounded number is
      wrong — it is that nobody should learn the size of the gap from somebody
      outside the organisation.
    ]
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (34mm, 22mm, 1fr),
      column-gutter: 4mm,
      row-gutter: 9pt,
      text(font: body-font, size: size-micro, weight: 600, fill: ink, "Published"),
      align(right, text(font: body-font, size: size-micro, weight: 600, fill: ink, "Says")),
      text(font: body-font, size: size-micro, weight: 600, fill: ink, "The registers hold"),
      ..D.claims.map(c => (
        text(font: body-font, size: size-meta, weight: 700, fill: brand, c.claim),
        align(right, text(font: display, size: 14pt, weight: display-weight,
          stretch: display-stretch, fill: ink, _num(c.claimed))),
        {
          set par(leading: 0.66em)
          text(font: body-font, size: size-micro, fill: ink-700)[
            #text(weight: 700, fill: ink)[#_num(c.recorded)] #c.recordedLabel.
            #text(fill: ink-500)[#_num(c.alsoRecorded) #c.alsoRecordedLabel.]
          ]
        },
      )).flatten()
    )
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #box(
      width: 100%, fill: card, radius: radius-card, inset: (x: 5mm, y: 4.5mm),
      {
        block(above: 0pt, below: gap-line, text(
          font: body-font, size: size-micro, weight: 700, tracking: 0.10em,
          fill: ink-500, upper("Three of these behave differently"),
        ))
        block(above: 0pt, below: 0pt, {
          set par(leading: lead-body)
          text(font: body-font, size: size-meta, fill: ink-700)[
            #text(weight: 600)[The events figure is not a claim at all] — it is
            computed from the event register, so it moves when the register
            does and cannot drift. #text(weight: 600)[The members figure is
            defensible if the word is read as reach]: 2,919 people have
            registered for something and the audience database holds 3,689, so
            3,500 sits inside the record rather than outside it. What it is not
            is a count of members in any sense that implies belonging —
            #str(D.list.subscribed) can be emailed, and the platform holds a few
            dozen accounts. #text(weight: 600)[The mentorship figures have
            nothing behind them at all,] and they are the ones on a page inviting
            people to apply.
          ]
        })
      },
    )
  ]

  #reading[
    No recommendation is made here. The purpose of the page is that the team
    decides what to publish knowing all three columns, rather than discovering
    the third one during a funding conversation.
  ]
]
