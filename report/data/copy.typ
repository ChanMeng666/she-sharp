// =============================================================================
// copy.typ — all long-form prose
// =============================================================================
//
// Every paragraph of running text in the report lives here as a content
// binding, so an editor can rewrite the report without opening a layout file.
//
// VOICE — adapted from Dr. Mahsa McCauley's own newsletter writing
// (lib/data/json/newsletter-issues/2026-06.json and 2026-07.json). Plain
// English a programme officer can skim. Concrete nouns, real names, short
// sentences. State the awkward things rather than routing around them.
//
// BANNED: delve, realm, intricate, showcasing, pivotal, "leveraged X to drive
// Y", results-driven, passionate, dynamic, journey (as a metaphor), "we are
// excited to", "at the end of the day".
//
// Every claim below must be supportable by a metric in `report-data.typ` or a
// source in `sources.typ`. If you add a sentence with a number in it, the
// number goes in report-data.typ and is interpolated — never typed here.
//
// ⚠️  TYPST ESCAPING — these fail SILENTLY inside a content block:
//       ~   non-breaking space      → write \~
//       @   label reference         → write \@   (e.g. hello\@shesharp.org.nz)
//       #   start of code mode      → write \#   (e.g. \#IAmRemarkable)
//       $   start of math mode      → write \$   (e.g. \$6.8 billion)
//     Check every string you add.
// =============================================================================

// -----------------------------------------------------------------------------
// FOUNDER'S LETTER  (~545 words, and it must stay near that — see the note in
// the measurement paragraph and the header of sections/03-founder-letter.typ)
// -----------------------------------------------------------------------------

#let founder-letter = [
  Kia ora,

  // "The busiest six months She Sharp has had" was an all-time superlative with
  // no register behind it, and the one available comparison points the other
  // way: 2025 ran nine events and 716 registrations against this half-year's
  // nine events and 468 reconciled. "Most programme-heavy" is checkable and is
  // what the paragraph actually goes on to argue. The 468 is now measured
  // rather than partial, which strengthens the comparison without changing its
  // direction — do not upgrade the claim on the back of it.
  The first half of 2026 was the most programme-heavy six months She Sharp has
  run. We held fewer events for a general audience and more sessions built for
  particular people, and that shift is the story of this report.

  HER WAKA is the clearest example. Four monthly cohorts at academyEX in
  Grafton, March to June, funded by the Ministry of Social Development and built
  for people who are ready to move into work and want the labour market
  explained honestly. Each session ran two hours and paired something to learn
  with someone to meet: an AI panel and recruiters in March, the
  \#IAmRemarkable workshop and three recruiter tables in April, cybersecurity
  lightning talks in May, Andrea Halal on personal branding in June. Recruiters
  from Potentia, Randstad Digital, Absolute IT, Elevate Consulting and Younity
  gave up their lunch hours to sit at those tables. It is the half of the
  // Was: "That is the part participants talk about afterwards." No post-event
  // survey ran in this period, so there is no record of what participants say
  // afterwards — and the methodology page states that two pages later.
  session people stay for, and it is in every cohort for that reason.

  In June we started something at the other end of the pipeline. Two Saturdays
  in the hall at Fruitvale Primary School in West Auckland, with Peyvand Academy
  and the Ministry of Education, and on the second one Little Engineers.
  Rangatahi aged 12 to 18 met artificial intelligence as an idea they were
  allowed to argue with, then wired circuits by hand. There is nothing quite
  like watching a young person light up an LED they wired themselves. We are
  calling it the Youth Tech Series, and it will keep going.

  The community evenings continued alongside. academyEX hosted International
  // NO SUPERLATIVE HERE. This read "our largest gathering of the half-year",
  // written when the LinkedIn evening's attendance was still a placeholder.
  // Reconciled, that evening took more bookings (106 to 103) and this one put
  // more people through the door (72 to 70), so the ranking depends entirely on
  // which of the two columns printed later in this report you read — and the
  // letter cannot say which without switching measures for one sentence. An
  // intermediate fix, "our best-attended evening", was true on check-ins and
  // silent about that. The paragraph names three partners and three subjects
  // and does not need a ranking on top; a superlative that needs a footnote to
  // survive has not earned its place in a personal letter.
  Women's Day in March on the theme Give To Gain. Metlifecare opened their
  Newmarket office in April for Candice
  Murray's workshop on choosing the state you turn up in. AUT's School of
  Engineering, Computer and Mathematical Sciences co-presented a LinkedIn
  masterclass in May.

  We also put the member platform into service. It is not a marketing site: it
  holds mentor and mentee profiles, the matching queue, event records and role
  permissions. In March it took its first real load when the mentors confirmed
  for the 2026 programme were onboarded in a single day. Mentees followed over
  the months after, and more are waiting. We paused applications on 19 June
  while we work out how to run the programme at a size we can honour. I would
  rather say that plainly than leave you wondering why intake stopped.

  // REWRITTEN AFTER THE RECONCILIATION. Every specific failure this paragraph
  // used to confess was fixed by the Humanitix account export of 2026-08-17:
  // the May cohort reads 33 registered and 29 checked in, not "almost no
  // registrations"; employers were captured all along, at checkout. Leaving the
  // confession in place while the pages beside it print reconciled figures is
  // the same fault as the reverse, and a funder catches it faster.
  //
  // The register is not moved to the win column, though. What survives is
  // smaller, true, and still ours: no survey, no check-in at two sessions, and
  // an archive that starts in 2020. State those instead.
  // LENGTH. This letter flows across exactly two pages and build.ps1
  // -ExpectPages fails if it reaches a third, so the replacement is held to
  // roughly the length of what it replaced. Do not let it grow.
  When we began this report the attendance behind it was in poor shape. It has
  since been reconciled, event by event, against our booking platform's own
  export, so every attendance figure that follows comes from there. That was
  going to be my first commitment for the second half-year; I would rather
  report it done.

  What is left is smaller, and the methodology page has all of it: no
  post-event survey this period, no check-in at either Youth Tech session, a
  booking archive that only reaches back to 2020, and accounts for the half-year
  that are not filed because the financial year has not ended.

  Thank you to the Ministry of Social Development, academyEX, Metlifecare, AUT,
  Peyvand Academy, the Ministry of Education and Little Engineers. And to the
  fifteen people on this team, not one of whom is paid.

  Ngā mihi nui,
]

