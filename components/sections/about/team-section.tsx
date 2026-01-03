import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import Image from "next/image";
import { teamMembers } from "@/lib/data/team";
import { TeamMember } from "@/types/team";

interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
}

function TeamMemberCard({ member, index }: TeamMemberCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const background = "bg-surface-periwinkle";

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <article
          onClick={() => setIsDialogOpen(true)}
          className={`group relative ${background} rounded-2xl overflow-hidden
                      transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
                      focus-within:ring-4 focus-within:ring-brand/50 cursor-pointer`}
        >
          <div className="p-6 sm:p-8">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                {!imageError ? (
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.roles.join(", ")}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-4xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {member.name}
              </h3>
              <p className="text-sm sm:text-base font-medium text-brand mb-4">
                {member.roles.join(" • ")}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                {member.description}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
                className="text-sm font-medium text-brand hover:text-brand-hover transition-colors underline"
              >
                Learn more
              </button>
            </div>

            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </article>

        <DialogContent 
          className="max-w-2xl max-h-[90vh] overflow-y-auto p-8 md:p-10"
          hideCloseButton
        >
          <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none p-3 min-w-[44px] min-h-[44px] flex items-center justify-center">
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
          <DialogHeader>
            <div className="flex items-center gap-6 mb-4">
              <div className="relative w-24 h-24 rounded-full overflow-hidden ring-4 ring-brand/20 shrink-0">
                {!imageError ? (
                  <Image
                    src={member.image}
                    alt={`${member.name}, ${member.roles.join(", ")}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-3xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  {member.name}
                </DialogTitle>
                <p className="text-base md:text-lg font-medium text-brand">
                  {member.roles.join(" • ")}
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogDescription className="text-base text-foreground leading-relaxed whitespace-pre-line">
            {member.description}
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-4 sm:mb-6"
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
          {displayedMembers.map((member, index) => (
            <div key={member.id ?? index} role="listitem">
              <TeamMemberCard member={member} index={index} />
            </div>
          ))}
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
