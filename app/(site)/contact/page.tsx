import { ContactHeroSection } from "@/components/sections/contact/contact-hero-section";
import { ContactFormSection } from "@/components/sections/contact/contact-form-section";
import { ContactInfoSection } from "@/components/sections/contact/contact-info-section";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

export default function ContactPage() {
  return (
    <>
      <ContactHeroSection />
      <Section bgColor="white">
        <Container size="content">
          <div>
            <div className={layoutClasses(
              "grid gap-16 md:grid-cols-5",
              "md:gap-20"
            )}>
              {/* Left column - Contact Info */}
              <div className="md:col-span-2">
                <ContactInfoSection />
              </div>
              
              {/* Right column - Contact Form */}
              <div className="md:col-span-3">
                <ContactFormSection />
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}