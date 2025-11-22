import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function useScrollToHash() {
  const pathname = usePathname();

  useEffect(() => {
    const scrollToElement = (element: Element) => {
      const yOffset = -20; // Small offset for spacing
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    };

    const handleScrollToHash = () => {
      const hash = window.location.hash;
      if (!hash) return;

      // Try multiple times with increasing delays to ensure element is rendered
      const attempts = [50, 150, 300, 500, 800, 1200, 2000];
      
      attempts.forEach((delay) => {
        setTimeout(() => {
          const element = document.querySelector(hash);
          if (element) {
            scrollToElement(element);
          }
        }, delay);
      });
    };

    // Handle initial load
    handleScrollToHash();

    // Handle hash changes on the same page
    window.addEventListener('hashchange', handleScrollToHash);

    return () => {
      window.removeEventListener('hashchange', handleScrollToHash);
    };
  }, [pathname]);
}