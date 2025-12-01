"use client"

import * as React from "react"
import { HelpCircle } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface HintIconProps {
  hint: string
  className?: string
  side?: "top" | "right" | "bottom" | "left"
}

export function HintIcon({ hint, className, side = "top" }: HintIconProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger
        type="button"
        className={cn(
          "inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full",
          className
        )}
        onClick={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
        onTouchStart={(e) => {
          e.preventDefault()
          setOpen(!open)
        }}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="sr-only">More information</span>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className="max-w-[280px] sm:max-w-[320px] text-sm leading-relaxed"
        sideOffset={5}
      >
        {hint}
      </TooltipContent>
    </Tooltip>
  )
}
