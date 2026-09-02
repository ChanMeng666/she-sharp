"use client";

import Link from "next/link";
import { useCallback, useId, useState, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiPost, isApiError } from "@/lib/api/client";
import { GENERAL_EMAIL } from "@/lib/config/contact-addresses";
import {
  DEVICE_HEADER,
  deviceId,
  readStorage,
  removeStorage,
  writeStorage,
} from "@/lib/forms/feedback-device";
import type { NewsletterPlacement } from "@/lib/newsletter/placements";
import { cn } from "@/lib/utils";

/**
 * The success copy, and the reason it is a module constant rather than a prop.
 *
 * A 200 from `/api/newsletter/subscribe` means "your request was accepted", NOT
 * "an email was sent". The same 200 comes back when the address is already
 * confirmed on the list, when it is on the suppression list, and when the
 * honeypot caught the submission — precisely so that this form cannot be used
 * to test whether an address is subscribed. Copy that said "we've sent you an
 * email" would therefore be a lie in three of the four cases, and would have
 * people waiting on a message that is never coming. State the condition instead
 * of asserting the send.
 *
 * With the form now on eight surfaces, that hedge is the single thing most
 * likely to be "improved" locally into something confident and wrong. It lives
 * here, `labels` cannot reach it, and there is exactly one copy of it in the
 * codebase.
 */
export const NEWSLETTER_SUCCESS_COPY = {
  heading: "Check your inbox",
  body: "If that address isn’t already on the list, a confirmation email is on its way. You’ll need to click the link in it to finish subscribing — it works for 7 days.",
  troubleshootPrefix:
    "Nothing after a few minutes? Have a look in your spam folder, or write to",
} as const;

/** Shown for a 429. The only response status this form reads. */
const RATE_LIMITED_MESSAGE = "Too many attempts, please try again shortly.";

/** Shown for every other failure, including a dead network. */
const GENERIC_ERROR_MESSAGE =
  "We could not sign you up just now. Please try again in a moment.";

/**
 * `sessionStorage` marker: this tab has already sent a sign-up request.
 *
 * The footer form is on every page, so a visitor who signs up from a page
 * section is looking at a second, still-inviting form the moment they finish.
 * Submitting it again spends another slot of a rate budget shared with everyone
 * behind the same NAT and achieves nothing. The marker is local only and says
 * nothing about server state — it records that *this browser* pressed the
 * button, not that anything happened on the list — so it does not weaken the
 * anti-enumeration posture the endpoint is built around.
 */
const SUBMITTED_KEY = "newsletter-signup";
const SUBMITTED_VALUE = "submitted";

/**
 * The marker, as an external store every mounted instance reads.
 *
 * `sessionStorage` fires no event in the tab that wrote it, so a mount-time
 * read alone would only help on the *next* navigation — and the case that
 * matters most (footer plus in-page form, both already on screen) happens
 * without one. Hence the listener set: it is the change notification the
 * storage API does not give us.
 *
 * Read through `useSyncExternalStore` rather than an effect. Storage is a
 * mutable value living outside React, which is exactly what that hook is for,
 * and its server snapshot is what makes the read safe here: these forms render
 * inside statically prerendered pages, so the server must be told what to
 * assume rather than left to read a `sessionStorage` that does not exist.
 */
const SUBMITTED_LISTENERS = new Set<() => void>();

function subscribeToSubmitted(onStoreChange: () => void): () => void {
  SUBMITTED_LISTENERS.add(onStoreChange);
  return () => {
    SUBMITTED_LISTENERS.delete(onStoreChange);
  };
}

/**
 * Whether this tab has already sent a sign-up request.
 *
 * Returns a boolean, so React's snapshot comparison is by value and no caching
 * is needed. `readStorage` swallows the exception a private window throws on
 * access, which resolves to "not submitted" — the safe direction, since it
 * leaves the form asking rather than hiding it.
 */
function getSubmittedSnapshot(): boolean {
  return readStorage("session", SUBMITTED_KEY) === SUBMITTED_VALUE;
}

