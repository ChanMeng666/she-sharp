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

const teamMembers = [
  {
    name: "Mahsa McCauley (Mohaghegh)",
    roles: ["Trustee", "Ambassador", "Founder and Chair"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811ab760ae807f1dc87e65_Team_1_Masha.png",
    description:
      "Dr Mahsa McCauley is a Senior Lecturer in AUT's School of Computer, Engineering, and...",
    featured: true,
  },
  {
    name: "Mike McCauley",
    roles: ["Trustee", "Ambassador", "Assets Manager"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811c5d42437e3bb5b152b3_Team_2_Mike.png",
    description:
      "Mike is a Digital Delivery Manager on the ICT Leadership team at Metlifecare, where he oversees the strategy and delivery of...",
    featured: true,
  },
  {
    name: "Raquel Anne Maderazo",
    roles: ["Ambassador", "Event Manager"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d6b441043c6ce5cc64bcdb_Raquel.png",
    description:
      "Raquel is a certified Project Management Professional (PMP®) with a master's degree in IT Project Management from AUT...",
  },
  {
    name: "Sabrina Teoh",
    roles: ["Ambassador", "Event Manager"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d7e895dccee90db8608d3e_Sabrina.png",
    description:
      "Sabrina is a product development engineer at FPH, known for her passion for learning and self-improvement. She thrives on diverse...",
  },
  {
    name: "Isha Sangrolkar",
    roles: ["Ambassador", "Website Lead"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670e25e2f9fe2264ba4018d8_image%20(1).png",
    description:
      "Isha is pursuing her Master of Computer and Information Sciences degree at AUT, focusing on expanding her expertise in the field. With a...",
  },
  {
    name: "Iuliia Shmykova",
    roles: ["Ambassador", "Data Insight Manager"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6522343c421d58adf9529c1f_IIulia.png",
    description:
      "Iuliia is currently pursuing her Master's degree in IT Project Management at AUT, having shifted from Financial Analytics to the Product...",
  },
  {
    name: "Alyssa Pausanos",
    roles: ["Ambassador", "Website Maintenance"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229f74af4304fe122b5273_Alyssa.png",
    description:
      "Alyssa is a first class BE (Hons) software engineering graduate from Auckland University of Technology, passionate about empowering more...",
  },
  {
    name: "Meeta Patel",
    roles: ["Ambassador", "Industry"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d67ca7e3a1ff33201a2c10_Meeta.png",
    description:
      "Dr. Meeta Patel is an experienced scientist with over 20 years of research expertise. As a Senior Scientist and Sustainability Lead at...",
  },
  {
    name: "Neda Stefanovic",
    roles: ["Ambassador", "Content Creator"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/666951eddd9fcebde4e63dfc_Neda.png",
    description:
      "Neda is currently in the final year of studies at AUT, working towards completing a Bachelor of Science degree in Molecular...",
  },
  {
    name: "Gowri Lokesh",
    roles: ["Ambassador", "Digital Designer"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229d32b8ee169914b78ecc_Gowri%20(1).png",
    description:
      "Meet Gowri! After spending two dedicated years as a quality analyst in network security, Gowri realized that her true passion wasn't just...",
  },
  {
    name: "Sara Ghafoor",
    roles: ["Ambassador", "Secretary"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/652774fc247ee7d771e65d2c_Sara.png",
    description:
      "Sara is an electrical engineering graduate currently pursuing a master's in computer information sciences, effectively bridging insights...",
  },
  {
    name: "Ania Migdałek-Jabłońska",
    roles: ["Ambassador"],
    image:
      "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6796cd0279f5325b87cc5966_Ania.png",
    description:
      "Ania brings years of experience to the digital marketing space, with a proven ability to launch and drive growth. Her approach...",
  },
];

// Roles filtering removed; showing all members

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<
    (typeof teamMembers)[0] | null
  >(null);

  return (
    <Section className="pt-0">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-navy-dark">
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
                "shadow-[0_5px_5px_rgba(196,193,255,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_20px_rgba(196,193,255,0.35)]"
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
                  className="object-cover"
                />
              </div>

              {/* Content panel */}
              <CardContent className="relative rounded-b-3xl p-6 sm:p-7 md:p-8 text-center">
                <h3 className="font-bold text-navy-dark text-lg leading-snug">
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
                <div className="relative h-48 sm:h-64">
                  <Image
                    src={selectedMember.image}
                    alt={selectedMember.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 640px"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>
                <DialogHeader className="px-4 sm:px-6 pt-4">
                  <DialogTitle className="text-xl sm:text-2xl text-navy">
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
