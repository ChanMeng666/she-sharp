"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import {
  DEVICE_HEADER,
  deviceId,
  draftKey,
  readStorage,
  removeStorage,
  submittedKey,
  writeStorage,
} from "@/lib/forms/feedback-device";

/** Where the attendee came from. Mirrors the `source` enum on the API. */
export type FeedbackSource = "deck_qr" | "event_page" | "direct_link" | "email";

/** The three things an attendee can ask to hear more about. */
export type FeedbackInterest = "mentorship" | "volunteering" | "newsletter";

export interface EventFeedbackFormProps {
  eventSlug: string;
  eventTitle: string;
  /** Already formatted for display — the form never parses a date itself. */
  eventDateLabel: string;
  isFutureEvent: boolean;
  /** More than 30 days ago, so the event needs naming back to the attendee. */
  isLongPast: boolean;
  source: FeedbackSource;
}

interface Answers {
  overallRating: number | null;
  wouldAttendAgain: "yes" | "maybe" | "no" | null;
  whatWorked: string;
  whatToImprove: string;
  recommendScore: number | null;
  interests: FeedbackInterest[];
  name: string;
  email: string;
  /** Honeypot. A real person never fills this in. */
  website: string;
}

const EMPTY_ANSWERS: Answers = {
  overallRating: null,
  wouldAttendAgain: null,
  whatWorked: "",
  whatToImprove: "",
  recommendScore: null,
  interests: [],
  name: "",
  email: "",
  website: "",
};

const RATING_SCALE = [1, 2, 3, 4, 5];

const ATTEND_AGAIN_OPTIONS: { value: "yes" | "maybe" | "no"; label: string }[] =
  [
    { value: "yes", label: "Yes" },
    { value: "maybe", label: "Maybe" },
    { value: "no", label: "No" },
  ];

const INTEREST_OPTIONS: { value: FeedbackInterest; label: string }[] = [
  { value: "mentorship", label: "Mentorship programme" },
  { value: "volunteering", label: "Volunteering & ambassadors" },
  { value: "newsletter", label: "Monthly newsletter" },
];

/**
 * Post-event feedback, designed to be finished one-handed in under a minute
 * while an attendee is still in the room.
 *
 * One card, one scroll: no step wizard, no progress bar, no transitions. Every
 * "Next" tap on a multi-step form is a chance to abandon, and this form is
 * competing with people packing up to leave.
 */
