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
      <div className="bg-white card-sm p-6 sm:p-8 md:p-10 shadow-lg text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-navy-dark mb-2">
          Message Sent!
        </h3>
        <p className="text-navy-dark/70 mb-6">
          Thank you for reaching out. We&apos;ll get back to you as soon as
          possible.
        </p>
        <Button
          onClick={() => setIsSuccess(false)}
          variant="outline"
          className="rounded-full"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white card-sm p-6 sm:p-8 md:p-10 shadow-lg"
    >
      <div className="space-y-5 sm:space-y-6">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-navy-dark font-medium">
            Full Name <span className="text-brand">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Enter your name"
            className={`h-12 rounded-2xl bg-white border-gray-200 focus:border-brand ${
              errors.fullName ? "border-red-500" : ""
            }`}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500">{errors.fullName}</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-navy-dark font-medium">
            Email Address <span className="text-brand">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email address"
            className={`h-12 rounded-2xl bg-white border-gray-200 focus:border-brand ${
              errors.email ? "border-red-500" : ""
            }`}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        {/* Organisation */}
        <div className="space-y-2">
          <Label htmlFor="organisation" className="text-navy-dark font-medium">
            Organisation
          </Label>
          <Input
            id="organisation"
            name="organisation"
            type="text"
            value={formData.organisation}
            onChange={handleChange}
            placeholder="Enter your organisation"
            className="h-12 rounded-2xl bg-white border-gray-200 focus:border-brand"
          />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-navy-dark font-medium">
            Your message
          </Label>
          <Textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            placeholder="Enter your message"
            rows={5}
            className={`rounded-2xl bg-white border-gray-200 focus:border-brand resize-y ${
              errors.message ? "border-red-500" : ""
            }`}
          />
          {errors.message && (
            <p className="text-sm text-red-500">{errors.message}</p>
          )}
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-start sm:justify-center pt-2 sm:pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            size="lg"
            className="rounded-full px-12 bg-brand hover:bg-brand/90"
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

