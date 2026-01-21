"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Mic, FileText } from "lucide-react";

const resourceTypes = [
  {
    icon: Camera,
    label: "Gallery",
    description: "Photo albums",
    color: "text-purple-dark",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
  {
    icon: Mic,
    label: "Podcasts",
    description: "Audio content",
    color: "text-purple-mid",
    bgColor: "bg-purple-50 dark:bg-purple-900/20",
  },
  {
    icon: FileText,
    label: "Reports",
    description: "Impact data",
    color: "text-purple-light",
    bgColor: "bg-purple-50/50 dark:bg-purple-900/10",
  },
];

/**
 * Resource types card for the integrations slot.
 * Displays icons for different resource categories.
 */
export function ResourceTypesCard() {
  return (
    <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 rounded-[50px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Resources</CardTitle>
        <CardDescription>
          Explore our content library
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-4">
        {resourceTypes.map((type) => (
          <div
            key={type.label}
            className="flex flex-col items-center gap-2 group cursor-pointer"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${type.bgColor} transition-transform duration-200 group-hover:scale-110`}>
              <type.icon className={`h-6 w-6 ${type.color}`} />
            </div>
            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
              {type.label}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
