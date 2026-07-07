"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MENTORSHIP_CONFIG } from "@/lib/config/mentorship";

type CountdownVariant = "onBrand" | "onLight";

interface ApplicationCountdownProps {
  variant?: CountdownVariant;
}

const VARIANT_STYLES: Record<
  CountdownVariant,
  {
    cardClass: string;
    cardMinWidth: string;
    valueClass: string;
    unitClass: string;
    labelClass: string;
  }
> = {
  onBrand: {
    cardClass: "bg-white/10 border-white/20",
    cardMinWidth: "min-w-[80px] sm:min-w-[100px]",
    valueClass: "text-3xl font-bold text-white",
    unitClass: "text-sm text-white/80 capitalize",
    labelClass: "text-label text-white/80 text-left",
  },
  onLight: {
    cardClass: "bg-white border-border",
    cardMinWidth: "min-w-[70px] sm:min-w-[100px]",
    valueClass: "text-3xl font-bold text-foreground",
    unitClass: "text-sm text-ink-600 capitalize",
    labelClass: "text-label text-brand text-left",
  },
};

export function ApplicationCountdown({ variant = "onBrand" }: ApplicationCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    const applicationDeadline = new Date(MENTORSHIP_CONFIG.registrationDeadline);

    const timer = setInterval(() => {
      const difference = applicationDeadline.getTime() - Date.now();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <p className={styles.labelClass}>Application Deadline</p>
      <div className="flex gap-4 flex-wrap max-w-xl">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <Card
            key={unit}
            className={`${styles.cardClass} flex-1 ${styles.cardMinWidth} card-sm`}
          >
            <CardContent className="p-3 sm:p-4 text-center">
              <div className={styles.valueClass}>{value}</div>
              <div className={styles.unitClass}>{unit}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
