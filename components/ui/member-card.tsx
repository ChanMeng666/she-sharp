"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { X, ArrowUpRight } from "lucide-react";
import Image from "next/image";

export interface MemberCardData {
  id?: string | number;
  name: string;
  image: string;
  description: string;
  title: string; // For display: role/company for mentors, roles.join() for team members
}

interface MemberCardProps {
  member: MemberCardData;
  index?: number;
  background?: string;
  accentColor?: string;
}

export function MemberCard({ member, index, background = "bg-surface-periwinkle", accentColor = "bg-brand/5" }: MemberCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <article
          onClick={() => setIsDialogOpen(true)}
          className={`group relative ${background} rounded-2xl overflow-hidden
                      transition-all duration-300 hover:shadow-2xl hover:-translate-y-1
                      focus-within:ring-4 focus-within:ring-brand/50 cursor-pointer`}
        >
          <div className="p-6 sm:p-8">
            <div className="relative mb-6">
              <div className="w-32 h-32 mx-auto rounded-full overflow-hidden ring-4 ring-white shadow-lg">
                {!imageError ? (
                  <img
                    src={member.image}
                    alt={`${member.name}, ${member.title}`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-4xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center">
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {member.name}
              </h3>
              <p className="text-sm sm:text-base font-medium text-brand mb-4">
                {member.title}
              </p>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                {member.description}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDialogOpen(true);
                }}
                className="text-sm font-medium text-brand hover:text-brand-hover transition-colors underline inline-flex items-center gap-1"
              >
                Learn more <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            <div className={`absolute top-0 right-0 w-32 h-32 ${accentColor} rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
          </div>
        </article>

        <DialogContent 
          className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-10 md:p-12"
          hideCloseButton
        >
          <div className="flex items-start justify-between mb-6 md:mb-8">
            <DialogHeader className="flex-1">
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                {member.name}
              </DialogTitle>
              <p className="text-base md:text-lg font-medium text-brand">
                {member.title}
              </p>
            </DialogHeader>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none px-2 py-0.5 flex items-center justify-center shrink-0 ml-4">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          <div className="flex flex-col md:flex-row gap-8 md:gap-10">
            <div className="shrink-0 flex flex-col items-center md:items-start">
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden ring-4 ring-brand/20 mx-auto md:mx-0">
                {!imageError ? (
                  <Image
                    src={member.image}
                    alt={`${member.name}, ${member.title}`}
                    fill
                    className="object-cover"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-brand flex items-center justify-center text-brand-foreground text-4xl md:text-5xl font-bold">
                    {member.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 flex items-start">
              <DialogDescription className="text-sm md:text-base text-foreground leading-relaxed whitespace-pre-line w-full">
                {member.description}
              </DialogDescription>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

