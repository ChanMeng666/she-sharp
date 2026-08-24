// Page 24 — who was in the room.
//
// A NEW PAGE, added 2026-08-24, closing the community-and-partners chapter
// rather than opening the context chapter. Everything on it is a different cut
// of two exports the report already cites — the Humanitix account export and
// the Mailchimp audience export, both taken 2026-08-17 — so the page makes no
// new claim. It states the composition behind figures the glance spread already
// gives as totals.
//
// Three things it does deliberately:
//
//  · THE SEGMENT COLUMN ADDS UP. The nine ticket types sum to exactly 468,
//    which is the headline `registered` figure to the ticket. That is the point
//    of printing them and the note says so — PITFALLS.md, "a reader who adds a
//    column and finds it short stops trusting the whole document". The one
//    breakdown in this report that reconciles to its own total is worth the
//    space.
//
//  · IT PUBLISHES THE NEWSLETTER DECLINE. The list shrank by 132 contacts in
//    the half-year and the page says so in the tile, not in a footnote. The
//    framing is accurate rather than defensive: 67 of the 158 departures were
//    mailboxes Mailchimp removed after a hard bounce, which is list hygiene and
//    not people rejecting the organisation — but 91 people did choose to leave,
//    and against 26 who joined the list is smaller than it was. No excuse is
//    offered that the data does not evidence.
//
//  · IT PUBLISHES NO GEOGRAPHY. 649 of the 1,560 subscribed contacts — 42% —
//    carry no country at all, so every location figure would need that caveat
//    ahead of it and none is worth the sentence. There is no map on this page
//    and there should not be one.

#import "../theme/theme.typ": *
#import "../lib/layout.typ": sheet
#import "../lib/components.typ": chart-card, source-note, stat-card, eyebrow
#import "../lib/charts.typ": bar-h, stat-wall
#import "../lib/metrics.typ": num, commas, pct
#import "../data/report-data.typ": D

// Signed integer formatter, for the net movement tile. `commas()` already
// carries the minus sign; this only adds the plus, so a reader sees a
// DIRECTION on every one of the four flow tiles rather than having to infer it
// from the label. Without it "132" under "Net change" reads as growth.
#let _signed(v) = if v > 0 { "+" + commas(v) } else { commas(v) }

// Total departures, COMPUTED from the two published components rather than
// stored in data/. It is a sum of two verified metrics that are both printed
// three lines away, so it is not a new claim and it cannot drift from them —
// storing it would put a number in the data file whose only guarantee is that
// it equals the addition of two others. `src` is needed by `num()`; the walker
// never sees this, because it walks `D`.
// The share of places that were never on open sale. Partner-guest and ambassador
// are the two segments that are WHOLLY that by their own notes — a partner
// allocating to its own people, and the volunteer network's own places — so the
// sum is exact rather than a judgement about where to draw the line.
//
// It deliberately does NOT include the general-guest segment. Only a third of
// that segment is somebody's plus-one; the rest are independent bookings, and
// folding all 84 in would turn a true 35% into a "majority" the data does not
// support. Read the note on `General guest` before widening this.
// Looked up BY LABEL, never by index. The segments are ordered largest-first in
// the data file, and an index would silently start computing something else the
// day a value changes and the sort moves. A label that no longer exists fails
// the build outright, which is the behaviour worth having here.
#let _seg(name) = D.reach.ticket-segments.find(r => r.label == name).metric

#let _allocated-share = (
  value: (_seg("Partner guest").value + _seg("Ambassador").value)
    / D.reach.ticket-segments-total.value * 100,
  src: "verified",
  note: "Partner-guest plus ambassador places over D.reach.ticket-segments-total.",
)

#let _departures = (
  value: D.community.newsletter-unsubscribed.value
    + D.community.newsletter-bounced.value,
  src: "verified",
  note: "D.community.newsletter-unsubscribed plus D.community.newsletter-bounced.",
)

