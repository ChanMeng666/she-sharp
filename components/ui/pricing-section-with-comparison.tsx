"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Clock } from "lucide-react";
import Link from "next/link";
import type { VolunteerPath } from "@/components/join-team/types";
import {
  AMBASSADOR_GOOGLE_FORM_URL,
  VOLUNTEER_GOOGLE_FORM_URL,
  EX_AMBASSADOR_GOOGLE_FORM_URL,
} from "@/lib/data/join-team";

function getPathHref(id: string): string {
  // --- TEMPORARY join-our-team (founder request 2026-06-25): all three cards route to
  // external Google Forms. To restore an in-site form, uncomment its original return and
  // delete the Google-Form return below it. ---
  // if (id === "volunteer") return "/join-our-team/apply?type=volunteer";
  if (id === "volunteer") return VOLUNTEER_GOOGLE_FORM_URL;
  // if (id === "ambassador") return "/join-our-team/apply?type=ambassador";
  if (id === "ambassador") return AMBASSADOR_GOOGLE_FORM_URL;
  // if (id === "ex-ambassador") return "/join-our-team/apply/ex-ambassador";
  if (id === "ex-ambassador") return EX_AMBASSADOR_GOOGLE_FORM_URL;
  return "/join-our-team";
}

function getButtonLabel(id: string): string {
  return id === "ex-ambassador" ? "Share Feedback" : "Apply Now";
}

// Thin top-accent hairline per path — brand punctuates the recommended card.
function getAccentBar(id: string): string {
  if (id === "ambassador") return "bg-brand";
  if (id === "ex-ambassador") return "bg-periwinkle";
  return "bg-mint";
}

export function PricingComparison({
  volunteerPaths,
}: {
  volunteerPaths: VolunteerPath[];
}) {
  const paths = [...volunteerPaths].reverse();

  return (
    <section className="w-full py-16 md:py-20 lg:py-24 bg-white text-foreground">
      <div className="mx-auto max-w-8xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p className="text-label text-ink-500 mb-4">Get involved</p>
          <h2 className="text-display-sm text-foreground mb-4">
            Compare volunteer paths
          </h2>
          <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you have a few hours or want to make a bigger commitment,
            there&apos;s a place for you on our team.
          </p>
        </div>

        {/* Path cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
          {paths.map((path) => {
            const isAmbassador = path.id === "ambassador";
            const href = getPathHref(path.id);
            const isExternal = href.startsWith("http");
            const responsibilities = path.responsibilities.slice(0, 4);
            const benefits = path.benefits.slice(0, 3);

            return (
              <div
                key={path.id}
                className={cn(
                  "relative card-lg border border-border bg-background p-6 lg:p-8 flex flex-col gap-5 transition-colors duration-300 hover:border-foreground/30"
                )}
              >
                {/* Thin top-accent hairline */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-x-0 top-0 h-0.5",
                    getAccentBar(path.id)
                  )}
                />

                {/* Title + commitment */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {path.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-muted px-2.5 py-1 text-xs font-medium text-ink-700 mb-4">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {path.commitment}
                  </div>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {path.description}
                  </p>
                </div>

                <hr className="border-border" />

                {/* Responsibilities */}
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider mb-3">
                    What you&apos;ll do
                  </p>
                  <ul className="space-y-2.5">
                    {responsibilities.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-base text-foreground"
                      >
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider mb-3">
                    What you get
                  </p>
                  <ul className="space-y-2.5">
                    {benefits.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2.5 text-base text-foreground"
                      >
                        <Check className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Application note + CTA */}
                <div className="mt-auto pt-1">
                  {path.applicationNote && (
                    <p className="text-sm text-muted-foreground italic mb-4">
                      {path.applicationNote}
                    </p>
                  )}
                  <Button
                    asChild
                    size="lg"
                    variant={isAmbassador ? "brand" : "outline"}
                    className="w-full"
                  >
                    <Link
                      href={href}
                      {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {getButtonLabel(path.id)}
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
