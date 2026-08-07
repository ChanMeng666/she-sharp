"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SPONSORSHIP_EMAIL } from "@/lib/config/contact-addresses";

type Status = "idle" | "submitting" | "success" | "error";

export function SponsorInquiryForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/sponsors/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, organisation, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Failed to send inquiry. Please try again.");
        return;
      }
      setStatus("success");
      setFullName("");
      setEmail("");
      setOrganisation("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <section
      id="sponsor-inquiry"
      className="relative bg-foreground px-4 py-14 sm:px-6 sm:py-16 md:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-8 rounded-[32px] border border-white/10 p-6 sm:p-8 md:p-10 lg:grid-cols-5 lg:gap-12 lg:p-14">
          {/* Headline column */}
          <div className="lg:col-span-2">
            <h2 className="text-display-sm leading-tight text-mint">
              Hey sponsors, join us on our mission to bridge the gender gap
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-white/75 sm:mt-5 sm:text-base">
              Get in touch to learn more about becoming a She Sharp sponsor. Our
              partnerships team will reach out shortly.
            </p>
            {/*
              industry@ is the organisation's sponsorship address — a routing
              decision made in 2023 and re-confirmed in 2026, but one this site
              had never surfaced anywhere. Some sponsors would rather email a
              person than fill in a form, and until now the only address on
              offer was the general one.
            */}
            <p className="mt-4 text-sm leading-relaxed text-white/75 sm:text-base">
              Prefer email? Write to{" "}
              <a
                href={`mailto:${SPONSORSHIP_EMAIL}`}
                className="font-medium text-mint underline underline-offset-4 hover:text-white"
              >
                {SPONSORSHIP_EMAIL}
              </a>
              .
            </p>
          </div>

          {/* Form column */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-4 sm:space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="inquiry-name" className="text-white">
                Full Name <span className="text-mint">*</span>
              </Label>
              <Input
                id="inquiry-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-mint"
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-email" className="text-white">
                Email Address <span className="text-mint">*</span>
              </Label>
              <Input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-mint"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-org" className="text-white">
                Organisation <span className="text-mint">*</span>
              </Label>
              <Input
                id="inquiry-org"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                required
                maxLength={200}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-mint"
                placeholder="Enter your organisation"
                autoComplete="organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-message" className="text-white">
                Your message
              </Label>
              <Textarea
                id="inquiry-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                maxLength={5000}
                rows={5}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-mint"
                placeholder="Enter your message"
              />
            </div>

            {status === "error" && errorMsg && (
              <p
                role="alert"
                className="text-sm text-red-300 bg-red-500/10 border border-red-400/30 rounded-md px-3 py-2"
              >
                {errorMsg}
              </p>
            )}
            {status === "success" && (
              <p
                role="status"
                className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-400/30 rounded-md px-3 py-2"
              >
                Thanks! Your inquiry has been received — we&apos;ll reach out within a few business days.
              </p>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                variant="brand"
                disabled={status === "submitting"}
                className="w-full font-semibold sm:w-auto"
              >
                {status === "submitting" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
