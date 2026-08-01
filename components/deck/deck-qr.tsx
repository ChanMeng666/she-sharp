"use client";

import { QRCodeSVG } from "qrcode.react";

import { DECK_QR_MODE } from "@/lib/deck/theme";
import type { QrBlock } from "@/lib/deck/types";
import { cn } from "@/lib/utils";

interface DeckQrProps {
  qr: QrBlock;
  /** Rendered size in design px. Never go below 260: it stops scanning. */
  size?: number;
  className?: string;
  /** Hide the label and caption when the surrounding layout supplies them. */
  bare?: boolean;
}

/**
 * A scannable code sized for a room.
 *
 * Drawn from `qr.url` in the browser, so it is always the link it claims to be
 * and never depends on the network at a venue. `DECK_QR_MODE` switches to a
 * committed image when someone else's pre-made code has to be used verbatim.
 *
 * Error correction is deliberately `M`, not `H`. The usual reason to pick `H`
 * is a logo punched through the middle or a printed code that will get scuffed;
 * neither applies to a projected code. What does apply is distance, and `M`
 * spends the same physical area on fewer, larger modules — which is exactly
 * what a phone at the back of the room needs. A long Google Forms URL at `H`
 * produces a code dense enough to fail from six metres.
 *
 * The caption is not decoration: half the room photographs the slide instead of
 * scanning it, and the other half is too far back for any code to resolve.
 */
export function DeckQr({ qr, size = 320, className, bare = false }: DeckQrProps) {
  const hasUrl = qr.url.trim().length > 0;
  const chrome = (
    <div className="text-center">
      <p className="deck-label" style={{ color: "var(--slide-ink)" }}>
        {qr.label}
      </p>
      {qr.caption && (
        <p className="deck-muted" style={{ fontSize: 26, marginTop: 8 }}>
          {qr.caption}
        </p>
      )}
    </div>
  );

  /* A link that does not exist yet must look like one. A dead code that merely
     looks fine is the failure a host cannot catch from the front of the room. */
  if (!hasUrl) {
    return (
      <div className={cn("flex flex-col items-center", className)} style={{ gap: 20 }}>
        <div
          className="grid place-items-center text-center"
          style={{
            inlineSize: size + 40,
            blockSize: size + 40,
            padding: 24,
            borderRadius: 24,
            border: "4px dashed var(--slide-accent)",
            background: "var(--slide-surface)",
            color: "var(--slide-accent)",
          }}
        >
          <span className="deck-label" style={{ color: "var(--slide-accent)" }}>
            Link not set yet
          </span>
        </div>
        {!bare && chrome}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col items-center", className)} style={{ gap: 20 }}>
      <div
        className="deck-logo-chip"
        style={{ padding: 20, borderRadius: 24, inlineSize: size + 40, blockSize: size + 40 }}
      >
        {DECK_QR_MODE === "image" && qr.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qr.image}
            alt={`QR code linking to ${qr.label}`}
            width={size}
            height={size}
            style={{ width: size, height: size, objectFit: "contain" }}
            decoding="async"
            draggable={false}
          />
        ) : (
          <QRCodeSVG
            value={qr.url}
            size={size}
            level="M"
            /* Brand purple, matching `/api/qr` and the printed codes. At 7:1 on
               white it is far above what a scanner needs, so consistency wins. */
            fgColor="#9b2e83"
            bgColor="#ffffff"
            title={`QR code linking to ${qr.label}`}
          />
        )}
      </div>

      {!bare && chrome}
    </div>
  );
}
