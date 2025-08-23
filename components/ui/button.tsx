import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";;
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-purple-dark active:scale-95 transform",
  {
    variants: {
      variant: {
        // Primary Variants
        default:
          "bg-purple-dark text-white shadow-lg hover:bg-purple-mid hover:shadow-xl hover:shadow-purple-dark/25 hover:-translate-y-0.5",
        secondary:
          "bg-periwinkle-dark text-white shadow-lg hover:bg-periwinkle-dark/90 hover:shadow-xl hover:shadow-periwinkle-dark/25 hover:-translate-y-0.5",
        accent:
          "bg-mint-dark text-navy-dark shadow-lg hover:bg-mint-dark/90 hover:shadow-xl hover:shadow-mint-dark/25 hover:-translate-y-0.5",
        navy:
          "bg-navy-dark text-white shadow-lg hover:bg-navy-dark/90 hover:shadow-xl hover:shadow-navy-dark/25 hover:-translate-y-0.5",
        
        // Special Effects
        glass:
          "backdrop-blur-md bg-white/20 border border-white/20 text-navy-dark shadow-xl hover:bg-white/30 hover:shadow-2xl",
        gradient:
          "bg-gradient-to-r from-purple-dark to-periwinkle-dark text-white shadow-lg hover:shadow-xl hover:shadow-purple-mid/25 hover:scale-105",
        glassmorphism:
          "backdrop-blur-xl bg-gradient-to-r from-white/10 to-white/5 border border-white/20 text-navy-dark shadow-2xl hover:from-white/20 hover:to-white/10",
        neumorphism:
          "bg-gray-100 text-navy-dark shadow-[8px_8px_16px_#d1d1d1,_-8px_-8px_16px_#ffffff] hover:shadow-[4px_4px_8px_#d1d1d1,_-4px_-4px_8px_#ffffff]",
        
        // Border Variants
        outline:
          "border-2 border-purple-dark bg-transparent text-purple-dark shadow-md hover:bg-purple-light hover:shadow-lg hover:-translate-y-0.5",
        "outline-thick":
          "border-4 border-purple-dark bg-transparent text-purple-dark hover:border-purple-mid hover:bg-purple-light/50 hover:-translate-y-1 shadow-lg",
        "outline-dashed":
          "border-2 border-dashed border-purple-dark bg-transparent text-purple-dark hover:bg-purple-light hover:border-solid",
        "outline-gradient":
          "bg-gradient-to-r from-purple-dark to-periwinkle-dark p-[2px] text-transparent bg-clip-text hover:from-purple-mid hover:to-periwinkle-dark [&>*]:bg-white [&>*]:rounded-[calc(theme(borderRadius.md)-2px)] [&>*]:px-4 [&>*]:py-2 [&>*]:text-purple-dark",
        
        // Minimal Variants
        ghost:
          "hover:bg-purple-light hover:text-purple-dark transition-colors duration-200",
        link:
          "text-blue underline-offset-4 hover:underline hover:text-purple-dark transition-colors duration-200",
        minimal:
          "text-purple-dark hover:text-purple-mid transition-colors duration-200",
        text:
          "text-gray hover:text-navy-dark hover:bg-gray-50 rounded transition-all duration-200",
        
        // Monochrome Variants
        black:
          "bg-black text-white shadow-lg hover:bg-gray-800 hover:shadow-xl hover:-translate-y-0.5",
        white:
          "bg-white text-navy-dark border border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-0.5",
        dark:
          "bg-navy-dark text-white shadow-lg hover:bg-navy-dark/90 hover:shadow-xl hover:-translate-y-0.5",
        light:
          "bg-gray-50 text-navy-dark border border-gray-200 hover:bg-white hover:shadow-md hover:-translate-y-0.5",
        
        // State Variants
        success:
          "bg-mint-dark text-navy-dark shadow-lg hover:bg-mint-dark/90 hover:shadow-xl hover:shadow-mint-dark/25 hover:-translate-y-0.5",
        warning:
          "bg-yellow-500 text-white shadow-lg hover:bg-yellow-600 hover:shadow-xl hover:shadow-yellow-500/25 hover:-translate-y-0.5",
        danger:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5",
        info:
          "bg-blue text-white shadow-lg hover:bg-blue/90 hover:shadow-xl hover:shadow-blue/25 hover:-translate-y-0.5",
        
        // Legacy compatibility
        destructive:
          "bg-red-500 text-white shadow-lg hover:bg-red-600 hover:shadow-xl hover:shadow-red-500/25 hover:-translate-y-0.5"
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
