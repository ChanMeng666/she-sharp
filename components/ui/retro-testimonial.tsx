"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ImageProps } from "next/image";
import { ArrowLeft, ArrowRight, Quote, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface iTestimonial {
  name: string;
  designation: string;
  description: string;
  profileImage: string;
}

interface iCarouselProps {
  items: React.ReactElement<{
    testimonial: iTestimonial;
    index: number;
    layout?: boolean;
    onCardClose: () => void;
  }>[];
  initialScroll?: number;
  autoPlay?: boolean;
  autoPlayDuration?: number;
}

const useOutsideClick = (
  ref: React.RefObject<HTMLDivElement | null>,
  onOutsideClick: () => void
) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [ref, onOutsideClick]);
};

const Carousel = ({
  items,
  initialScroll = 0,
  autoPlay = true,
  autoPlayDuration = 60000,
}: iCarouselProps) => {
  const carouselRef = React.useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = React.useState(false);
  const [translateX, setTranslateX] = React.useState(0);
  const animationRef = React.useRef<number | null>(null);
  const lastTimeRef = React.useRef<number>(0);

  const isMobile = React.useCallback(() => {
    return typeof window !== "undefined" && window.innerWidth < 768;
  }, []);

  const cardWidth = isMobile() ? 320 : 384;
  const gap = 16;
  const totalWidth = items.length * (cardWidth + gap);
  const speed = totalWidth / autoPlayDuration;

  useEffect(() => {
    if (!autoPlay) return;

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      if (!isHovered) {
        const deltaTime = timestamp - lastTimeRef.current;

        setTranslateX((prev) => {
          const newValue = prev - speed * deltaTime;
          if (Math.abs(newValue) >= totalWidth) {
            return newValue + totalWidth;
          }
          return newValue;
        });
      }

      lastTimeRef.current = timestamp;
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [autoPlay, isHovered, speed, totalWidth]);

  const handleScrollLeft = React.useCallback(() => {
    const scrollAmount = cardWidth + gap;
    setTranslateX((prev) => prev + scrollAmount);
  }, [cardWidth, gap]);

  const handleScrollRight = React.useCallback(() => {
    const scrollAmount = cardWidth + gap;
    setTranslateX((prev) => {
      const newValue = prev - scrollAmount;
      if (Math.abs(newValue) >= totalWidth) {
        return newValue + totalWidth;
      }
      return newValue;
    });
  }, [cardWidth, gap, totalWidth]);

  const handleCardClose = React.useCallback((index: number) => {
    // Card close handler - no scroll needed for transform-based carousel
  }, []);

  return (
    <div className="relative w-full mt-10">
      <div
        className="flex w-full overflow-hidden py-5"
        ref={carouselRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          className={cn("flex flex-row justify-start gap-4 pl-3", "flex-nowrap")}
          style={{ x: translateX }}
        >
          {items.map((item, index) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.5,
                  delay: 0.2 * Math.min(index, 5),
                  ease: "easeOut",
                },
              }}
              key={`card-${index}`}
              className="shrink-0 rounded-[50px]"
            >
              {React.cloneElement(item, {
                onCardClose: () => handleCardClose(index),
              })}
            </motion.div>
          ))}
          {autoPlay &&
            items.map((item, index) => (
              <div key={`card-clone-${index}`} className="shrink-0 rounded-[50px]">
                {React.cloneElement(item, {
                  onCardClose: () => handleCardClose(index),
                })}
              </div>
            ))}
        </motion.div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-foreground border-2 border-foreground flex items-center justify-center hover:bg-foreground/80 transition-colors duration-200"
          onClick={handleScrollLeft}
        >
          <ArrowLeft className="h-6 w-6 text-background" />
        </button>
        <button
          className="relative z-40 h-10 w-10 rounded-full bg-foreground border-2 border-foreground flex items-center justify-center hover:bg-foreground/80 transition-colors duration-200"
          onClick={handleScrollRight}
        >
          <ArrowRight className="h-6 w-6 text-background" />
        </button>
      </div>
    </div>
  );
};

