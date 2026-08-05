/**
 * The karakia She Sharp opens and closes an event with.
 *
 * **These are the standing pair. She Sharp uses the same tīmatanga and the same
 * whakamutunga at every event**, confirmed by the team on 2026-08-05, so this
 * is the organisation's own karakia rather than a placeholder waiting to be
 * replaced per event.
 *
 * Both are general-purpose karakia in common use across Aotearoa — "Kia hora te
 * marino" opening, "Kia tau te manaakitanga" closing. Neither is iwi-specific
 * and neither carries event-specific content, which is what makes a standing
 * default the right call here.
 *
 * They first arrived with the Aotearoa AI Hackathon Festival 2026 deck and are
 * reproduced verbatim. **Macrons are as received. Do not "correct" them and do
 * not paraphrase the translation.**
 *
 * A standing default is still not a decision made *for* a host. Passing
 * `karakia:` to `buildOpeningSlides()` or `buildClosingSlides()` overrides them
 * completely — for a venue that opens with its own mihi, or a guest who will
 * read something else. That is the exception, not the routine, so
 * `build-event-slides` no longer needs to ask about it at every event.
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
