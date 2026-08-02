# Typst Layout Pitfalls — She Sharp H1 2026 report

Read this before editing anything under `report/`. Every rule here is a layout
bug that the **compiler does not catch**. A clean `typst compile` proves nothing
about any of them — each was found by rendering to PNG and looking at the page.

Adapted from `ChanMeng666/cv/TYPST_PITFALLS.md`. Rules 1b, 4b, 6b and 11 were
found while building **this** project and are not in that document.

**Deliberately dropped: the `pdftotext` extraction checks.** Those exist in the
CV doc because an applicant-tracking system parses the CV as text, so a lost
hyphen is a lost keyword. This report is read by humans and by nobody else. Rules
9 and 10 below survive the cut because a vanished `~` or `@` is wrong **on the
page**, not just in an extraction.

---

## 1. `block` above/below margins are MAX, not SUM

Between consecutive blocks `A` then `B`, the rendered gap is
`max(A.below, B.above)` — **not** `A.below + B.above`. Verified on this project:
`below: 20pt` against `above: 0pt` renders **20pt**, and `below: 20pt` against
`above: 6pt` also renders 20pt.

So a gap declared on both sides has no single owner, and halving one side changes
nothing. This project fixes the owner by convention:

> **Every gap token in `report/theme/theme.typ` is a BELOW-side gap. There is no
> `above` gap token anywhere in this codebase. Every `block(...)` sets
> `above: 0pt` explicitly and owns its spacing in `below:`.**

If you want an `above:` gap, you actually want the **preceding** block's
`below:`. Do not add one.

## 1b. …except against a PARAGRAPH, where an explicit `above:` wins OUTRIGHT

**This one is not in the CV document and it cost a rendered collision here.**

The `max()` rule only arbitrates between two *explicit block margins*. Against a
plain markup **paragraph**, an explicit `above:` **replaces** the paragraph's
`par.spacing` instead of competing with it. Measured, `par.spacing: 20pt`:

| Construct after a paragraph | Rendered gap |
|---|---|
| `block(above: 0pt, …)` | **0pt** — the paragraph's 20pt is destroyed |
| `block(above: 4pt, …)` | **4pt** — not `max(20, 4)` |
| `block(…)` with `above` unset | **20pt** — correct |

**Symptom:** `source-note()` printed *on top of* the last line of the paragraph it
followed. Nothing warned.

**Fix:** a component that is designed to sit directly after prose omits `above:`
entirely rather than setting it to `0pt`. In `report/lib/components.typ` that is
`source-note()` and `eyebrow()` — and only those two. Everything else lives in a
card stack, is always preceded by another block, and keeps `above: 0pt` per
rule 1.

## 2. `v(N, weak: true)` after `linebreak()` silently renders as ZERO

A `linebreak()` does not end a paragraph, so a following `v(weak: true)` has no
paragraph margin to collapse against and disappears. **Never write `linebreak()`
followed by `v()`.**

Every stacked visual line is its own `block(above: 0pt, below: Xpt)`:
portrait captions (three blocks), stat cards (label block, then value block),
plate titles (kicker block, then title block), quote cards (body block, then
source block).

## 3. List `spacing` must be at least 1.7× the within-item leading

`list.spacing` is the between-bullet gap; `par.leading × font-size` is the
within-bullet wrapped-line gap. Below about 1.7× the bullets visually merge and
the reader loses the item boundaries.

Ship exactly these pairings. **Every `set list(spacing:)` in this codebase
carries its ratio in a comment next to it.**

| use | size | leading | within | spacing | ratio |
|---|---|---|---|---|---|
| body prose lists | 9.5pt | 0.62em | 5.89pt | 11pt | 1.87× |
| lede lists | 11.5pt | 0.68em | 7.82pt | 14pt | 1.79× |
| compact lists | 8pt | 0.60em | 4.80pt | 8.5pt | 1.77× |
| source citations | 6.8pt | 0.62em | 4.22pt | 7.5pt | 1.78× |

Do not lower `spacing` to save vertical space without lowering `leading`
proportionally. **The ratio is the contract, not the numbers.**

**Rule 3 is worthless without rule 3b. Read on.**

## 3b. `spacing:` does NOTHING unless the list is `tight: false`

A Typst list written **without blank lines between its items** is a *tight* list,
and a tight list spaces its items with `par.leading`. It **ignores `spacing:`
entirely**. Since almost all prose is written without blank lines between
bullets, this is the default state, not an edge case.

Every one of the four calibrated pairings above shipped **inert**. Measured on
the rendered methodology page: bullet-to-bullet pitch **16px**, within-bullet
wrapped-line pitch **16px** — a ratio of **1.00×** where the comment beside the
code claimed 1.87×. Seven disclosure caveats rendered as one undifferentiated
grey slab.

```typst
set list(tight: false, spacing: 11pt, indent: 0pt, body-indent: 7pt, …)
//        ^^^^^^^^^^^ load-bearing. Without it the next argument is discarded.
```

