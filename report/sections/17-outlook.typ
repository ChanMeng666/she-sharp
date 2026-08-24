// Page 26 — funding and resourcing.
//
// ── What this page is, and what it deliberately is not ──────────────────────
// It carried fourteen invented figures until 2026-08-24: total income, total
// expenditure, volunteer hours, and a four-segment stacked bar of expenditure
// categories whose own caption called its proportions "illustrative". A chart
// that has to disown itself in its caption is a fabricated chart with a
// disclaimer stapled on, and this project has already been burned by exactly
// that once (PITFALLS.md, "the other half"). All of it is gone, together with
// the amber "Not yet reconciled" banner that stood at the top explaining it.
//
// What replaces it is narrower and entirely verified, in three movements:
//
//   1. what the half-year earned through the booking platform, and what that
//      figure is — net after Humanitix fees, ticket earnings plus checkout
//      donations, with the $42.80 gap between earned and settled NAMED rather
//      than left for a funder to find on their own;
//   2. the last two financial years actually FILED with Charities Services,
//      both of them, because the register is public and the fall from $102,674
//      to $40,825 is readable there in under a minute. PITFALLS.md: state the
//      comparison your reader already has. No explanation is offered, because
//      none is evidenced anywhere this report can reach;
//   3. what these figures do NOT include — a list with no numbers in it, which
//      is the point. Grant funding, in-kind venue and catering, and unpaid time
//      pass through no system this build can read.
//
// The chart is the real one the placeholder was standing in front of: 402 free
// places against 66 paid. Those 66 tickets are the entire $1,200, and that
// single comparison explains the size of the income figure better than any
// sentence could.
//
// `outlook-copy` from data/copy.typ used to open this page. It is about HER
// WAKA, the Youth Tech Series and mentorship — programme outlook, on a page
// titled "Funding and resourcing" — and has moved to 18-whats-next.typ, which
// is its subject.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, source-note, stat-card, eyebrow, compact-list
#import "../lib/charts.typ": bar-h
#import "../lib/metrics.typ": commas, money, num, pct
#import "../data/report-data.typ": D, charity-number, charity-register-url

// Cents-precise money, for the two figures on this page where rounding would
// destroy the thing the page is disclosing: at `digits: 0` the income prints
// "$1,335", the settlement prints "$1,292", and the $42.80 gap named two lines
// below simply is not there any more. `stat-card` takes a value→string `fmt`,
// so this cannot route through `money()` from metrics.typ, which returns
// content; the arithmetic is the same (integer cents before the split, so 1.999
// carries into the whole part instead of printing "1.100").
#let _cents(v) = {
  let neg = v < 0
  let units = int(calc.round(calc.abs(v) * 100))
  let whole = int(calc.floor(units / 100))
  let frac = str(units - whole * 100)
  while frac.len() < 2 { frac = "0" + frac }
  (if neg { "-" } else { "" }) + "$" + commas(whole) + "." + frac
}

// TWO DERIVED FIGURES, COMPUTED HERE RATHER THAN STORED IN data/.
//
// Both are pure arithmetic over metrics that are already published on this
// page, so neither is a new claim and neither can drift from its inputs — if
// the finance block is ever re-sourced, these follow it in the same edit.
// Storing them would put two numbers in the data file whose only guarantee is
// that they equal a subtraction of two others, which is how a report ends up
// with a column that no longer adds up.
//
// `src: "verified"` is correct and not a shortcut: `num()` needs the key, and
// both inputs are verified. The walker never sees these — it walks `D`.
#let _settlement-gap = (
  value: D.finance.event-income.value - D.finance.payouts-amount.value,
  src: "verified",
  note: "D.finance.event-income less D.finance.payouts-amount.",
)
#let _free-share = (
  value: D.finance.free-places.value
    / (D.finance.free-places.value + D.finance.paid-places.value)
    * 100,
  src: "verified",
  note: "D.finance.free-places as a share of free plus paid places.",
)

// One row of the filed-returns table. Four cells, so the header row and the two
// data rows cannot fall out of step with each other.
#let _filed-head(..cells) = cells.pos().map(c => text(
  font: body-font, size: size-micro, weight: 700, tracking: 0.08em,
  fill: brand, upper(c),
))
#let _filed-row(year, submitted, income, expenditure) = (
  text(font: body-font, size: size-meta, weight: 600, fill: ink, year),
  text(font: body-font, size: size-source, fill: ink-500, submitted),
  text(font: body-font, size: size-meta, weight: 600, fill: ink, income),
  text(font: body-font, size: size-meta, weight: 600, fill: ink, expenditure),
)

