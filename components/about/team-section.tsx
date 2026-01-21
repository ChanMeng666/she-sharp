import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { teamMembers } from "@/lib/data/team";

export function TeamSection() {
  const [showAll, setShowAll] = useState(false);
  const displayedMembers = showAll ? teamMembers : teamMembers.slice(0, 6);

  return (
    <section
      className="py-16 lg:py-24 bg-background"
      aria-labelledby="team-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="team-heading"
            className="text-display-sm text-foreground mb-4 sm:mb-6"
          >
            Meet Our People
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl max-w-3xl mx-auto text-muted-foreground leading-relaxed">
            The passionate team of leaders, innovators, and advocates driving
            change in the tech industry
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          role="list"
        >
          {displayedMembers.map((member, index) => {
            const memberCardData: MemberCardData = {
              id: member.id,
              name: member.name,
              image: member.image,
              description: member.description,
              title: member.roles.join(" | "),
              linkedin: member.linkedin,
            };
            return (
              <div key={member.id ?? index} role="listitem">
                <MemberCard member={memberCardData} index={index} />
              </div>
            );
          })}
        </div>

        {!showAll && teamMembers.length > 6 && (
          <div className="text-center mt-12 lg:mt-16">
            <Button
              onClick={() => setShowAll(true)}
              variant="brand"
              size="lg"
              aria-label={`View all ${teamMembers.length} team members`}
            >
              View All {teamMembers.length} Team Members
            </Button>
          </div>
        )}

        {showAll && teamMembers.length > 6 && (
          <div className="text-center mt-12 lg:mt-16">
            <Button
              onClick={() => {
                setShowAll(false);
                document.getElementById("team-heading")?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              variant="outline"
              size="lg"
              className="border-brand text-brand hover:bg-surface-purple hover:text-brand"
              aria-label="Show less team members"
            >
              Show Less
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
