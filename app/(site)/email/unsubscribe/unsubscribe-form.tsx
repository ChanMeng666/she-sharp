"use client";

import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type Status = "idle" | "sending" | "done" | "error";

/**
 * The confirm button for a browser-initiated unsubscribe.
 *
 * It POSTs to the same endpoint the mail providers use, so there is one code
 * path and one definition of "unsubscribed". The click is what makes this safe:
 * the page never opts anyone out on load, because link scanners fetch these
 * URLs without a human involved.
 *
 * @param token The signed `t` value carried over from the email link.
 */
export function UnsubscribeForm({ token }: { token: string }) {
  const [status, setStatus] = useState<Status>("idle");

  async function handleUnsubscribe() {
    setStatus("sending");
    try {
      const response = await fetch(
        `/api/email/unsubscribe?t=${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      setStatus(response.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="mt-8 rounded-lg border border-border bg-muted p-4">
        You are unsubscribed. Reminder emails will stop immediately — no further
        action needed.
      </p>
    );
  }

  return (
    <div className="mt-8">
      <Button onClick={handleUnsubscribe} disabled={status === "sending"}>
        {status === "sending" ? "Unsubscribing…" : "Unsubscribe me"}
      </Button>

      {status === "error" && (
        <p className="mt-4 text-sm text-destructive">
          That did not work. The link may have expired. Please email{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>{" "}
          and we will remove you manually.
        </p>
      )}
    </div>
  );
}
