import { MemberCard, MemberCardData } from "@/components/ui/member-card";
import { teamMembers } from "@/lib/data/team";

export function TeamSection() {
  return (
    <section
      className="bg-muted py-16 md:py-24 lg:py-32"
      aria-labelledby="team-heading"
    >
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center lg:mb-16">
          <p className="text-label mb-4 text-brand">The team</p>
          <h2
            id="team-heading"
            className="text-display-sm mb-4 text-foreground sm:mb-6"
          >
            Meet our people
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-ink-600 lg:text-lg">
            The leaders, innovators, and advocates driving change in the tech
            industry.
          </p>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
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
              <div key={member.id ?? index} role="listitem" className="h-full">
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
