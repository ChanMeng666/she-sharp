import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, Mail, Users, Heart } from "lucide-react";
import Link from "next/link";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

export function JoinTeamCTASection() {
  return (
    <Section bgColor="accent">
      <Container size="wide">
        <div>
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Ready to Make Your Impact?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join our community of changemakers and help shape the future of women in technology
            </p>
          </div>

          {/* Primary CTA Card */}
          <Card className="mb-12 border-2 border-border shadow-xl">
            <CardContent className="p-12 text-center">
              <Badge className="mb-6 bg-foreground text-background px-4 py-2 text-sm">
                <Calendar className="w-4 h-4 mr-2" />
                Applications Open Year-Round
              </Badge>

              <h3 className="text-3xl font-bold text-foreground mb-4">
                Become a She Sharp Volunteer
              </h3>

              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Whether you can spare a few hours for events or want to join our ambassador team, 
                we have the perfect opportunity for you to contribute to our mission.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-foreground hover:bg-foreground/90 text-background transition-colors duration-150">
                  <Users className="w-5 h-5 mr-2" />
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button size="lg" variant="outline" className="border-2 border-border text-foreground hover:bg-muted transition-colors duration-150">
                  <Mail className="w-5 h-5 mr-2" />
                  Get Updates
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Ambassador Recruitment Notice */}
          <Alert className="mb-12 border-border bg-muted">
            <Calendar className="h-5 w-5 text-foreground" />
            <AlertDescription className="text-base">
              <strong className="text-foreground">Ambassador Applications:</strong> Our next ambassador recruitment 
              opens in February 2025. Register your interest now to be notified when applications open!
            </AlertDescription>
          </Alert>

          {/* Secondary CTAs */}
          <div className={layoutClasses(
            "grid",
            layoutSystem.grids.content.cols1,
            layoutSystem.grids.content.cols3,
            layoutSystem.grids.content.gap
          )}>
            <Card className="group hover:shadow-lg transition-shadow duration-150">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6 group-hover:bg-muted/80 transition-colors duration-150">
                  <Heart className="w-8 h-8 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  Support Our Mission
                </h4>
                <p className="text-muted-foreground mb-6">
                  Your donation helps us create more opportunities for women in STEM
                </p>
                <Button asChild variant="outline" className="text-foreground p-0 underline-offset-4 hover:underline">
                  <Link href="/donate">
                    Make a Donation
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow duration-150">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6 group-hover:bg-muted/80 transition-colors duration-150">
                  <Calendar className="w-8 h-8 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  Attend Our Events
                </h4>
                <p className="text-muted-foreground mb-6">
                  Connect with the community at our workshops and networking events
                </p>
                <Button asChild variant="outline" className="text-foreground p-0 underline-offset-4 hover:underline">
                  <Link href="/events">
                    Explore Events
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-shadow duration-150">
              <CardContent className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-muted rounded-full mb-6 group-hover:bg-muted/80 transition-colors duration-150">
                  <Mail className="w-8 h-8 text-foreground" />
                </div>
                <h4 className="text-xl font-semibold text-foreground mb-3">
                  Stay Connected
                </h4>
                <p className="text-muted-foreground mb-6">
                  Get the latest updates on volunteer opportunities and events
                </p>
                <Button asChild variant="outline" className="text-foreground p-0 underline-offset-4 hover:underline">
                  <Link href="/contact">
                    Contact Us
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}