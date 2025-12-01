import { PodcastsHeroSection } from "@/components/sections/media/podcasts/podcasts-hero-section";
import { PodcastsListSection } from "@/components/sections/media/podcasts/podcasts-list-section";
import { PodcastSubscribeSection } from "@/components/sections/media/podcasts/podcast-subscribe-section";
import { PageTestimonialsSection } from "@/components/sections/shared/page-testimonials-section";

export default function PodcastsPage() {
  return (
    <>
      <PodcastsHeroSection />
      <PodcastsListSection />
      <PodcastSubscribeSection />
      <PageTestimonialsSection
        title="What Listeners Are Saying"
        subtitle="Hear from our podcast community"
        pageKey="media"
      />
    </>
  );
}