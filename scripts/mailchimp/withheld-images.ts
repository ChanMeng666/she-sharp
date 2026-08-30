/**
 * Images in the newsletter archive that must NOT be given a permanent URL.
 *
 * **AUTHORED, not generated.** `extract-archive.ts` rewrites every other file
 * in this pipeline wholesale; it must never be able to rewrite this one. These
 * are decisions a person made, and a regeneration that could overwrite a
 * decision is how a decision gets lost.
 *
 * WHY THIS EXISTS
 * ---------------
 * A pre-publication screen of all 442 content images in the back catalogue
 * found ten containing school-age children. Five are excluded from re-hosting.
 * The rule they are screened against is in
 * `docs/development/PHOTOGRAPHING_MINORS.md`: do not publish a frame in which
 * a child is the identifiable subject — the frame is about them and their face
 * is readable. A child inside a wide group shot is not that.
 *
 * THE ORDER IS THE WHOLE POINT. A Vercel Blob URL is immutable for a year, so
 * adding an image later is easy and un-publishing one is not. Excluding now and
 * restoring after a question is answered is cheap; publishing now and
 * retracting later is not available at any price. That asymmetry is why four of
 * the five are excluded over an *unresolved* question rather than a resolved
 * one — an unanswered question must not be answered by default.
 *
 * HOW IT IS ENFORCED
 * ------------------
 * An excluded image gets `data-mc-asset-withheld="1"` and **no**
 * `data-mc-asset` / `data-mc-sha256`. PR 2's re-host is a mechanical rewrite
 * over `img[data-mc-asset]`, so a withheld image is not selectable by it — the
 * exclusion is structural rather than a note somebody has to read. It is a
 * deliberately different marker from `data-mc-asset-lost`, which means the
 * image is *gone*: one is an accident of the past and one is a decision, and a
 * future reader has to be able to tell which. `archive-guard.test.ts` asserts
 * that no path here ever appears as a `data-mc-asset` value, and that the two
 * markers never land on the same element.
 *
 * The images themselves stay in the private vault, unaltered. Nothing here
 * deletes anything; it decides what gets a public URL.
 *
 * ADDING OR REMOVING AN ENTRY is a judgement about a photograph of a child.
 * It is not a code change to be made in passing.
 */

/** Why one image is withheld, and whether that could change. */
export interface WithheldImage {
  /** Path inside the vault, exactly as `campaign-images.json` records `file`. */
  file: string;
  /** The reason, in the terms `PHOTOGRAPHING_MINORS.md` uses. */
  reason: string;
  /**
   * `permanent` — the rule decides it and no new information would change it.
   * `pending`   — a question is open; answering it could put the image back.
   */
  status: "permanent" | "pending";
}

export const WITHHELD_IMAGES: WithheldImage[] = [
  {
    file: "assets/8070797-IMG_2938.jpg",
    reason:
      "A whole-class group shot from the Peyvand/Fruitvale workshops. The rule " +
      "permits a wide group shot, but PHOTOGRAPHING_MINORS.md records the school " +
      "consent behind those particular workshops as unconfirmed, and publishing a " +
      "new frame from them would answer that open question by default rather than " +
      "by decision.",
    status: "pending",
  },
  {
    file: "assets/7837889-Email-cover-1.png",
    reason:
      "A close two-person frame of identifiable students in school blazers, a " +
      "school crest legible. Fails the rule's two-part test on its face — the " +
      "frame is about them and their faces are readable. Decided by the rule " +
      "itself, not a judgement call.",
    status: "permanent",
  },
  {
    file: "assets/7870130-test.18.jpeg",
    reason:
      "Age could not be determined from the image and nothing in the surrounding " +
      "copy resolves it. Unresolved, not cleared.",
    status: "pending",
  },
  {
    file: "assets/7821413-image003.jpg",
    reason:
      "Children, but the evidence points to licensed stock rather than a She Sharp " +
      "photograph. That is a licence question, not a consent one, and it is " +
      "unestablished.",
    status: "pending",
  },
  {
    file: "assets/7832569-1683873936699.jpg",
    reason:
      "A posed line-up of secondary students at an expo; the students are the " +
      "subject. Needs the school's word.",
    status: "pending",
  },
];

/** Vault paths that must never reach a public URL. */
export const WITHHELD_ASSETS: ReadonlySet<string> = new Set(
  WITHHELD_IMAGES.map((image) => image.file)
);

/**
 * True when this vault path is withheld from re-hosting.
 *
 * @param file - A `campaign-images.json` `file` value, or null for a lost image.
 */
export function isWithheldAsset(file: string | null | undefined): boolean {
  return file !== null && file !== undefined && WITHHELD_ASSETS.has(file);
}
