# The four edits that actually happen

Recipes for `lib/deck/decks/<slug>.ts`. Field definitions live in
`lib/deck/types.ts`; the line numbers below are a starting point, not a promise.

Every one of these assumes Step 0's scope gate has already passed.

---

## 1. Change a word

Find the slide by its `id` — it is stable, URL-safe and also the deep-link
anchor, so `/present/<slug>#<id>` opens exactly the slide the author is looking
at. That is the fastest way to be sure you have the right one:

> Which slide? If you open the deck and press `O` for the overview, clicking a
> slide puts its name in the address bar after the `#`.

Then edit the string in place. The fields that carry words:

| Field | Limit |
|---|---|
| `title` | ≤7 words |
| `lead` | ≤18 words, one sentence |
| `points[]` / `bullets[]` | ≤5 items, ≤10 words each, **no full stops** |
| `eyebrow` | names *this* slide; must not restate `section` |
| `section` | the chapter name; repeats across slides |
| `note` | the host's note — only ever shown in `?print=1`, no limit |

**Do not touch a value that is an expression** (`deckTitleFrom(event)`,
`SPEAKERS[0].people`, `RUN_SHEET_ROWS`). Those are facts, and facts live in
`lib/data/json/events-custom.json` — see Step 2 of the skill.

---

## 2. Swap an image

Images are `DeckImage`:

```ts
{
  src: "/img/events/event-lesmills-03-september-2026/poster.webp",
  alt: "The panel poster: four speakers against a navy ground",
  focus: "50% 30%",   // object-position, for a full-bleed crop
}
```

- `src` is **site-relative** and the file must exist under `public/`.
  `verify-image-paths.ts` is the check.
- Put a new file at `public/img/events/<event-slug>/<what-it-is>.webp`. WebP,
  ≤1600px on the long edge. Every asset an event owns lives in that one
  slug-named folder, and the slug is **not** repeated in the filename — it is
  what keeps the ~50 hackathon assets findable as a set.
- `alt` is required and is real alt text, not a filename.
- **`focus` is the only way to move a crop.** `object-position` cannot be set
  from `deck-skins.css` — `DeckImage` writes it inline and inline beats any
  stylesheet. A band showing an empty strip is a `focus` problem, not a CSS one.
- **Never point at a full-resolution original.** One wall slide at source
  resolution was ~31 MB of transfer and ~1 GB of decoded bitmap.

---

## 3. Add a QR slide for a link

The most common late addition: a signup form, a Slido poll, a feedback link, a
video. `QrCtaSlide` (`lib/deck/types.ts`):

```ts
const SIGNUP_QR: QrBlock = {
  url: "https://example.com/signup",
  label: "Sign up for the next one",   // what the code does
  caption: "shesharp.org.nz/events",   // short, human-typable fallback
};

const SIGNUP_CTA: Slide = {
  id: "signup-cta",
  type: "qr-cta",
  section: "Before You Go",            // an existing chapter, not a new one
  tone: "dark",
  eyebrow: "Two taps and you are on the list",
  title: "Come To The Next One",
  lead: "Scan it now — the room is the easiest place you will ever do this",
  points: [
    "Opens in your browser, nothing to install",
    "One email a month, unsubscribe any time",
  ],
  qr: SIGNUP_QR,
  note: "Leave this up while people are still standing. Read the caption aloud for anyone whose camera will not focus.",
};
```

Then insert it into the slide array where the rhythm survives — see the rhythm
rule in the skill. `qr-cta` defaults to a full-frame layout, so **do not put two
of them next to each other**, and do not park one beside the closing feedback QR.

Rules specific to QR slides:

- **The code is generated from `url` in the browser**, so a link and its code
  cannot drift apart and generation never touches the network. There is no image
  to make and none to check.
- **A URL you do not have yet is `""`.** The slide renders a visible "Link not
  set yet" panel and the linter reports it.
- **Open the destination in a signed-out browser before the event.** The person
  building the deck is always signed in and is the one person who cannot see a
  forced-sign-in page. A Google Form with a file-upload question always forces
  sign-in and there is no setting to turn that off.
- `caption` matters. Someone's camera will not focus, and they will type it.

---

## 4. Add a speaker or guest

If the person is a **speaker on the event record**, they belong in
`lib/data/json/events-custom.json`, not in the deck — the deck reads
`speakerGroupsFrom(event)` and the website and the slides then agree. That is a
`fix(events):` commit of its own, and the deck usually needs no edit at all.

Only when the person is *not* an event speaker — a surprise guest, a sponsor's
representative, a judge added on the day — do they go straight onto a
`PeopleSlide`:

```ts
{
  id: "guest-judges",
  type: "people",
  section: "Meet the Panel",
  eyebrow: "Catch them at the break",
  title: "Two More In The Room",
  lead: "Joining the panel for the second half",
  people: [
    { name: "Ada Lovelace", role: "Principal Engineer", org: "Acme",
      image: "/img/events/<event-slug>/ada-lovelace.webp" },
  ],
  density: "lg",
  shape: "card",
  note: "Read the names out. Say each person's role, not their biography.",
}
```

- **`density` caps how many people fit**, and the linter enforces it:
  `lg` = 4 across with roles, `md` = 6/8, `sm` = names only. Adding a fifth
  person to a `lg` slide fails the check — either drop to `md` or split the
  slide.
- `image` is optional; without one the layout draws an initials tile, which is
  much better than a stretched photo grabbed from LinkedIn.
- Headshots go to `public/img/events/<event-slug>/<firstname-lastname>.webp`.
- Bios do not go on the slide. Long-form material stays on the event page and is
  reached by a QR slide.
