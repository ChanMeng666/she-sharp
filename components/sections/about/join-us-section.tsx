"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Briefcase, ArrowRight } from "lucide-react";
import Link from "next/link";

export function JoinUsSection() {
  return (
    <Section className="bg-white">
      <Container>
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-dark">Join Us</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-700 max-w-2xl mx-auto px-4 sm:px-0">
            Be part of our mission—volunteer with us or partner with us
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-light/20 text-purple-dark flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-dark">Volunteer</h3>
                  <p className="mt-2 text-gray-600">Share your skills and help create inclusive tech.</p>
                  <div className="mt-4">
                    <Button asChild>
                      <Link href="/join-our-team">
                        Apply to Volunteer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-mint-light/20 text-mint-dark flex items-center justify-center">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-navy-dark">Partner</h3>
                  <p className="mt-2 text-gray-600">Support diversity in tech through corporate partnership.</p>
                  <div className="mt-4">
                    <Button asChild variant="accent">
                      <Link href="/sponsors/corporate-sponsorship">
                        Explore Partnership
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}


