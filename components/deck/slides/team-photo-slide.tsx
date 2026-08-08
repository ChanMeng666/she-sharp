import { DeckImage } from "@/components/deck/deck-image";
import type { TeamPhotoSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/**
 * Above this many characters the team's name drops from display to title size.
 *
 * Twelve of the thirteen names are one short word. `kpi-kaitiaki-positive-impact`
 * is twenty-eight characters, and at display size on a 4:3 projector it wraps to
 * four lines and starts competing with the photograph instead of labelling it.
 * The threshold sits above `kaitiakidata` and `kai-sense-ai` (twelve each) so
 * only the genuine outlier moves — the block still reads as one design when the
 * host steps through it, which a per-slide `clamp()` on character count would
 * quietly destroy.
 */
const LONG_NAME = 14;

/**
 * One team: their own photograph at full height, their name at reading size.
 *
 * THE PHOTOGRAPH IS NEVER CROPPED, AND THAT IS THE WHOLE REASON THIS LAYOUT
 * EXISTS. These frames are portrait — 3:4, shot on a phone, the team in two
 * rows — and the stage runs 4:3 to 21:9. A `photo` slide bleeds its image off
 * every edge, which on a 3:4 source keeps a horizontal band about 42% of the
 * original height; on these particular frames that band cuts the front row off
 * at the chest. One `focus` value cannot save twelve differently-composed
 * photographs, and the loss is invisible in the file and obvious only once it
 * is six metres wide in front of the people in it.
 *
 * So the image keeps its own aspect inside a bounded column and the landscape
 * stage's spare width — which is most of the stage — carries the name. The
 * split is a percentage rather than a breakpoint because the stage is fluid:
 * the column is the same fraction of a 4:3 projector and a 21:9 wall, capped in
 * px at both ends so it neither collapses on the narrowest stage nor turns into
 * a billboard on the widest.
 */
export function TeamPhotoSlideLayout({ slide }: { slide: TeamPhotoSlide }) {
  const nameClass = slide.team.length > LONG_NAME ? "deck-title" : "deck-display";

  return (
    <div className="deck-safe">
      {/* `minmax(0, 1fr)` on the row, and `minBlockSize: 0` on the grid, before
          the photo column's percentage height means anything — the same trap
          documented on `.deck-contain-box` and in `photo-slide.tsx`. Without
          both, the row sizes to the image's intrinsic 1492px and the slide
          overflows the stage while looking perfectly composed in the file. */}
      <div
        className="deck-content grid flex-1"
        style={{
          gap: "var(--deck-gap-lg)",
          gridTemplateColumns:
            "minmax(0, clamp(300px, 36%, 620px)) minmax(0, 1fr)",
          gridTemplateRows: "minmax(0, 1fr)",
          alignItems: "center",
          minBlockSize: 0,
        }}
      >
        {/* `.deck-contain-box` is `position: relative; min-block-size: 0`, and
            its child image is pinned `inset: 0` with `object-fit: contain`, so
            the portrait frame letterboxes inside the column instead of being
            cropped by it. Full colour, never the duotone: this is one team
            looking at themselves, not the archive used as texture — the same
            distinction `photo-slide.tsx` draws against `photo-grid`. */}
        <div className="deck-contain-box" style={{ blockSize: "100%" }}>
          <DeckImage image={slide.image} fit="contain" />
        </div>

        <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
          <Kicker text={slide.eyebrow} />

          {slide.index && (
            <p
              className="deck-title"
              style={{ color: "var(--slide-accent)", lineHeight: 1 }}
            >
              {slide.index}
            </p>
          )}

          {/* `anywhere` rather than `break-word`: these names are hyphenated
              Discord handles, so the browser already has good break points and
              will use them first. This only stops a hypothetical unbroken name
              from running off the trailing edge instead of wrapping. */}
          <h2 className={nameClass} style={{ overflowWrap: "anywhere" }}>
            {slide.team}
          </h2>

          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>
      </div>
    </div>
  );
}
