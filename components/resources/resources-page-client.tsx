"use client";

interface ResourcesPageClientProps {
  children: React.ReactNode;
}

export function ResourcesPageClient({ children }: ResourcesPageClientProps) {
  return (
    /* The canvas, not white. Every card on this page is `bg-white`, and a
       white card on a white ground is invisible — `press.tsx` renders here
       AND on /resources/in-the-press, where the ground is the canvas, so the
       ground is what has to move. */
    <div className="relative bg-background">
      {children}
    </div>
  );
}
