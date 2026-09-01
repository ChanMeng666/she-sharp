import Link from "next/link";
import { Button } from "@/components/ui/button";
import { NewsletterSignup } from "@/components/newsletter/newsletter-signup";
import { PhotoBackdrop } from "@/components/ui/photo-backdrop";
import { MENTORSHIP_CTA_BACKDROP, photo } from "@/lib/data/site-photos";
import { isMentorshipOpen } from "@/lib/config/mentorship";
import { cn } from "@/lib/utils";

export function MentorshipCTASection() {
  const applicationsOpen = isMentorshipOpen();

  return (
    /*
      Was a flat navy band. The colour was only ever standing in for something
      to look at, and a photograph under the same navy scrim does the job the
      colour was doing while showing the programme it is asking people to join.
      The layout inside is unchanged.
    */
    <PhotoBackdrop
      image={photo(MENTORSHIP_CTA_BACKDROP)}
      heightClass="min-h-[22rem] md:min-h-[24rem]"
      scrim="dark"
      contentClassName="w-full max-w-8xl"
    >
      <div className="w-full">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="max-w-2xl">
            <h2 className="text-display-sm text-background mb-3">
              {applicationsOpen ? (
                <>
                  Join our <span className="text-mint">programme</span>
                </>
              ) : (
                <>
                  Stay <span className="text-mint">connected</span>
                </>
              )}
            </h2>
            <p className="text-base md:text-lg text-background/85">
              {applicationsOpen
                ? "Be part of a community that empowers women in STEM."
                : "Applications for this year's programme have closed. Subscribe to our newsletter for the latest mentorship updates, application announcements, and community news."}
            </p>
          </div>

          {/* The width is for the form only: an inline field has no natural
              width to size to, while the two buttons did and their layout must
              not change when applications reopen. */}
          <div
            className={cn(
              "flex flex-col sm:flex-row gap-4 shrink-0",
              !applicationsOpen && "lg:w-[26rem]",
            )}
          >
            {applicationsOpen ? (
              <>
                <Button variant="brand" size="lg" asChild>
                  <Link href="/mentorship/mentee">Become a Mentee</Link>
                </Button>
                <Button
                  size="lg"
                  className="bg-transparent border border-white/30 text-background hover:bg-white/10"
                  asChild
                >
                  <Link href="/mentorship/mentor">Become a Mentor</Link>
                </Button>
              </>
            ) : (
              /*
                While applications are closed the copy beside this already says
                "subscribe to our newsletter for application announcements", so
                the field belongs here rather than a link to it — this is the
                moment somebody who came to apply and cannot has a reason to
                leave an address.

                This is the ONLY one of the four `!applicationsOpen` newsletter
                CTAs in the mentorship section that becomes a form. The other
                three (`mentorship/page.tsx`, `how-it-works-section.tsx`,
                `become-cta-section.tsx`) sit behind the same condition and can
                appear on the same page; four forms on one page is not four
                times the distribution, it is spam.
              */
              <NewsletterSignup
                placement="mentorship"
                tone="dark"
                className="w-full"
                labels={{ cta: "Keep me posted" }}
              />
            )}
          </div>
        </div>
      </div>
    </PhotoBackdrop>
  );
}
