import { cn } from "@/lib/utils";

/**
 * Photographer credit for a block of event photography.
 *
 * The repository has no crediting convention — none of the ~1,400 images in
 * `public/img/` carries one — so this exists to keep the first one from
 * becoming several. The credit belongs to a *block* of photographs, not to each
 * frame: a line under a gallery reads as courtesy, the same line repeated
 * twenty-four times reads as a watermark.
 */

/**
 * The 2026 hackathon shoot. Both batches carry `VISIONWORKS` in their EXIF, and
 * the studio name is spelled the way the files spell it.
 */
export const VISIONWORKS_CREDIT = "Photography by VISIONWORKS";

export interface PhotoCreditProps {
  children: React.ReactNode;
  className?: string;
}

export function PhotoCredit({ children, className }: PhotoCreditProps) {
  return (
    <p className={cn("text-label text-right text-ink-500", className)}>
      {children}
    </p>
  );
}