// -----------------------------------------------------------------------------
// CHAPTER OPENERS
// -----------------------------------------------------------------------------

#let chapter-her-waka = [
  HER WAKA is an employment programme, not an event series. The Ministry of
  Social Development funds it and refers the participants; She Sharp designs and
  delivers it; academyEX provides the room. It ran monthly from March to June
  2026 in Grafton, two hours a session, capped at twenty-five people so that
  everyone in the room can actually speak.

  // "chosen because participants asked for it" and, below, "the thing
  // participants name when asked what worked" both assert a feedback instrument
  // by name. No post-event survey ran in this period — the methodology page says
  // so — so nobody was asked anything. Deleting eighteen fabricated survey
  // charts and keeping the sentences that summarise their findings is the
  // half-fix a hostile reader enjoys most. Both are now stated as She Sharp's
  // own programme decisions, which is what they actually were.
  The structure repeats deliberately. The first half is content — a panel, a
  workshop, a set of lightning talks — chosen to give people something to take
  away before anyone is asked to network.
  The second half is contact: two or three tables of recruiters from RCSA member
  firms, and small groups rotating between them with a few minutes each to
  introduce themselves, ask a real question, and hear an honest answer. Job
  readiness is mostly a matter of having had the conversation once before it
  counts.

  Four cohorts ran. The themes were AI and the future of work, \#IAmRemarkable
  and practical AI tools, cybersecurity pathways, and personal branding. What
  did not change was the recruiter tables. They are the element She Sharp keeps
  in every cohort, and the reason the format is built around them.
]

#let chapter-youth = [
  The Youth Tech Series started in June, in a school hall in West Auckland, with
  Peyvand Academy and the Ministry of Education. Two Saturday afternoons, two
  hours each, for rangatahi aged 12 to 18.

  The first session put artificial intelligence in front of them as a set of
  ideas rather than a product — what it can do, what it gets wrong, who decides
  — and then moved to a table of components. The second went further into
  electronics with Little Engineers: resistors, LEDs, series and parallel
  circuits, most of the session spent building.

  This is the part of our work with the longest payback and the least
  measurement. Fewer than one in twenty New Zealand girls currently considers a
  high-paid STEM career, against one in five boys. Nothing about a two-hour
  workshop fixes that. What a workshop can do is make the field concrete and
  local at an age when it is still an abstraction — and put a facilitator in the
  room who looks like the young person watching her.
]

