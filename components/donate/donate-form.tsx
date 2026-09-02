"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

const DONATION_AMOUNTS = [10, 25, 50, 100];

/**
 * Single-page donation form: pick a preset amount and go straight to Stripe
 * Checkout. The donor's email is collected on Stripe's hosted page.
 */
export function DonateForm({ className }: { className?: string }) {
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDonate = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: selectedAmount }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Failed to start checkout. Please try again.");
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("mx-auto w-full max-w-md", className)}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {DONATION_AMOUNTS.map((amount) => (
          <button
            key={amount}
            type="button"
            onClick={() => setSelectedAmount(amount)}
            aria-pressed={selectedAmount === amount}
            className={cn(
              "rounded-xl border-2 py-4 text-lg font-semibold transition-colors",
              selectedAmount === amount
                ? "border-brand bg-brand text-white"
                : "border-border bg-muted text-foreground hover:border-brand"
            )}
          >
            ${amount}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Button
        onClick={handleDonate}
        disabled={loading}
        size="lg"
        variant="brand"
        className="mt-6 w-full"
      >
        {loading ? (
          <>
            <Spinner className="mr-2" />
            Processing...
          </>
        ) : (
          <>
            <Heart className="mr-2 h-4 w-4" />
            Donate ${selectedAmount} NZD
          </>
        )}
      </Button>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Secure payment powered by Stripe. She Sharp is a registered non-profit
        organisation.
      </p>
    </div>
  );
}
