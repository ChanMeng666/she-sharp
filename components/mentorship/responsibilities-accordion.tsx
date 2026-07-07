"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CurtainReveal } from "@/components/ui/reveal";

export interface ResponsibilityItem {
  id: number;
  title: string;
  image: string;
  alt: string;
  description: string;
}

/**
 * ResponsibilitiesAccordion — editorial hairline-row accordion. Each row is a
 * full-width title with a brand plus-toggle and a soft purple tint sweep on
 * hover; opening a row swaps the framed image panel on the right (curtain
 * wipe). Collapses to a single column with inline images on mobile.
 */
export function ResponsibilitiesAccordion({
  items,
}: {
  items: ResponsibilityItem[];
}) {
  const [activeImage, setActiveImage] = useState({
    src: items[0]?.image ?? "",
    alt: items[0]?.alt ?? "",
  });

  return (
    <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
      <Accordion
        type="single"
        collapsible
        defaultValue="item-0"
        className="w-full border-t border-border"
        onValueChange={(value) => {
          const idx = Number(value?.replace("item-", ""));
          if (!Number.isNaN(idx) && items[idx]) {
            setActiveImage({ src: items[idx].image, alt: items[idx].alt });
          }
        }}
      >
        {items.map((item, index) => (
          <AccordionItem
            key={item.id}
            value={`item-${index}`}
            className="border-b border-border"
          >
            <AccordionTrigger className="group -mx-4 rounded-[12px] px-4 py-5 !no-underline transition-colors hover:bg-[#f7e5f3] [&>svg:last-child]:hidden">
              <div className="flex w-full items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <span className="text-label text-brand">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="text-lg md:text-xl font-semibold text-foreground">
                    {item.title}
                  </h3>
                </div>
                <Plus className="size-5 shrink-0 text-brand transition-transform duration-200 group-data-[state=open]:rotate-45" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4">
              <p className="text-base text-ink-600 leading-relaxed">
                {item.description}
              </p>
              <div className="mt-4 md:hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[32px] border border-border bg-muted">
                  <Image
                    src={item.image}
                    alt={item.alt}
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

      <div className="sticky top-28 hidden md:block">
        <CurtainReveal
          key={activeImage.src}
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[32px] border border-border bg-muted"
        >
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            className="object-cover"
            sizes="50vw"
          />
        </CurtainReveal>
      </div>
    </div>
  );
}