#let chapter-community = [
  Alongside the programmes, She Sharp ran three community evenings in the first
  half of 2026: International Women's Day with academyEX in March, Own Your
  Energy with Metlifecare in April, and the LinkedIn masterclass with AUT in
  May. All three were free, in person, in Tāmaki Makaurau, and open to anyone.

  These evenings are how most people meet She Sharp for the first time. They are
  also how the organisation stays honest about who it is for: the room is
  students and career changers and senior engineers at the same tables, and the
  format has to work for all of them. We keep the talks short and the
  unstructured time long, because the connections are the product.

  Behind the events, the volunteer team grew and the enquiries kept arriving —
  from people wanting to help, to speak, to host, or to find their way in.
]

// -----------------------------------------------------------------------------
// PLATFORM
// -----------------------------------------------------------------------------

#let platform-narrative = [
  She Sharp's member platform went into service in the first half of 2026. It is
  the record system behind the mentorship programme: accounts, roles, mentor and
  mentee profiles, the waiting queue, application review, invitation codes and
  admin permissions. Members can hold more than one role, so a mentee who later
  mentors does not need a second account.

  The first real load arrived in March, when the mentors already confirmed for
  the 2026 programme were imported and issued invitation codes in a single
  operation. That is why the platform's growth chart has one tall bar and a flat
  tail: it reflects an onboarding event, not a surge in demand. Reading it as
  demand would be the easiest mistake in this report to make, and the most
  misleading.

  The platform also records what has not happened yet. Mentorship relationships,
  meeting logs, event registrations and donations all have tables and no rows.
  // Was: "Every figure in this report that would draw on them is marked as an
  // estimate or a placeholder rather than presented as a measurement." Neither
  // half survived. The pairing and meeting counts are a measured zero — the
  // tables are empty and the mentorship programme's own weekly Slack digest
  // reported the same zero on 29 June — and an empty table checked against an
  // independent source is a finding, not a gap. Event attendance never came
  // from here at all; it comes from the booking platform, where the bookings
  // are actually taken.
  The pairing and meeting counts are therefore reported as zero, not estimated:
  a second, independent record agrees with the empty tables. Attendance is not
  read from here at all — it comes from the booking platform, which is where
  people actually register.
]

#let matching-narrative = [
  Matching mentees to mentors is the part of the programme that does not scale
  by adding volunteers. She Sharp's platform includes an assisted matching step:
  it compares a mentee's stated goals, industry, skills and logistics against
  available mentors, ranks the candidates and assigns a confidence level, and a
  human makes the decision. Mentees who cannot be matched immediately go into a
  waiting queue rather than being turned away.

  // Was: "…so at 30 June ten people were waiting — which is every mentee the
  // platform holds." The platform holds eleven mentee submissions against ten
  // queued, so the clause was a claim the data does not make. Nobody has
  // established what the eleventh record is, and a report is not the place to
  // guess; the sentence works without it.
  Every month from March to June added mentees to that queue, and none were
  matched, so at 30 June ten people were waiting. Applications were paused on
  19 June. The runbook recording that decision states the mechanism and the
  reversibility; it does not state a reason, so this report does not supply one.

  The pause is documented and reversible. Both application forms still exist and
  work; they are held behind a placeholder page and a redirect, and the runbook
  for reopening them is four steps long.
]

// -----------------------------------------------------------------------------
// VOICES
// -----------------------------------------------------------------------------

#let voices-intro = [
  The two accounts on this page come from mentees in earlier She Sharp
  mentorship cohorts, not from the January–June 2026 period. We have included
  them because they describe what the programme is for, and because the 2026
  cohort has not yet reached the point where it would be fair to ask.

  // Was: "Where the 2025 impact report carried post-event survey charts, this
  // one carries placeholders, and they are marked." It carries neither. The
  // eighteen charts were deleted outright, along with the 72 invented
  // percentages behind them, because no instrument exists that would ever fill
  // them — see the note at the head of events.typ. A sentence advertising
  // marked placeholders to a reader who can see there are none reads as
  // carelessness about the rest.
  No post-event survey ran in the first half of 2026. The 2025 impact report
  charted what people said had worked and what had not; this one carries no
  participant-feedback figures at all, rather than estimates of them. Running
  one is a commitment for the second half of the year.
]

