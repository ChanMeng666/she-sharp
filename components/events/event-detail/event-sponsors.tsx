"use client";

import { Event } from "@/types/event";
import { cn } from "@/lib/utils";

interface EventSponsorsProps {
    event: Event;
    className?: string;
}

export function EventSponsors({ event, className }: EventSponsorsProps) {
    if (!event.sponsors || event.sponsors.length === 0) {
        return null;
    }

    return (
        <section
            id="event-sponsors"
            className={cn(
                "py-16 border-t border-border bg-muted/40",
                className,
            )}
        >
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <p className="text-lg font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                        Event Sponsors
                    </p>
                    <h2 className="mt-2 text-3xl md:text-4xl font-semibold ">
                        Powered by our partners
                    </h2>
                </div>

                 <div className="flex flex-wrap justify-center gap-10 md:gap-12">
                    {event.sponsors.map((sponsor) => (
                        <div
                            key={`${sponsor.name}-${sponsor.logo}`}
                             className="flex items-center justify-center px-4"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={sponsor.logo}
                                alt={sponsor.name}
                                 className="h-24 md:h-28 lg:h-32 w-auto object-contain opacity-90"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


