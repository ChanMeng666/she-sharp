# `styles/` — the deck stage, and one sitewide trap

## Deck CSS: four rules that fail silently

Inside `.deck-stage` (`styles/components/deck.css`):

1. **Never `vw`/`vh`/`dvh`** — they resolve against the real viewport, not the
   scaled stage. Use `cqi`, fixed design px, and the `.deck-*` type classes.
2. The stage is centred with `translate(-50%, -50%) scale()`, **not** flex/grid.
   A grid will never centre an oversized item.
3. Grid tracks must be `minmax(0, 1fr)` before a percentage `max-block-size` on
   a child means anything.
4. **Responsive `--dt-*` overrides go on `.deck-slide`, never `.deck-stage`** —
   the stage *is* the named container and cannot match its own container query.
   Also: `@container deck (max-width: 1000px)` must stay **below** the 1560px
   block.

Each of these fails by producing a layout that looks plausible rather than an
error. Everything else about decks — the visual language, the phone fix, the
copy and rhythm linter, skins, motion, host controls — is in
`docs/development/DECK_SYSTEM.md`. Read it before editing a deck or a slide
layout.

## `body` uses `overflow-x: clip`, not `hidden`

In `app/globals.css`. `hidden` establishes a scroll container and breaks
`position: sticky` sitewide; the event detail page's "Time & location" sidebar
is the first consumer that noticed.
