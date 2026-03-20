// She Sharp Unified Layout System
export const layoutSystem = {
  // Container widths for different content types
  containers: {
    narrow: "max-w-3xl",       // 768px - for text-heavy content
    content: "max-w-5xl",      // 1024px - standard content width
    wide: "max-w-6xl",         // 1152px - wide content display
    full: "max-w-8xl",         // 1440px - full width layout
  },

  // Consistent spacing system
  spacing: {
    section: {
      base: "py-16",
      md: "py-16",
      lg: "py-16",
      combined: "py-16",
    },
    component: {
      base: "py-8",
      md: "md:py-12",
      combined: "py-8 md:py-12",
    },
    element: {
      base: "py-4",
      md: "md:py-6",
      combined: "py-4 md:py-6",
    },
  },

  // Grid systems for different layouts
  grids: {
    // Standard content grid
    content: {
      cols1: "grid-cols-1",
      cols2: "md:grid-cols-2",
      cols3: "lg:grid-cols-3",
      cols4: "xl:grid-cols-4",
      gap: "gap-6 md:gap-8 lg:gap-10",
    },
    // Tight grid for galleries
    gallery: {
      cols2: "grid-cols-2",
      cols3: "sm:grid-cols-3",
      cols4: "md:grid-cols-4",
      cols5: "lg:grid-cols-5",
      gap: "gap-4",
    },
    // Masonry grid
    masonry: {
      base: "columns-1 sm:columns-2 lg:columns-3 xl:columns-4",
      gap: "gap-4",
    },
  },

  // Responsive breakpoints
  breakpoints: {
    sm: "640px",   // Mobile landscape
    md: "768px",   // Tablet portrait
    lg: "1024px",  // Tablet landscape/small laptop
    xl: "1280px",  // Desktop
    "2xl": "1536px", // Large screens
  },

  // Layout patterns for different page types
  patterns: {
    // Asymmetric split layout
    splitLayout: {
      left: "lg:col-span-7",
      right: "lg:col-span-5",
      gap: "gap-8 lg:gap-12",
    },
    // Magazine layout
    magazine: {
      hero: "md:col-span-2 lg:col-span-3",
      sidebar: "lg:col-span-1",
      grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
    },
    // Timeline layout
    timeline: {
      container: "relative",
      line: "absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5",
      item: "relative flex items-start gap-8",
      alternating: "md:flex-row-reverse",
    },
  },

  // Common layout utilities
  utils: {
    // Center content
    center: "mx-auto",
    // Full bleed on mobile, contained on desktop
    bleed: "mx-[-1rem] px-4 md:mx-0 md:px-0",
    // Sticky sidebar
    sticky: "lg:sticky lg:top-24",
    // Visual hierarchy
    hero: "min-h-[60vh] lg:min-h-[70vh]",
    // Reading width
    prose: "max-w-prose mx-auto",
  },
};

// Design system presets
export const designSystem = {
  radius: {
    sm: "card-sm",      // 30px
    md: "card-md",      // 40px
    lg: "card-lg",      // 50px
    full: "rounded-full",
  },
  cards: {
    glass: "card-glass",
    interactive: "card-interactive",
  },
  padding: {
    card: "p-4 sm:p-5 md:p-6",
    section: "p-6 sm:p-8 md:p-12 lg:p-16",
    container: "px-4 sm:px-6 lg:px-8",
  },
  gap: {
    tight: "gap-3 sm:gap-4 md:gap-5",
    normal: "gap-4 sm:gap-5 md:gap-6",
    wide: "gap-6 sm:gap-8 md:gap-10 lg:gap-12",
    section: "gap-8 sm:gap-10 md:gap-12 lg:gap-16",
  },
};

// Dashboard layout presets for all dashboard pages
export const dashboardLayout = {
  // Common card layout presets
  cardHeader: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
  cardMeta: "flex flex-wrap items-center gap-2 sm:gap-4 text-sm",
  actionRow: "flex flex-wrap gap-2",
  infoGrid: "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4",
  cardItem: "flex items-start gap-3 min-w-0",
  // Stats grid with smooth breakpoint progression
  statsGrid: {
    compact: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3",
    wide: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3",
  },
  // Filter bar responsive stacking
  filterBar: {
    container: "flex flex-col sm:flex-row gap-3",
    select: "w-full sm:w-[180px]",
    search: "relative flex-1",
  },
  // Page header with title + actions
  pageHeader: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4",
  // Inline stats row
  inlineStats: "flex flex-wrap items-center gap-4 sm:gap-6 text-sm",
  // Mobile card view (hidden on desktop)
  mobileCardView: "block lg:hidden space-y-3",
  // Desktop table view (hidden on mobile)
  desktopTableView: "hidden lg:block overflow-x-auto",
  // Kanban layout
  kanban: {
    container: "flex flex-col lg:flex-row gap-3 lg:overflow-x-auto lg:pb-4",
    column: "w-full lg:w-56 lg:flex-shrink-0",
  },
  // Tabs + view toggle row
  tabsRow: "flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3",
};

// Helper function to combine layout classes
export function layoutClasses(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Get container class by size
export function getContainer(size: keyof typeof layoutSystem.containers = "content"): string {
  return `mx-auto px-4 sm:px-6 lg:px-8 ${layoutSystem.containers[size]}`;
}

// Get section spacing
export function getSectionSpacing(size: keyof typeof layoutSystem.spacing = "section"): string {
  return layoutSystem.spacing[size].combined;
}