// ⚠️  lib/data/testimonials.ts contains 19 testimonials, 17 of which are
//     dicebear placeholders with invented names, roles and employers. Only the
//     two below are real, and even their `company` fields in that file are
//     fabricated ("Tech Innovations Ltd", "Innovation Hub NZ", and Meeta Patel
//     listed as "Senior Director, Global Tech Corp" when lib/data/team.ts has
//     her at academyEX). Names and quoted words only — no employers.
#let voices = (
  (
    name: "Fay Fialho",
    line: "Mentee, mentored by Dr. Meeta Patel",
    quote: [
      From the first meeting with Meeta, she was inspiring, both personally and
      professionally. Her humble yet professional attitude made me comfortable
      with a feeling of being heard. Her insights and experience of the job
      market, industries and people provided me with clarity and direction.
    ],
    // VERBATIM. This previously read "as I go forward" — "journey" had been
    // swapped out because it sits on this file's own banned-word list. That list
    // governs OUR prose. Applying it to a named living person's words, in a
    // document going to four funders, is not house style; it is putting words in
    // her mouth. The only edits permitted here are the two doubled words in the
    // source ("with with", "and and"), which are transcription slips.
    long: [
      From the first meeting with Meeta, she was inspiring, both personally and
      professionally. Her humble yet professional attitude made me comfortable
      with a feeling of being heard. Her insights and experience of the job
      market, industries and people, provided me with clarity and direction. The
      encouragement and assurance that I was on the right track, to continue to
      persevere and embrace challenges is one that I will continue to keep with
      me as I journey forward.
    ],
  ),
  (
    name: "Shweta Sharma",
    line: "Mentee, 2024 cohort, mentored by Anshu Maharaj",
    quote: [
      This initiative has truly been a taonga for both mentors and mentees,
      offering invaluable opportunities for growth, guidance, and connection.
    ],
    // VERBATIM, with the one cut marked by an ellipsis. This previously dropped
    // "A shoutout to my incredible She Sharp mentor, Anshu Maharaj," entirely
    // and compressed her closing sentence to "I aim to keep applying them" —
    // deletion and rewording with no ellipsis and no brackets. She names her
    // mentor; removing that name and keeping the praise inverts who she was
    // thanking. "(treasure)" is hers too and is restored.
    long: [
      This initiative has truly been a taonga (treasure) for both mentors and
      mentees, offering invaluable opportunities for growth, guidance, and
      connection. A shoutout to my incredible She Sharp mentor, Anshu Maharaj,
      whose support has been instrumental in my journey, enabling me to grow in
      my Product Owner role. … It has equipped me with the skills and insights
      needed to navigate challenges with confidence, and I aim to continue
      applying these tools to make an impact in all aspects moving forward.
    ],
  ),
)

// -----------------------------------------------------------------------------
// CONTEXT
// -----------------------------------------------------------------------------

// Named `sector-intro` — an identifier starting with the reserved word
// `context` is a Typst parse hazard.
#let sector-intro = [
  She Sharp works on one problem: women are a minority in New Zealand's
  technology workforce, and the pipeline into it narrows early. The figures on
  this page are not ours. Each one is sourced, and the sources are listed at the
  back so they can be checked.

  Two of them frame everything else. Women hold around 29% of professional IT
  roles in New Zealand. And fewer than one in twenty Kiwi girls considers a
  high-paid STEM career, against one in five boys — a gap that opens at school,
  well before anyone applies for a job.

  The demand side is not short of roles. It is short of the right people in
  them: New Zealand's tech skills shortage is largely a mismatch, with the
  deepest unmet demand at senior and experienced levels. That is an argument for
  mentorship and for retention, not only for recruitment. It is also why
  Auckland matters disproportionately — the city generates 54% of the country's
  tech-sector GDP and employs roughly 68,000 tech workers, and every event in
  this report was held in it.
]

// -----------------------------------------------------------------------------
// OUTLOOK
// -----------------------------------------------------------------------------

#let outlook-copy = [
  Three things carry into the second half of 2026.

  The first is HER WAKA. Four cohorts have now run end to end, and the format
  has stopped being an experiment. The question for the rest of the year is
  whether it can run with more cohorts without losing the thing that makes it
  work, which is a room small enough that a recruiter can talk to everybody in
  it.

  The second is the Youth Tech Series. Two workshops at one school is a start,
  not a programme. Extending it means more schools, more kits, and facilitators
  who can be there on a Saturday.

  The third is mentorship. Applications are paused, the waiting queue is not
  empty, and the honest constraint is matching capacity rather than interest.
  Reopening intake is a decision about how many pairs we can support properly,
  and it will be made on that basis.

  // Attendance reconciliation has moved off this list, because it was done —
  // see the founder's letter. What is left is the work that has not been done,
  // and a list that quietly keeps a completed item on it is worth nothing to
  // the reader as a statement of intent.
  Underneath all three sits measurement. Attendance is now reconciled against
  the booking platform, event by event — the one measurement problem that was
  closed before this report went out rather than promised in it. Three remain: a
  post-event survey that runs, a check-in scanned at every session, and an agreed
  definition of what a good outcome is for someone who comes to HER WAKA — the
  last of which is a decision before it is a measurement.
]

