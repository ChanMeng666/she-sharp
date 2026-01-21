"use client";

interface ResourcesPageClientProps {
  children: React.ReactNode;
}

export function ResourcesPageClient({ children }: ResourcesPageClientProps) {
  return (
    <div className="relative bg-white">
      {children}
    </div>
  );
}
