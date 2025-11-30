import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

const infoItems = [
  {
    icon: "🎯",
    title: "Our Events",
    description: "Every year, we organise several events and try to cover every aspect of tech. We invite speakers to share their experiences, what drives them, and what they are involved with on a day-to-day basis."
  },
  {
    icon: "💡",
    title: "Our Workshops",
    description: "Then we have hands-on workshops to give participants practical skills or provide a first-hand demonstration of tech-based skills."
  },
  {
    icon: "👥",
    title: "Our Community",
    description: "Our events are open to anyone identifying as a woman, where you can get to know the She Sharp community, learn and have fun. Don't worry if you don't know anyone, we're a friendly community! So we hope to see you in our next event!"
  }
];

export function EventsInfoSection() {
  return (
    <Section className="py-16">
      <Container>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">Message to the Community</h2>
        </div>
        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {infoItems.map((item) => (
            <div key={item.title} className="text-center">
              <div className="text-5xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-semibold text-foreground mb-4">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}