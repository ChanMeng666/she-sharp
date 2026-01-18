"use client";

import { useEffect, useState } from "react";
import { Event } from "@/types/event";

interface EventCountdownProps {
  event: Event;
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
    // Calculate target date from startDate and startTime
    const [hours, minutes] = event.startTime.split(":").map(Number);
    const targetDate = new Date(event.startDate);
    targetDate.setHours(hours, minutes, 0, 0);

    const updateCountdown = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
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
  }, [event.startDate, event.startTime]);

  return (
    <div className={className}>
      <div className="w-full">
        <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
          {/* Card with three color sections */}
          <div className="flex">
            {/* Left section - Purple/Blue */}
            <div className="bg-brand/30 px-4 md:px-6 py-4 md:py-6 flex items-center">
              <div>
                <p className="text-white text-xs md:text-sm font-medium uppercase mb-1 md:mb-2">
                  SEE YOU IN
                </p>
                <div className="h-0.5 w-12 md:w-24 bg-white"></div>
              </div>
            </div>

            {/* Middle section - Dark Grey */}
            <div className="bg-foreground/90 px-4 md:px-6 py-4 md:py-6 flex-1 flex items-center justify-around gap-2 md:gap-4">
              <div className="text-center">
                <div className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 md:mb-1">
                  {String(timeLeft.days).padStart(2, "0")}
                </div>
                <div className="text-[10px] md:text-xs text-white/80 uppercase tracking-wider">
                  DAYS
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-0.5 md:mb-1">
                  {String(timeLeft.hours).padStart(2, "0")}
                </div>
                <div className="text-[10px] md:text-xs text-white/80 uppercase tracking-wider">
                  HOURS
                </div>
              </div>
            </div>

            {/* Right section - White */}
            <div className="bg-white/95 px-4 md:px-6 py-4 md:py-6 flex-1 flex items-center justify-around gap-2 md:gap-4">
              <div className="text-center">
                <div className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-0.5 md:mb-1">
                  {String(timeLeft.minutes).padStart(2, "0")}
                </div>
                <div className="text-[10px] md:text-xs text-foreground/70 uppercase tracking-wider">
                  MINUTES
                </div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-3xl lg:text-4xl font-bold text-foreground mb-0.5 md:mb-1">
                  {String(timeLeft.seconds).padStart(2, "0")}
                </div>
                <div className="text-[10px] md:text-xs text-foreground/70 uppercase tracking-wider">
                  SECONDS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

