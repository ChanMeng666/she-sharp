// =============================================================================
// events.typ — the nine H1 2026 events, in chronological order
// =============================================================================
//
// One record per event. Every number here is a metric dict imported from
// `report-data.typ` — the per-event stat cards read `D.events.<slug>` so that
// the same figure can never disagree with itself between the event page and the
// headline spread.
//
// Editorial fields (`lede`, `speakers`, `venue`) are drawn from the event's own
// record in `lib/data/json/events-custom.json`. The `companies` blocks are read
// from the Humanitix account export of 2026-08-17 — self-reported at checkout
// and never verified against the organisation, which is what each row's note
// says. Nothing in this file is invented.
//
// The photo-key → source-path table is at the BOTTOM of this file. The asset
// agent builds its manifest from that block.
// =============================================================================

#import "report-data.typ": D, v

// -----------------------------------------------------------------------------
// DELETED: the `went-well` and `improve` blocks. Do not re-add them.
//
// Every record used to carry four "what went well" percentages and four "areas
// for improvement" percentages — 72 figures in all — shaped to look like a
// survey response distribution, because the 2025 report charted exactly that on
// every event page. NO POST-EVENT SURVEY RAN IN H1 2026. Nothing will ever
// populate these fields: there is no instrument, no export, and no partial
// dataset waiting to be reconciled.
//
// That makes them fiction with an amber marker on it rather than placeholders.
// A placeholder says "awaiting data"; these were awaiting nothing. The two
// charts that consumed them were removed from sections/09-event-page.typ and
// replaced with the speaker line-up, which is real and comes from each event's
// own record. See the header comment on that block for the fuller reasoning.
//
// The `p()` and `e()` constructors are no longer imported here for the same
// reason: this file now holds no estimated and no percentage values at all.
// -----------------------------------------------------------------------------