#let outlook-page() = sheet(title: "Funding and resourcing")[

  // ── MOVEMENT 1 — what passed through the booking platform ─────────────────
  #block(above: 0pt, below: gap-block, width: 100%)[
    #set par(leading: lead-body, justify: true)
    #text(font: body-font, size: size-body, fill: ink-700)[
      Two systems record She Sharp money in a form this report can cite: the
      booking platform, and the New Zealand Charities Register. Everything below
      comes from one or the other. Grant funding, sponsorship and in-kind support
      pass through neither — so these are not She Sharp's finances, they are the
      slice of them that has a machine-readable record.
    ]
  ]

  // TWO tiles, not three, and the width is the reason. "$1,334.84" is nine
  // glyphs at `size-stat`; in a third-width card it runs straight out of the
  // card's own inset, and `stat-card` clips nothing. At half width it sits
  // comfortably. The order count lives in the note below, where it costs
  // nothing and reads better as prose.
  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      stat-card(D.finance.event-income, "Event income, H1 2026",
        fmt: _cents, height: 25mm),
      stat-card(D.finance.payouts-amount, "Settled to the bank account",
        fmt: _cents, height: 25mm),
    )
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #source-note[
      Event income is #money(D.finance.ticket-earnings, digits: 2) of ticket
      earnings plus #money(D.finance.donation-income, digits: 2) of voluntary
      donations added at checkout, taken across #num(D.finance.orders) completed
      orders. Ticket earnings are #text(weight: 600)[net to She Sharp after
      Humanitix fees] — not gross, and not what attendees paid.
      Humanitix settled #num(D.finance.payouts-settled) payouts to the bank
      account within the period; the #money(_settlement-gap, digits: 2) difference between the
      two figures above is an adjustment on the 15 May event that the payout
      report does not itemise. It is named here rather than left for a reader to
      discover by subtracting one from the other.
    ]
  ]

  // ── The chart the placeholder was standing in front of ────────────────────
  #chart-card(
    "Free places against paid places",
    bar-h(
      (
        ("Free", D.finance.free-places),
        ("Paid", D.finance.paid-places),
      ),
      max: none,
      label-width: 22mm,
    ),
    note: [#pct(_free-share) of the #num(D.headline.registered) places taken in
      the half-year cost the attendee nothing. The
      #num(D.finance.paid-places) paid tickets account for the whole of the
      #money(D.finance.ticket-earnings, digits: 2) of ticket earnings, which is
      why the income figure above is the size it is.],
  )

  // ── MOVEMENT 2 — the last full years actually filed ───────────────────────
  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("The last full years, as filed", fill: brand)
  ]

  #block(above: 0pt, below: gap-block, width: 100%, breakable: false)[
    #box(
      width: 100%, fill: card, radius: radius-card, inset: (x: 5mm, y: 4.5mm),
      grid(
        columns: (auto, 1fr, auto, auto),
        column-gutter: 7mm,
        row-gutter: 5pt,
        align: (left + horizon, left + horizon, right + horizon, right + horizon),
        .._filed-head("Year ended", "Return submitted", "Income", "Expenditure"),
        .._filed-row(
          "31 December 2025", "25 June 2026",
          money(D.finance.filed-income-2025),
          money(D.finance.filed-expenditure-2025),
        ),
        .._filed-row(
          "31 December 2024", "5 February 2025",
          money(D.finance.filed-income-2024),
          money(D.finance.filed-expenditure-2024),
        ),
      ),
    )
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #source-note[
      Both rows are annual returns She Sharp has filed with Charities Services,
      charity #charity-number, readable in full at #charity-register-url. The
      prior year is shown because it sits on the same public page: income fell
      from #money(D.finance.filed-income-2024) to
      #money(D.finance.filed-income-2025). No explanation is offered for that,
      because none is evidenced in anything this report draws on.
      #text(weight: 600)[Neither row is an H1 2026 figure.] The balance date is
      31 December, so this half-year falls inside a financial year that has not
      been filed and will not be until 2027.
    ]
  ]

  // ── MOVEMENT 3 — what none of it includes ─────────────────────────────────
  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("What these figures do not include", fill: ink-500)
  ]

  #block(above: 0pt, below: gap-block, width: 100%, breakable: false)[
    #box(
      width: 100%, fill: peri-pale, radius: radius-card, inset: (x: 5mm, y: 4.5mm),
      compact-list[
        - The Ministry of Social Development funding behind HER WAKA, which does
          not pass through the booking platform.

        - Venue and catering provided in kind by the organisations that hosted
          each event.

        - The unpaid time of a team of #num(D.community.team-size) people.

        - Platform, hosting and tooling costs.
      ],
    )
  ]

  #source-note[
    She Sharp is a registered charitable entity, #charity-number, and files
    annual financial statements with Charities Services; this half-year page is
    management reporting and is not a substitute for them. The half-year accounts
    are not reconciled and no figure above comes from an accounting ledger — the
    platform figures are the Humanitix account export of 17 August 2026, the
    filed figures the public register. She Sharp is not registered for GST. An
    application to the AWS Imagine Grant was submitted on 4 May 2026, and a
    weekly automated scan of six New Zealand government and community funding
    sources went live on 10 May 2026; no grant outcome is claimed, because none
    is recorded.
  ]
]
