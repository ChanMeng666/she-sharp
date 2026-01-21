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
}

export function DonationAmountButtons({
  className,
}: DonationAmountButtonsProps) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4", className)}>
      {donationAmounts.map(({ amount, label }) => (
        <Button
          key={amount}
          asChild
          size="lg"
        >
          <Link href={`/donate/checkout?amount=${amount}`}>{label}</Link>
        </Button>
      ))}
    </div>
  );
}
