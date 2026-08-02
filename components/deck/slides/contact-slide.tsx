import { DeckQr } from "@/components/deck/deck-qr";
import { socialIcons } from "@/components/ui/social-icons";
import type { ContactSlide } from "@/lib/deck/types";

import { Kicker } from "./archive";

/** Spellings that reach the deck data but are not the icon key. */
const ICON_ALIASES: Record<string, keyof typeof socialIcons> = {
  twitter: "x",
  newsletter: "mailchimp",
  email: "mailchimp",
};

/** Resolves a social network name to its brand mark, or `null` when unknown. */
function iconFor(name: string) {
  const key = name.trim().toLowerCase().replace(/[^a-z]/g, "");
  const resolved = ICON_ALIASES[key] ?? (key as keyof typeof socialIcons);
  return socialIcons[resolved] ?? null;
}

/**
 * "Here is how you stay in touch" — left up through the whole first break.
 *
 * That is when people actually get their phones out, so it carries both the
 * handles someone types later and the two or three codes someone scans now. The
 * charity registration number is on it because a room that has just been asked
 * to donate deserves to see it.
 *
 * SIX HANDLES ON ONE RULED ROW. Stacked in a column they cost 210px and push the
 * codes into the bottom margin of a 4:3 projector; on one `auto-fit` row above a
 * hairline they cost 90px and read as a masthead. That row is also the only
 * place in the deck where brand marks other than She Sharp's appear at small
 * size, which is why they take the accent rather than full colour.
 *
 * No archive band. Three white code chips are already the strongest furniture on
 * any light slide in the deck, and a full-bleed strip of faces under them would
 * be competing with the one thing the slide is asking the room to look at.
 */
export function ContactSlideLayout({ slide }: { slide: ContactSlide }) {
  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-md)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          <Kicker text={slide.eyebrow} />
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <ul
          className="grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            columnGap: "var(--deck-gap-md)",
            rowGap: "var(--deck-gap-sm)",
            borderBlockStart: "1px solid var(--slide-hairline)",
            paddingBlockStart: "var(--deck-gap-sm)",
          }}
        >
          {slide.socials.map((social) => {
            const Icon = iconFor(social.name);
            return (
              <li
                key={social.href}
                className="flex min-w-0 items-center"
                style={{ gap: "var(--deck-gap-xs)" }}
              >
                {Icon && (
                  <Icon
                    width={38}
                    height={38}
                    aria-hidden="true"
                    style={{ color: "var(--slide-accent)", flexShrink: 0 }}
                  />
                )}
                <span className="deck-body truncate">{social.handle}</span>
              </li>
            );
          })}
        </ul>

        {/* auto-fit keeps two codes wide-set and three codes evenly spread,
            without either arrangement needing its own breakpoint. */}
        <ul
          className="grid justify-items-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "var(--deck-gap-md)",
          }}
        >
          {/* Keyed on the label, not the URL: an unset link is an empty string
              by design, and two of them would collide on the same React key. */}
          {slide.qrs.map((qr) => (
            <li key={qr.label}>
              <DeckQr qr={qr} size={260} />
            </li>
          ))}
        </ul>

        {slide.footnote && (
          <div
            className="mt-auto flex flex-col"
            style={{ gap: "var(--deck-gap-sm)" }}
          >
            <hr className="deck-rule" />
            <p className="deck-body deck-muted">{slide.footnote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
