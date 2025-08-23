"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlayCircle } from "lucide-react";
import Image from "next/image";

export function AboutHeroSection() {
  return (
    <Section className="relative overflow-hidden bg-white py-0">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Left Side - Image */}
        <div className="relative h-[50vh] sm:h-[40vh] w-full lg:h-screen lg:w-[60%]">
          <Image
            src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/670c6faa065093d7fd557a81_66b08c577a2a3900c4c635f8_GEC23%20%281%29.jpg"
            alt="She Sharp team at an event"
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-navy-dark/40" />
          
          {/* Mobile overlay text */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white lg:hidden">
            <h1 className="text-3xl font-bold">
              Bridging the
              <span className="block text-periwinkle-dark">Gender Gap</span>
              in STEM
            </h1>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="flex min-h-[50vh] w-full flex-col justify-center bg-navy-light/5 px-6 py-12 sm:px-8 lg:h-screen lg:w-[40%] lg:px-12 xl:px-16">
          <div className="mx-auto w-full max-w-xl">
            {/* Desktop Title */}
            <h1 className="hidden font-serif text-4xl font-bold leading-tight text-navy sm:text-5xl lg:block lg:text-6xl">
              Bridging the
              <span className="block text-navy-dark">
                Gender Gap
              </span>
              in STEM
            </h1>

            {/* Founder's Message */}
            <div className="mt-6 lg:mt-8">
              <p className="mb-4 text-lg font-medium text-purple-dark">
                A Message from Our Founder
              </p>
              
              {/* Mobile: Show full content, Desktop: ScrollArea */}
              <div className="lg:hidden">
                <div className="space-y-4 text-gray-700">
                  <p>
                    She Sharp is a nonprofit founded in 2014 with the mission to bridge 
                    the gender gap in the STEM industry, one woman at a time.
                  </p>
                  <p>
                    As the Director of She Sharp, I am proud to lead an organization 
                    dedicated to empowering women in tech. Despite women making up over 
                    half of the population, they represent only 20% of roles in STEM fields.
                  </p>
                  <p>
                    At She Sharp, we strive to connect women with female role models, 
                    host workshops, and dispel misconceptions about the industry.
                  </p>
                  <p className="font-semibold">
                    Join us in changing the face of tech!
                  </p>
                  <p className="text-sm italic text-gray-600">
                    Dr. Mahsa McCauley, Founder and Director
                  </p>
                </div>
              </div>
              
              <ScrollArea className="hidden h-64 pr-4 lg:block">
                <div className="space-y-4 text-gray-700">
                  <p>
                    She Sharp is a nonprofit founded in 2014 with the mission to bridge 
                    the gender gap in the STEM industry, one woman at a time.
                  </p>
                  <p>
                    As the Director of She Sharp, I am proud to lead an organization 
                    dedicated to empowering women in tech. Despite women making up over 
                    half of the population, they represent only 20% of roles in STEM fields.
                  </p>
                  <p>
                    At She Sharp, we strive to connect women with female role models, 
                    host workshops, and dispel misconceptions about the industry. We aim 
                    to create an inclusive environment that empowers women to pursue their 
                    passions in tech.
                  </p>
                  <p className="font-semibold">
                    Join us in changing the face of tech!
                  </p>
                  <p className="text-sm italic text-gray-600">
                    Dr. Mahsa McCauley, Founder and Director
                  </p>
                </div>
              </ScrollArea>
            </div>

            {/* Video Dialog Trigger */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="gradient"
                  size="lg"
                  className="mt-8 w-full gap-2 sm:w-auto"
                >
                  <PlayCircle className="h-5 w-5" />
                  Watch Our Story
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl p-0">
                <div className="aspect-video">
                  <video
                    className="h-full w-full"
                    src="https://lxd4dc8r8oetlgua.public.blob.vercel-storage.com/6494eca97a143f705f5a5436_Home%20Vid%201-1%20Placeholder-transcode.mp4"
                    controls
                    autoPlay
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Section>
  );
}