import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users, Calendar } from "lucide-react";

export function MenteeHeroSection() {
  return (
    <Section className="relative overflow-hidden">
      {/* Dynamic gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-mint-light via-purple-light/50 to-periwinkle-light">
        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
      </div>
      
      <Container className="relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center py-16 md:py-24">
          {/* Content Section */}
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-purple-dark text-white hover:bg-purple-mid">
                <Calendar className="w-3 h-3 mr-1" />
                Applications Open
              </Badge>
              <Badge variant="secondary" className="bg-mint-dark/20 text-navy-dark">
                <Users className="w-3 h-3 mr-1" />
                Limited Spots Available
              </Badge>
            </div>
            
            <div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-navy-dark">
                BECOME A
              </h1>
              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-purple-dark mt-2">
                MENTEE
              </h2>
            </div>
            
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
              Join our mentorship program and accelerate your career in STEM. 
              Get personalized guidance from experienced professionals in your field.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/mentorship/join"
                className="inline-flex items-center justify-center px-6 py-3 bg-purple-dark text-white rounded-lg hover:bg-purple-mid transition-colors font-semibold"
              >
                Join the Program
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
              <Link
                href="/mentorship/mentors"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-purple-dark text-purple-dark rounded-lg hover:bg-purple-light transition-colors font-semibold"
              >
                <Users className="mr-2 w-4 h-4" />
                Meet Our Mentors
              </Link>
            </div>
          </div>
          
          {/* Image Section */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <AspectRatio ratio={4/3}>
                <Image
                  src="https://cdn.prod.website-files.com/646193fdf4af9a2a791b1555/66e7d4c72be67f161bddd38d_IMG_9887.jpg"
                  alt="She Sharp mentee group photo"
                  fill
                  className="object-cover"
                  priority
                />
              </AspectRatio>
              {/* Overlay gradient for better text readability if needed */}
              <div className="absolute inset-0 bg-gradient-to-t from-purple-dark/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Floating stats card */}
            <div className="absolute -bottom-6 -left-6 bg-white dark:bg-gray-900 rounded-lg shadow-xl p-4 hidden md:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-mint-dark/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-dark" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-dark">200+</p>
                  <p className="text-sm text-gray-600">Active Mentees</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}