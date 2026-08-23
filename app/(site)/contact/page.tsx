import { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui/reveal";
import { ContactForm } from "@/components/contact";
import { footerConfig } from "@/lib/config/footer";
import { socialIcons } from "@/components/ui/social-icons";
import { Mail } from "lucide-react";
import { PhotoBand } from "@/components/ui/photo-band";
import { CONTACT_BAND, toBandPhotos } from "@/lib/data/site-photos";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";

export const metadata: Metadata = {
    title: "Contact Us",
    description:
        "Get in touch with She Sharp. We'd love to hear from you about events, partnerships, media features, and more.",
    alternates: { canonical: "/contact" },
};

export default function ContactPage() {
    return (
        <Section bgColor="accent">
            <Container size="full">
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-10 sm:gap-12 lg:gap-20 lg:items-start pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-8 sm:pb-12 md:pb-16">
                    {/* Left side — eyebrow, headline & contact channels */}
                    <Reveal className="flex flex-col justify-center">
                        <p className="text-label text-ink-500 mb-5">Contact</p>
                        <h1 className="text-display-sm text-foreground">
                            Say hello and let&apos;s get the ball rolling
                        </h1>

                        <p className="mt-6 text-lg text-ink-700 leading-relaxed sm:max-w-lg">
                            From questions about our events and how we make an impact to
                            featuring us in the media, we&apos;d love to hear from you.
                        </p>

                        {/* Email channel */}
                        <div className="mt-10">
                            <p className="text-label text-ink-500 mb-3">Email</p>
                            <Link
                                href={`mailto:${GENERAL_EMAIL}`}
                                className="inline-flex items-center gap-2.5 text-lg font-medium text-brand hover:text-brand-hover transition-colors"
                            >
                                <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                                {GENERAL_EMAIL}
                            </Link>
                        </div>

                        {/* Social Media Links */}
                        <div className="mt-10">
                            <p className="text-label text-ink-500 mb-4">Follow us</p>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {footerConfig.socialLinks.map((social) => {
                                    const Icon =
                                        socialIcons[social.icon as keyof typeof socialIcons];
                                    return (
                                        <Link
                                            key={social.name}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 sm:p-3 border border-border rounded-full bg-background text-foreground hover:bg-brand hover:border-brand hover:text-brand-foreground transition-colors duration-200"
                                            aria-label={`Follow us on ${social.name}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </Reveal>

                    {/* Right side - Contact Form */}
                    <Reveal delay={80}>
                        <ContactForm />
                    </Reveal>
                </div>
            </Container>

            {/*
                A page that asks a stranger to write in should show who they
                would be writing to. Decorative, so the band is aria-hidden and
                carries no lightbox — the photographs are the tone, not the content.
            */}
            <PhotoBand
                photos={toBandPhotos(CONTACT_BAND)}
                eyebrow="Faces from our events"
                reverse
            />
        </Section>
    );
}
