import { Button } from "@/components/ui/button";
import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { teamMembers } from "@/lib/data/team";

export function TeamSection() {
  return (
    <section
      className="bg-muted py-16 md:py-24 lg:py-32"
      aria-labelledby="team-heading"
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 lg:mb-16">
          <h2
            id="team-heading"
            className="text-display-sm text-foreground mb-4 sm:mb-6"
          >
            Meet Our People
          </h2>
          <p className="text-md lg:text-lg max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            The passionate team of leaders, innovators, and advocates driving
            change in the tech industry
          </p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          role="list"
        >
          {teamMembers.map((member, index) => {
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
                <MemberCard
                  member={memberCardData}
                  index={index}
                  background="bg-white"
                  accentColor="bg-brand/5" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
