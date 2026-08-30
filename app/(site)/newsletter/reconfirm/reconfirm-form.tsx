"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiPost, isApiError } from "@/lib/api/client";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";

type Status = "idle" | "sending" | "done" | "refused" | "invalid" | "error";

type ReconfirmResponse = { ok: true; email: string };

/**
 * The re-confirmation button.
 *
 * It POSTs; nothing happens on load, and that is the whole point of the
 * component existing. This page's only job is to produce evidence that a person
 * still wants the newsletter, and a page that recorded that on GET would record
 * it for every link scanner and mail gateway that opened the message first —
 * fabricating exactly the evidence the feature exists to collect.
 *
 * @param token The signed `t` value carried over from the email link.
 * @param issue The `i` value: which issue the link came from, recorded with the
 *   act so the consent record names it.
 */
export function ReconfirmForm({
  token,
  issue,
}: {
  token: string;
  issue?: string;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");

  async function handleConfirm() {
    setStatus("sending");
    try {
      const result = await apiPost<ReconfirmResponse>("/api/newsletter/reconfirm", {
        token,
        ...(issue ? { issue } : {}),
      });
      setEmail(result?.email ?? "");
      setStatus("done");
    } catch (error) {
      if (isApiError(error) && error.status === 409) {
        setStatus("refused");
      } else if (isApiError(error) && error.status === 400) {
        setStatus("invalid");
      } else {
        setStatus("error");
      }
    }
  }

  if (status === "done") {
    return (
      <div
        className="mt-8 rounded-[16px] border border-border bg-muted p-5"
        role="status"
        aria-live="polite"
      >
        <p className="font-medium text-foreground">
          Thank you{email ? ` — ${email} is confirmed` : " — you are confirmed"}.
        </p>
        <p className="mt-2 text-sm text-ink-600">
          That is the whole thing. You will keep getting one email a month, and
          every issue still has a one-click unsubscribe link if you change your
          mind.
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="brand">
            <Link href="/events">See upcoming events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/resources/newsletters">Read past issues</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (status === "refused" || status === "invalid") {
    return (
      <div className="mt-8 rounded-[16px] border border-border bg-muted p-5">
        <p className="font-medium text-foreground">
          This link can no longer be used.
        </p>
        <p className="mt-2 text-sm text-ink-600">
          If you would like to receive the She Sharp newsletter, you can sign up
          in a few seconds — the form below is the way onto the list, and it
          works whatever happened before.
        </p>
        <div className="mt-5">
          <Button asChild variant="brand">
            <Link href="/newsletter/subscribe">Sign up for the newsletter</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Button
        onClick={handleConfirm}
        variant="brand"
        size="lg"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Confirming…" : "Yes, keep sending it"}
      </Button>

      {status === "error" && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          That did not work. Please try again in a moment, or email{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>{" "}
          and we will sort it out by hand.
        </p>
      )}
    </div>
  );
}
