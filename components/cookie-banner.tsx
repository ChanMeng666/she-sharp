"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Settings } from "lucide-react";
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
          "fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-background border-t-2 border-border shadow-2xl transform transition-transform duration-500",
          isVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-6 w-6 text-foreground mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">We value your privacy</h3>
                <p className="text-sm text-muted-foreground">
                  We use cookies to enhance your browsing experience, analyze site traffic, and personalize content.
                  By clicking "Accept All", you consent to our use of cookies. Read our{" "}
                  <a href="/cookie-policy" className="text-foreground hover:underline">
                    Cookie Policy
                  </a>{" "}
                  to learn more.
                </p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="text-foreground hover:bg-muted"
              >
                <Settings className="h-4 w-4 mr-1" />
                Manage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="border-border text-foreground hover:bg-muted"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                onClick={acceptAll}
                className="bg-foreground hover:bg-foreground/90 text-background"
              >
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-foreground">Cookie Preferences</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Manage your cookie preferences below. You can enable or disable different types of cookies as per your preference.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Necessary Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="necessary" className="text-base font-semibold text-foreground">
                    Necessary Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    These cookies are essential for the website to function properly. They cannot be disabled.
                  </p>
                </div>
                <Switch
                  id="necessary"
                  checked={true}
                  disabled
                  className="data-[state=checked]:bg-foreground"
                />
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="analytics" className="text-base font-semibold text-foreground">
                    Analytics Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
                  </p>
                </div>
                <Switch
                  id="analytics"
                  checked={preferences.analytics}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, analytics: checked })
                  }
                  className="data-[state=checked]:bg-foreground"
                />
              </div>
            </div>

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="text-base font-semibold text-foreground">
                    Marketing Cookies
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to track visitors across websites to display ads that are relevant and engaging.
                  </p>
                </div>
                <Switch
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, marketing: checked })
                  }
                  className="data-[state=checked]:bg-foreground"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              onClick={acceptSelected}
              className="bg-foreground hover:bg-foreground/90 text-background"
            >
              Save Preferences
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}