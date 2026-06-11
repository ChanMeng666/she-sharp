"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Loader2 } from "lucide-react";

const impactMessages: Record<number, string> = {
  10: "Your $10 donation helps provide workshop materials for students and subsidize event tickets.",
  25: "Your $25 donation supports networking events and educator training materials.",
  50: "Your $50 donation helps bring STEM workshops to schools and supports students attending events.",
  100: "Your $100 donation funds complete workshop sessions and supports multiple accessibility initiatives.",
};

function SuccessContent() {
  const searchParams = useSearchParams();
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? parseInt(amountParam, 10) : 25;
  const impactMessage = impactMessages[amount] || impactMessages[25];

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 pt-24 pb-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-brand">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>

        <h1 className="text-3xl font-bold text-foreground md:text-4xl">
          Thank You!
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your generous donation of{" "}
          <span className="font-semibold text-brand">${amount} NZD</span> has
          been received.
        </p>

        <div className="mt-8 rounded-xl border border-border bg-muted/40 p-6 text-left">
          <p className="font-medium text-foreground">Your Impact</p>
          <p className="mt-1 text-sm text-muted-foreground">{impactMessage}</p>
        </div>

        <Button asChild variant="brand" className="mt-8">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <p className="mt-8 text-xs text-muted-foreground">
          A receipt has been sent to your email address. She Sharp is a
          registered non-profit organisation.
        </p>
      </div>
    </div>
  );
}

export default function DonateSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
