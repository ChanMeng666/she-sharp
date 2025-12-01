import { NewslettersHeroSection } from "@/components/sections/media/newsletters/newsletters-hero-section";
import { NewsletterPreviewSection } from "@/components/sections/media/newsletters/newsletter-preview-section";
import { NewslettersGridSection } from "@/components/sections/media/newsletters/newsletters-grid-section";

export default function NewslettersPage() {
  return (
    <>
      <NewslettersHeroSection />
      <NewsletterPreviewSection />
      <NewslettersGridSection />
    </>
  );
}