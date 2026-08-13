import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SPINNER_SIZES = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

export type SpinnerSize = keyof typeof SPINNER_SIZES;

interface SpinnerProps extends React.ComponentProps<typeof Loader2> {
  /** Square dimension token. Defaults to `sm` (h-4 w-4), the inline-in-a-button size. */
  size?: SpinnerSize;
}

/**
 * The site's single loading indicator — a spinning `Loader2` at one of four sizes.
 *
 * Anything beyond the size (colour, margins) is passed through `className`,
 * which `cn` merges last so a caller can always override.
 */
export function Spinner({ size = "sm", className, ...props }: SpinnerProps) {
  return (
    <Loader2
      className={cn(SPINNER_SIZES[size], "animate-spin", className)}
      {...props}
    />
  );
}
