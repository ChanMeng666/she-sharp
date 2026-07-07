"use client";

import { useEffect, useState } from "react";
import { EventV3 } from "@/types/event";
import { getEventStartTime, parseDateString } from "@/lib/data/events";

interface EventCountdownProps {
  event: EventV3;
  className?: string;
}

export function EventCountdown({ event, className }: EventCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    // Parse the event date
    const targetDate = parseDateString(event.date);

    // If there's a specific time, use it; otherwise default to 9:00 AM
    const startTime = getEventStartTime(event);
    if (startTime) {
      const timeMatch = startTime.match(/(\d+):(\d+)/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        targetDate.setHours(hours, minutes, 0, 0);
      }
    } else {
      targetDate.setHours(9, 0, 0, 0);
    }

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor(
            (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          ),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [
    event.date,
    event.detailPageData.startTime,
    event.detailPageData.time,
    event.detailPageData.dateTime,
  ]);

  const units: { value: number; label: string }[] = [
    { value: timeLeft.days, label: "Days" },
    { value: timeLeft.hours, label: "Hours" },
    { value: timeLeft.minutes, label: "Min" },
    { value: timeLeft.seconds, label: "Sec" },
  ];

  return (
    <div className={className}>
      <p className="text-label text-mint mb-3">See you in</p>
      <div className="flex items-stretch gap-2 sm:gap-3">
        {units.map((unit) => (
          <div
            key={unit.label}
            className="flex-1 rounded-[12px] border border-white/20 bg-white/10 px-2 py-3 text-center"
          >
            <div className="text-2xl md:text-3xl font-bold tabular-nums text-white">
              {String(unit.value).padStart(2, "0")}
            </div>
            <div className="mt-1 text-[10px] md:text-xs uppercase tracking-wider text-white/70">
              {unit.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
