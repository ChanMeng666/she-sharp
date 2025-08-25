import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Card } from "@/components/ui/card";
import { Mail, MapPin, Clock } from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email",
    value: "hello@shesharp.org.nz",
    href: "mailto:hello@shesharp.org.nz"
  },
  {
    icon: MapPin,
    label: "Location",
    value: "Auckland, New Zealand",
    href: null
  },
  {
    icon: Clock,
    label: "Response Time",
    value: "Within 48 hours",
    href: null
  }
];

export function ContactInfoSection() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-light text-navy-dark">Contact Information</h2>
      <div className="space-y-6">
        {contactInfo.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-start space-x-4">
              <div className="mt-1">
                <Icon className="h-5 w-5 text-purple-dark" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm text-gray">{item.label}</p>
                {item.href ? (
                  <a 
                    href={item.href}
                    className="text-navy-dark hover:text-purple-dark transition-colors"
                  >
                    {item.value}
                  </a>
                ) : (
                  <p className="text-navy-dark">{item.value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}