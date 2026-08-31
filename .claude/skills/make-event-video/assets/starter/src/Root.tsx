import "./index.css";
import { Composition } from "remotion";
import { Promo, TOTAL_FRAMES } from "./Promo";
import { FPS } from "./theme";

/**
 * One edit, four deliverables. Scenes read the frame's shape from useLayout()
 * and recompose — safe areas, grid columns and type scale all change — rather
 * than being letterboxed from a single master.
 *
 *   9:16  Reels, Stories, TikTok, Shorts, LinkedIn vertical
 *   4:5   Instagram + Facebook feed (tallest the feed allows)
 *   1:1   LinkedIn + Instagram feed, and anywhere a square is safest
 *  16:9   YouTube, LinkedIn landscape, the website, playing in the room
 */
const SIZES = [
  { id: "Promo-Vertical-9x16", width: 1080, height: 1920 },
  { id: "Promo-Portrait-4x5", width: 1080, height: 1350 },
  { id: "Promo-Square-1x1", width: 1080, height: 1080 },
  { id: "Promo-Landscape-16x9", width: 1920, height: 1080 },
];

export const RemotionRoot: React.FC = () => (
  <>
    {SIZES.map(({ id, width, height }) => (
      <Composition
        key={id}
        id={id}
        component={Promo}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={width}
        height={height}
      />
    ))}
  </>
);
