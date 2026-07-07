import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button Variants — She Sharp Editorial
 *
 * Principles:
 * - 16px radius by default (nav CTA can go pill via size="pill").
 * - Quiet elevation: color-only transitions, no scale/shadow.
 * - Purple is reserved for the single key CTA (`brand`).
 *
 * Variants:
 * - default: navy fill, white text (primary action)
 * - brand: purple fill → lighter purple on hover (THE CTA)
 * - outline: hairline border → darkens to navy on hover (secondary)
 * - secondary: soft purple tint, navy text (quiet secondary)
 * - destructive: red fill (dangerous action)
 * - ghost: transparent, navy text, muted hover (toolbar/nav)
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-[16px] font-medium",
    "transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // Primary: navy fill
        default: "bg-foreground text-white hover:bg-foreground/90",

        // Outline: hairline → navy border on hover
        outline:
          "bg-transparent text-foreground border border-ink-300 hover:border-foreground",

        // Brand: the single purple CTA (hover is lighter)
        brand: "bg-brand text-brand-foreground hover:bg-brand-hover",

        // Secondary: soft purple tint
        secondary:
          "bg-[#f7e5f3] text-foreground hover:bg-[#f2d4ea]",

        // Destructive
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",

        // Ghost
        ghost: "bg-transparent text-foreground hover:bg-muted",
      },
      size: {
        sm: "h-8 px-3 text-sm has-[>svg]:px-2",
        default: "h-10 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-4",
        icon: "size-10 p-0",
        pill: "h-11 rounded-full px-6 text-sm has-[>svg]:px-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? SlotPrimitive.Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
