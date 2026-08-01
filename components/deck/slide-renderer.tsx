import type { Slide } from "@/lib/deck/types";

import { AgendaSlideLayout } from "./slides/agenda-slide";
import { BreakSlideLayout } from "./slides/break-slide";
import { BulletsSlideLayout } from "./slides/bullets-slide";
import { ContactSlideLayout } from "./slides/contact-slide";
import { CriteriaSlideLayout } from "./slides/criteria-slide";
import { KarakiaSlideLayout } from "./slides/karakia-slide";
import { LogosSlideLayout } from "./slides/logos-slide";
import { PeopleSlideLayout } from "./slides/people-slide";
import { PhotoGridSlideLayout } from "./slides/photo-grid-slide";
import { PhotoSlideLayout } from "./slides/photo-slide";
import { PrizesSlideLayout } from "./slides/prizes-slide";
import { QrCtaSlideLayout } from "./slides/qr-cta-slide";
import { SectionSlideLayout } from "./slides/section-slide";
import { StatsSlideLayout } from "./slides/stats-slide";
import { ThanksSlideLayout } from "./slides/thanks-slide";
import { ThemesSlideLayout } from "./slides/themes-slide";
import { TitleSlideLayout } from "./slides/title-slide";
import { UpcomingSlideLayout } from "./slides/upcoming-slide";

/**
 * Maps a slide to its layout component — the single dispatch point for the
 * `Slide` union.
 *
 * The `never` assignment in the default branch is the whole reason this is a
 * switch rather than a lookup table: adding a member to `Slide` without adding
 * a layout stops the build here, instead of rendering nothing on a projector.
 */
export function SlideRenderer({ slide }: { slide: Slide }) {
  switch (slide.type) {
    case "title":
      return <TitleSlideLayout slide={slide} />;
    case "section":
      return <SectionSlideLayout slide={slide} />;
    case "karakia":
      return <KarakiaSlideLayout slide={slide} />;
    case "bullets":
      return <BulletsSlideLayout slide={slide} />;
    case "agenda":
      return <AgendaSlideLayout slide={slide} />;
    case "people":
      return <PeopleSlideLayout slide={slide} />;
    case "photo":
      return <PhotoSlideLayout slide={slide} />;
    case "photo-grid":
      return <PhotoGridSlideLayout slide={slide} />;
    case "stats":
      return <StatsSlideLayout slide={slide} />;
    case "logos":
      return <LogosSlideLayout slide={slide} />;
    case "themes":
      return <ThemesSlideLayout slide={slide} />;
    case "criteria":
      return <CriteriaSlideLayout slide={slide} />;
    case "prizes":
      return <PrizesSlideLayout slide={slide} />;
    case "break":
      return <BreakSlideLayout slide={slide} />;
    case "qr-cta":
      return <QrCtaSlideLayout slide={slide} />;
    case "contact":
      return <ContactSlideLayout slide={slide} />;
    case "upcoming":
      return <UpcomingSlideLayout slide={slide} />;
    case "thanks":
      return <ThanksSlideLayout slide={slide} />;
    default: {
      const exhaustive: never = slide;
      void exhaustive;
      return null;
    }
  }
}
