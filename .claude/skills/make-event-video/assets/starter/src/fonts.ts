/**
 * The three She Sharp typefaces, matching lib/fonts.ts in the main site repo:
 * Bricolage Grotesque for display, Instrument Sans for body, Carattere for the
 * brand script accent. loadFont() registers a delayRender handle itself, so the
 * renderer will not capture a frame before the glyphs are ready.
 */
import { loadFont as loadDisplay } from "@remotion/google-fonts/BricolageGrotesque";
import { loadFont as loadSans } from "@remotion/google-fonts/InstrumentSans";
import { loadFont as loadScript } from "@remotion/google-fonts/Carattere";

const display = loadDisplay("normal", { weights: ["600", "700", "800"] });
const sans = loadSans("normal", { weights: ["400", "500", "600"] });
const script = loadScript("normal", { weights: ["400"] });

export const font = {
  display: display.fontFamily,
  sans: sans.fontFamily,
  script: script.fontFamily,
} as const;
