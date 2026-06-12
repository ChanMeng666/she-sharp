import { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { DonateForm } from "@/components/donate/donate-form";

export const metadata: Metadata = {
  title: "Donate | She Sharp",
  description:
    "Support She Sharp's mission to empower women in STEM. Your donation helps fund mentorship programmes, workshops, and events across New Zealand.",
};

const impactSections = [
  {
    title: "Raising Awareness & Accessibility",
    description:
      "Your donations help us bring events and workshops to low decile schools, train teachers and educators on the importance of digital curriculums, and make sure She Sharp events are accessible through subsidised tickets.",
  },
  {
    title: "Creating Memorable Experiences",
    description:
      "This includes accessible venues, nourishing food and drinks, AV equipment hire and tools for workshops—we want to make sure attendees and volunteers have a great time at our events!",
  },
  {
    title: "Support Our Mission",
    description:
      "Choose an amount to make your impact today. Every dollar counts toward making sure our events are engaging, fun and safe spaces for women and underrepresented groups in STEM.",
  },
];

const stats = [
  { value: "2200+", label: "Members" },
  { value: "50+", label: "Sponsors" },
  { value: "84+", label: "Events" },
];

export default function DonatePage() {
  return (
    <Section bgColor="white" className="pt-28 md:pt-32">
      <Container size="content">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold text-brand md:text-4xl">
            Donate to She Sharp
          </h1>
          <p className="mt-4 text-base text-muted-foreground md:text-lg">
            Your donation empowers the next generation of women in STEM. Every
            contribution helps us bridge the gender gap through events,
            mentorship, and career opportunities.
          </p>
        </div>

        {/* Donation form */}
        <div className="mt-10">
          <DonateForm />
        </div>

        {/* Stats */}
        <div className="mx-auto mt-12 grid max-w-md grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-brand">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Impact sections */}
        <div className="mx-auto mt-14 max-w-2xl space-y-8">
          {impactSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 text-muted-foreground">{section.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