/** Nothing has been submitted during SSR, and no storage exists to ask. */
function getSubmittedServerSnapshot(): boolean {
  return false;
}

function broadcastSubmitted(submitted: boolean) {
  if (submitted) {
    writeStorage("session", SUBMITTED_KEY, SUBMITTED_VALUE);
  } else {
    removeStorage("session", SUBMITTED_KEY);
  }
  for (const listener of SUBMITTED_LISTENERS) listener();
}

type Status = "idle" | "sending" | "done" | "error";

export interface NewsletterSignupProps {
  /** Which surface this instance is on. Becomes the consent record's wording. */
  placement: NewsletterPlacement;
  /** `inline`: field and button on one row. `stacked`: a labelled column. */
  layout?: "inline" | "stacked";
  /** `dark` is the navy footer. */
  tone?: "light" | "dark";
  /** Only the dedicated sign-up page asks for a name; everywhere else it costs conversions. */
  askFirstName?: boolean;
  /** Prefill, still editable — the feedback success panel already has the address. */
  defaultEmail?: string;
  /** Surface-specific framing. Deliberately cannot reach the success copy. */
  labels?: { heading?: string; blurb?: string; cta?: string };
  className?: string;
}

/**
 * The newsletter sign-up form, everywhere it appears.
 *
 * POSTs to `/api/newsletter/subscribe`, which answers `{ ok: true }` and
 * nothing else, for every outcome. This component therefore branches on the
 * HTTP status and never on the response body — there is nothing in the body to
 * branch on, and reading one would be the first half of an enumeration oracle.
 *
 * Nothing here can subscribe anybody: the route writes a `pending` row and
 * emails a link, and only a button press on `/newsletter/confirm` makes an
 * address mailable.
 */
