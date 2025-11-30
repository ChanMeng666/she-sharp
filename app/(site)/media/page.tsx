import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Mic, Mail, Camera, FileText, ArrowRight, Sparkles } from "lucide-react";
import { SmartCTASection } from "@/components/sections/shared/smart-cta-section";

export default function MediaHubPage() {
  const mediaCategories = [
    {
      title: "Podcasts",
      description: "Listen to inspiring stories from women in STEM",
      icon: Mic,
      href: "/media/podcasts",
      color: "bg-muted",
      iconColor: "text-foreground",
      featured: true,
      stats: "20+ Episodes",
    },
    {
      title: "Newsletters",
      description: "Stay updated with our monthly newsletter",
      icon: Mail,
      href: "/media/newsletters",
      color: "bg-muted",
      iconColor: "text-foreground",
      stats: "Monthly Updates",
    },
    {
      title: "Photo Gallery",
      description: "Browse event highlights and memorable moments",
      icon: Camera,
      href: "/media/photo-gallery",
      color: "bg-muted",
      iconColor: "text-foreground",
      stats: "500+ Photos",
    },
    {
      title: "In the Press",
      description: "Read about our impact in media coverage",
      icon: FileText,
      href: "/media/news-and-press",
      color: "bg-muted",
      iconColor: "text-foreground",
      stats: "Latest Coverage",
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <Section bgColor="white" className="pt-24 pb-12">
        <Container size="full">
          <div className="text-center max-w-4xl mx-auto px-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-foreground" />
              <span className="text-foreground font-semibold">Resources Hub</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
              Media & Resources
            </h1>
            <p className="text-lg sm:text-xl text-gray">
              Explore our collection of podcasts, newsletters, photos, and press coverage. 
              Stay connected with the She Sharp community and discover inspiring stories 
              from women in STEM.
            </p>
          </div>
        </Container>
      </Section>

      {/* Media Categories Grid */}
      <Section bgColor="light">
        <Container size="full">
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
            {mediaCategories.map((category) => (
              <Card 
                key={category.title} 
                className={cn(
                  "hover:shadow-md transition-shadow duration-150",
                  category.featured && "md:col-span-2"
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-full ${category.color} flex items-center justify-center mb-4`}>
                      <category.icon className={`w-7 h-7 ${category.iconColor}`} />
                    </div>
                    <span className="text-sm text-gray">{category.stats}</span>
                  </div>
                  <CardTitle className="text-xl sm:text-2xl text-foreground">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-gray">
                    {category.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    asChild
                    variant="ghost"
                    className="group p-0 h-auto font-semibold text-foreground transition-colors duration-150"
                  >
                    <Link href={category.href}>
                      Explore {category.title}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Impact Report Special Section */}
      <Section bgColor="white">
        <Container size="content">
          <Card className="overflow-hidden bg-muted">
            <div className="grid gap-8 items-center">
              <div className="p-8 md:p-12">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                  Annual Impact Report
                </h2>
                <p className="text-gray mb-6">Read our annual impact and outcomes. Download the latest report.</p>
                <Button
                  asChild
                  className="bg-foreground transition-colors duration-150"
                >
                  <Link href="/media/impact-report">View Impact Report</Link>
                </Button>
              </div>
            </div>
          </Card>
        </Container>
      </Section>

      {/* Smart CTA Section */}
      <SmartCTASection title="Stay Connected" />
    </>
  );
}

// Add missing import
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}