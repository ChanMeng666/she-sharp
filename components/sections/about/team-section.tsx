"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";
import { teamMembers } from "@/lib/data/team";
import type { TeamMember } from "@/types/team";

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  return (
    <Section className="pt-0">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
            Meet Our People
          </h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg max-w-2xl mx-auto px-4 sm:px-0">
            The passionate team of leaders, innovators, and advocates driving
            change in the tech industry
          </p>
        </div>

        {/* Search and filters removed for simplicity */}

        {/* Team Grid - Responsive */}
        <div
          className={layoutClasses(
            "grid",
            "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            layoutSystem.grids.content.gap
          )}
        >
          {teamMembers.map((member) => (
            <Card
              key={member.name}
              className={cn(
                "group relative cursor-pointer rounded-3xl border border-white/40 bg-white/80 backdrop-blur-md",
                "shadow-[0_5px_5px_rgba(155,46,131,0.15)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_20px_rgba(155,46,131,0.25)]",
                "p-0 gap-0"
              )}
              onClick={() => setSelectedMember(member)}
            >
              {/* Top image */}
              <div
                className={cn(
                  "relative aspect-[16/10] overflow-hidden rounded-t-3xl"
                )}
              >
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover object-top"
                />
              </div>

              {/* Content panel */}
              <CardContent className="relative rounded-b-3xl p-6 sm:p-7 md:p-8 text-center">
                <h3 className="font-bold text-foreground text-lg leading-snug">
                  {member.name}
                </h3>
                <p className="mt-1 text-sm text-gray">
                  {member.roles.join(", ")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No results message removed */}

        {/* Member Detail Dialog */}
        <Dialog
          open={!!selectedMember}
          onOpenChange={(open) => !open && setSelectedMember(null)}
        >
          <DialogContent className="max-w-2xl p-0 overflow-hidden">
            {selectedMember && (
              <>
                <div className="relative w-full">
                  <Image
                    src={selectedMember.image}
                    alt={selectedMember.name}
                    width={640}
                    height={640}
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="w-full h-auto object-contain"
                  />
                </div>
                <DialogHeader className="px-4 sm:px-6 pt-4">
                  <DialogTitle className="text-xl sm:text-2xl text-foreground">
                    {selectedMember.name}
                  </DialogTitle>
                  <p className="text-sm text-gray mt-1">
                    {selectedMember.roles.join(", ")}
                  </p>
                </DialogHeader>
                <div className="px-4 sm:px-6 pb-6">
                  <div className="pr-2 text-sm sm:text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                    {selectedMember.description}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Section>
  );
}