const TestimonialCard = ({
  testimonial,
  index,
  layout = false,
  onCardClose = () => {},
  backgroundImage = "/img/scraped/backgrounds/testimonial-bg.jpg",
}: {
  testimonial: iTestimonial;
  index: number;
  layout?: boolean;
  onCardClose?: () => void;
  backgroundImage?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleExpand = () => {
    return setIsExpanded(true);
  };
  const handleCollapse = () => {
    setIsExpanded(false);
    onCardClose();
  };

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCollapse();
      }
    };

    if (isExpanded) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.body.dataset.scrollY = scrollY.toString();
    } else {
      const scrollY = parseInt(document.body.dataset.scrollY || "0", 10);
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo({ top: scrollY, behavior: "instant" });
    }

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      return window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isExpanded]);

  useOutsideClick(containerRef, handleCollapse);

  const expandedModal = (
    <AnimatePresence>
      {isExpanded && (
        <div className="fixed inset-0 h-screen overflow-hidden z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-foreground/50 backdrop-blur-lg h-full w-full fixed inset-0"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            ref={containerRef}
            layoutId={layout ? `card-${testimonial.name}` : undefined}
            className="max-w-5xl mx-auto bg-linear-to-b from-background to-muted h-full z-[60] p-4 md:p-10 rounded-[50px] relative md:mt-10"
          >
            <button
              className="sticky top-4 h-8 w-8 right-0 ml-auto rounded-full flex items-center justify-center bg-foreground border-2 border-foreground hover:bg-foreground/80 transition-colors duration-200"
              onClick={handleCollapse}
            >
              <X className="h-6 w-6 text-background absolute" />
            </button>
            <motion.p
              layoutId={layout ? `category-${testimonial.name}` : undefined}
              className="px-0 md:px-20 text-muted-foreground text-lg font-thin underline underline-offset-8"
            >
              {testimonial.designation}
            </motion.p>
            <motion.p
              layoutId={layout ? `title-${testimonial.name}` : undefined}
              className="px-0 md:px-20 text-2xl md:text-4xl font-normal italic text-foreground mt-4"
            >
              {testimonial.name}
            </motion.p>
            <div className="py-8 text-foreground px-0 md:px-20 text-xl md:text-2xl font-light leading-relaxed tracking-wide">
              <Quote className="h-6 w-6 text-muted-foreground mb-4" />
              {testimonial.description}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {isMounted && createPortal(expandedModal, document.body)}
      <motion.button
        layoutId={layout ? `card-${testimonial.name}` : undefined}
        onClick={handleExpand}
        className="cursor-zoom-in"
        whileHover={{
          rotateX: 2,
          rotateY: 2,
          rotate: 3,
          scale: 1.02,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
      >
        <div
          className={`${
            index % 2 === 0 ? "rotate-0" : "-rotate-0"
          } rounded-[50px] bg-linear-to-b from-background to-muted h-[500px] md:h-[550px] w-80 md:w-96 overflow-hidden flex flex-col items-center justify-center relative z-10 shadow-md border border-border`}
        >
          <div
            className="absolute opacity-20"
            style={{ inset: "-1px 0 0" }}
          >
            <div className="absolute inset-0">
              <Image
                className="block w-full h-full object-center object-cover"
                src={backgroundImage}
                alt="Background layer"
                fill
                style={{ objectFit: "cover" }}
              />
            </div>
          </div>
          <ProfileImage
            src={testimonial.profileImage}
            alt={testimonial.name}
          />
          <motion.p
            layoutId={layout ? `title-${testimonial.name}` : undefined}
            className="text-muted-foreground text-xl md:text-2xl font-normal text-center [text-wrap:balance] mt-4 px-4"
          >
            {testimonial.description.length > 100
              ? `${testimonial.description.slice(0, 100)}...`
              : testimonial.description}
          </motion.p>
          <motion.p
            layoutId={layout ? `category-${testimonial.name}` : undefined}
            className="text-foreground text-xl md:text-2xl font-medium text-center mt-5"
          >
            {testimonial.name}
          </motion.p>
          <motion.p
            className="text-muted-foreground text-sm md:text-base font-light text-center mt-1 underline underline-offset-8 decoration-1 px-4"
          >
            {testimonial.designation.length > 35
              ? `${testimonial.designation.slice(0, 35)}...`
              : testimonial.designation}
          </motion.p>
        </div>
      </motion.button>
    </>
  );
};

const ProfileImage = ({ src, alt, ...rest }: ImageProps) => {
  const [isLoading, setLoading] = useState(true);

  return (
    <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] overflow-hidden rounded-full border-[3px] border-solid border-border aspect-[1/1] flex-none relative">
      <Image
        className={cn(
          "transition duration-300 absolute top-0 inset-0 rounded-inherit object-cover z-50",
          isLoading ? "blur-sm" : "blur-0"
        )}
        onLoad={() => {
          return setLoading(false);
        }}
        src={src}
        width={150}
        height={150}
        loading="lazy"
        decoding="async"
        blurDataURL={typeof src === "string" ? src : undefined}
        alt={alt || "Profile image"}
        {...rest}
      />
    </div>
  );
};

export { Carousel, TestimonialCard, ProfileImage };
