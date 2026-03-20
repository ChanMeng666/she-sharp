"use client";

import { useState } from "react";
import Image from "next/image";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FeatureItem {
  id: number;
  title: string;
  image: string;
  description: string;
}

interface AccordionFeatureSectionProps {
  features: FeatureItem[];
}

const AccordionFeatureSection = ({
  features,
}: AccordionFeatureSectionProps) => {
  const [activeTabId, setActiveTabId] = useState<number>(features[0]?.id ?? 1);
  const [activeImage, setActiveImage] = useState(features[0]?.image ?? "");

  return (
    <div className="flex w-full items-start justify-between gap-6 md:gap-8 lg:gap-10">
      <div className="w-full md:w-1/2">
        <Accordion type="single" className="w-full" defaultValue="item-1">
          {features.map((tab) => (
            <AccordionItem key={tab.id} value={`item-${tab.id}`}>
              <AccordionTrigger
                onClick={() => {
                  setActiveImage(tab.image);
                  setActiveTabId(tab.id);
                }}
                className="cursor-pointer py-5 !no-underline transition"
              >
                <h3
                  className={`text-lg md:text-xl font-semibold transition-colors ${
                    tab.id === activeTabId
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {tab.title}
                </h3>
              </AccordionTrigger>
              <AccordionContent>
                <p className="mt-1 text-base text-muted-foreground leading-relaxed">
                  {tab.description}
                </p>
                <div className="mt-4 md:hidden">
                  <div className="relative aspect-[4/3] w-full overflow-hidden card-sm">
                    <Image
                      src={tab.image}
                      alt={tab.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <div className="relative m-auto hidden w-1/2 overflow-hidden card-sm bg-muted md:block">
        <div className="relative aspect-[4/3] w-full">
          <Image
            src={activeImage}
            alt="Feature preview"
            fill
            className="object-cover"
            sizes="50vw"
          />
        </div>
      </div>
    </div>
  );
};

export { AccordionFeatureSection };
export type { FeatureItem, AccordionFeatureSectionProps };
