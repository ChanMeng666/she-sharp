/**
 * The karakia She Sharp opens and closes an event with.
 *
 * These two are general-purpose karakia in common use across Aotearoa — "Kia
 * hora te marino" as a tīmatanga and "Kia tau te manaakitanga" as a
 * whakamutunga. They are not iwi-specific, and they carry no event-specific
 * content, which is why they can stand as the organisational default rather
 * than being asked for again at every event.
 *
 * They arrived with the Aotearoa AI Hackathon Festival 2026 deck, supplied by
 * that client, and are reproduced verbatim. **Macrons are as received. Do not
 * "correct" them and do not paraphrase the translation.**
 *
 * A default is not a decision made for the host. `build-event-slides` reads
 * these back before the deck is built and swaps in whatever the host will
 * actually say — a venue with its own mihi, an iwi-specific karakia, or a
 * different translation. Passing `karakia:` to `buildOpeningSlides()` or
 * `buildClosingSlides()` overrides them completely.
 */

import type { KarakiaText } from "./boilerplate";

/** Opening karakia — tīmatanga. */
export const DEFAULT_OPENING_KARAKIA: KarakiaText = {
  teReo: [
    "Kia hora te marino",
    "Kia whakapapa pounamu te moana",
    "Hei huarahi mā tātou i te rangi nei",
    "Aroha atu, aroha mai",
    "Tātou i ā tātou katoa",
    "Hui e, taiki e!",
  ],
  english: [
    "May peace be widespread",
    "May the sea be like greenstone",
    "A pathway for us all this day",
    "Let us show respect for each other",
    "For one another",
    "Bind us all together",
  ],
};

/** Closing karakia — whakamutunga. */
export const DEFAULT_CLOSING_KARAKIA: KarakiaText = {
  teReo: [
    "Kia tau te manaakitanga",
    "Ki runga ki tena ki tena o tatau",
    "Kia piki te ora",
    "Kia piki te maramatanga",
    "Kia hoki pai atu, kia hoki pai mai",
    "Haumi e, Hui e, Taiki E",
  ],
  // The client supplied the English as one run-on uppercase line; split into
  // four spoken lines and set in sentence case so it reads at 44px.
  english: [
    "Settle the care and protection upon each of us",
    "May the health and understanding grow",
    "Return well to others and yourselves",
    "Join together, gather together, bind as one",
  ],
};
