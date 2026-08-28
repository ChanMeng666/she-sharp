"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiPost, isApiError } from "@/lib/api/client";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";

type Status = "idle" | "sending" | "done" | "expired" | "error";

type ConfirmResponse = { ok: true; email: string };

/**
 * The confirm button for a newsletter double opt-in.
 *
 * It POSTs; it does not confirm on load, and that is the whole point of the
 * component existing. Link scanners and corporate mail gateways fetch every URL
 * in an inbound message before a human sees it, so a page that subscribed
 * someone on GET would manufacture consent for people who never clicked — and
 * consent for a marketing list is exactly the thing we cannot fabricate. A
 * button press is the cheapest evidence that a person, not a scanner, is here.
 *
 * @param token The single-use `t` value carried over from the email link.
 */
export function ConfirmForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");

  async function handleConfirm() {
    setStatus("sending");
    try {
      const result = await apiPost<ConfirmResponse>("/api/newsletter/confirm", {
        token,
      });
      setEmail(result?.email ?? "");
      setStatus("done");
    } catch (error) {
      // 410 is the one failure with its own copy. The route returns it for an
      // expired token, an already-used token and an unknown token alike, and we
      // keep those indistinguishable here on purpose: telling them apart would
      // let anyone holding a token learn whether it had been redeemed.
      setStatus(isApiError(error) && error.status === 410 ? "expired" : "error");
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
          You&rsquo;re on the list{email ? ` — ${email}` : ""}.
        </p>
        <p className="mt-2 text-sm text-ink-600">
          You&rsquo;ll get one email a month covering upcoming events, the
          mentorship programme, and news from the New Zealand women-in-tech
          community. Every issue has a one-click unsubscribe link, so you can
          leave whenever you like.
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

  if (status === "expired") {
    return (
      <div className="mt-8 rounded-[16px] border border-border bg-muted p-5">
        <p className="font-medium text-foreground">
          This confirmation link has expired or has already been used.
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Confirmation links last 7 days. Sign up again and we will send you a
          new one.
        </p>
        <div className="mt-5">
          <Button asChild variant="brand">
            <Link href="/newsletter/subscribe">Request a new link</Link>
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
        {status === "sending" ? "Confirming…" : "Confirm my subscription"}
      </Button>

      {status === "error" && (
        <p className="mt-4 text-sm text-destructive" role="alert">
          That did not work. Please try again in a moment, or email{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>{" "}
          and we will add you by hand.
        </p>
      )}
    </div>
  );
}
