"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormData {
  fullName: string;
  email: string;
  organisation: string;
  message: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    organisation: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message");
      }

      setIsSuccess(true);
      setFormData({
        fullName: "",
        email: "",
        organisation: "",
        message: "",
      });
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-background border border-border card-sm p-6 sm:p-8 md:p-10 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-mint flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-foreground" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-2">
          Message sent
        </h3>
        <p className="text-ink-700 mb-6">
          Thank you for reaching out. We&apos;ll get back to you as soon as
          possible.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          className="rounded-full"
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-background border border-border card-sm p-6 sm:p-8 md:p-10"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground font-medium">
            Full Name <span className="text-brand">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your name"
            className={`h-12 rounded-2xl bg-background border-border focus:border-brand ${
              errors.fullName ? "border-destructive" : ""
            }`}
          />
          {errors.fullName && (
            <p className="text-sm text-destructive">{errors.fullName}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground font-medium">
            Email Address <span className="text-brand">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            className={`h-12 rounded-2xl bg-background border-border focus:border-brand ${
              errors.email ? "border-destructive" : ""
            }`}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email}</p>
          )}
        </div>

        {/* Organisation */}
        <div className="space-y-2">
          <Label htmlFor="organisation" className="text-foreground font-medium">
            Organisation
          </Label>
          <Input
            id="organisation"
            name="organisation"
            type="text"
            value={formData.organisation}
            onChange={handleChange}
            placeholder="Enter your organisation"
            className="h-12 rounded-2xl bg-background border-border focus:border-brand"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-foreground font-medium">
            Your message
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your message"
            rows={5}
            className={`rounded-2xl bg-background border-border focus:border-brand resize-y ${
              errors.message ? "border-destructive" : ""
            }`}
          />
          {errors.message && (
            <p className="text-sm text-destructive">{errors.message}</p>
          )}
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
            <p className="text-sm text-destructive">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-start sm:justify-center pt-2 sm:pt-4">
          <Button
            type="submit"
            variant="brand"
            disabled={isSubmitting}
            size="lg"
            className="rounded-full px-12"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" />
                Sending...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

