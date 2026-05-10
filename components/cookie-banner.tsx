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

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem("cookie-consent");
    if (!cookieConsent) {
      // Show banner after a short delay
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(allAccepted));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  const acceptSelected = () => {
    localStorage.setItem("cookie-consent", JSON.stringify(preferences));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
    setShowSettings(false);
  };

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      analytics: false,
      marketing: false,
    };
    localStorage.setItem("cookie-consent", JSON.stringify(onlyNecessary));
    localStorage.setItem("cookie-consent-date", new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Cookie Banner */}
      <div
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
                <Settings className="h-3.5 w-3.5 mr-1" />
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