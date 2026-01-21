import { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/layout/section";
import { Container } from "@/components/layout/container";
import { ContactForm } from "@/components/contact";
import { footerConfig } from "@/lib/config/footer";
import { socialIcons } from "@/components/ui/social-icons";
import { Mail } from "lucide-react";

export const metadata: Metadata = {
    title: "Contact Us | She Sharp",
    description:
        "Get in touch with She Sharp. We'd love to hear from you about events, partnerships, media features, and more.",
};

export default function ContactPage() {
    return (
        <Section className="bg-[#f7e5f3]">
            <Container size="full">
                <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-20 items-start py-16 md:py-24 lg:py-32">
                    {/* Left side - Headline & Social Links */}
                    <div className="flex flex-col justify-center">
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-navy-dark leading-tight tracking-tight">
                            Let&apos;s Connect,
                            <br />
                            Say Hello to Get the Ball Rolling
                        </h1>

                        <p className="mt-8 text-lg text-paragraph max-w-xl">
                            From questions about our events and how we make an impact to
                            featuring us in the media, we&apos;d love to hear from you!
                        </p>

                        {/* Social Media Links */}
                        <div className="mt-10">
                            <p className="text-md font-semibold text-navy-dark/60 uppercase tracking-wide mb-4">
                                Follow Us
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {footerConfig.socialLinks.map((social) => {
                                    const Icon =
                                        socialIcons[social.icon as keyof typeof socialIcons];
                                    return (
                                        <Link
                                            key={social.name}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-3 border border-navy-dark/20 rounded-full bg-white/50 hover:bg-brand hover:border-brand hover:text-white text-navy-dark transition-all duration-200"
                                            aria-label={`Follow us on ${social.name}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Contact Form */}
                    <div>
                        <ContactForm />
                    </div>
                </div>
            </Container>
        </Section>
    );
}

