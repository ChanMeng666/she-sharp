"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost, isApiError } from "@/lib/api/client";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";

type Status = "idle" | "sending" | "done" | "error";

/**
 * The newsletter sign-up form.
 *
 * POSTs to `/api/newsletter/subscribe`, which answers `{ ok: true }` and
 * nothing else. That is a privacy decision on the server's part, not an
 * omission: a route that said "we sent it" versus "you are already on the
 * list" versus "that address is suppressed" would be an email-enumeration
 * oracle anyone could query. So the client genuinely cannot know which of
 * those happened — see `handleSubmit` for what that costs the copy.
 */
export function SubscribeForm() {
  const emailId = useId();
  const nameId = useId();
  const honeypotId = useId();

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    try {
      await apiPost("/api/newsletter/subscribe", { email, firstName, website });
      setStatus("done");
    } catch (error) {
      if (isApiError(error) && error.status === 429) {
        setErrorMessage("Too many attempts, please try again shortly.");
      } else {
        setErrorMessage(
          "We could not sign you up just now. Please try again in a moment."
        );
      }
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      // The success copy is hedged on purpose, and it must stay that way.
      //
      // A 200 from this endpoint means "your request was accepted", NOT "an
      // email was sent". The same 200 comes back when the address is already
      // confirmed on the list, when it is on the suppression list, and when the
      // honeypot caught the submission — precisely so that this page cannot be
      // used to test whether an address is subscribed. Copy that said "we've
      // sent you an email" would therefore be a lie in three of the four cases,
      // and would have people waiting on a message that is never coming. State
      // the condition instead of asserting the send.
      <div
        className="mt-6 rounded-[16px] border border-border bg-muted p-5"
        role="status"
        aria-live="polite"
      >
        <p className="font-medium text-foreground">Check your inbox</p>
        <p className="mt-2 text-sm text-ink-600">
          If that address isn&rsquo;t already on the list, a confirmation email
          is on its way. You&rsquo;ll need to click the link in it to finish
          subscribing — it works for 7 days.
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Nothing after a few minutes? Have a look in your spam folder, or write
          to{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="space-y-2">
        <Label htmlFor={emailId}>Email address</Label>
        <Input
          id={emailId}
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={nameId}>
          First name{" "}
          <span className="font-normal text-ink-600">(optional)</span>
        </Label>
        <Input
          id={nameId}
          name="firstName"
          type="text"
          autoComplete="given-name"
          placeholder="Ada"
          value={firstName}
          onChange={(event) => setFirstName(event.target.value)}
        />
      </div>

      {/* Honeypot. `aria-hidden` and `tabIndex={-1}` keep it out of both the
          screen-reader tree and the tab order, so it only ever catches a bot
          that fills every field it finds. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={honeypotId}>Website</label>
        <input
          id={honeypotId}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <Button
        type="submit"
        variant="brand"
        size="lg"
        className="w-full"
        disabled={status === "sending"}
      >
        {status === "sending" ? "Signing you up…" : "Subscribe"}
      </Button>

      {status === "error" && (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage} If it keeps happening, email{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>{" "}
          and we will add you by hand.
        </p>
      )}

      <p className="text-xs text-ink-600">
        We only use your address to send the newsletter. Unsubscribe from any
        email in one click.
      </p>
    </form>
  );
}