#let events = (
  // ===========================================================================
  (
    slug: "she-sharp-and-academyex-international-womens-day-2026",
    title: "She Sharp & academyEX: International Women's Day 2026",
    short-title: "International Women's Day",
    month: "MARCH 2026",
    date: "6 March 2026",
    time: "5:00pm – 7:30pm",
    venue: "academyEX, 99 Khyber Pass Road, Grafton",
    city: "Auckland",
    category: "Community evening",
    partner-logos: ("academyex",),
    photo-keys: (
      "she-sharp-and-academyex-international-womens-day-2026-hero",
      "she-sharp-and-academyex-international-womens-day-2026-2",
      "she-sharp-and-academyex-international-womens-day-2026-3",
    ),
    lede: [
      She Sharp returned to academyEX for International Women's Day, built
      around this year's theme, Give To Gain. The evening was deliberately
      unglamorous in structure — five speakers, honest conversations, and a long
      run of open networking — on the premise that progress grows through
      community rather than announcements. More people were checked in here than
      // The measure is named on purpose. This read "the largest single
      // gathering of the half-year", which the LinkedIn evening's reconciled
      // 106 registrations now outranks — that event drew more bookings, this
      // one drew more people through the door. Both figures are printed in this
      // report, so an unqualified superlative invites a reader to find the
      // other page and disagree with us.
      at any other session in the half-year.
    ],
    speakers: (
      (
        name: "Ana Ivanovic-Tongue",
        role: "Chief Delivery Officer",
        company: "academyEX",
      ),
      (
        name: "Annette Rangi",
        role: "GM, Digital Transformation",
        company: "HEB Construction",
      ),
      (
        name: "Camille Elemia",
        role: "Digital Product Manager",
        company: "NZME",
      ),
      (
        name: "Wyndi Tagi",
        role: "Co-founder",
        company: "WE Mana & The Table",
      ),
      (
        name: "Danubi Paim",
        role: "Founder",
        company: "Property Besties",
      ),
    ),
    stats: (
      (metric: D.events.she-sharp-and-academyex-international-womens-day-2026.registered, label: "Registered attendees"),
      (metric: D.events.she-sharp-and-academyex-international-womens-day-2026.checked-in, label: "Checked-in attendees"),
      (metric: D.events.she-sharp-and-academyex-international-womens-day-2026.returning, label: "Returning attendees"),
      (metric: D.events.she-sharp-and-academyex-international-womens-day-2026.companies, label: "Companies represented"),
    ),
    // 60 organisations across 94 answered rows of 103 registrations.
    // The 12 rows below cover 46 of those — a top-N slice, not a full account.
    companies: (
      ("She Sharp", v(9, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("academyEX", v(8, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Auckland University of Technology", v(8, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("University of Auckland", v(5, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Rototuna High School", v(3, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("2degrees", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Cyma Limited", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Datacom", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("HEB", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Sanford", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Ventana Ventures", v(2, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Adhesion Ltd", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-06--she-sharp-and-academyex-international-women-s-day-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "her-waka",
    title: "HER WAKA — Navigating Pathways into Sustainable Employment",
    short-title: "HER WAKA · Cohort 1",
    month: "MARCH 2026",
    date: "25 March 2026",
    time: "12:00pm – 2:00pm",
    venue: "academyEX, Pikopiko Room, Grafton",
    city: "Auckland",
    category: "Employment programme",
    partner-logos: ("msd", "academyex"),
    photo-keys: ("her-waka-hero", "her-waka-2", "her-waka-3"),
    lede: [
      The first HER WAKA cohort opened the Ministry of Social Development
      programme with the question participants were already asking at home: what
      is artificial intelligence doing to the job I want. A panel of three
      practitioners answered it, a short hands-on session put the tools in
      people's hands, and recruiters from the RCSA closed with what employers
      were actually hiring for in 2026.
    ],
    speakers: (
      (
        name: "Dr. Mahsa McCauley",
        role: "Founder & Chair, She Sharp; Associate Professor",
        company: "AUT",
      ),
      (
        // No employer: the record's `company` is empty and her bio names none
        // either. "She Sharp" was inferred from her ambassador role on the team
        // page — true of her volunteering, but it is not who she was speaking
        // as, and printing it here quietly turns an external practitioner into
        // an internal one.
        name: "Nikita Kumari",
        role: "Product and Project Manager, PMP",
        company: "",
      ),
      (
        name: "Chan Meng",
        role: "Senior AI/ML Infrastructure and Full-Stack Engineer",
        company: "Gavigo / Sanicle",
      ),
      (
        name: "Dr. Meeta Patel",
        role: "Programme Lead, Leading Change for Good",
        company: "academyEX",
      ),
      (
        name: "Abe Naus",
        role: "General Manager",
        company: "Potentia",
      ),
    ),
    stats: (
      (metric: D.events.her-waka.registered, label: "Registered attendees"),
      (metric: D.events.her-waka.checked-in, label: "Checked-in attendees"),
      (metric: D.events.her-waka.returning, label: "Returning attendees"),
      (metric: D.events.her-waka.companies, label: "Companies represented"),
    ),
    // 9 organisations across 27 answered rows of 39 registrations.
    // The 9 rows below cover 27 of those — a top-N slice, not a full account.
    companies: (
      ("Ministry of Social Development", v(17, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(3, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Absolute IT", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("APAC Gold", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Potentia", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Randstad Digital", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("RBS Intellect", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("RCSA", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("StayinFront", v(1, "Humanitix checkout Company/Organisation field, instance 2026-03-25--her-waka — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "her-waka-april-2026",
    title: "HER WAKA (April 2026) — #IAmRemarkable & Vibe Coding",
    short-title: "HER WAKA · Cohort 2",
    month: "APRIL 2026",
    date: "7 April 2026",
    time: "12:00pm – 2:00pm",
    venue: "academyEX, Grafton",
    city: "Auckland",
    category: "Employment programme",
    partner-logos: ("msd", "academyex"),
    photo-keys: (
      "her-waka-april-2026-hero",
      "her-waka-april-2026-2",
      "her-waka-april-2026-3",
    ),
    lede: [
      The second cohort ran the \#IAmRemarkable workshop, a global session that
      asks people to say out loud what they are good at — a skill most
      participants had been trained out of. The second half swapped the
      classroom for three recruiter tables, where small groups practised
      introducing themselves and asking for what they wanted, several minutes at
      a time.
    ],
    speakers: (
      (
        name: "Dr. Mahsa McCauley",
        role: "Founder & Chair, She Sharp; Associate Professor",
        company: "AUT",
      ),
      (
        name: "Chan Meng",
        role: "Senior AI/ML Infrastructure and Full-Stack Engineer",
        company: "Gavigo / Sanicle",
      ),
      (
        name: "Anabella Bianchi",
        role: "Director Consultant",
        company: "Elevate Consulting",
      ),
      (
        name: "Sri Nanduri",
        role: "Senior Consultant",
        company: "Potentia",
      ),
      (
        name: "Abe Naus",
        role: "General Manager",
        company: "Potentia",
      ),
    ),
    stats: (
      (metric: D.events.her-waka-april-2026.registered, label: "Registered attendees"),
      (metric: D.events.her-waka-april-2026.checked-in, label: "Checked-in attendees"),
      (metric: D.events.her-waka-april-2026.returning, label: "Returning attendees"),
      (metric: D.events.her-waka-april-2026.companies, label: "Companies represented"),
    ),
    // 7 organisations across 26 answered rows of 32 registrations.
    // The 7 rows below cover 26 of those — a top-N slice, not a full account.
    companies: (
      ("Ministry of Social Development", v(17, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("RCSA", v(3, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("academyEX", v(1, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Pezxe", v(1, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("RBS Intellect", v(1, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Sona Sansaar Ltd.", v(1, "Humanitix checkout Company/Organisation field, instance 2026-04-07--her-waka-april-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "she-sharp-candice-murray-own-your-energy",
    title: "She Sharp & Candice Murray: Own Your Energy",
    short-title: "Own Your Energy",
    month: "APRIL 2026",
    date: "16 April 2026",
    time: "5:00pm – 7:30pm",
    venue: "Metlifecare, Level 4, 110 Carlton Gore Road, Newmarket",
    city: "Auckland",
    category: "Career workshop",
    partner-logos: ("metlifecare",),
    photo-keys: (
      "she-sharp-candice-murray-own-your-energy-hero",
      "she-sharp-candice-murray-own-your-energy-2",
      "she-sharp-candice-murray-own-your-energy-3",
    ),
    lede: [
      Career mindset coach Candice Murray took a room at Metlifecare through the
      practical question of how to choose the state you turn up in — calm,
      confidence, self-belief — rather than hoping for it. Metlifecare's CIO Tim
      // NO RANKING SENTENCE HERE, and this is the second time one has been
      // removed. It first read "the second-largest event of the half-year and
      // the first She Sharp has held in Newmarket"; it was then softened to
      // "the largest verified attendance of any community evening after
      // International Women's Day", which compared this event's verified 81
      // against the LinkedIn evening's placeholder 68. The note left here at
      // the time said the sentence becomes false if the real figure lands above
      // 81. The Humanitix export of 2026-08-17 put the LinkedIn evening at 106
      // registered and 70 checked in, so it did, twice over — this was the
      // SMALLEST of the three community evenings, not the second largest.
      // A ranking written against an unverified sibling figure is a claim about
      // the sibling. Do not write another one.
      Aynsley opened the evening.
    ],
    speakers: (
      (
        name: "Candice Murray",
        role: "Career Mindset Coach",
        company: "Candice Murray Journey",
      ),
      (
        name: "Tim Aynsley",
        role: "Chief Information Officer",
        company: "Metlifecare",
      ),
    ),
    stats: (
      (metric: D.events.she-sharp-candice-murray-own-your-energy.registered, label: "Registered attendees"),
      (metric: D.events.she-sharp-candice-murray-own-your-energy.checked-in, label: "Checked-in attendees"),
      (metric: D.events.she-sharp-candice-murray-own-your-energy.returning, label: "Returning attendees"),
      (metric: D.events.she-sharp-candice-murray-own-your-energy.companies, label: "Companies represented"),
    ),
    // 39 organisations across 73 answered rows of 81 registrations.
    // The 12 rows below cover 46 of those — a top-N slice, not a full account.
    companies: (
      ("Auckland University of Technology", v(9, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(9, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Massey University", v(5, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("University of Auckland", v(5, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Metlifecare", v(4, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Auckland Institute of Studies", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Evolve Recruitment", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Fonterra", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Ministry of Social Development", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("StayinFront", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("UNESCO", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Vector", v(2, "Humanitix checkout Company/Organisation field, instance 2026-04-16--own-your-energy-with-candice-murray-presented-by-she-sharp-and-metlifecare — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
    ),
  ),
  // ===========================================================================
  (
    slug: "her-waka-may-2026",
    // The flag this record used to carry, and why it is gone: its registration
    // export recorded 5 registrations and 0 check-ins for a session that
    // demonstrably ran, so the organisation table beneath it was suppressed
    // rather than printed against a number nobody believed. The Humanitix
    // account export of 2026-08-17 reconciled it to 33 and 29 — which is what
    // the note called "the real fix" — so the table is printed from measured
    // data and the suppression is no longer needed.
    title: "HER WAKA (May 2026) — Cybersecurity",
    short-title: "HER WAKA · Cohort 3",
    month: "MAY 2026",
    date: "5 May 2026",
    time: "12:00pm – 2:00pm",
    venue: "academyEX, Grafton",
    city: "Auckland",
    category: "Employment programme",
    partner-logos: ("msd", "academyex"),
    photo-keys: (
      "her-waka-may-2026-hero",
      "her-waka-may-2026-2",
      "her-waka-may-2026-3",
    ),
    lede: [
      The third cohort turned to cybersecurity — a field with more open roles
      than people to fill them and no single way in. Three practitioners gave
      lightning talks on how they got there, followed by forty-five minutes of
      // Was: "Attendance for this session has not yet been reconciled against
      // Humanitix; the figures shown are the incomplete export." It has been.
      // The stat cards above this lede now read 33 registered and 29 checked
      // in, straight from the export — a caveat left standing next to figures
      // it no longer describes is worse than no caveat, because a reader who
      // notices assumes the numbers were never checked either.
      recruiter tables.
    ],
    speakers: (
      (
        // company is EMPTY in the source record for both of these speakers, and
        // an empty company must stay empty. This entry previously read
        // "academyEX" — inventing an employer for a named living person, and
        // attributing her to a partner organisation that hosts our events and
        // receives this report. The one below previously read "Independent",
        // which asserts self-employment from a blank field. Neither is a
        // formatting default; both are factual claims about real people.
        name: "Paula Gair",
        role: "Consultant, Educator & Advisor",
        company: "",
      ),
      (
        // "NZ Post" comes from her BIO — "She currently serves as Agility Coach
        // at NZ Post" — not from the empty `company` field. This entry has now
        // been wrong twice in opposite directions: first "Independent", which
        // asserted self-employment over a named employer, then blank, which
        // threw away a fact the record does hold. The lesson is that an empty
        // `company` means "look in the bio", not "there is no employer".
        name: "Swapna Soni",
        role: "Agility Coach",
        company: "NZ Post",
      ),
      (
        name: "Prasanth Pavithran",
        role: "Senior Business Analyst, Office of the CTO",
        company: "AUT",
      ),
      (
        name: "Sian Clements",
        role: "Client Relationship & Delivery Partner",
        company: "Younity",
      ),
      (
        name: "Jenny Martin",
        role: "Senior Consultant",
        company: "Potentia",
      ),
    ),
    stats: (
      (metric: D.events.her-waka-may-2026.registered, label: "Registered attendees"),
      (metric: D.events.her-waka-may-2026.checked-in, label: "Checked-in attendees"),
      (metric: D.events.her-waka-may-2026.returning, label: "Returning attendees"),
      (metric: D.events.her-waka-may-2026.companies, label: "Companies represented"),
    ),
    // 6 organisations across 21 answered rows of 33 registrations.
    // The 6 rows below cover 21 of those — a top-N slice, not a full account.
    // 1 row(s) here named the registrant rather than an employer and are excluded.
    companies: (
      ("Ministry of Social Development", v(11, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(4, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("RCSA", v(3, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Auckland University of Technology", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("BJT", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("RBS Intellect", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-05--her-waka-may-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "making-linkedin-work-for-you-with-stuart-little",
    title: "Making LinkedIn Work for You, with Stuart Little",
    short-title: "Making LinkedIn Work for You",
    month: "MAY 2026",
    date: "15 May 2026",
    time: "5:00pm – 7:30pm",
    venue: "AUT City Campus, Building WZ416, Wellesley Street East",
    city: "Auckland",
    category: "Career workshop",
    partner-logos: ("aut",),
    photo-keys: (
      "making-linkedin-work-for-you-with-stuart-little-hero",
      "making-linkedin-work-for-you-with-stuart-little-2",
      "making-linkedin-work-for-you-with-stuart-little-3",
    ),
    lede: [
      Presented with AUT's School of Engineering, Computer and Mathematical
      Sciences, this session treated a LinkedIn profile as what it now is: the
      first impression made before any conversation happens. Stuart Little of
      Agency8 worked from current hiring behaviour rather than theory, and
      recruiter Janelle Wright described what she actually searches for.
    ],
    speakers: (
      (
        name: "Stuart Little",
        role: "Creative Strategist and Director",
        company: "Agency8",
      ),
      (
        name: "Janelle Wright",
        role: "Founder",
        company: "Janelle's Recruitment",
      ),
    ),
    stats: (
      (metric: D.events.making-linkedin-work-for-you-with-stuart-little.registered, label: "Registered attendees"),
      (metric: D.events.making-linkedin-work-for-you-with-stuart-little.checked-in, label: "Checked-in attendees"),
      (metric: D.events.making-linkedin-work-for-you-with-stuart-little.returning, label: "Returning attendees"),
      (metric: D.events.making-linkedin-work-for-you-with-stuart-little.companies, label: "Companies represented"),
    ),
    // 30 organisations across 102 answered rows of 106 registrations.
    // The 12 rows below cover 84 of those — a top-N slice, not a full account.
    companies: (
      ("Auckland University of Technology", v(52, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(12, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("2degrees", v(5, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("PB Tech", v(3, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("academyEX", v(2, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Netbridge", v(2, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("StayinFront", v(2, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("University of Auckland", v(2, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Acfn", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Agency8", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Ais", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("ASB", v(1, "Humanitix checkout Company/Organisation field, instance 2026-05-15--making-linkedin-work-for-you — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
    ),
  ),
  // ===========================================================================
  (
    slug: "her-waka-june-2026",
    title: "HER WAKA (June 2026) — Personal Branding & Growth",
    short-title: "HER WAKA · Cohort 4",
    month: "JUNE 2026",
    date: "2 June 2026",
    time: "12:00pm – 2:00pm",
    venue: "academyEX, Grafton",
    city: "Auckland",
    category: "Employment programme",
    partner-logos: ("msd", "academyex"),
    photo-keys: (
      "her-waka-june-2026-hero",
      "her-waka-june-2026-2",
      "her-waka-june-2026-3",
    ),
    lede: [
      The final cohort of the first HER WAKA series asked participants to treat
      their career like a go-to-market plan. Andrea Halal described rebuilding a
      professional network from nothing after moving to New Zealand, and made
      the case that positioning matters as much as performance. RCSA joined
      again with a read on the current job market.
    ],
    speakers: (
      (
        name: "Andrea Halal",
        role: "Tech Marketing Leader; creator of Big Leap Energy",
        company: "Ideqa",
      ),
    ),
    stats: (
      (metric: D.events.her-waka-june-2026.registered, label: "Registered attendees"),
      (metric: D.events.her-waka-june-2026.checked-in, label: "Checked-in attendees"),
      (metric: D.events.her-waka-june-2026.returning, label: "Returning attendees"),
      (metric: D.events.her-waka-june-2026.companies, label: "Companies represented"),
    ),
    // 6 organisations across 21 answered rows of 24 registrations.
    // The 6 rows below cover 21 of those — a top-N slice, not a full account.
    companies: (
      ("Ministry of Social Development", v(13, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(3, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("RCSA", v(2, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("BJT", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Ideqa", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("RBS Intellect", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-02--her-waka-june-2026 — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "peyvand-academy-13-june-2026",
    title: "Youth Tech Series — AI & Electronics Workshop",
    short-title: "Youth Tech · AI & Electronics",
    month: "JUNE 2026",
    date: "13 June 2026",
    time: "2:30pm – 4:30pm",
    venue: "Fruitvale Primary School, 40 Fruitvale Road",
    city: "Auckland",
    category: "Youth workshop",
    partner-logos: ("peyvand-academy", "moe"),
    photo-keys: (
      "peyvand-academy-13-june-2026-hero",
      "peyvand-academy-13-june-2026-2",
      "peyvand-academy-13-june-2026-3",
    ),
    lede: [
      The first of two Saturday workshops for rangatahi aged 12 to 18, run with
      Peyvand Academy and the Ministry of Education in a school hall in West
      Auckland. Participants met artificial intelligence as a set of ideas they
      could argue with, then wired basic circuits by hand. For most of the room
      it was a first encounter with either.
    ],
    speakers: (),
    stats: (
      (metric: D.events.peyvand-academy-13-june-2026.registered, label: "Registered participants"),
      (metric: D.events.peyvand-academy-13-june-2026.checked-in, label: "Attended on the day"),
      (metric: D.events.peyvand-academy-13-june-2026.returning, label: "Returning participants"),
      (metric: D.events.peyvand-academy-13-june-2026.companies, label: "Partner organisations"),
    ),
    // 10 organisations across 19 answered rows of 24 registrations.
    // The 10 rows below cover 19 of those — a top-N slice, not a full account.
    companies: (
      ("Peyvand Academy", v(7, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Auckland University of Technology", v(3, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Green cafe", v(2, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Engram", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Eyc", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Metlifecare", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Pagans", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("She Sharp", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Three Kings School", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("UCG", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-13--youth-tech-series-ai-and-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
  // ===========================================================================
  (
    slug: "peyvand-academy-20-june-2026",
    title: "Youth Tech Series — Electronics Workshop",
    short-title: "Youth Tech · Electronics",
    month: "JUNE 2026",
    date: "20 June 2026",
    time: "2:30pm – 4:30pm",
    venue: "Fruitvale Primary School, 40 Fruitvale Road",
    city: "Auckland",
    category: "Youth workshop",
    partner-logos: ("peyvand-academy", "moe", "little-engineers"),
    photo-keys: (
      "peyvand-academy-20-june-2026-hero",
      "peyvand-academy-20-june-2026-2",
      "peyvand-academy-20-june-2026-3",
    ),
    lede: [
      A week later the series went deeper into electronics, with Little Engineers
      joining Peyvand Academy and the Ministry of Education. Resistors, LEDs,
      series and parallel circuits — the whole session was build time. Many of
      the same young people came back, which is the outcome the series is
      designed for.
    ],
    speakers: (),
    stats: (
      (metric: D.events.peyvand-academy-20-june-2026.registered, label: "Registered participants"),
      (metric: D.events.peyvand-academy-20-june-2026.checked-in, label: "Attended on the day"),
      (metric: D.events.peyvand-academy-20-june-2026.returning, label: "Returning participants"),
      (metric: D.events.peyvand-academy-20-june-2026.companies, label: "Partner organisations"),
    ),
    // 9 organisations across 22 answered rows of 26 registrations.
    // The 9 rows below cover 22 of those — a top-N slice, not a full account.
    companies: (
      ("Peyvand Academy", v(10, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("She Sharp", v(3, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Eywi", v(2, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Little Engineers", v(2, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Auckland University of Technology", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("Humanitix", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("Metlifecare", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — normalised to its canonical name by lib/data/json/humanitix/organisations.json. Self-reported at checkout and never verified against the organisation.")),
      ("RBS Intellect", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
      ("W. Hospital", v(1, "Humanitix checkout Company/Organisation field, instance 2026-06-20--youth-tech-series-electronics-workshop — shown as attendees most often spelled it; no canonical entry exists for it. Self-reported at checkout and never verified against the organisation.")),  // as typed
    ),
  ),
)

// -----------------------------------------------------------------------------
// Convenience lookup for section authors.
// -----------------------------------------------------------------------------

#let event-by-slug(slug) = {
  let found = events.filter(ev => ev.slug == slug)
  if found.len() == 0 {
    panic("events.typ: no event with slug " + slug)
  }
  found.first()
}

// =============================================================================
// PHOTO KEY → SOURCE PATH
// =============================================================================
//
// The asset agent builds its conversion manifest from this block. Sources are
// WebP and must be converted to JPEG for Typst; the report references the KEY,
// never the path.
//
// HAND-MAINTAINED, and nothing checks it. These paths sit in `//` comments, so
// scripts/assets/refs.ts deliberately reads them as documentation rather than
// as references - which means scripts/assets/apply-move.ts does not rewrite
// them and scripts/verify-image-paths.ts does not notice when they rot. They
// went stale in the 2026-08-19 move to per-event folders and were corrected by
// hand afterwards. If you move an event asset, fix this block yourself. The
// build inputs that ARE checked live in report/assets/photos.manifest.json.
//
//   she-sharp-and-academyex-international-womens-day-2026-hero
//       → public/img/events/she-sharp-and-academyex-international-womens-day-2026/archive/1.webp
//   she-sharp-and-academyex-international-womens-day-2026-2
//       → public/img/events/she-sharp-and-academyex-international-womens-day-2026/archive/2.webp
//   she-sharp-and-academyex-international-womens-day-2026-3
//       → public/img/events/she-sharp-and-academyex-international-womens-day-2026/archive/3.webp
//
//   her-waka-hero    → public/img/events/her-waka/archive/1.webp
//   her-waka-2       → public/img/events/her-waka/archive/2.webp
//   her-waka-3       → public/img/events/her-waka/archive/3.webp
//
//   her-waka-april-2026-hero → public/img/events/her-waka-april-2026/archive/1.webp
//   her-waka-april-2026-2    → public/img/events/her-waka-april-2026/archive/2.webp
//   her-waka-april-2026-3    → public/img/events/her-waka-april-2026/archive/3.webp
//
//   she-sharp-candice-murray-own-your-energy-hero
//       → public/img/events/she-sharp-candice-murray-own-your-energy/archive/1.webp
//   she-sharp-candice-murray-own-your-energy-2
//       → public/img/events/she-sharp-candice-murray-own-your-energy/archive/2.webp
//   she-sharp-candice-murray-own-your-energy-3
//       → public/img/events/she-sharp-candice-murray-own-your-energy/archive/3.webp
//
//   her-waka-may-2026-hero → public/img/events/her-waka-may-2026/archive/1.webp
//   her-waka-may-2026-2    → public/img/events/her-waka-may-2026/archive/2.webp
//   her-waka-may-2026-3    → public/img/events/her-waka-may-2026/archive/3.webp
//
//   making-linkedin-work-for-you-with-stuart-little-hero
//       → public/img/events/making-linkedin-work-for-you-with-stuart-little/archive/1.webp
//   making-linkedin-work-for-you-with-stuart-little-2
//       → public/img/events/making-linkedin-work-for-you-with-stuart-little/archive/2.webp
//   making-linkedin-work-for-you-with-stuart-little-3
//       → public/img/events/making-linkedin-work-for-you-with-stuart-little/archive/3.webp
//
//   her-waka-june-2026-hero → public/img/events/her-waka-june-2026/archive/1.webp
//   her-waka-june-2026-2    → public/img/events/her-waka-june-2026/archive/2.webp
//   her-waka-june-2026-3    → public/img/events/her-waka-june-2026/archive/3.webp
//
//   peyvand-academy-13-june-2026-hero
//       → public/img/events/peyvand-academy-13-june-2026/photo-1.webp
//   peyvand-academy-13-june-2026-2
//       → public/img/events/peyvand-academy-13-june-2026/photo-2.webp
//   peyvand-academy-13-june-2026-3
//       → public/img/events/peyvand-academy-13-june-2026/photo-3.webp
//
//   peyvand-academy-20-june-2026-hero
//       → public/img/events/peyvand-academy-20-june-2026/photo-1.webp
//   peyvand-academy-20-june-2026-2
//       → public/img/events/peyvand-academy-20-june-2026/photo-2.webp
//   peyvand-academy-20-june-2026-3
//       → public/img/events/peyvand-academy-20-june-2026/photo-3.webp
//
// Spare frames available if a layout needs a fourth image: `4.webp` exists in
// each of the seven archive directories above, and the two Peyvand slugs have
// `-photo-4` through `-photo-7`.
// =============================================================================
