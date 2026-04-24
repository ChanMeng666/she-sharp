"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

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
      className="relative py-14 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-[#1f1e44]"
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-[var(--radius-card-md)] bg-[#1f1e44] border border-white/10 shadow-2xl p-6 sm:p-8 md:p-10 lg:p-14 grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Headline column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight uppercase leading-tight text-[#2dd4bf]">
              Hey sponsors, join us on our mission to bridge the gender gap
            </h2>
            <p className="mt-4 sm:mt-5 text-sm sm:text-base text-white/75 leading-relaxed">
              Get in touch to learn more about becoming a She Sharp sponsor. Our
              partnerships team will reach out shortly.
            </p>
          </div>

          {/* Form column */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-3 space-y-4 sm:space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="inquiry-name" className="text-white">
                Full Name <span className="text-[#2dd4bf]">*</span>
              </Label>
              <Input
                id="inquiry-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#2dd4bf]"
                placeholder="Enter your name"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-email" className="text-white">
                Email Address <span className="text-[#2dd4bf]">*</span>
              </Label>
              <Input
                id="inquiry-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={100}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#2dd4bf]"
                placeholder="Enter your email address"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inquiry-org" className="text-white">
                Organisation <span className="text-[#2dd4bf]">*</span>
              </Label>
              <Input
                id="inquiry-org"
                value={organisation}
                onChange={(e) => setOrganisation(e.target.value)}
                required
                maxLength={200}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#2dd4bf]"
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
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-[#2dd4bf]"
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
                disabled={status === "submitting"}
                className="w-full sm:w-auto bg-[#2dd4bf] text-[#1f1e44] hover:bg-[#26bfab] font-semibold"
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
