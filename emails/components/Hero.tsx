/**
 * Cover hero: a full-width brand illustration sitting on the page background
 * directly below the masthead, forming a magazine-cover opening. No text is
 * overlaid on the image (email background-image / VML overlays are fragile);
 * the cover's typography lives in the masthead above it.
 */

import * as React from "react";
import { Section, Img } from "@react-email/components";
import { COLORS, RADIUS, SPACE, CONTAINER_WIDTH, HERO_DEFAULT_URL } from "../brand";

export function Hero({
  src,
}: {
  /** Per-issue override; falls back to the default community art. */
  src: string | null;
}): React.JSX.Element {
  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      <Img
        src={src ?? HERO_DEFAULT_URL}
        alt="She Sharp — connecting women across the New Zealand tech community"
        width={CONTAINER_WIDTH}
        height="auto"
        style={{
          display: "block",
          width: "100%",
          maxWidth: `${CONTAINER_WIDTH}px`,
          borderRadius: `${RADIUS}px`,
          border: `1px solid ${COLORS.border}`,
        }}
      />
    </Section>
  );
}
