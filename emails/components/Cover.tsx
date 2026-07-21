/**
 * Cover photo — a single real event photo shown full-width directly under the
 * masthead, forming the lower half of the magazine cover plate. Square top
 * corners butt flush against the masthead's gradient band (no top border, so
 * there is no seam under the gradient); the bottom corners are rounded to close
 * the plate. Renders nothing when no photo is set, so the masthead flows
 * straight into the founder note (an intentional, clean opening rather than a
 * missing slot). No text is overlaid: email background-image / VML overlays are
 * fragile, and the nameplate's typography already lives above.
 */

import * as React from "react";
import { Section, Img } from "@react-email/components";
import { COLORS, RADIUS, SPACE, CONTAINER_WIDTH } from "../brand";

export function Cover({
  src,
}: {
  /** Absolute URL of a real, email-safe JPEG, or null for no cover. */
  src: string | null;
}): React.JSX.Element | null {
  if (!src) return null;
  return (
    <Section style={{ marginBottom: `${SPACE.lg}px` }}>
      <Img
        src={src}
        alt="A moment from a recent She Sharp event in Auckland"
        width={CONTAINER_WIDTH}
        height="auto"
        style={{
          display: "block",
          width: "100%",
          maxWidth: `${CONTAINER_WIDTH}px`,
          borderRadius: `0 0 ${RADIUS}px ${RADIUS}px`,
          borderLeft: `1px solid ${COLORS.border}`,
          borderRight: `1px solid ${COLORS.border}`,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      />
    </Section>
  );
}
