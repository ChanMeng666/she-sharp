import { EventV3, EventSession } from "@/types/event";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

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
          <p className="text-lg font-bold tracking-[0.2em] uppercase text-brand">
            Sessions
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
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

function SessionCard({ session }: { session: EventSession }) {
  return (
    <div className="card-responsive-sm bg-background p-6 md:p-8 shadow-sm flex flex-col h-full">
      <h3 className="text-base md:text-lg font-semibold text-foreground">
        {session.title}
      </h3>
      {session.description && (
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed flex-1">
          {session.description}
        </p>
      )}
      {session.facilitators && session.facilitators.length > 0 && (
        <p className="mt-4 text-sm font-medium text-brand">
          {session.facilitators.join(", ")}
        </p>
      )}
    </div>
  );
}
