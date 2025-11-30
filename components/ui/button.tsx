import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";;
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-ring active:scale-95 transform",
  {
    variants: {
      variant: {
        // Primary Variants
        default:
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90 hover:shadow-xl hover:shadow-secondary/25 hover:-translate-y-0.5",
        accent:
          "bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5",
        navy:
          "bg-foreground text-background shadow-lg hover:bg-foreground/90 hover:shadow-xl hover:shadow-foreground/25 hover:-translate-y-0.5",

        // Special Effects
        glass:
          "backdrop-blur-md bg-background/20 border border-border text-foreground shadow-xl hover:bg-background/30 hover:shadow-2xl",
        gradient:
          "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25 hover:scale-105",
        glassmorphism:
          "backdrop-blur-xl bg-background/10 border border-border text-foreground shadow-2xl hover:bg-background/20",
        neumorphism:
          "bg-accent text-foreground shadow-[8px_8px_16px_hsl(var(--muted)),_-8px_-8px_16px_hsl(var(--background))] hover:shadow-[4px_4px_8px_hsl(var(--muted)),_-4px_-4px_8px_hsl(var(--background))]",

        // Border Variants
        outline:
          "border-2 border-primary bg-transparent text-primary shadow-md hover:bg-muted hover:shadow-lg hover:-translate-y-0.5",
        "outline-thick":
          "border-4 border-primary bg-transparent text-primary hover:border-primary/70 hover:bg-muted/50 hover:-translate-y-1 shadow-lg",
        "outline-dashed":
          "border-2 border-dashed border-primary bg-transparent text-primary hover:bg-muted hover:border-solid",
        "outline-gradient":
          "border-2 border-primary bg-transparent text-primary hover:bg-muted hover:shadow-lg hover:-translate-y-0.5",

        // Minimal Variants
        ghost:
          "hover:bg-muted hover:text-foreground transition-colors duration-200",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary/70 transition-colors duration-200",
        minimal:
          "text-primary hover:text-primary/70 transition-colors duration-200",
        text:
          "text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-all duration-200",

        // Monochrome Variants
        black:
          "bg-foreground text-background shadow-lg hover:bg-foreground/90 hover:shadow-xl hover:-translate-y-0.5",
        white:
          "bg-background text-foreground border border-border shadow-md hover:shadow-lg hover:-translate-y-0.5",
        dark:
          "bg-foreground text-background shadow-lg hover:bg-foreground/90 hover:shadow-xl hover:-translate-y-0.5",
        light:
          "bg-accent text-foreground border border-border hover:bg-background hover:shadow-md hover:-translate-y-0.5",

        // State Variants
        success:
          "bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 hover:shadow-xl hover:shadow-accent/25 hover:-translate-y-0.5",
        warning:
          "bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/25 hover:-translate-y-0.5",
        danger:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5",
        info:
          "bg-secondary text-secondary-foreground shadow-lg hover:bg-secondary/90 hover:shadow-xl hover:shadow-secondary/25 hover:-translate-y-0.5",

        // Legacy compatibility
        destructive:
          "bg-destructive text-destructive-foreground shadow-lg hover:bg-destructive/90 hover:shadow-xl hover:shadow-destructive/25 hover:-translate-y-0.5"
      },
      size: {
        xs: "h-6 px-2 text-xs gap-1 has-[>svg]:px-1.5",
        sm: "h-8 px-3 text-sm gap-1.5 has-[>svg]:px-2.5",
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-4",
        xl: "h-14 px-8 text-lg has-[>svg]:px-6",
        icon: "size-10 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
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
