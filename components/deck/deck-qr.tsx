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
 * Two modes, one data shape. `image` renders the committed file at
 * `qr.image` — what ships while the team is still producing codes in Canva.
 * `generate` renders `qr.url` with `qrcode.react`, which draws entirely in the
 * browser, so switching modes never introduces a network dependency at a venue.
 * Flip `DECK_QR_MODE` in `lib/deck/theme.ts`; deck data does not change.
 *
 * The caption is not decoration: half the room photographs the slide rather
 * than scanning it, and the other half is too far back for the code to resolve.
 */
export function DeckQr({ qr, size = 320, className, bare = false }: DeckQrProps) {
  return (
    <div className={cn("flex flex-col items-center", className)} style={{ gap: 20 }}>
      <div
        className="deck-logo-chip"
        style={{ padding: 20, borderRadius: 24, width: size + 40, height: size + 40 }}
      >
        {DECK_QR_MODE === "generate" ? (
          <QRCodeSVG
            value={qr.url}
            size={size}
            level="H"
            fgColor="#9b2e83"
            bgColor="#ffffff"
          />
        ) : (
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
        )}
      </div>

      {!bare && (
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
      )}
    </div>
  );
}
