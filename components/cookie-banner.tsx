"use client";

import { useState, useEffect } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

/**
 * Reads the stored consent, treating an unreadable store as "never answered".
 *
 * **Every `localStorage` access in this file has to be guarded, and the reason
 * is worse than a lost preference.** Accessing `localStorage` does not merely
 * return null when a browser has site data blocked — it *throws*, and Chrome
 * throws `QuotaExceededError` rather than a `SecurityError`, so it does not
 * look like a permissions problem at the call site. Until 2026-09-01 the read
 * below was unguarded inside an effect, and `CookieBanner` is rendered from
 * `app/layout.tsx` — the ROOT layout. A throw there unmounted the whole tree,
 * so **every page on the site rendered blank**, `/sign-in` included. It was
 * found while testing an unrelated component's storage paths.
 *
 * The people it broke the site for are exactly the people this banner exists to
 * serve: anyone with site data blocked in Chrome, under an enterprise policy,
 * or running a privacy extension.
 *
 * @returns The raw stored value, or null when absent OR unreadable.
 */
function readConsent(): string | null {
  try {
    return localStorage.getItem("cookie-consent");
  } catch {
    return null;
  }
}

/**
 * Records a consent choice, and does not care whether it was actually stored.
 *
 * A visitor whose browser refuses to store the answer still made a choice, and
 * the banner still has to close — so the caller dismisses it either way. The
 * cost is that the banner asks again on the next page load for that visitor,
 * which is the honest outcome: we genuinely cannot remember what they said.
 * Silently failing to close would be worse, and throwing would be worse again.
 *
 * @param preferences The choice the visitor made.
 */
function writeConsent(preferences: CookiePreferences): void {
  try {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
  } catch {
    // Nothing to do and nothing to report: see the note above.
  }
}

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already accepted cookies. An unreadable store reads as
    // "not yet answered", so the banner asks rather than assuming consent.
    const cookieConsent = readConsent();
    if (!cookieConsent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptAll = () => {
    writeConsent({ necessary: true, analytics: true, marketing: true });
    setIsVisible(false);
  };

  const acceptSelected = () => {
    writeConsent(preferences);
    setIsVisible(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    writeConsent({ necessary: true, analytics: false, marketing: false });
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Banner */}
      {/* `data-cookie-banner` lets the presentation deck hide this on a
          projector. Sonner and this banner both stack above page content, so
          `styles/components/deck.css` hides them by attribute rather than
          trying to out-rank an inline z-index. */}
      <div
        role="region"
        aria-label="Cookie consent"
        data-cookie-banner
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-background border-t border-border shadow-2xl transform transition-transform duration-500",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">A quick note on cookies</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to keep the site working and understand how it's being used.{" "}
                <a href="/cookie-policy" className="text-foreground underline underline-offset-2 hover:text-brand transition-colors">
                  Cookie policy
                </a>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-muted-foreground"
              >
                <Settings className="h-3.5 w-3.5 mr-1" aria-hidden="true" />
                Customise
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
              >
                Decline
              </Button>
              <Button
                size="sm"
                variant="brand"
                onClick={acceptAll}
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-foreground">Cookie Settings</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Necessary cookies are always on. Everything else is your call.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="necessary" className="text-sm font-semibold text-foreground">
                  Necessary
                </Label>
                <p className="text-sm text-muted-foreground">
                  Keeps logins, navigation, and security working. Can&apos;t be turned off.
                </p>
              </div>
              <Switch
                id="necessary"
                checked={true}
                disabled
                className="data-[state=checked]:bg-foreground shrink-0 mt-0.5"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="analytics" className="text-sm font-semibold text-foreground">
                  Analytics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Shows us which pages are useful so we can improve the site. No personal data.
                </p>
              </div>
              <Switch
                id="analytics"
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, analytics: checked })
                }
                className="data-[state=checked]:bg-brand shrink-0 mt-0.5"
              />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="marketing" className="text-sm font-semibold text-foreground">
                  Marketing
                </Label>
                <p className="text-sm text-muted-foreground">
                  Used to show relevant content on other sites. Off by default.
                </p>
              </div>
              <Switch
                id="marketing"
                checked={preferences.marketing}
                onCheckedChange={(checked) =>
                  setPreferences({ ...preferences, marketing: checked })
                }
                className="data-[state=checked]:bg-brand shrink-0 mt-0.5"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button variant="ghost" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button variant="brand" onClick={acceptSelected}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}