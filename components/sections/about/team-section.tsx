"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const teamMembers = [
  {
    name: "Mahsa McCauley (Mohaghegh)",
    roles: ["Trustee", "Ambassador", "Founder and Chair"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811ab760ae807f1dc87e65_Team_1_Masha.png",
    description: "Dr Mahsa McCauley is a Senior Lecturer and Director of Women in Tech in AUT's School of Computer, Engineering, and...",
    featured: true
  },
  {
    name: "Mike McCauley",
    roles: ["Trustee", "Ambassador", "Assets Manager"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/64811c5d42437e3bb5b152b3_Team_2_Mike.png",
    description: "Mike is a Digital Delivery Manager on the ICT Leadership team at Metlifecare, where he oversees the strategy and delivery of...",
    featured: true
  },
  {
    name: "Raquel Anne Maderazo",
    roles: ["Ambassador", "Event Manager"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d6b441043c6ce5cc64bcdb_Raquel.png",
    description: "Raquel is a certified Project Management Professional (PMP®) with a master's degree in IT Project Management from AUT..."
  },
  {
    name: "Sabrina Teoh",
    roles: ["Ambassador", "Event Manager"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d7e895dccee90db8608d3e_Sabrina.png",
    description: "Sabrina is a product development engineer at FPH, known for her passion for learning and self-improvement. She thrives on diverse..."
  },
  {
    name: "Isha Sangrolkar",
    roles: ["Ambassador", "Website Lead"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/670e25e2f9fe2264ba4018d8_image%20(1).png",
    description: "Isha is pursuing her Master of Computer and Information Sciences degree at AUT, focusing on expanding her expertise in the field. With a..."
  },
  {
    name: "Iuliia Shmykova",
    roles: ["Ambassador", "Data Insight Manager"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6522343c421d58adf9529c1f_IIulia.png",
    description: "Iuliia is currently pursuing her Master's degree in IT Project Management at AUT, having shifted from Financial Analytics to the Product..."
  },
  {
    name: "Alyssa Pausanos",
    roles: ["Ambassador", "Website Maintenance"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229f74af4304fe122b5273_Alyssa.png",
    description: "Alyssa is a first class BE (Hons) software engineering graduate from Auckland University of Technology, passionate about empowering more..."
  },
  {
    name: "Meeta Patel",
    roles: ["Ambassador", "Industry"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/66d67ca7e3a1ff33201a2c10_Meeta.png",
    description: "Dr. Meeta Patel is an experienced scientist with over 20 years of research expertise. As a Senior Scientist and Sustainability Lead at..."
  },
  {
    name: "Neda Stefanovic",
    roles: ["Ambassador", "Content Creator"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/666951eddd9fcebde4e63dfc_Neda.png",
    description: "Neda is currently in the final year of studies at AUT, working towards completing a Bachelor of Science degree in Molecular..."
  },
  {
    name: "Gowri Lokesh",
    roles: ["Ambassador", "Digital Designer"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/67229d32b8ee169914b78ecc_Gowri%20(1).png",
    description: "Meet Gowri! After spending two dedicated years as a quality analyst in network security, Gowri realized that her true passion wasn't just..."
  },
  {
    name: "Sara Ghafoor",
    roles: ["Ambassador", "Secretary"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/652774fc247ee7d771e65d2c_Sara.png",
    description: "Sara is an electrical engineering graduate currently pursuing a master's in computer information sciences, effectively bridging insights..."
  },
  {
    name: "Ania Migdałek-Jabłońska",
    roles: ["Ambassador"],
    image: "https://cdn.prod.website-files.com/646ab5895264c7470e0c89f5/6796cd0279f5325b87cc5966_Ania.png",
    description: "Ania brings years of experience to the digital marketing space, with a proven ability to launch and drive growth. Her approach..."
  }
];

// Roles filtering removed; showing all members

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<typeof teamMembers[0] | null>(null);

  return (
    <Section bgColor="light">
      <Container size="wide">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-navy-dark">Meet Our People</h2>
          <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray max-w-2xl mx-auto px-4 sm:px-0">
            The passionate team of leaders, innovators, and advocates driving change in the tech industry
          </p>
        </div>

        {/* Search and filters removed for simplicity */}

        {/* Team Grid - Responsive */}
        <div className={layoutClasses(
          "grid",
          "grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          layoutSystem.grids.content.gap
        )}>
          {teamMembers.map((member, index) => (
            <Card
              key={member.name}
              className={cn(
                "group relative overflow-hidden cursor-pointer transition-all hover:shadow-lg"
              )}
              onClick={() => setSelectedMember(member)}
            >
              <div className={cn(
                "relative aspect-square"
              )}>
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-150 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <CardContent className="relative p-4 sm:p-5">
                <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                  {member.roles.map((role) => (
                    <Badge 
                      key={role} 
                      variant={role.includes("Trustee") ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        role.includes("Trustee") && "bg-purple-dark hover:bg-purple-dark/90",
                        role.includes("Founder") && "bg-gradient-to-r from-purple-dark to-periwinkle text-white"
                      )}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
                <h3 className={cn(
                  "font-semibold text-navy-dark text-base sm:text-lg"
                )}>
                  {member.name}
                </h3>
              </CardContent>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-purple-dark to-periwinkle transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </Card>
          ))}
        </div>

        {/* No results message removed */}

        {/* Member Detail Dialog */}
        <Dialog open={!!selectedMember} onOpenChange={(open) => !open && setSelectedMember(null)}>
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
                  <DialogTitle className="text-xl sm:text-2xl text-navy">{selectedMember.name}</DialogTitle>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedMember.roles.map((role) => (
                      <Badge 
                        key={role} 
                        variant={role.includes("Trustee") ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          role.includes("Trustee") && "bg-purple-dark hover:bg-purple-dark/90",
                          role.includes("Founder") && "bg-gradient-to-r from-purple-dark to-periwinkle text-white"
                        )}
                      >
                        {role}
                      </Badge>
                    ))}
                  </div>
                </DialogHeader>
                <div className="px-4 sm:px-6 pb-6">
                  <ScrollArea className="max-h-[50vh]">
                    <div className="pr-2 text-sm sm:text-base leading-relaxed text-gray-700 whitespace-pre-wrap">
                      {selectedMember.description}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </Container>
    </Section>
  );
}