import { EventV3 } from "@/types/event";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";

interface EventScheduleProps {
  event: EventV3;
}

/**
 * Renders the day's agenda (the legacy site's schedule sub-page) as a
 * responsive When / What / Where table. A time slot may run several parallel
 * sessions, each listed with its room.
 */
export function EventSchedule({ event }: EventScheduleProps) {
  const schedule = event.detailPageData.schedule;
  if (!schedule || !schedule.items?.length) return null;

  return (
    <Section spacing="section" className="bg-white">
      <Container size="full">
        <div className="mb-8 md:mb-10">
          <p className="text-label text-ink-500">Schedule</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight text-foreground">
            Agenda
          </h2>
          {schedule.day && (
            <p className="mt-2 text-base md:text-lg text-muted-foreground">
              {schedule.day}
            </p>
          )}
        </div>

        {schedule.bannerImage && (
          <div className="mb-8 overflow-hidden rounded-[32px] border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={schedule.bannerImage}
              alt="Conference schedule banner"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Column headers (desktop) */}
        <div className="hidden md:grid grid-cols-[160px_1fr_240px] gap-6 border-b border-border pb-3 mb-2">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            When
          </p>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            What
          </p>
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Where
          </p>
        </div>

        <div className="divide-y divide-border">
          {schedule.items.map((item, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-[160px_1fr_240px] gap-2 md:gap-6 py-4 md:py-5"
            >
              <p className="font-semibold text-foreground md:text-sm">
                {item.time}
              </p>
              <div className="space-y-2">
                {item.entries.map((e, j) => (
                  <div key={j}>
                    <p className="text-sm md:text-base text-foreground">
                      {e.activity}
                    </p>
                    {/* Room shown inline on mobile (no Where column) */}
                    {e.location && (
                      <p className="md:hidden text-xs text-muted-foreground mt-0.5">
                        {e.location}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="hidden md:block space-y-2">
                {item.entries.map((e, j) => (
                  <p key={j} className="text-sm text-muted-foreground">
                    {e.location || " "}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
