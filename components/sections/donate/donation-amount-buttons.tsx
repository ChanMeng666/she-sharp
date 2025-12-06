"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const donationAmounts = [
  { amount: 10, label: "$10" },
  { amount: 25, label: "$25" },
  { amount: 50, label: "$50" },
  { amount: 100, label: "$100" },
];

interface DonationAmountButtonsProps {
  className?: string;
  variant?: "light" | "dark";
}

export function DonationAmountButtons({
  className,
  variant = "light",
}: DonationAmountButtonsProps) {
  const isDark = variant === "dark";

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>
      {donationAmounts.map(({ amount, label }) => (
        <Button
          key={amount}
          asChild
          size="lg"
          className={cn(
            "h-14 md:h-16 text-lg md:text-xl font-bold rounded-xl transition-all",
            isDark
              ? "bg-white text-[#9b2e83] hover:bg-white/90 hover:scale-105"
              : "bg-[#9b2e83] text-white hover:bg-[#7a2468] hover:scale-105"
          )}
        >
          <Link href={`/donate/checkout?amount=${amount}`}>{label}</Link>
        </Button>
      ))}
    </div>
  );
}
