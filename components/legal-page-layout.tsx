import Link from "next/link";
import { ChevronRight, FileText, Shield, Cookie, Heart, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { layoutSystem, getContainer } from "@/lib/layout-system";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

interface LegalPageLayoutProps {
  children: React.ReactNode;
  title: string;
  navTitle?: string; // Optional title for navigation matching
  lastUpdated?: Date;
  icon?: React.ReactNode;
}

interface LegalNavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

const legalPages: LegalNavItem[] = [
  {
    title: "Privacy Policy",
    href: "/privacy-policy",
    icon: <Shield className="h-5 w-5" />,
    description: "How we protect your data",
  },
  {
    title: "Cookie Policy",
    href: "/cookie-policy",
    icon: <Cookie className="h-5 w-5" />,
    description: "Our use of cookies",
  },
  {
    title: "Terms of Service",
    href: "/terms-of-service",
    icon: <FileText className="h-5 w-5" />,
    description: "Terms of using our services",
  },
  {
    title: "Accessibility",
    href: "/accessibility",
    icon: <Heart className="h-5 w-5" />,
    description: "Our commitment to accessibility",
  },
  {
    title: "Security Policy",
    href: "/security-policy",
    icon: <Lock className="h-5 w-5" />,
    description: "Security practices & reporting",
  },
  {
    title: "Code of Conduct",
    href: "/code-of-conduct",
    icon: <Users className="h-5 w-5" />,
    description: "Community guidelines",
  },
  {
    title: "Ambassador Code of Conduct",
    href: "/volunteers/code-of-conduct",
    icon: <FileText className="h-5 w-5" />,
    description: "Volunteer & ambassador standards",
  },
];

export function LegalPageLayout({ 
  children, 
  title,
  navTitle,
  lastUpdated = new Date(),
  icon 
}: LegalPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 pt-16">
        <div className="min-h-screen bg-white">
          {/* Hero Section */}
          <div className="relative overflow-hidden bg-foreground">
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-0 opacity-10" />
        
        <div className={cn("relative py-24 md:py-32", getContainer("content"))}>
          <div className="max-w-4xl mx-auto text-center">
            {icon && (
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white/10 backdrop-blur rounded-2xl">
                  {icon}
                </div>
              </div>
            )}
            <h1 className="text-4xl md:text-6xl font-bold text-background mb-6">
              {title}
            </h1>
            <p className="text-lg text-background/80">
              Last Updated: {lastUpdated.toLocaleDateString('en-NZ', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
        </div>
        
        {/* Wave decoration */}
        <div className="absolute -bottom-1 left-0 right-0 h-24 overflow-hidden">
          <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0 50C240 50 240 0 480 0C720 0 720 50 960 50C1200 50 1200 0 1440 0V75H0V50Z" fill="white"/>
          </svg>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className={cn("py-12", getContainer("content"))}>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {legalPages.map((page) => {
              const isActive = page.title === (navTitle || title);
              return (
                <Link
                  key={page.href}
                  href={page.href}
                  className={cn(
                    "group relative p-4 rounded-xl transition-all duration-150",
                    isActive
                      ? "bg-foreground text-background shadow-md"
                      : "bg-background hover:bg-muted border border-border hover:border-foreground"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg transition-colors",
                      isActive ? "bg-background/20" : "bg-muted group-hover:bg-muted/50"
                    )}>
                      <div className={isActive ? "text-background" : "text-foreground"}>
                        {page.icon}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className={cn(
                        "font-semibold text-sm mb-1",
                        isActive ? "text-background" : "text-foreground"
                      )}>
                        {page.title}
                      </h3>
                      <p className={cn(
                        "text-xs",
                        isActive ? "text-background/80" : "text-muted-foreground"
                      )}>
                        {page.description}
                      </p>
                    </div>
                  </div>
                  {!isActive && (
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={cn("pb-24", getContainer("narrow"))}>
        <div>
          <div className={cn(
            "bg-background rounded-2xl shadow-sm border border-border p-8 md:p-12",
            "prose prose-gray max-w-none",
            "prose-headings:text-foreground",
            "prose-p:text-muted-foreground prose-p:leading-relaxed",
            "prose-a:text-foreground prose-a:no-underline hover:prose-a:underline",
            "prose-strong:text-foreground",
            "prose-ul:text-muted-foreground prose-ol:text-muted-foreground",
            "prose-li:marker:text-foreground"
          )}>
            {children}
          </div>
        </div>
      </div>
    </div>
      </main>
      <SiteFooter />
    </div>
  );
}