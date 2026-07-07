"use client";

import { buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import { Check, Star, X } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import confetti from "canvas-confetti";
import NumberFlow from "@number-flow/react";

interface PricingFeature {
  name: string;
  included: boolean;
}

interface PricingPlan {
  name: string;
  price: number;
  monthlyPrice: number;
  currency: string;
  description: string;
  features: PricingFeature[];
  buttonText: string;
  href: string;
  isPopular: boolean;
}

interface PricingProps {
  plans: PricingPlan[];
  title?: string;
  description?: string;
}

export function Pricing({
  plans,
  title = "Choose Your Membership",
  description = "Select the plan that best fits your goals.\nAll memberships support our mission to empower women in tech.",
}: PricingProps) {
  const [isYearly, setIsYearly] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const switchRef = useRef<HTMLButtonElement>(null);

  const handleToggle = (checked: boolean) => {
    setIsYearly(checked);
    if (checked && switchRef.current) {
      const rect = switchRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;

      confetti({
        particleCount: 50,
        spread: 60,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
        colors: ["#9b2e83", "#c846ab", "#8982ff", "#b1f6e9"],
        ticks: 200,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
        shapes: ["circle"],
      });
    }
  };

  return (
    <div>
      <div className="text-center space-y-4 mb-12 md:mb-16">
        <h2 className="text-display-sm text-foreground">{title}</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto whitespace-pre-line">
          {description}
        </p>
      </div>

      <div className="flex justify-center items-center mb-10">
        <span
          className={cn(
            "mr-3 font-medium transition-colors",
            !isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Monthly
        </span>
        <Label>
          <Switch
            ref={switchRef as React.Ref<HTMLButtonElement>}
            checked={isYearly}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-brand"
          />
        </Label>
        <span
          className={cn(
            "ml-3 font-medium transition-colors",
            isYearly ? "text-foreground" : "text-muted-foreground"
          )}
        >
          Yearly{" "}
          <span className="text-brand font-semibold">(Save 20%)</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ y: 50, opacity: 0 }}
            whileInView={
              isDesktop
                ? {
                    y: plan.isPopular ? -20 : 0,
                    opacity: 1,
                    x: index === 2 ? -30 : index === 0 ? 30 : 0,
                    scale: index === 0 || index === 2 ? 0.94 : 1.0,
                  }
                : { y: 0, opacity: 1 }
            }
            viewport={{ once: true }}
            transition={{
              duration: 1.6,
              type: "spring",
              stiffness: 100,
              damping: 30,
              delay: 0.4,
              opacity: { duration: 0.5 },
            }}
            className={cn(
              "rounded-[var(--radius-card-sm)] p-4 sm:p-6 md:p-8 text-center lg:flex lg:flex-col lg:justify-center relative border",
              plan.isPopular
                ? "bg-foreground text-white border-foreground"
                : "bg-white border-border",
              "flex flex-col",
              !plan.isPopular && "mt-5",
              index === 0 || index === 2
                ? "z-0 transform translate-x-0 translate-y-0"
                : "z-10",
              index === 0 && "origin-right",
              index === 2 && "origin-left"
            )}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-brand py-0.5 px-3 rounded-bl-xl rounded-tr-[var(--radius-card-sm)] flex items-center">
                <Star className="text-brand-foreground h-4 w-4 fill-current" />
                <span className="text-brand-foreground ml-1 font-semibold text-sm">
                  Popular
                </span>
              </div>
            )}
            <div className="flex-1 flex flex-col">
              <p className={cn(
                "text-base font-semibold uppercase tracking-wider",
                plan.isPopular ? "text-white/60" : "text-ink-600"
              )}>
                {plan.name}
              </p>
              <div className="mt-6 flex items-baseline justify-center gap-x-2">
                <span className={cn(
                  "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight",
                  plan.isPopular ? "text-white" : "text-brand"
                )}>
                  <NumberFlow
                    value={
                      isYearly ? plan.price : plan.monthlyPrice
                    }
                    format={{
                      style: "currency",
                      currency: plan.currency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }}
                    transformTiming={{
                      duration: 500,
                      easing: "ease-out",
                    }}
                    willChange
                  />
                </span>
                {(isYearly ? plan.price : plan.monthlyPrice) > 0 && (
                  <span className={cn(
                    "text-sm font-semibold leading-6 tracking-wide",
                    plan.isPopular ? "text-white/60" : "text-ink-600"
                  )}>
                    / {isYearly ? "year" : "month"}
                  </span>
                )}
              </div>

              <p className={cn(
                "text-xs leading-5 mt-1",
                plan.isPopular ? "text-white/60" : "text-ink-600"
              )}>
                {plan.price === 0
                  ? "Free forever"
                  : isYearly
                    ? "billed annually"
                    : "billed monthly"}
              </p>

              <ul className="mt-6 gap-2.5 flex flex-col text-left">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <Check className={cn(
                        "h-4 w-4 mt-1 flex-shrink-0",
                        plan.isPopular ? "text-[#b1f6e9]" : "text-brand"
                      )} />
                    ) : (
                      <X className={cn(
                        "h-4 w-4 mt-1 flex-shrink-0",
                        plan.isPopular ? "text-white/30" : "text-ink-300"
                      )} />
                    )}
                    <span
                      className={cn(
                        "text-sm sm:text-base",
                        feature.included
                          ? plan.isPopular ? "text-white" : "text-foreground"
                          : plan.isPopular ? "text-white/50" : "text-ink-500"
                      )}
                    >
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <hr className={cn(
                "w-full my-5",
                plan.isPopular ? "border-white/20" : "border-border"
              )} />

              <Link
                href={plan.href}
                className={cn(
                  buttonVariants({
                    variant: plan.isPopular ? "brand" : "outline",
                    size: "lg",
                  }),
                  "w-full gap-2 text-base font-semibold tracking-tight",
                  "transform-gpu transition-colors duration-300 ease-out"
                )}
              >
                {plan.buttonText}
              </Link>
              <p className={cn(
                "mt-5 text-xs leading-5",
                plan.isPopular ? "text-white/60" : "text-ink-600"
              )}>
                {plan.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