**Why this one is especially dangerous:** it is invisible to every check that
does not measure pixels. The ratio comments were all present and all correct, so
a source grep for "does every `set list` carry its ratio?" reports the contract
as *passing* while nothing is enforcing it. This project's own compliance check
reported green on it for several builds.

**Verify list spacing by measuring the render, never by reading the source.**
Rasterise the page and compare between-item pitch against within-item pitch.

## 4. Quote / callout / stat cards must be `breakable: false`

A breakable card can split across a page and orphan its attribution line, or its
label with no figure, at the top of the next page. That reads as a fault, not as
a figure. Applied to `stat-row`, `stat-card`, `portrait`, `quote-card`,
`company-table`, `chart-card`, `logo-wall`.

If a card no longer fits, it moves whole. That is the intended behaviour — fix
the upstream pressure, do not make it breakable.

## 4b. Never size a card with `height: 100%` inside an auto-height grid row

A percentage height resolves against the parent. In an auto-sized grid row the
parent height is not known at that point, so it resolves to **zero** — and the
cards do not merely misalign, **they vanish and the page renders blank**. No
warning, exit code 0.

Use an explicit length (`stat-card(…, height: 26mm)`) plus `v(1fr)` inside to
push the figure to the card's foot. That is what makes a 4-up row scan as one
row when one label wraps to two lines.

## 5. Page count is structural here — keep it that way

**Every section is a scoped `#page(...)` element-function call, never `set page`
plus flowing content.** With `set page`, a 2pt spacing change on page 4 can push
a line over and shunt every later page along silently. With one `page()` call per
section, an overflow can only damage the page it is on.

`report/build.ps1` counts pages off the PDF bytes and warns on a mismatch with
`-ExpectPages`. Re-render with `-Png` and look at the seam.

## 6. SVG `currentColor` is NOT inherited by `image()`

Typst renders the SVG verbatim. A mark that relies on inheriting its fill from
the surrounding `text(fill: …)` comes out black or unfilled, and there is no way
to tint it from the call site. Such a mark must be pre-rendered to PNG with its
colour baked in, and its slug added to `RASTER-FALLBACK` in
`report/lib/assets.typ`.

## 6b. An "SVG" that is really a base64 raster costs its full weight per placement

Typst does not deduplicate an image embedded inside SVG markup the way it does a
file-backed raster. `wahine-kakano.svg` is ~500 KB of base64 inside a
`<pattern>`; three placements would add 1.5 MB against a 20 MB ceiling. Same
`RASTER-FALLBACK` map, different reason — both are documented at the map.

## 7. `linebreak()` vs `parbreak()` vs nested `block()`

| Construct | Gap governed by | Use when |
|---|---|---|
| `linebreak()` | `par.leading` | wrapping rules must carry across the lines |
| `parbreak()` | `par.spacing` | paragraph-level spacing between two spans |
| nested `block(above:, below:)` | `block.above` / `below` | **default choice here** — the only construct whose gap renders as written |

## 8. `grid` column `align:` is INSIDE-cell alignment, not page position

`align:` controls how content sits within a cell's own bounds. It cannot move a
cell, and **no grid cell can extend outside the content area into the page
margin**.

This is why the left-bleeding notch header uses `place(dx: -page-margin)` and not
a grid. `page-margin` is exactly the distance from the content edge to the paper
edge. `notch()` and `logo-lockup()` both carry a source comment saying so, so
nobody "simplifies" either into a grid.

## 9. A bare `~` in markup is a non-breaking space

`~85%` renders as a nbsp followed by `85%` — the tilde is **gone** and a ghost
space is left. Write `\~`. Enforced by `report/build.ps1`.

## 10. A bare `@` in markup is a label reference

`hello@shesharp.org.nz` in markup silently loses the address. Write `\@`.
Enforced by `report/build.ps1`.

## 10b. Escaping is MARKUP-ONLY — never "fix" a string literal

Rules 9 and 10 apply **only inside markup** (a `[...]` content block, or the
markup body of a `.typ` file). Inside a **string literal** both characters are
already literal, and adding the escape makes it worse:

```typst
#let email = "hello@shesharp.org.nz"     // correct — renders hello@shesharp.org.nz
#let email = "hello\@shesharp.org.nz"    // WRONG  — renders hello\@shesharp.org.nz
```

The second form prints a **visible backslash on the page**. Verified by
rendering, not assumed. A string interpolated into markup inserts as literal
text, so it needs no escaping at all — which is why the data layer correctly
stores `contact-email` and `org.email` as plain strings.

**Consequences for the build gate.** A naive grep for `\@` is not merely noisy,
it actively teaches people to introduce this bug. `report/build.ps1` therefore:

- strips string literals **and** `//` comments before matching, so neither a
  correct `"hello@shesharp.org.nz"` nor a heading reading `(~450 words)` can fire
  — both were real false positives on the actual tree;
- narrows the at-sign pattern to a **domain shape** (`@word.tld`) rather than any
  at-sign, because `@some-label` is *legitimate* Typst markup. Typst label names
  cannot contain a dot, so a label reference and an email can never be confused;
- reports the tilde and at-sign lists **together** before throwing, so an author
  fixes every escape in one pass;
- prints the markup-only caveat in the failure message itself.

