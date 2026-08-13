import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/ui/reveal";

/**
 * She Sharp's three values, as the team defined them.
 *
 * These are not marketing copy written after the fact. On 14 July 2018 the
 * team spent a Saturday session doing exactly one thing: working out what the
 * organisation stood for. The output was sticky notes sorted into three
 * colours — community, inspiring, inclusion. The three words have appeared
 * loosely across the site ever since without ever being presented as the set
 * they are.
 *
 * The wording below expands each one; the three values themselves come from
 * that session and should not be quietly reworded into something else.
 */
const VALUES = [
  {
    name: "Community",
    body: "A professional network you can actually reach. Since 2014 the point has been the room — the people you meet at an event, the mentor who takes your call, the person who tells you the job exists before it is advertised.",
  },
  {
    name: "Inspiring",
    body: "Showing what a career in STEM can look like, told by women who are living one. Not abstract encouragement — real paths, including the parts that did not go to plan.",
  },
  {
    name: "Inclusion",
    body: "Bridging the gender gap is the mission, and it does not stop there. Everyone should be able to walk into one of our events and find someone they recognise themselves in.",
  },
];

export function ValuesSection() {
  return (
    <Section bgColor="white">
      <Container>
        <div className="max-w-2xl">
          <p className="text-label text-brand">What we stand for</p>
          <h2 className="text-display-sm mt-3 text-foreground">
            Three things we keep coming back to
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-600 md:text-base">
            Our team set these out together in 2018, and they have shaped every
            event since.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 md:mt-16 md:grid-cols-3">
          {VALUES.map((value, index) => (
            <Reveal
              key={value.name}
              delay={index * 80}
              className="border-t border-border pt-6"
            >
              <span className="text-label text-brand">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-xl font-bold text-foreground md:text-2xl">
                {value.name}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-ink-600">
                {value.body}
              </p>
            </Reveal>
          ))}
        </div>
      </Container>
    </Section>
  );
}