export function EventFeedbackForm({
  eventSlug,
  eventTitle,
  eventDateLabel,
  isFutureEvent,
  isLongPast,
  source,
}: EventFeedbackFormProps) {
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS);
  const [errors, setErrors] = useState<{
    overallRating?: string;
    name?: string;
    email?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  /** Draft restore has run; only then is it safe to start persisting. */
  const [isHydrated, setIsHydrated] = useState(false);

  const ratingGroupRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  /** Null until the attendee moves the slider — see the range input below. */
  const hasRecommendScore = answers.recommendScore !== null;

  // Storage is read after mount, never during render — reading it during
  // render would desync the server HTML from the client's first paint.
  useEffect(() => {
    if (readStorage("local", submittedKey(eventSlug))) {
      setAlreadySubmitted(true);
    }

    const draft = readStorage("session", draftKey(eventSlug));
    if (draft) {
      try {
        setAnswers({ ...EMPTY_ANSWERS, ...(JSON.parse(draft) as Answers) });
      } catch {
        removeStorage("session", draftKey(eventSlug));
      }
    }

    setIsHydrated(true);
  }, [eventSlug]);

  /*
   * Bring the confirmation into view, and put focus on it.
   *
   * Without this the phone appears to jump to the footer on submit. Nothing
   * scrolls: the submit button sits near the bottom of a tall form, the success
   * panel that replaces it is a fraction of that height, and the page simply
   * gets shorter underneath a scroll position that stays where it was — which
   * lands on whatever is now at that offset, the footer. The attendee has to
   * scroll back up to discover it worked, and some will assume it did not and
   * submit again.
   *
   * Focus moves too, not just the scroll: it announces the result to a screen
   * reader, and it puts the keyboard back somewhere sensible now that every
   * control the user was tabbing through has been removed from the document.
   */
  useEffect(() => {
    if (!isSuccess) return;
    const panel = successRef.current;
    if (!panel) return;

    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    panel.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "center",
    });
    panel.focus({ preventScroll: true });
  }, [isSuccess]);

  // Mirror answers into `sessionStorage` so a tab backgrounded mid-form — to
  // check a calendar, to answer a message — comes back with them intact.
  useEffect(() => {
    if (!isHydrated || isSuccess) return;
    writeStorage("session", draftKey(eventSlug), JSON.stringify(answers));
  }, [answers, eventSlug, isHydrated, isSuccess]);

  const update = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const toggleInterest = (interest: FeedbackInterest, checked: boolean) => {
    setAnswers((prev) => ({
      ...prev,
      interests: checked
        ? [...prev.interests, interest]
        : prev.interests.filter((value) => value !== interest),
    }));
  };

  /**
   * Rating, name and email are required; the rest is optional.
   *
   * Name and email were optional until 2026-08-03 and were made required so
   * the team can follow up and run the prize draw. It is worth writing down
   * what that costs, because the cost is invisible in the data: everyone who
   * would have answered anonymously now either identifies themselves or
   * abandons, so the response rate drops and the people most likely to drop
   * are the ones with something critical to say. If the volume of feedback
   * falls off after this change, this is the first thing to look at.
   */
  const validate = (): boolean => {
    const next: typeof errors = {};

    if (answers.overallRating === null) {
      next.overallRating = "Please pick a rating";
    }

    if (!answers.name.trim()) {
      next.name = "Please enter your name";
    }

    // Same expression `contact-form.tsx` uses.
    if (!answers.email.trim()) {
      next.email = "Please enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers.email)) {
      next.email = "Please enter a valid email address";
    }

    setErrors(next);

    if (next.overallRating) {
      ratingGroupRef.current?.querySelector("button")?.focus();
    } else if (next.name) {
      nameRef.current?.focus();
    } else if (next.email) {
      emailRef.current?.focus();
    }

    return Object.keys(next).length === 0;
  };

  const markSubmitted = () => {
    setIsSuccess(true);
    writeStorage("local", submittedKey(eventSlug), new Date().toISOString());
    removeStorage("session", draftKey(eventSlug));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/event-feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          [DEVICE_HEADER]: deviceId(),
        },
        body: JSON.stringify({
          eventSlug,
          overallRating: answers.overallRating,
          recommendScore: answers.recommendScore ?? undefined,
          wouldAttendAgain: answers.wouldAttendAgain ?? undefined,
          whatWorked: answers.whatWorked.trim() || undefined,
          whatToImprove: answers.whatToImprove.trim() || undefined,
          interests: answers.interests,
          name: answers.name.trim() || undefined,
          email: answers.email.trim() || undefined,
          source,
          website: answers.website,
        }),
      });

      // A 429 renders SUCCESS, not an error. It means this device already sent
      // feedback moments ago — almost always a double tap on a slow connection.
      // Telling that person the form is broken invites them to keep retrying,
      // and there is nothing they can usefully do about a rate limit anyway.
      if (response.ok || response.status === 429) {
        markSubmitted();
        return;
      }

      const result = await response.json().catch(() => null);
      throw new Error(result?.error || "We couldn't send that. Please try again.");
    } catch (error) {
      // The answers deliberately stay in state. Venue wifi drops constantly;
      // a form that clears itself on a failed POST never gets a second attempt.
      setSubmitError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardClass =
    "bg-background border border-border card-sm p-6 sm:p-8 md:p-10";
  // `md:text-base` overrides the shared `md:text-sm` in `input.tsx` /
  // `textarea.tsx`: below 16px, iOS Safari zooms the page on focus and the
  // attendee is left scrolled sideways mid-form.
  const fieldClass =
    "h-12 rounded-2xl bg-background border-border focus:border-brand text-base md:text-base";
  const textareaClass =
    "rounded-2xl bg-background border-border focus:border-brand resize-y text-base md:text-base";

  if (isSuccess) {
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        className={`${cardClass} text-center focus:outline-none`}
      >
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-mint flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-foreground" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Thanks — that&apos;s it
        </h2>
        <p className="text-ink-700 mb-6">
          Your feedback goes straight to the people who ran today.
        </p>
        {/* No confetti. On an old phone in a hall it is pure jank, and there is
            nothing on the other side of it worth the frames. */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Button asChild variant="brand" size="lg" className="rounded-full">
            <Link href="/events">See what&apos;s coming up</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            {/* Titles run long, so the label stays fixed rather than
                interpolating one into a pill button. */}
            <Link href={`/events/${eventSlug}`}>Back to the event</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Soft gate, never a hard one: an attendee who genuinely wants to add
  // something — or who shares a phone — is one tap from the form.
  if (alreadySubmitted) {
    return (
      <div className={cardClass}>
        <h2 className="text-xl font-bold text-foreground mb-2">
          You&apos;ve already sent feedback for this event
        </h2>
        <p className="text-ink-700 mb-6">
          Thank you — we have it. If you&apos;d like to add something, you can
          fill the form in again.
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          onClick={() => setAlreadySubmitted(false)}
        >
          Send more feedback
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cardClass} noValidate>
      <div className="space-y-8">
        {isFutureEvent && (
          <p className="text-sm text-ink-700 bg-muted rounded-2xl p-4">
            This event hasn&apos;t happened yet — you can still tell us what
            you&apos;re hoping for.
          </p>
        )}

        {/* Someone scanning an old code needs the event named back to them
            before they rate it. */}
        {isLongPast && (
          <p className="text-sm text-ink-500">
            You&apos;re rating {eventTitle}, held {eventDateLabel}.
          </p>
        )}

        {/* Q1 — required, along with name and email at the foot of the form. */}
        <div className="space-y-3">
          <p id="rating-label" className="text-foreground font-medium">
            {/* Not "How was today?" — the form is deliberately open long after
                the event, and someone filling it in three days later is a good
                outcome we should not make read as a mistake. */}
            Overall, how was it? <span className="text-brand">*</span>
          </p>
          <div
            ref={ratingGroupRef}
            role="radiogroup"
            aria-labelledby="rating-label"
            aria-required="true"
            className="grid grid-cols-5 gap-2"
          >
            {RATING_SCALE.map((value) => {
              const selected = answers.overallRating === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${value} out of 5`}
                  onClick={() => {
                    update("overallRating", value);
                    setErrors((prev) => ({ ...prev, overallRating: undefined }));
                  }}
                  className={`h-16 rounded-2xl border text-lg font-semibold transition-colors ${
                    selected
                      ? "bg-brand text-white border-brand"
                      : "bg-background border-border text-foreground hover:border-brand"
                  }`}
                >
                  {value}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between text-sm text-ink-500">
            <span>Not great</span>
            <span>Loved it</span>
          </div>
          {errors.overallRating && (
            <p className="text-sm text-destructive">{errors.overallRating}</p>
          )}
        </div>

        {/* Q2 */}
        <div className="space-y-3">
          <p id="attend-again-label" className="text-foreground font-medium">
            Would you come to another She Sharp event?
          </p>
          <div
            role="radiogroup"
            aria-labelledby="attend-again-label"
            className="grid grid-cols-3 gap-2"
          >
            {ATTEND_AGAIN_OPTIONS.map((option) => {
              const selected = answers.wouldAttendAgain === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() =>
                    update(
                      "wouldAttendAgain",
                      selected ? null : option.value
                    )
                  }
                  className={`h-14 rounded-full border font-medium transition-colors ${
                    selected
                      ? "bg-brand text-white border-brand"
                      : "bg-background border-border text-foreground hover:border-brand"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Q3 */}
        <div className="space-y-2">
          <Label htmlFor="whatWorked" className="text-foreground font-medium">
            What was the best bit?
          </Label>
          <Textarea
            id="whatWorked"
            name="whatWorked"
            rows={3}
            value={answers.whatWorked}
            onChange={(e) => update("whatWorked", e.target.value)}
            placeholder="The thing you'd tell a friend about"
            className={textareaClass}
          />
        </div>

        {/* Q4 */}
        <div className="space-y-2">
          <Label htmlFor="whatToImprove" className="text-foreground font-medium">
            What should we do differently?
          </Label>
          <Textarea
            id="whatToImprove"
            name="whatToImprove"
            rows={3}
            value={answers.whatToImprove}
            onChange={(e) => update("whatToImprove", e.target.value)}
            placeholder="Anything at all — we read every one"
            className={textareaClass}
          />
          {/* Placed here rather than in a footer, deliberately. This is the
              field where someone who had a bad experience starts typing, and
              this box is the wrong place for a safeguarding disclosure: it goes
              to a public team channel, it is attached to their name, and nobody
              is on duty for it. Naming the private route at the moment the
              thought occurs is the whole point — a line under the submit button
              is read by people who have already decided what to write. */}
          <p className="text-sm text-ink-500">
            If something happened that you would rather tell us privately, email{" "}
            <a
              href="mailto:conduct@shesharp.org.nz"
              className="underline hover:text-brand"
            >
              conduct@shesharp.org.nz
            </a>{" "}
            or read our{" "}
            <Link
              href="/code-of-conduct"
              className="underline hover:text-brand"
            >
              code of conduct
            </Link>
            . You do not have to put it in this form.
          </p>
        </div>

        {/* Q5 — sits here, after the free text, not near the top. It is the
            most-abandoned question on a phone, and Q1 and Q2 already carry most
            of the signal, so anyone who drops out at this point has still given
            us the answers that matter.

            A slider, not eleven buttons. Attendees found a bare 0–10 grid
            confusing: eleven equal boxes give no clue which end is good, and
            "0" reads as "no answer" rather than as the worst score. One track
            with the ends named, and the chosen number shown large as you drag,
            makes the direction obvious without reading anything.

            The question is asked in full — "How likely are you to recommend…"
            — rather than the terse "Recommend us to a friend?". This is the
            standard NPS wording and the extra words are what make 0 and 10
            mean something. */}
        <div className="space-y-3">
          <label
            htmlFor="recommend"
            className="block text-foreground font-medium"
          >
            How likely are you to recommend She Sharp to a friend?
          </label>

          <div className="flex items-baseline gap-3">
            <span
              className={`text-3xl font-bold tabular-nums ${
                hasRecommendScore ? "text-brand" : "text-ink-500"
              }`}
              aria-hidden="true"
            >
              {hasRecommendScore ? answers.recommendScore : "–"}
            </span>
            <span className="text-sm text-ink-500">
              {hasRecommendScore ? "out of 10" : "Drag to answer"}
            </span>
          </div>

          {/* A native range input rather than a custom widget: it is keyboard
              operable, exposes a real value to assistive tech, and needs no
              dependency. `slider.tsx` does not exist in components/ui despite
              what CLAUDE.md lists.

              A range input always HAS a value, which is the trap here — an
              untouched slider parked at 5 would be indistinguishable from a
              deliberate 5. So `recommendScore` stays null until the attendee
              actually moves it, the thumb is styled flat and grey until then,
              and the readout above shows "–". */}
          <input
            id="recommend"
            name="recommend"
            type="range"
            min={0}
            max={10}
            step={1}
            value={answers.recommendScore ?? 5}
            onChange={(e) => update("recommendScore", Number(e.target.value))}
            aria-valuetext={
              hasRecommendScore
                ? `${answers.recommendScore} out of 10`
                : "Not answered yet"
            }
            className={`feedback-range w-full ${
              hasRecommendScore ? "" : "feedback-range--unset"
            }`}
          />

          <div className="flex justify-between text-sm text-ink-500">
            <span>0 — Not at all likely</span>
            <span>10 — Extremely likely</span>
          </div>
        </div>

        {/* Q6 — label-wrapped so the whole card is the tap target and Space
            toggles from the keyboard. */}
        <div className="space-y-3">
          <p className="text-foreground font-medium">Want to hear more?</p>
          <div className="space-y-2">
            {INTEREST_OPTIONS.map((option) => {
              const checked = answers.interests.includes(option.value);
              return (
                <label
                  key={option.value}
                  htmlFor={`interest-${option.value}`}
                  className={`card-sm flex items-center gap-3 p-4 min-h-14 border cursor-pointer transition-colors ${
                    checked
                      ? "border-brand bg-brand/5"
                      : "border-border bg-background hover:border-brand"
                  }`}
                >
                  <Checkbox
                    id={`interest-${option.value}`}
                    checked={checked}
                    onCheckedChange={(value) =>
                      toggleInterest(option.value, value === true)
                    }
                    /* Square, explicitly. The shared Checkbox asks for
                       `rounded-sm`, but this project's `--radius` scale resolves
                       that to 12px — a full circle on a 20px box. A circle reads
                       as "pick one", and these three are not exclusive, so the
                       default shape would quietly cost us two thirds of the
                       answers to this question. */
                    className="h-5 w-5 rounded-[4px]"
                  />
                  <span className="text-base text-foreground">
                    {option.label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Q7 — required since 2026-08-03. Because these are now mandatory the
            page has to say what they are for; an unexplained required email on
            a feedback form reads as a data grab and is the point people close
            the tab. */}
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Name <span className="text-brand">*</span>
            </Label>
            <Input
              ref={nameRef}
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={answers.name}
              onChange={(e) => {
                update("name", e.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: undefined }));
                }
              }}
              className={`${fieldClass} ${
                errors.name ? "border-destructive" : ""
              }`}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground font-medium">
              Email <span className="text-brand">*</span>
            </Label>
            <Input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={answers.email}
              onChange={(e) => {
                update("email", e.target.value);
                if (errors.email) {
                  setErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              className={`${fieldClass} ${
                errors.email ? "border-destructive" : ""
              }`}
            />
            <p className="text-sm text-ink-500">
              So we can follow up on what you&apos;ve told us, and enter you in
              the prize draw. We won&apos;t add you to any mailing list unless
              you tick it above.{" "}
              <Link
                href="/privacy-policy"
                className="underline hover:text-brand"
              >
                Privacy policy
              </Link>
              .
            </p>
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
        </div>

        {/* Honeypot. `aria-hidden` and `tabIndex={-1}` keep it out of both the
            screen-reader tree and the tab order, so it only ever catches a bot
            that fills every field it finds. */}
        <div className="sr-only" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={answers.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </div>

        {submitError && (
          <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-2xl">
            <p className="text-sm text-destructive">{submitError}</p>
            <p className="text-sm text-destructive/80 mt-1">
              Your answers are still here — tap Try again.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            type="submit"
            variant="brand"
            size="lg"
            disabled={isSubmitting}
            className="w-full sm:w-auto rounded-full px-12 h-12"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2" />
                Sending...
              </>
            ) : submitError ? (
              "Try again"
            ) : (
              "Send feedback"
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
