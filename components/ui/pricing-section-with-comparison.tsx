"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Clock, ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import type { VolunteerPath } from "@/components/join-team/types";
import { AMBASSADOR_GOOGLE_FORM_URL } from "@/lib/data/join-team";

function getPathHref(id: string): string {
  if (id === "volunteer") return "/join-our-team/apply?type=volunteer";
  // --- TEMPORARY ambassador (founder request 2026-06-25): route to external Google Form. ---
  // To restore the in-site form, uncomment the next line and delete the Google-Form return below it.
  // if (id === "ambassador") return "/join-our-team/apply?type=ambassador";
  if (id === "ambassador") return AMBASSADOR_GOOGLE_FORM_URL;
  if (id === "ex-ambassador") return "/join-our-team/apply/ex-ambassador";
  return "/join-our-team";
}

function getButtonLabel(id: string): string {
  return id === "ex-ambassador" ? "Share Feedback" : "Apply Now";
}

function getAccentBorder(id: string): string {
  if (id === "ambassador") return "border-t-brand";
  if (id === "ex-ambassador") return "border-t-periwinkle-dark";
  return "border-t-periwinkle-dark";
}

function getCheckColor(id: string): string {
  if (id === "ambassador") return "text-brand";
  return "text-periwinkle-dark";
}

function getCommitmentPill(id: string): string {
  if (id === "ambassador") return "text-brand";
  return "text-periwinkle-dark";
}

function getCardBg(_id: string): string {
  return "bg-white";
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
          <h2 className="text-display-sm text-foreground mb-4">
            Compare Volunteer Paths
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
            const responsibilities = path.responsibilities.slice(0, 4);
            const benefits = path.benefits.slice(0, 3);

            return (
              <div
                key={path.id}
                className={cn(
                  "relative card-lg border border-t-4 p-6 lg:p-8 flex flex-col gap-5 transition-all duration-300 hover:-translate-y-1.5",
                  getAccentBorder(path.id),
                  getCardBg(path.id),
                  isAmbassador
                    ? "border-brand/20 shadow-brand/10"
                    : "border-border"
                )}
              >
                {/* Title + commitment */}
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {path.title}
                  </h3>
                  <div
                    className={cn(
                      "inline-flex items-center gap-1.5 py-1.5 text-sm font-medium mb-4",
                      getCommitmentPill(path.id)
                    )}
                  >
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
                        <Check
                          className={cn(
                            "w-4 h-4 mt-0.5 shrink-0",
                            getCheckColor(path.id)
                          )}
                        />
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
                        <Check
                          className={cn(
                            "w-4 h-4 mt-0.5 shrink-0",
                            getCheckColor(path.id)
                          )}
                        />
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
                      href={getPathHref(path.id)}
                      {...(isAmbassador
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