Regression-tested against a file containing all six cases (comment, string
literal, string with `https://`, real `@label` reference, markup email, markup
tilde): exactly the two markup lines are flagged. A gate that cries wolf gets
disabled, which is worse than no gate.

## 11. Bricolage Grotesque's family name and defaults are both traps

Two separate things, both silent:

- Typst sees the family as **`Bricolage Grotesque 96pt`** — the default
  optical-size instance is baked into the name. Plain `"Bricolage Grotesque"`
  does **not** resolve; it produces a warning and a fallback face. Do not tidy
  the `96pt` off the end.
- Its variable-axis defaults are the **extremes**: weight **800**, optical size
  **96pt**. Any `text()` that does not set `weight:` explicitly renders
  ultra-bold. **Always set weight and size on display type.**

Verify with `typst fonts --font-path report\fonts --variants`.

Related: `lead-display` is `0.22em`, not the ~0.9em that looks right for body
copy. Typst's `leading` is the gap *between line boxes*, and a 46pt display face
already carries a ~46pt box — 0.86em there rendered an 85pt baseline step and a
two-line chapter title fell apart.

## 12. Narrow the compound-boxing show rule, and put it last

`#show regex(...): it => box(it)` removes internal line-break opportunities so
"AI-native" cannot break mid-compound. It must come **last** in `report-setup`,
since it is a catch-all over text and any later rule would apply to
already-boxed content.

It must also be **narrow**. A boxed URL cannot break anywhere and overflows its
column instead of wrapping. The shipped pattern bounds each segment to 2–14
ASCII letters, which keeps real compounds in and leaves URL-shaped strings (dots,
slashes, digits) out.

---

## Definition of done for any layout edit here

1. `pwsh report/build.ps1` exits 0.
2. Page count matches `-ExpectPages` with no warning.
3. `pwsh report/build.ps1 -Png` and **look at every changed page**, checking:
   - bullet gaps visibly larger than within-bullet line gaps (rule 3);
   - no card split across a page break, no orphaned attribution (rule 4);
   - no collision between prose and a following component (rule 1b);
   - stacked caption lines visibly separated (rule 2);
   - the notch still bleeds off the left paper edge (rule 8);
   - every placeholder still carries its amber marker.
4. For a `-Final` build: the provenance gate passed, so no amber marker and no
   draft ribbon appear anywhere.
5. **Measure, do not eyeball, anything with a number attached to it** — list
   ratios (rule 3b), contrast, bar lengths, card baselines. Two chart bars
   suspected of being mis-scaled by eye during review were both fine; the list
   spacing that read as fine was 1.00×.

---

# The other half: things the layout rules cannot catch

Three adversarial reviews of the rendered pages found more defects **outside**
this document than inside it. A page can obey every rule above and still be
wrong. Check these too.

## The provenance system has a blind spot, and it is everything that is not a number

`lib/metrics.typ` walks `report/data/` and marks unverified *metrics*. It cannot
inspect a diagram, a photo caption, a chart title, a chapter heading, or a
sentence of prose. **That is where an unsupportable claim will actually hide.**
Real examples caught here:

- A process diagram showing a six-month cycle, a three-month check-in and a
  close-out survey — none of which had run, on the page facing two empty database
  tables. Its source note claimed the stage names matched the database schema;
  not one of them appeared in `relationship_status`.
- A chapter kicker asserting "…for the first time", backed only by a placeholder
  that was never printed. **No heading carries an amber marker, so a claim made
  in one reads as established fact.**
- Prose stating what participants "name when asked what worked", in a report
  whose own methodology page says no survey ran.
- An organisation table headed "Registered attendees by organisation" summing to
  58 against a stated 103 registrations.

## Rules that came out of this build

1. **An empty field means "look further", not "there is nothing".** Two speakers
   were printed with employers the record did not contain, because a blank
   `company` was read as "no employer" — the bio named one two clauses in. One of
   them was attributed to a partner organisation that receives this report.
2. **Never apply house style to a quotation.** A banned-word list governs *our*
   prose. A named living person's words are reproduced verbatim, with cuts marked
   by an ellipsis, or not used.
3. **Deleting a fabricated chart does not delete the sentence that summarised it.**
   Grep the prose for claims that depended on the thing you removed.
4. **A placeholder that can never become real is not a placeholder.** If no
   process exists that would ever produce the number, remove the component rather
   than marking it. Marking implies "awaiting data".
5. **Two irreconcilable numbers on one page cost more than a missing one.** A
   reader who adds a column and finds it short stops trusting the whole document.
6. **State the comparison your reader already has.** Withholding the prior-year
   figure does not stop the comparison being made; it only stops you framing it.

## Sanity checks worth automating

- Every rendered image resolves to a **unique** source file. Duplicates crept in
  twice: a chapter plate reusing the hero photo on the very next page, and one
  portrait appearing on two pages three apart.
- Every `photo()` key used at page size uses a **plate**-role asset. A 620px
  thumbnail rendition was once stretched across a full A4 page.
- The contents page's folios match the rendered pages. Merging or splitting a
  section silently invalidates them.
