import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ArrowRight, Clock, CheckCircle2, Users, BookOpen, Target, Info, CreditCard } from "lucide-react";
import Link from "next/link";

export function MenteeCallToActionSection() {
  // Mock data - replace with actual data
  const spotsRemaining = 15;
  const totalSpots = 50;
  const progressPercentage = ((totalSpots - spotsRemaining) / totalSpots) * 100;
  
  const applicationSteps = [
    { step: "1", title: "Join the Program", description: "Pay the annual membership fee to get started" },
    { step: "2", title: "Create Account", description: "Use your invitation code to register and complete your profile" },
    { step: "3", title: "AI Matching", description: "Our AI matches you with mentors based on your goals and personality" },
    { step: "4", title: "Start Journey", description: "Begin your mentorship journey with your matched mentor" }
  ];
  
  return (
    <Section className="py-16 bg-gradient-to-b from-white to-purple-light/20">
      <Container>
        <div className="mx-auto max-w-5xl">
          {/* Main CTA Card */}
          <Card className="overflow-hidden shadow-lg border-0">
            <div className="bg-gradient-to-r from-purple-dark via-purple-mid to-periwinkle-dark h-2" />
            <CardHeader className="text-center pb-8 pt-10">
              <CardTitle className="text-3xl md:text-4xl font-bold text-navy-dark mb-4">
                Learn and be inspired by our empowering mentors in STEM
              </CardTitle>
              <CardDescription className="text-lg text-gray-700 max-w-3xl mx-auto">
                Gain valuable advice, inspiration, and empowerment from our amazing 
                mentors in STEM to support your personal and professional development 
                journey.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-8 pb-10">
              {/* Application Progress */}
              <div className="bg-periwinkle-light/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-dark" />
                    <span className="font-semibold text-navy-dark">Current Cohort Status</span>
                  </div>
                  <HoverCard>
                    <HoverCardTrigger>
                      <Info className="w-4 h-4 text-gray-500 cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <p className="text-sm">Applications are reviewed on a rolling basis. Apply early to secure your spot!</p>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <Progress value={progressPercentage} className="h-3 mb-2" />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{totalSpots - spotsRemaining} mentees enrolled</span>
                  <span className="font-semibold text-purple-dark">{spotsRemaining} spots remaining</span>
                </div>
              </div>
              
              {/* Application Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {applicationSteps.map((step, index) => (
                  <div key={step.step} className="relative">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-dark text-white rounded-full flex items-center justify-center mx-auto mb-3 font-bold">
                        {step.step}
                      </div>
                      <h4 className="font-semibold text-navy-dark mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                    {index < applicationSteps.length - 1 && (
                      <div className="hidden md:block absolute top-6 left-[60%] w-full h-0.5 bg-purple-light -z-10" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm">
                  <Clock className="w-8 h-8 text-purple-dark flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-navy-dark">6-Month Program</p>
                    <p className="text-sm text-gray-600">Structured mentorship journey</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm">
                  <BookOpen className="w-8 h-8 text-purple-dark flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-navy-dark">Monthly Sessions</p>
                    <p className="text-sm text-gray-600">Regular one-on-one meetings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm">
                  <Target className="w-8 h-8 text-purple-dark flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-navy-dark">Goal-Oriented</p>
                    <p className="text-sm text-gray-600">Personalized development plan</p>
                  </div>
                </div>
              </div>
              
              {/* CTA Button */}
              <div className="text-center pt-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-dark hover:bg-purple-mid text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Link
                    href="/mentorship/join"
                    className="inline-flex items-center gap-2"
                  >
                    Join the Program - $100 NZD/year
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-600 mt-3">
                  <CreditCard className="w-4 h-4 inline mr-1 text-purple-dark" />
                  Secure payment via Stripe. Cancel anytime.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}