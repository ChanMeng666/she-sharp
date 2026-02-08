"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Check,
  CreditCard,
  Shield,
  ChevronLeft,
  Heart,
} from "lucide-react";

const impactStatements: Record<number, string[]> = {
  10: [
    "Provides workshop materials for one student",
    "Helps subsidize event tickets for attendees",
  ],
  25: [
    "Funds refreshments for a networking event",
    "Supports educator training materials",
    "Covers workshop supplies for multiple participants",
  ],
  50: [
    "Sponsors a student to attend a She Sharp event",
    "Contributes to AV equipment for workshops",
    "Helps bring STEM workshops to schools",
  ],
  100: [
    "Sponsors multiple students to attend events",
    "Funds a complete workshop session",
    "Supports accessibility initiatives",
    "Contributes to venue costs for events",
  ],
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const amountParam = searchParams.get("amount");
  const amount = amountParam ? parseInt(amountParam, 10) : 25;

  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState("");

  const validAmounts = [10, 25, 50, 100];
  const isValidAmount = validAmounts.includes(amount);
  const displayAmount = isValidAmount ? amount : 25;
  const impacts = impactStatements[displayAmount] || impactStatements[25];

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: displayAmount }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen pt-24 md:pt-32 pb-12 relative"
      style={{
        backgroundImage: 'url(/img/bauhaus-1764928820705.svg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 glass-overlay"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand px-4 py-2 rounded-full mb-4">
            <Heart className="h-4 w-4" />
            <span className="text-sm font-medium">Support She Sharp</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Complete Your Donation
          </h1>
          <p className="text-gray-600">
            Your generosity helps us bridge the gender gap in STEM
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {/* Donation Card */}
          <Card className="glass-card rounded-[50px]">
            <CardHeader className="text-center pb-2">
              <div className="bg-brand text-white text-xs font-semibold px-3 py-1 rounded-full inline-block mb-3 mx-auto">
                ONE-TIME DONATION
              </div>
              <CardTitle className="text-4xl font-bold text-brand">
                ${displayAmount}{" "}
                <span className="text-lg font-normal text-gray-500">NZD</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Making a difference for women in STEM
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Impact List */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Your donation will help:
                </p>
                <ul className="space-y-2">
                  {impacts.map((impact, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-brand/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3 text-brand" />
                      </div>
                      <span className="text-gray-700 text-sm">{impact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Other Amount Options */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-2">Other amounts:</p>
                <div className="flex gap-2 flex-wrap">
                  {validAmounts
                    .filter((a) => a !== displayAmount)
                    .map((a) => (
                      <Button
                        key={a}
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/donate/checkout?amount=${a}`)}
                      >
                        ${a}
                      </Button>
                    ))}
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                disabled={checkoutLoading}
                size="lg"
                variant="brand"
                className="w-full"
              >
                {checkoutLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Donate ${displayAmount} NZD
                  </>
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                <Shield className="h-4 w-4" />
                <span>Secure payment powered by Stripe</span>
              </div>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center mt-6">
            <Link
              href="/donate"
              className="text-gray-600 hover:text-brand inline-flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to donation options
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonateCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center relative"
          style={{
            backgroundImage: 'url(/img/bauhaus-1764928820705.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <div className="absolute inset-0 glass-overlay"></div>
          <Loader2 className="h-8 w-8 animate-spin text-brand relative z-10" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
