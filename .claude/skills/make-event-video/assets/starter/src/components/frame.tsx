import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useLayout } from "../layout";
import { alpha } from "../theme";

/**
 * Safe-area container for a graphic scene. The generous top and bottom padding
 * on 9:16 exists because Reels, Shorts and TikTok all draw their own controls
 * over those bands. See references/sizes.md in the skill.
 */
export const SceneFrame: React.FC<{
  children: React.ReactNode;
  justify?: React.CSSProperties["justifyContent"];
  gap?: number;
}> = ({ children, justify = "center", gap = 0 }) => {
  const { safe, maxContent } = useLayout();
  return (
    <AbsoluteFill
      style={{
        paddingTop: safe.top,
        paddingBottom: safe.bottom,
        paddingLeft: safe.side,
        paddingRight: safe.side,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: justify,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: maxContent,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

/**
 * She Sharp mark, optionally with a partner wordmark.
 *
 * Partner SVGs in this repo are often black-on-transparent with no fill
 * attribute. Invert them on the navy stage rather than shipping a second file.
 * Pass invertPartner={false} if the file is already light.
 */
export const LogoLockup: React.FC<{
  height: number;
  partnerSrc?: string;
  invertPartner?: boolean;
}> = ({ height, partnerSrc, invertPartner = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: height * 0.5 }}>
    <Img src={staticFile("brand/she-sharp-white.png")} style={{ height, width: "auto" }} />
    {partnerSrc ? (
      <>
        <div style={{ width: 2, height: height * 0.7, background: alpha.hairline }} />
        <Img
          src={staticFile(partnerSrc)}
          style={{
            height: height * 0.62,
            width: "auto",
            filter: invertPartner ? "brightness(0) invert(1)" : undefined,
          }}
        />
      </>
    ) : null}
  </div>
);
