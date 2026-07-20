/**
 * Signature She Sharp gradient bar.
 *
 * A 4px-high divider carrying the brand gradient. Built as a 3-cell table so
 * Outlook (which ignores CSS gradients) still shows the purple/periwinkle/mint
 * blocks via `bgcolor`, while modern clients get the real linear-gradient
 * layered on the row via `style`.
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

export function GradientBar(): React.JSX.Element {
  return (
    <Section style={{ width: "100%" }}>
      <Row
        style={{
          height: "4px",
          lineHeight: "4px",
          fontSize: "1px",
          backgroundImage: GRADIENT_CSS,
        }}
      >
        {GRADIENT_STOPS.map((color, i) => (
          <Column
            key={i}
            {...bgcolorAttr(color)}
            style={{
              height: "4px",
              lineHeight: "4px",
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
