import { EventV3, EventSession } from "@/types/event";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { ChevronDown } from "lucide-react";

interface EventSessionsProps {
  event: EventV3;
}

// Display order for the session-type groups.
const TYPE_ORDER = ["Keynote", "Demo", "Workshop", "Panel", "Guest Speaker"];

function orderTypes(types: string[]): string[] {
  return [...types].sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a);
    const ib = TYPE_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}

export function EventSessions({ event }: EventSessionsProps) {
  const sessions = event.detailPageData.sessions;
  if (!sessions || sessions.length === 0) return null;

  const types = orderTypes(Array.from(new Set(sessions.map((s) => s.type))));

  return (
    <Section spacing="section" className="bg-muted">
      <Container size="full">
        <div className="mb-8 md:mb-12">
          <p className="text-label text-ink-500">Sessions</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            What to expect on the day
          </h2>
        </div>

        <div className="space-y-10 md:space-y-14">
          {types.map((type) => {
            const items = sessions.filter((s) => s.type === type);
            return (
              <div key={type} className="space-y-5 md:space-y-6">
                <p className="text-lg md:text-xl font-semibold text-foreground">
                  {type === "Guest Speaker" ? "Guest Speaker" : `${type}s`}
                </p>
                <div className="space-y-5 md:space-y-6">
                  {items.map((session, i) => (
                    <SessionCard key={i} session={session} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}

function SessionBody({ session }: { session: EventSession }) {
  // Prefer the structured blocks (paragraphs / sub-headings / bullet lists) that
  // preserve the legacy accordion layout; fall back to the flat description.
  if (session.descriptionBlocks && session.descriptionBlocks.length > 0) {
    return (
      <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
        {session.descriptionBlocks.map((block, i) => {
          if (block.type === "list") {
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5">
                {block.items?.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            );
          }
          if (block.type === "subheading") {
            return (
              <p key={i} className="font-semibold text-foreground">
                {block.text}
              </p>
            );
          }
          return <p key={i}>{block.text}</p>;
        })}
      </div>
    );
  }
  if (session.description) {
    return (
      <p className="text-sm text-muted-foreground leading-relaxed">
        {session.description}
      </p>
    );
  }
  return null;
}

function SessionCard({ session }: { session: EventSession }) {
  const hasBody =
    (session.descriptionBlocks && session.descriptionBlocks.length > 0) ||
    !!session.description;

  return (
    <details className="rounded-[16px] border border-border bg-white p-6 md:p-8 group [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex items-start justify-between gap-3 cursor-pointer list-none">
        <h3 className="text-base md:text-lg font-semibold text-foreground">
          {session.title}
        </h3>
        {hasBody && (
          <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-ink-500 transition-transform duration-200 group-open:rotate-180" />
        )}
      </summary>
      <div className="mt-4">
        <SessionBody session={session} />
        {session.facilitators && session.facilitators.length > 0 && (
          <p className="mt-4 text-sm font-medium text-ink-600">
            {session.facilitators.join(", ")}
          </p>
        )}
      </div>
    </details>
  );
}
