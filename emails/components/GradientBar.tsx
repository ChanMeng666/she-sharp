/**
 * Signature She Sharp gradient bar — the newsletter's one recurring motif.
 *
 * A brand-gradient divider built as a 3-cell table so Outlook (which ignores
 * CSS gradients) still shows the purple/periwinkle/mint blocks via `bgcolor`,
 * while modern clients get the real linear-gradient layered on the row via
 * `style`. Fallback: on gradient-blind clients the three solid `bgcolor` cells
 * read as a purple→periwinkle→mint tri-band — still unmistakably She Sharp.
 *
 * The height scales its role: a thicker band (6px) caps the masthead as a cover
 * accent; a thin rule (3px) marks a transition between major sections in place
 * of a decorative image.
 */

import * as React from "react";
import { Section, Row, Column } from "@react-email/components";
import { GRADIENT_CSS, GRADIENT_STOPS } from "../brand";

/**
 * `bgcolor` is a valid <td> attribute and the most Outlook-safe way to fill a
 * cell, but React dropped it from its typed attributes — surface it here.
 */
function bgcolorAttr(color: string): React.TdHTMLAttributes<HTMLTableCellElement> {
  return { bgcolor: color } as unknown as React.TdHTMLAttributes<HTMLTableCellElement>;
}

export function GradientBar({
  height = 4,
}: {
  /** Bar thickness in px. 6 = masthead cover band; 3 = section transition rule. */
  height?: number;
} = {}): React.JSX.Element {
  const h = `${height}px`;
  return (
    <Section style={{ width: "100%" }}>
      <Row
        style={{
          height: h,
          lineHeight: h,
          fontSize: "1px",
          backgroundImage: GRADIENT_CSS,
        }}
      >
        {GRADIENT_STOPS.map((color, i) => (
          <Column
            key={i}
            {...bgcolorAttr(color)}
            style={{
              height: h,
              lineHeight: h,
              fontSize: "1px",
              width: "33.33%",
              backgroundColor: color,
            }}
          >
            &nbsp;
          </Column>
        ))}
      </Row>
    </Section>
  );
}
