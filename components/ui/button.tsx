import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button Variants - 按钮样式设计系统
 *
 * 设计原则：
 * - 简洁：仅保留 2 个核心变体
 * - 高对比：悬停时颜色反转
 * - 粗边框：2px 边框增强视觉层次
 * - 无动画：仅颜色过渡，无 translate、scale、shadow 动画
 *
 * 变体说明：
 * - default: 黑底白字 → 悬停白底黑字
 * - outline: 透明底黑字 → 悬停黑底白字
 */
const buttonVariants = cva(
  // 基础样式
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-full font-medium border-2",
    "transition-colors duration-200",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        // 主按钮：黑底白字黑边 → 悬停白底黑字黑边
        default: [
          "bg-foreground text-background border-foreground",
          "hover:bg-background hover:text-foreground",
        ].join(" "),

        // 轮廓按钮：透明底黑字黑边 → 悬停黑底白字黑边
        outline: [
          "bg-transparent text-foreground border-foreground",
          "hover:bg-foreground hover:text-background",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-3 text-sm has-[>svg]:px-2",
        default: "h-10 px-4 text-sm has-[>svg]:px-3",
        lg: "h-12 px-6 text-base has-[>svg]:px-4",
        icon: "size-10 p-0",
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
