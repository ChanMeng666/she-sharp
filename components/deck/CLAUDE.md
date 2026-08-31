# `components/deck/`

`/present/<event-slug>` is built from **typed slide data**, not hand-written
JSX — types, boilerplate, skins, motion, lint and the registry live in
`lib/deck/`, and a build-failing copy and rhythm linter gates every deck. Skins
sit over a fixed house sequence on a fluid 4:3–21:9 stage.

Organisers use the `/build-event-slides` and `/tweak-event-slides` skills and
never touch TypeScript. `EDITORIAL_SKIN` is the reusable default for a regular
evening deck.

**Read `docs/development/DECK_SYSTEM.md` before editing a slide layout.** The
CSS rules that fail silently are in `styles/CLAUDE.md`; deck behaviour that used
to live in `deck-viewport.tsx` is now in `hooks/use-deck-keyboard.ts`,
`use-deck-swipe.ts`, `use-deck-preload.ts` and `use-wake-lock.ts`.

Do not diff deck screenshots — two runs of the same build differ by around 65%.
Capture layout geometry with Playwright instead, and detect a mid-word break
with `getClientRects().length > 1`.
