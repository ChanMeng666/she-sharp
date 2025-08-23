"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  Calendar, 
  Megaphone, 
  Users, 
  PenTool, 
  Camera,
  Briefcase,
  HeartHandshake,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface VolunteerRole {
  title: string;
  description: string;
  skills: string[];
  commitment: string;
  urgent?: boolean;
  icon?: LucideIcon;
}

interface VolunteerCategory {
  title: string;
  color: string;
  icon: LucideIcon;
  roles: VolunteerRole[];
}

const volunteerRoles: Record<string, VolunteerCategory> = {
  technical: {
    title: "Technical",
    color: "from-purple-dark to-purple-mid",
    icon: Code,
    roles: [
      {
        title: "Website Developer",
        description: "Help maintain and improve our website using React and Next.js",
        skills: ["React", "TypeScript", "Web Development"],
        commitment: "5-10 hours/month",
        urgent: true
      },
      {
        title: "Data Analyst",
        description: "Analyze member data to help us better understand our community impact",
        skills: ["Data Analysis", "SQL", "Visualization"],
        commitment: "3-5 hours/month"
      },
      {
        title: "Mobile App Developer",
        description: "Build features for our upcoming mobile application",
        skills: ["React Native", "Mobile Development"],
        commitment: "10-15 hours/month"
      }
    ]
  },
  events: {
    title: "Events",
    color: "from-periwinkle to-purple-light",
    icon: Calendar,
    roles: [
      {
        title: "Event Coordinator",
        description: "Plan and execute workshops, conferences, and networking events",
        skills: ["Event Planning", "Communication", "Organization"],
        commitment: "10-20 hours/event",
        urgent: true
      },
      {
        title: "Workshop Facilitator",
        description: "Lead technical or career development workshops for our members",
        skills: ["Teaching", "Public Speaking", "Subject Matter Expertise"],
        commitment: "2-4 hours/workshop"
      },
      {
        title: "Event Photographer",
        description: "Capture memorable moments at our events",
        skills: ["Photography", "Photo Editing"],
        commitment: "Event-based",
        icon: Camera
      }
    ]
  },
  operations: {
    title: "Operations",
    color: "from-mint to-periwinkle",
    icon: Briefcase,
    roles: [
      {
        title: "Content Creator",
        description: "Write blog posts, social media content, and newsletters",
        skills: ["Writing", "Social Media", "Content Strategy"],
        commitment: "5-10 hours/month",
        icon: PenTool
      },
      {
        title: "Marketing Coordinator",
        description: "Help spread the word about She Sharp and our initiatives",
        skills: ["Marketing", "Communications", "Design"],
        commitment: "5-10 hours/month",
        icon: Megaphone
      },
      {
        title: "Partnership Manager",
        description: "Build relationships with sponsors and partner organizations",
        skills: ["Business Development", "Networking", "Communication"],
        commitment: "5-10 hours/month",
        icon: HeartHandshake
      }
    ]
  }
};

export function VolunteerSection() {
  return (
    <Section className="bg-gradient-to-b from-purple-light/10 to-mint/10 py-20">
      <Container>
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h2 className="text-4xl font-bold text-navy">
            Join Our Mission
          </h2>
          <p className="mt-4 text-lg text-gray-700">
            A nonprofit run entirely by passionate volunteers
          </p>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto">
            Behind every She Sharp event, workshop, and initiative is a dedicated team of 
            volunteers who believe in creating a more inclusive tech industry. Find your 
            perfect role and help us make a difference.
          </p>
        </div>

        {/* Desktop Kanban View */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {Object.entries(volunteerRoles).map(([key, category]) => {
            const Icon = category.icon;
            return (
              <div key={key} className="space-y-4">
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r text-white",
                  category.color
                )}>
                  <Icon className="h-6 w-6" />
                  <h3 className="text-xl font-semibold">{category.title}</h3>
                  <Badge variant="secondary" className="ml-auto bg-white/20 text-white">
                    {category.roles.length} roles
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {category.roles.map((role, index) => {
                    const RoleIcon = role.icon || Users;
                    return (
                      <Card 
                        key={index} 
                        className={cn(
                          "group hover:shadow-lg transition-all cursor-pointer",
                          "hover:-translate-y-1",
                          role.urgent && "border-2 border-purple-dark"
                        )}
                      >
                        <CardHeader className="pb-4">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg">{role.title}</CardTitle>
                            {role.urgent && (
                              <Badge className="bg-purple-dark text-white">Urgent</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-gray-600">{role.description}</p>
                          
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1">
                              {role.skills.map((skill) => (
                                <Badge key={skill} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-xs text-gray-500">
                              Commitment: {role.commitment}
                            </p>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="w-full"
                          >
                            Learn More
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Tab View */}
        <div className="lg:hidden">
          <Tabs defaultValue="technical" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              {Object.entries(volunteerRoles).map(([key, category]) => (
                <TabsTrigger key={key} value={key}>
                  {category.title}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {Object.entries(volunteerRoles).map(([key, category]) => (
              <TabsContent key={key} value={key} className="mt-6 space-y-4">
                {category.roles.map((role, index) => (
                  <Card 
                    key={index}
                    className={cn(
                      role.urgent && "border-2 border-purple-dark"
                    )}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{role.title}</CardTitle>
                        {role.urgent && (
                          <Badge className="bg-purple-dark text-white">Urgent</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">{role.description}</p>
                      
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {role.skills.map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          Commitment: {role.commitment}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-6">
            Don't see a role that fits? We're always open to new ideas and contributions!
          </p>
          <Button asChild variant="gradient" size="lg">
            <Link href="/join-our-team">
              Apply to Volunteer
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </Container>
    </Section>
  );
}