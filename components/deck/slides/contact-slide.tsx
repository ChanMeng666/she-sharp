import { DeckQr } from "@/components/deck/deck-qr";
import { socialIcons } from "@/components/ui/social-icons";
import type { ContactSlide } from "@/lib/deck/types";

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
 * "Here is how you stay in touch" — the last slide before the closing karakia.
 *
 * Left on screen through the whole pack-down, which is when people actually get
 * their phones out, so it carries both the handles someone types later and the
 * two or three codes someone scans now. The charity registration number is on it
 * because a room that has just been asked to donate deserves to see it.
 */
export function ContactSlideLayout({ slide }: { slide: ContactSlide }) {
  return (
    <div className="deck-safe">
      <div
        className="deck-content flex flex-1 flex-col"
        style={{ gap: "var(--deck-gap-lg)" }}
      >
        <div className="flex flex-col" style={{ gap: "var(--deck-gap-xs)" }}>
          {slide.eyebrow && <p className="deck-kicker">{slide.eyebrow}</p>}
          <h2 className="deck-title">{slide.title}</h2>
          {slide.lead && <p className="deck-lead">{slide.lead}</p>}
        </div>

        <ul
          className="flex flex-wrap items-center"
          style={{ columnGap: "var(--deck-gap-lg)", rowGap: "var(--deck-gap-sm)" }}
        >
          {slide.socials.map((social) => {
            const Icon = iconFor(social.name);
            return (
              <li
                key={social.href}
                className="flex items-center"
                style={{ gap: "var(--deck-gap-xs)" }}
              >
                {Icon && (
                  <Icon
                    width={44}
                    height={44}
                    aria-hidden="true"
                    style={{ color: "var(--slide-accent)", flexShrink: 0 }}
                  />
                )}
                <span className="deck-body">{social.handle}</span>
              </li>
            );
          })}
        </ul>

        {/* auto-fit keeps two codes wide-set and three codes evenly spread,
            without either arrangement needing its own breakpoint. */}
        <ul
          className="grid justify-items-center"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
            gap: "var(--deck-gap-lg)",
          }}
        >
          {/* Keyed on the label, not the URL: an unset link is an empty string
              by design, and two of them would collide on the same React key. */}
          {slide.qrs.map((qr) => (
            <li key={qr.label}>
              <DeckQr qr={qr} size={300} />
            </li>
          ))}
        </ul>

        {slide.footnote && (
          <div className="flex flex-col" style={{ gap: "var(--deck-gap-sm)" }}>
            <hr className="deck-rule" />
            <p className="deck-label">{slide.footnote}</p>
          </div>
        )}
      </div>
    </div>
  );
}
