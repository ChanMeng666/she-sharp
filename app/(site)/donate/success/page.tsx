"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Heart, Home, Share2, Loader2 } from "lucide-react";

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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#9b2e83] rounded-full mb-4">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* Thank You Message */}
          <h1 className="text-3xl md:text-4xl font-bold text-[#1f1e44] mb-4">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your generous donation of <span className="font-semibold text-[#9b2e83]">${amount} NZD</span> has been received.
          </p>

          {/* Impact Card */}
          <Card className="border-0 shadow-2xl shadow-foreground/10 bg-background/95 backdrop-blur-xl rounded-[50px] mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-[#9b2e83] flex-shrink-0 mt-1" />
                <div className="text-left">
                  <p className="font-medium text-[#1f1e44] mb-1">Your Impact</p>
                  <p className="text-gray-600 text-sm">{impactMessage}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#9b2e83]">2200+</p>
              <p className="text-xs text-gray-500">Members</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#9b2e83]">50+</p>
              <p className="text-xs text-gray-500">Sponsors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#9b2e83]">84+</p>
              <p className="text-xs text-gray-500">Events</p>
            </div>
          </div>

          {/* Social Share Message */}
          <p className="text-sm text-gray-500 mb-6">
            Help us spread the word about supporting women in STEM!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="brand">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const shareText = `I just donated to @SheSharpp to support women in STEM! Join me in making a difference.`;
                const shareUrl = "https://shesharp.co.nz/donate";
                if (navigator.share) {
                  navigator.share({
                    title: "Support She Sharp",
                    text: shareText,
                    url: shareUrl,
                  });
                } else {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
                    "_blank"
                  );
                }
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>

          {/* Receipt Notice */}
          <p className="text-xs text-gray-400 mt-8">
            A receipt has been sent to your email address. She Sharp is a registered non-profit organization.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function DonateSuccessPage() {
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
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm"></div>
          <Loader2 className="h-8 w-8 animate-spin text-[#9b2e83] relative z-10" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