export function NewsletterSignup({
  placement,
  layout = "inline",
  tone = "light",
  askFirstName = false,
  defaultEmail,
  labels,
  className,
}: NewsletterSignupProps) {
  const emailId = useId();
  const nameId = useId();
  const honeypotId = useId();

  const [email, setEmail] = useState(defaultEmail ?? "");
  const [firstName, setFirstName] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  /** This tab has already sent a sign-up request. See `SUBMITTED_KEY`. */
  const submittedElsewhere = useSyncExternalStore(
    subscribeToSubmitted,
    getSubmittedSnapshot,
    getSubmittedServerSnapshot,
  );

  const isDark = tone === "dark";

  /** Lets someone add a second address after the first went through. */
  const resetForAnotherAddress = useCallback(() => {
    broadcastSubmitted(false);
    setStatus("idle");
    setEmail("");
    setFirstName("");
    setErrorMessage("");
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("sending");
    setErrorMessage("");

    // The feedback form is the one placement a whole room reaches at once, from
    // one venue IP. Sending the device id it already mints lets the API give
    // each phone its own allowance instead of the room sharing five. Nowhere
    // else needs it, and sending it everywhere would put a stable per-browser
    // id on every page of the site for no benefit.
    const init =
      placement === "event-feedback"
        ? { headers: { [DEVICE_HEADER]: deviceId() } }
        : undefined;

    try {
      await apiPost(
        "/api/newsletter/subscribe",
        { email, firstName, website, placement },
        init,
      );
      setStatus("done");
      broadcastSubmitted(true);
    } catch (error) {
      setErrorMessage(
        isApiError(error) && error.status === 429
          ? RATE_LIMITED_MESSAGE
          : GENERIC_ERROR_MESSAGE,
      );
      setStatus("error");
    }
  }

  const mutedText = isDark ? "text-white/75" : "text-ink-600";
  const headingText = isDark ? "text-white" : "text-foreground";

  // Both halves are load-bearing. `submittedElsewhere` is what a sibling
  // instance reacts to, but it comes from storage — and in a private window
  // every write throws, so the store stays false even for the instance that
  // just submitted. Its own `status` is what shows that person their result.
  if (status === "done" || submittedElsewhere) {
    return (
      <div
        className={cn(
          "rounded-[16px] border p-5",
          isDark ? "border-white/25 bg-white/10" : "border-border bg-muted",
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <p className={cn("font-medium", headingText)}>
          {NEWSLETTER_SUCCESS_COPY.heading}
        </p>
        <p className={cn("mt-2 text-sm", mutedText)}>
          {NEWSLETTER_SUCCESS_COPY.body}
        </p>
        <p className={cn("mt-2 text-sm", mutedText)}>
          {NEWSLETTER_SUCCESS_COPY.troubleshootPrefix}{" "}
          <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
            {GENERAL_EMAIL}
          </a>
          .
        </p>
        <p className="mt-3">
          <button
            type="button"
            onClick={resetForAnotherAddress}
            className={cn(
              "text-xs underline underline-offset-4",
              mutedText,
              isDark ? "hover:text-white" : "hover:text-foreground",
            )}
          >
            Subscribe a different address
          </button>
        </p>
      </div>
    );
  }

  const inputClass = cn(
    "h-12 text-base md:text-base",
    isDark &&
      "border-white/40 bg-white/10 text-white placeholder:text-white/50 focus-visible:border-white",
  );

  const emailField = (
    <Input
      id={emailId}
      name="email"
      type="email"
      required
      autoComplete="email"
      placeholder="you@example.com"
      aria-label={layout === "inline" ? "Email address" : undefined}
      className={inputClass}
      value={email}
      onChange={(event) => setEmail(event.target.value)}
    />
  );

  const submitButton = (
    <Button
      type="submit"
      variant="brand"
      size="lg"
      className={cn("h-12 shrink-0", layout === "stacked" && "w-full")}
      disabled={status === "sending"}
    >
      {status === "sending" ? "Signing you up…" : (labels?.cta ?? "Subscribe")}
    </Button>
  );

  return (
    <div className={className}>
      {labels?.heading && (
        <h2 className={cn("text-xl font-semibold", headingText)}>
          {labels.heading}
        </h2>
      )}
      {labels?.blurb && (
        <p className={cn("mt-2 text-sm", mutedText)}>{labels.blurb}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className={cn("space-y-4", (labels?.heading || labels?.blurb) && "mt-6")}
      >
        {/* Its own labelled row in both layouts: an optional second field on an
            inline row reads as a required one and costs the conversion the
            inline layout exists to win. */}
        {askFirstName && (
          <div className="space-y-2">
            <Label htmlFor={nameId} className={headingText}>
              First name{" "}
              <span className={cn("font-normal", mutedText)}>(optional)</span>
            </Label>
            <Input
              id={nameId}
              name="firstName"
              type="text"
              autoComplete="given-name"
              placeholder="Ada"
              className={inputClass}
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
        )}

        {layout === "stacked" ? (
          <div className="space-y-2">
            <Label htmlFor={emailId} className={headingText}>
              Email address
            </Label>
            {emailField}
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">{emailField}</div>
            {submitButton}
          </div>
        )}

        {/* Honeypot. `aria-hidden` and `tabIndex={-1}` keep it out of both the
            screen-reader tree and the tab order, so it only ever catches a bot
            that fills every field it finds. Unconditional by design — no prop
            can switch it off. */}
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

        {layout === "stacked" && submitButton}

        {status === "error" && (
          <p
            className={cn(
              "text-sm",
              isDark ? "text-white" : "text-destructive",
            )}
            role="alert"
          >
            {errorMessage} If it keeps happening, email{" "}
            <a className="underline" href={`mailto:${GENERAL_EMAIL}`}>
              {GENERAL_EMAIL}
            </a>{" "}
            and we will add you by hand.
          </p>
        )}

        <p className={cn("text-xs", mutedText)}>
          One email a month. Unsubscribe in one click.{" "}
          {/* Every inline form keeps a route to the page that explains what the
              reader is signing up for — the field alone asks for an address
              without saying what it buys. */}
          {placement !== "newsletter-page" && (
            <Link
              href="/newsletter/subscribe"
              className="underline underline-offset-4"
            >
              What you get
            </Link>
          )}
        </p>
      </form>
    </div>
  );
}
