import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoBackdrop } from "@/components/ui/photo-backdrop";
import { MENTORSHIP_CTA_BACKDROP, photo } from "@/lib/data/site-photos";
import { isMentorshipOpen } from "@/lib/config/mentorship";

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

          <div className="flex flex-col sm:flex-row gap-4 shrink-0">
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
              <Button variant="brand" size="lg" asChild>
                <Link href="/newsletter/subscribe">
                  <Mail className="h-5 w-5" />
                  Subscribe to Newsletter
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </PhotoBackdrop>
  );
}
