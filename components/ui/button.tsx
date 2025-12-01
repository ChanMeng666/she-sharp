import * as React from "react";
import { Slot as SlotPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Button Variants - 按钮样式设计系统
 *
 * 设计原则：
 * - 统一：所有变体使用 border-2 粗边框 + rounded-full 全圆角
 * - 高对比：确保文字在任何背景上清晰可读
 * - 无动画：仅颜色过渡，无 translate、scale、shadow 动画
 *
 * 变体说明：
 * - default: 黑底白字黑边 → 悬停白底黑字黑边（主要操作）
 * - outline: 透明底黑字黑边 → 悬停黑底白字黑边（次要操作）
 * - brand: 紫底白字紫边 → 悬停深紫底白字深紫边（关键CTA）
 * - destructive: 红底白字红边 → 悬停深红底白字深红边（危险操作）
 * - ghost: 白底黑字灰边 → 悬停浅灰底黑字灰边（工具栏/导航）
 */
const buttonVariants = cva(
  // 基础样式：统一粗边框 + 全圆角
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

        // 品牌按钮：紫底白字紫边 → 悬停深紫底白字深紫边
        brand: [
          "bg-brand text-brand-foreground border-brand",
          "hover:bg-brand-hover hover:border-brand-hover",
        ].join(" "),

        // 破坏性按钮：红底白字红边 → 悬停深红底白字深红边
        destructive: [
          "bg-destructive text-destructive-foreground border-destructive",
          "hover:bg-destructive/80 hover:border-destructive/80",
        ].join(" "),

        // 幽灵按钮：白底黑字灰边 → 悬停浅灰底黑字灰边
        ghost: [
          "bg-background text-foreground border-border",
          "hover:bg-muted",
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
