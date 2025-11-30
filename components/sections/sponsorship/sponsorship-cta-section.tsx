"use client";

import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, Download, Copy } from "lucide-react";
import { useState } from "react";
import { layoutSystem, layoutClasses } from "@/lib/layout-system";

export function SponsorshipCTASection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      toast.success("Partnership inquiry sent!", {
        description: "We'll get back to you within 24-48 hours.",
        duration: 5000,
      });
      
      // Reset form
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (error) {
      toast.error("Something went wrong", {
        description: "Please try again or email us directly.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("partnerships@shesharp.org.nz");
    toast.success("Email copied to clipboard!");
  };

  const handleDownloadGuide = () => {
    toast.info("Downloading sponsorship guide...", {
      description: "Your download should start automatically.",
    });
    // Trigger download
    const link = document.createElement("a");
    link.href = "/docs/sponsorship-guide-2025.pdf";
    link.download = "She-Sharp-Sponsorship-Guide-2025.pdf";
    link.click();
  };

  return (
    <Section id="contact" bgColor="white">
      <Container size="wide">
        <div className={layoutClasses(
          "grid",
          layoutSystem.patterns.splitLayout.gap,
          "lg:grid-cols-2"
        )}>
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Make an Impact?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join us in creating more opportunities for women in STEM.
                Let's discuss how your organization can make a difference.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Email Us</h3>
                  <button
                    onClick={handleCopyEmail}
                    className="text-foreground hover:text-foreground/90 flex items-center gap-2 mt-1 transition-colors"
                  >
                    partnerships@shesharp.org.nz
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Call Us</h3>
                  <p className="text-muted-foreground mt-1">+64 21 123 456</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Visit Us</h3>
                  <p className="text-muted-foreground mt-1">
                    Auckland, New Zealand<br />
                    (Events held nationwide)
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-muted border-border">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-3">
                  Download Our Sponsorship Guide
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get detailed information about partnership opportunities,
                  benefits, and success stories.
                </p>
                <Button
                  onClick={handleDownloadGuide}
                  variant="outline"
                  className="w-full border-border text-foreground hover:bg-muted"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download 2025 Guide (PDF)
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Send Us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and we'll get back to you within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your Name *</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Smith"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Tech Corp"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@company.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+64 21 234 567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">How can we partner together? *</Label>
                  <Textarea
                    id="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your organization's goals and how you'd like to support women in STEM..."
                    className="resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-foreground hover:bg-foreground/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-pulse">Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send Partnership Inquiry
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </Container>
    </Section>
  );
}