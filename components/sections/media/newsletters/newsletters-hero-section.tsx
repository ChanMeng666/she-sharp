import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { Mail, Send, Newspaper } from "lucide-react";
import { getNewsletterStats } from "@/lib/data/newsletters";

export function NewslettersHeroSection() {
  const stats = getNewsletterStats();

  return (
    <Section className="relative overflow-hidden bg-foreground">
      {/* Typography pattern background */}
      <div className="absolute inset-0 bg-muted/10" />

      {/* Floating typography elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 text-6xl font-bold text-background/5 transform -rotate-12">
          NEWS
        </div>
        <div className="absolute top-40 right-20 text-8xl font-bold text-background/5 transform rotate-6">
          TECH
        </div>
        <div className="absolute bottom-20 left-1/3 text-7xl font-bold text-background/5 transform -rotate-6">
          INSPIRE
        </div>
        <div className="absolute bottom-40 right-10 text-5xl font-bold text-background/5 transform rotate-12">
          CONNECT
        </div>
      </div>

      <Container className="relative z-10">
        <div className="py-12 md:py-16">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-muted text-background border-0">
              <Mail className="h-4 w-4 mr-2" />
              Newsletter Archive
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold text-background mb-6 leading-tight">
              Stay Connected
              <span className="block text-background/80">with She Sharp</span>
            </h1>

            <p className="text-xl md:text-2xl text-background/80 mb-8 leading-relaxed">
              Browse our newsletter archive for the latest updates, event
              announcements, and inspiring stories from women in technology.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 text-background">
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Newspaper className="h-7 w-7 opacity-80" />
                  {stats.monthlyCount}
                </div>
                <span className="text-sm text-background/60">
                  Monthly Issues
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-2 text-3xl font-bold">
                  <Send className="h-7 w-7 opacity-80" />
                  {stats.eventCount}
                </div>
                <span className="text-sm text-background/60">
                  Event Updates
                </span>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold">{stats.total}</div>
                <span className="text-sm text-background/60">
                  Total Newsletters
                </span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
