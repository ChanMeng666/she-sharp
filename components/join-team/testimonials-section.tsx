"use client";

import { useState } from "react";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, MessageSquareQuote } from "lucide-react";
import { cn } from "@/lib/utils";

type Testimonial = {
    name: string;
    role: string;
    content: string;
};

const testimonials: Testimonial[] = [
    {
        name: "Shein Delos Angeles",
        role: "Event Volunteer",
        content:
            "I volunteered to help with the She Sharp Tomorrow Expo and I enjoyed every step of the way. I was one of the volunteers who helped set up and talk to people about She Sharp's agenda and it was a blast! I wanted to commend this organisation for giving me an opportunity to meet people around tech and to know some people that are now my friends. I'm looking forward to the next upcoming event!",
    },
    {
        name: "Vic Arce",
        role: "Previous Ambassador",
        content:
            "Working with She# has been such a remarkable experience. I feel lucky to have had the opportunity to be surrounded by highly motivated people who want to make a difference for women. I once spoke with a friend who described the She# team as people who eat passion for breakfast - a very amusing description which I found true in the months I've been with the team.",
    },
    {
        name: "Aneela Lala",
        role: "Previous Ambassador",
        content:
            "As an Ambassador for She Sharp, I have had the privilege of collaborating with fabulous like-minded Wahine, connecting with amazing people from diverse STEM fields and sharing my passion for STEM and inclusivity with so many talented, successful and inspiring Women in Industry. In addition, She Sharp has allowed me to step outside of my comfort zone (as an introvert), by providing a supportive safety net of Ambassadors who challenge my own limiting beliefs about my capabilities and encourage me to grow.",
    },
    {
        name: "Yinghui (Maxie) Ouyang",
        role: "Event Volunteer",
        content:
            "Being a volunteer at She Sharp has been an enlightening and fulfilling experience. The She Sharp team really take care of you and make sure you get access to the benefits as if you are a participant of each event. Networking is a great example of that. I've met more women in tech from the first event than I have in months. They go out of their way to make sure the volunteers are seen and appreciated for their hard work.",
    },
];

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
                            What People Say About She Sharp
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
                                className="card-sm p-4 sm:p-5 md:p-6 bg-white shadow-sm hover:shadow-md transition-all duration-300 flex flex-col"
                            >
                                <p className="text-base text-foreground mb-6 leading-relaxed flex-1">
                                    {testimonial.content}
                                </p>
                                <div className="border-t pt-4 mt-auto">
                                    <div className="flex items-start gap-3">
                                        <MessageSquareQuote className="w-8 h-8 text-muted-foreground shrink-0 mt-1" />
                                        <div>
                                            <p className="font-semibold text-foreground mb-1">
                                                {testimonial.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {testimonial.role}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            </Container>
        </section>
    );
}

