import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Clock, Heart } from "lucide-react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

const volunteerPaths = [
  {
    id: "events",
    title: "Event Volunteer",
    icon: Calendar,
    color: "purple",
    commitment: "Flexible • 4-6 times per year",
    highlights: [
      "Perfect for busy schedules",
      "Choose events that interest you",
      "Network with industry professionals",
      "No weekly commitment required"
    ],
    responsibilities: [
      "Help with event setup and registration",
      "Welcome and guide attendees",
      "Support speakers and panellists",
      "Represent She Sharp at conferences",
      "Assist with photography and social media"
    ],
    benefits: [
      "Free entry to all She Sharp events",
      "Networking opportunities",
      "Certificate of volunteer service",
      "Professional development workshops"
    ]
  },
  {
    id: "ambassador",
    title: "She Sharp Ambassador",
    icon: Users,
    color: "periwinkle",
    commitment: "Regular • Weekly involvement",
    highlights: [
      "Shape She Sharp's future",
      "Lead meaningful projects",
      "Build lasting connections",
      "Develop leadership skills"
    ],
    responsibilities: [
      "Attend fortnightly team meetings",
      "Lead event planning and execution",
      "Manage sponsor relationships",
      "Create content for social media",
      "Mentor new volunteers"
    ],
    benefits: [
      "Leadership development opportunities",
      "Direct impact on She Sharp's strategy",
      "Strong professional network",
      "Resume and LinkedIn recommendations"
    ]
  }
];

export function VolunteerOptionsSection() {
  return (
    <Section bgColor="white">
      <Container size="wide">
        <div className="mx-auto max-w-6xl">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Choose Your Way to Make an Impact
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto">
              Whether you have a few hours or can commit weekly, there&apos;s a perfect volunteer opportunity waiting for you
            </p>
          </div>

          {/* Volunteer Options Tabs */}
          <Tabs defaultValue="events" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-12">
              <TabsTrigger value="events" className="text-lg">Event Volunteer</TabsTrigger>
              <TabsTrigger value="ambassador" className="text-lg">Ambassador</TabsTrigger>
            </TabsList>

            {volunteerPaths.map((path) => (
              <TabsContent key={path.id} value={path.id} className="mt-0">
                <div className="grid lg:grid-cols-2 gap-12">
                  {/* Left Column - Overview */}
                  <div>
                    <Card className="border-2 border-border">
                      <CardContent className="p-8">
                        <div className="flex items-start gap-4 mb-6">
                          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                            <path.icon className="w-6 h-6 text-foreground" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">{path.title}</h3>
                            <Badge variant="secondary" className="font-normal">
                              <Clock className="w-3 h-3 mr-1" />
                              {path.commitment}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 mb-6">
                          {path.highlights.map((highlight, index) => (
                            <div key={index} className="flex items-center gap-3">
                              <Heart className="w-4 h-4 text-foreground" />
                              <span className="text-gray-700">{highlight}</span>
                            </div>
                          ))}
                        </div>

                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-gray-600">
                            {path.id === 'events' 
                              ? 'Applications open year-round. Join us for our next event!'
                              : 'Applications open in February each year. Register your interest below.'}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right Column - Details */}
                  <div className="space-y-8">
                    {/* Responsibilities */}
                    <div>
                      <h4 className="text-xl font-semibold text-foreground mb-4">What You&apos;ll Do</h4>
                      <ul className="space-y-2">
                        {path.responsibilities.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full mt-2 bg-foreground" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Benefits */}
                    <div>
                      <h4 className="text-xl font-semibold text-foreground mb-4">What You&apos;ll Gain</h4>
                      <ul className="space-y-2">
                        {path.benefits.map((item, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full mt-2 bg-foreground" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </Container>
    </Section>
  );
}