#let who-was-in-the-room-page() = sheet(title: "Who was in the room")[

  #block(above: 0pt, below: gap-section, width: 100%)[
    #set par(leading: lead-lede, justify: true)
    #text(font: body-font, size: size-lede, weight: 500, fill: ink-700)[
      Every place taken at a She Sharp event in the half-year was booked under
      one of nine ticket types. They are the closest thing the organisation has
      to a description of its own audience, and unlike a survey they are a record
      of what people actually did. #pct(_allocated-share) of those places were
      never on open sale: a host partner allocated them to its own people, or
      they were held by She Sharp's own ambassador network.
    ]
  ]

  #chart-card(
    "Every place taken, by ticket type",
    bar-h(
      D.reach.ticket-segments,
      max: none,
      label-width: 36mm,
      fmt: commas,
    ),
    // THE LABELS ARE HUMANITIX'S TICKET-TYPE NAMES, and three of them mislead a
    // reader who takes them at face value. The caption has to carry that or the
    // chart quietly says four things that are not true. Every correction below
    // is in the metric's own note in data/report-data.typ; read those before
    // touching this text, and do not describe a segment from its name.
    //
    // The "Youth" line is the one that matters most. This report states 50
    // rangatahi elsewhere; a five-ticket bar labelled "Youth" is the single
    // figure on this page a reader can independently check against another page,
    // and they must find the explanation here rather than a contradiction.
    note: [The nine segments sum to #num(D.reach.ticket-segments-total), which is
      the registration figure on the glance spread to the ticket: every place
      falls in exactly one segment and none is unclassified. The labels are the
      booking platform's own ticket-type names, and three read differently from
      how they look. #text(weight: 600)[Student] does not mean university: a
      little over half of it is tertiary students at the three evening events and
      the rest is primary-school children at Fruitvale Primary.
      #text(weight: 600)[Ambassador] mixes the volunteer network's places at the
      evening events with helper places at the two school workshops.
      #text(weight: 600)[Programme session] is HER WAKA cohort tickets and
      nothing else. And #text(weight: 600)[Youth] is a single ticket type at the
      20 June workshop — not the Youth Tech headcount: the
      #num(D.programme.youth.rangatahi) places across the two Saturdays are
      spread across the student, ambassador and youth rows above. Ticket type is
      chosen by the person booking and is never verified.],
  )

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      stat-card(D.reach.seats-filled-rate, "Seats offered that were filled",
        fmt: v => str(int(calc.round(v))) + "%", height: 21mm),
      stat-card(D.headline.companies, "Distinct employers represented",
        height: 21mm),
    )
  ]

  #block(above: 0pt, below: gap-section, width: 100%)[
    #source-note[
      #num(D.headline.registered) places of the #num(D.finance.seats-offered)
      offered, and one event sold beyond its stated capacity. Employers are what
      attendees typed into the Company or Organisation field at checkout,
      normalised so one organisation spelled three ways counts once — never
      verified against the organisation named.
    ]
  ]

  // ── The standing audience ─────────────────────────────────────────────────
  #block(above: 0pt, below: gap-line, width: 100%)[
    #eyebrow("The standing audience", fill: brand)
  ]

  #block(above: 0pt, below: gap-block, width: 100%)[
    #grid(
      columns: (1fr, 1fr),
      column-gutter: gutter-card,
      stat-card(D.community.newsletter-subscribers, "Contacts who may be emailed",
        fmt: commas, height: 21mm),
      stat-card(D.community.newsletter-net, "Net change over the half-year",
        fmt: _signed, fill: peri-pale, height: 21mm),
    )
  ]

  // THREE TILES, NOT FOUR. `newsletter-issues` was the fourth and is gone from
  // this row: it counts output rather than audience, it is a FLOOR rather than a
  // count (a campaign nobody left and nobody bounced on is invisible in the
  // export), and carrying it here cost two lines of caveat in the note below to
  // explain a number the page was not arguing anything with. What is left is
  // exactly the decomposition of the net figure above it — 26 less 91 less 67.
  #block(above: 0pt, below: gap-block, width: 100%)[
    #stat-wall((
      (metric: D.community.newsletter-joined, label: "Joined"),
      (metric: D.community.newsletter-unsubscribed, label: "Unsubscribed"),
      (metric: D.community.newsletter-bounced, label: "Undeliverable"),
    ), cols: 3, height: 21mm)
  ]

  // The decline, said plainly. This note is the reason the flow tiles are on the
  // page at all: -132 on its own invites the wrong reading in either direction.
  #source-note[
    The mailing list is smaller than it was at the start of the year.
    #num(D.community.newsletter-bounced) of the #num(_departures) departures were
    mailboxes Mailchimp removed after a hard bounce — addresses that no longer
    exist, which is list hygiene rather than a verdict on the organisation — but
    #num(D.community.newsletter-unsubscribed) people chose to leave against
    #num(D.community.newsletter-joined) who joined, and the list did shrink.
    Counts are read at the export date, 17 August 2026, not at 30 June: Mailchimp
    exports a snapshot of the present. No geography is published, here or
    anywhere in this report — a large minority of subscribed contacts carry no
    country at all.
  ]
]