#let whats-next = [
  Three events are already scheduled for the second half of 2026.

  *Working Smarter: AI, MYOB and the New Delivery Landscape* — 30 July, at
  MYOB's Albert Street office. Three MYOB leaders on what AI has changed in
  their work, followed by small groups working a real problem with MYOB mentors
  circulating.

  *Aotearoa AI Hackathon Festival 2026* — 7 to 8 August, AUT City Campus.
  Hosted by AUT in partnership with She Sharp and the AI Forum New Zealand. Two
  days building AI projects against the UN Sustainable Development Goals, with
  free pre-event training, mentors in the room, and a path for winning teams to
  pitch at the Aotearoa AI Summit. Beginners are welcome and solo registrants
  are matched into teams on the day.

  *No Pain, All Gain: Getting Fit for AI* — 3 September, with Les Mills. A panel
  on diversity and AI for impact, cross-functional perspectives, table
  discussions and networking.
]

// -----------------------------------------------------------------------------
// METHODOLOGY — the page that decides whether a funder trusts the rest
// -----------------------------------------------------------------------------

#let methodology = [
  *What this report covers.* Activity between 1 January and 30 June 2026.
  Repository and database figures are as at 1 August 2026.

  *How attendance is counted.* Two separate numbers are reported for every
  event. _Registered_ counts tickets issued, not distinct people: a parent
  booking for two rangatahi is two tickets, someone at three events is counted
  three times, and the nine events' tickets came from noticeably fewer email
  addresses than the total. _Checked in_ is the count scanned or marked present
  on the day. Neither is adjusted. The gap between them is normal
  for free events and is shown rather than smoothed away — the check-in rate is
  a more useful figure for a funder than either number alone.

  *Where each figure comes from.* Event attendance is taken from the Humanitix
  account export of 17 August 2026 and reconciled instance by instance against
  the event register in the She Sharp codebase, which was corrected wherever the
  two disagreed. Platform figures — accounts, roles, profiles, applications, waiting queue,
  enquiries — come from a direct query against the live production database.
  Team, sponsor and partner details come from the codebase's own registers.
  External context figures are each attributed to a named third-party source and
  listed at the back.

  // THIS LIST WAS THE WORST-DATED PROSE IN THE REPORT. It described a state of
  // affairs that ended on 2026-08-17, when the Humanitix account export
  // reconciled all nine events — while the pages it introduces printed the
  // reconciled figures. A methodology page that understates the data is not a
  // safe error: it is the page a funder reads to decide whether to believe the
  // rest, and being wrong in either direction costs the same.
  //
  // What replaces it must not be a victory lap. Every limit below is real and
  // is what a hostile reader would find anyway.
  *What these figures can and cannot tell you.* This is the part that matters
  most, so it is stated plainly rather than footnoted.

  - All nine events are reconciled against that export; no attendance figure in
    this report is estimated or a placeholder.
  - Neither Youth Tech Series workshop ran a check-in. Nobody was scanned, so
    those two have no attendance figure and none is shown — they are not zeros.
    Every check-in rate here therefore covers seven events, not nine.
  - Organisation names come from a free-text field at checkout: attendees type
    them, nobody verifies them, and some leave it blank. Spellings are folded
    together where they are obviously one employer, and each count is of those
    who answered, not of everyone there.
  - _Returning_ means an earlier registration exists in the booking archive,
    which begins in 2020 — anyone whose first event predates it counts as new,
    so the figure is a floor.
  - No post-event survey was run in this period, so this report carries no
    participant-feedback figures at all. The 2025 report's "what went well" and
    "areas for improvement" charts have no 2026 equivalent and are absent rather
    than marked pending: no instrument exists that would fill them.
  - *Employment outcomes are not tracked by any system She Sharp operates.* No
    into-work figure is claimed for HER WAKA or any other programme. Agreeing
    what to measure, and who records it, is a decision for the second half-year.
  - The organisation's accounts for this half-year are not filed: its financial
    year ends on 31 December, so H1 2026 sits inside a year that has not closed.
    Any half-year income figure here is money that passed through the booking
    platform, evidenced by that platform's earnings and payout reports; any
    annual figure is a return already filed with Charities Services, labelled as
    the full year it covers and never as a half-year result.
  - Mailing-list figures are a snapshot from the day the audience was exported,
    not a position at 30 June — the platform exports the present, not a past
    state. The newsletter issue count is a floor: an issue is evidenced only
    where someone unsubscribed or bounced, so one nobody left is invisible.
  - Mentorship relationships and meetings are empty tables in the platform.
    Those counts are reported as zero rather than estimated, and the programme's
    own weekly digest reports the same zero independently.
  - *This report contains no year-on-year comparison beyond the single panel on
    page 5.* The 2025 edition covered a full twelve months of community evenings;
    this half-year mixes those with capped programme cohorts, so per-event
    averages are not comparable by construction.
  - The mentoring-cycle diagram on page 21 shows the programme as designed. Its
    later stages are not implemented in the platform and no pair has run them.
]

