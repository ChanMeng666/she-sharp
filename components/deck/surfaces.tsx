/**
 * The ground under a statement slide, dispatched by the slide's skin.
 *
 * WHY A DISPATCH AND NOT A COMPONENT. Five layouts — title, section, stats,
 * prizes, qr-cta — used to call `<ArchiveWall>` directly, which is what made
 * every deck in the repository look like the same deck. They now ask for "the
 * surface", and which surface that is depends on whether the slide is
 * organisational (always the archive) or the event's own (the event's skin).
 * The five layouts do not know or care which; that is the whole point.
 *
 * A NEW SURFACE KIND IS ONE BRANCH HERE plus a variant on `SurfaceSpec` in
 * `lib/deck/types.ts`. It is deliberately not a component slot on the skin
 * object: a skin is plain serialisable data, so it can be linted, described in
 * a build report, and reasoned about without rendering it.
 */

"use client";

import { createContext, useContext, useMemo, type CSSProperties } from "react";

import { DeckImage as DeckImg } from "@/components/deck/deck-image";
import { ArchiveBand, ArchiveWall } from "@/components/deck/slides/archive";
import { platePlacement, skinForSlide } from "@/lib/deck/skins";
import type {
  ArchiveWeaveKey,
  DeckSkin,
  Slide,
  SurfaceSpec,
} from "@/lib/deck/types";
import { cn } from "@/lib/utils";

/**
 * The deck's event skin and its archive weave, published by `DeckStage`.
 *
 * Context rather than a prop because a layout is handed its slide and nothing
 * else — the same constraint that forces `seedFrom()` to derive from the id.
 * Defaults to the house skin in its original arrangement, so a layout rendered
 * outside a stage still has a ground rather than throwing. (Nothing does that
 * today: both `deck-viewport.tsx` and `deck-print.tsx` wrap in `DeckStage`. The
 * default is insurance, not a code path.)
 *
 * ONE context carrying both, not two. The weave and the event skin are read
 * together on every single slide, by the same hook, and two providers would be
 * two subscriptions for one decision.
 */
interface DeckSkinScope {
  eventSkin: DeckSkin | undefined;
  weave: ArchiveWeaveKey;
}

const SkinContext = createContext<DeckSkinScope>({
  eventSkin: undefined,
  weave: "drift",
});

export function DeckSkinProvider({
  skin,
  weave,
  children,
}: {
  skin: DeckSkin | undefined;
  weave: ArchiveWeaveKey;
  children: React.ReactNode;
}) {
  const value = useMemo<DeckSkinScope>(
    () => ({ eventSkin: skin, weave }),
    [skin, weave],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

/** The skin this slide wears — the event's, unless it is an organisational one. */
export function useSlideSkin(slide: Pick<Slide, "surface">): DeckSkin {
  const { eventSkin, weave } = useContext(SkinContext);
  return useMemo(
    () => skinForSlide(slide.surface, eventSkin, weave),
    [slide.surface, eventSkin, weave],
  );
}

/**
 * A field built from an event's own artwork.
 *
 * Full bleed, one plate, panned by the slide's seed so eight statement slides
 * do not show one identical crop. The plate keeps its own colours — it is this
 * event's artwork, not archive photography used as mass, so the purple duotone
 * that holds the archive together would be actively wrong here.
 *
 * `deck-plate-field` in `deck-skins.css` owns the scrim and the optional drift.
 * The drift is scoped there to the ACTIVE slide, for the reason recorded at
 * length in `deck.css`: an ambient loop on every mounted slide is what used to
 * kill the tab on iOS.
 */
function PlateField({
  spec,
  seed,
}: {
  spec: Extract<SurfaceSpec, { kind: "plate" }>;
  seed: number;
}) {
  const { image } = platePlacement(spec, seed);

  return (
    <div
      className={cn("deck-plate-field", spec.drift && "deck-plate-drift")}
      aria-hidden="true"
    >
      <DeckImg image={image} fit="cover" />
    </div>
  );
}

/** The full-bleed ground of a statement slide. */
export function DeckSurface({
  slide,
  seed,
}: {
  slide: Pick<Slide, "surface">;
  seed: number;
}) {
  const skin = useSlideSkin(slide);

  switch (skin.surface.kind) {
    case "plate":
      return <PlateField spec={skin.surface} seed={seed} />;
    case "archive":
    default:
      return <ArchiveWall seed={seed} />;
  }
}

/**
 * The surface reduced to one strip, for a light slide.
 *
 * The band is how a skin survives on a light ground — the same language
 * transposed rather than a second design. Every surface kind owes one, because
 * a light slide with no band is a light slide with no family resemblance to the
 * dark ones on either side of it.
 */
export function DeckSurfaceBand({
  slide,
  seed,
  place = "end",
}: {
  slide: Pick<Slide, "surface">;
  seed: number;
  place?: "start" | "end";
}) {
  const skin = useSlideSkin(slide);

  if (skin.surface.kind === "plate") {
    const { image } = platePlacement(skin.surface, seed);
    const style: CSSProperties =
      place === "end"
        ? { insetBlockEnd: 0 }
        : { insetBlockStart: "var(--deck-rail-h)" };

    return (
      <div
        className={cn(
          "deck-plate-band",
          place === "end" ? "deck-edge-block-start" : "deck-edge-block-end",
        )}
        style={style}
        aria-hidden="true"
      >
        <DeckImg image={image} fit="cover" />
      </div>
    );
  }

  return <ArchiveBand seed={seed} place={place} />;
}
