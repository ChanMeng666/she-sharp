import Link from "next/link";
import { PlusIcon, Shield, Cookie, FileText, Heart, Lock, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  title: string;
  href: string;
  icon: React.ReactNode;
};

const legalPages: NavItem[] = [
  { title: "Privacy Policy", href: "/privacy-policy", icon: <Shield className="h-4 w-4" /> },
  { title: "Cookie Policy", href: "/cookie-policy", icon: <Cookie className="h-4 w-4" /> },
  { title: "Terms of Service", href: "/terms-of-service", icon: <FileText className="h-4 w-4" /> },
  { title: "Accessibility", href: "/accessibility", icon: <Heart className="h-4 w-4" /> },
  { title: "Security Policy", href: "/security-policy", icon: <Lock className="h-4 w-4" /> },
  { title: "Code of Conduct", href: "/code-of-conduct", icon: <Users className="h-4 w-4" /> },
  { title: "Ambassador Code", href: "/volunteers/code-of-conduct", icon: <FileText className="h-4 w-4" /> },
];

type LegalNavProps = React.ComponentProps<"div"> & {
  activeTitle?: string;
};

export function LegalNav({ className, activeTitle, ...props }: LegalNavProps) {
  return (
    <div
      className={cn(
        "relative grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
        className
      )}
      style={{ borderColor: "#f7e5f3" }}
      {...props}
    >
      {legalPages.map((page, index) => {
        const isActive = page.title === activeTitle ||
          (page.title === "Ambassador Code" && activeTitle === "Ambassador Code of Conduct");

        return (
          <NavCard
            key={page.href}
            href={page.href}
            icon={page.icon}
            title={page.title}
            isActive={isActive}
            className={cn(
              "relative",
              index % 4 !== 3 && "border-r",
              index < 4 && "border-b",
              (index === 0 || index === 2 || index === 5 || index === 7) && !isActive && "bg-[#f4f4fa]",
            )}
          >
            {index === 0 && (
              <PlusIcon
                className="-right-[10px] -bottom-[10px] absolute z-10 size-5 text-[#9b2e83] hidden lg:block"
                strokeWidth={1.5}
              />
            )}
            {index === 2 && (
              <PlusIcon
                className="-right-[10px] -bottom-[10px] absolute z-10 size-5 text-[#9b2e83] hidden lg:block"
                strokeWidth={1.5}
              />
            )}
          </NavCard>
        );
      })}

      {/* Fill empty cell */}
      <div className="hidden lg:block bg-[#f4f4fa] border-t" style={{ borderColor: "#f7e5f3" }} />
    </div>
  );
}

type NavCardProps = {
  href: string;
  icon: React.ReactNode;
  title: string;
  isActive?: boolean;
  className?: string;
  children?: React.ReactNode;
};

function NavCard({ href, icon, title, isActive, className, children }: NavCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-center gap-2 px-4 py-5 transition-colors",
        isActive
          ? "bg-[#9b2e83] text-white"
          : "bg-white hover:bg-[#f7e5f3] text-[#1f1e44]",
        className
      )}
      style={{ borderColor: "#f7e5f3" }}
    >
      <span className={isActive ? "text-white" : "text-[#9b2e83]"}>
        {icon}
      </span>
      <span className={cn(
        "text-sm font-medium",
        isActive ? "text-white" : "text-[#1f1e44]"
      )}>
        {title}
      </span>
      {children}
    </Link>
  );
}
