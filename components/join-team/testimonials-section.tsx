"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";
import { joinTeamTestimonials as testimonials } from "@/lib/data/testimonials";


export function JoinTeamTestimonialsSection() {
    const [currentIndex, setCurrentIndex] = useState(0);

    const visibleCount = 3;
    const maxIndex = Math.max(0, testimonials.length - visibleCount);

    const nextTestimonials = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
    };

    const prevTestimonials = () => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    };

    const visibleTestimonials = testimonials.slice(
        currentIndex,
        currentIndex + visibleCount
    );

    return (
        <section className="w-full bg-muted/30 py-16 md:py-20 lg:py-24 xl:py-28">
            <Container size="full">
                <div>
                    {/* Header with title and navigation */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                        <h2 className="text-display-sm text-foreground">
                            What people say about She Sharp
                        </h2>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={prevTestimonials}
                                disabled={currentIndex === 0}
                                className={cn(
                                    "h-10 w-10 rounded-full",
                                    currentIndex === 0 && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={nextTestimonials}
                                disabled={currentIndex >= maxIndex}
                                className={cn(
                                    "h-10 w-10 rounded-full",
                                    currentIndex >= maxIndex && "opacity-50 cursor-not-allowed"
                                )}
                            >
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    {/* Testimonials Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-8">
                        {visibleTestimonials.map((testimonial, index) => (
                            <Card
                                key={`${currentIndex + index}-${testimonial.name}`}
                                className="card-sm p-4 sm:p-5 md:p-6 bg-background border border-border shadow-none hover:border-foreground/30 transition-colors duration-300 flex flex-col"
                            >
                                <MessageSquareQuote className="w-8 h-8 text-brand shrink-0 mb-4" />
                                <p className="text-base text-foreground mb-6 leading-relaxed flex-1">
                                    {testimonial.content}
                                </p>
                                <div className="border-t border-border pt-4 mt-auto">
                                    <p className="font-semibold text-foreground mb-1">
                                        {testimonial.name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonial.role}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}