// -----------------------------------------------------------------------------
// METHODOLOGY, PART TWO — three standing notes that are not attendance caveats
//
// SPLIT FROM `methodology` ON PURPOSE. DO NOT MERGE THEM BACK.
//
// The Humanitix reconciliation grew the caveat list by about 1,900 characters,
// and 20-methodology.typ renders `methodology` as a single scoped `sheet()`.
// Over-length, the last two paragraphs spilled onto a continuation page with no
// notch header, no title and five lines on an otherwise empty sheet — PITFALLS
// rule 5, and one of the extra pages in the build.
//
// These three read as standing notes rather than as reconciliation caveats, so
// the seam is editorial as well as convenient: everything above is "what these
// figures can and cannot tell you" about H1 2026; everything here is true of the
// report as an artefact. The section layer places this at the head of the
// facing sheet. Adding to `methodology` costs a page; add here instead, and
// check with the section layer before either grows much further.
// -----------------------------------------------------------------------------

#let methodology-notes = [
  *Marketing figures are excluded.* Publicly quoted totals such as "3,000+
  members" and "94+ events since 2014" describe cumulative reach and are not
  backed by a register. They are not used as measurements anywhere in this
  report.

  *A note on the mentors.* Twenty-six mentors were onboarded in this period,
  twenty-five of them in a single March import of people already confirmed
  offline for the 2026 programme. That is an onboarding event, not applications
  received, and it is described that way throughout. The distinction matters:
  reading it as demand would overstate the programme's inbound interest several
  times over.

  *Comparative year.* Figures for 2025 are taken from the summary panel of the
  published 2025 impact report. That document's opening letter quotes slightly
  different totals from its own summary panel; the summary panel is used here.
]

// -----------------------------------------------------------------------------
// THANKS
// -----------------------------------------------------------------------------

#let thanks = [
  None of the six months in this report were funded by a single large cheque.
  They were made possible by organisations that gave a room, a budget line, a
  classroom, a set of kits, or an afternoon of their people's time.

  Thank you to the *Ministry of Social Development*, who funded HER WAKA and
  referred the participants who made it real. To *academyEX*, who hosted
  International Women's Day and gave HER WAKA a home in Grafton for every
  cohort. To *Metlifecare*, who opened their Newmarket office and put their
  Chief Information Officer on the programme. To *AUT's School of Engineering,
  Computer and Mathematical Sciences*, who co-presented the LinkedIn masterclass
  and provided the venue. To *Peyvand Academy* and the *Ministry of Education*,
  who brought the Youth Tech Series to West Auckland, and to *Little Engineers*,
  who brought the kits.

  // "the tables that participants said mattered most" asserted a finding from
  // a survey that did not run, on the same spread as a methodology page saying
  // so. What the recruiters did is enough on its own.
  Thank you to the recruiters from Potentia, Randstad Digital, Absolute IT,
  Elevate Consulting and Younity, who sat at the tables that every HER WAKA
  cohort is built around. To every speaker who prepared a talk for a
  free event. And to
  the fifteen trustees and ambassadors who run She Sharp, none of whom are paid
  for it.
]

// -----------------------------------------------------------------------------
// BACK COVER
// -----------------------------------------------------------------------------

#let back-cover = [
  She Sharp is a New Zealand non-profit on a mission to bridge the gender gap in
  STEM, one woman at a time — through events, mentorship, networking, and career
  development.

  Registered charity CC57025.
]

#let back-cover-invitation = [
  If your organisation wants to host an event, fund a cohort, send mentors, or
  put a name to a room full of people who are trying to get in — we would like
  to hear from you.
]
