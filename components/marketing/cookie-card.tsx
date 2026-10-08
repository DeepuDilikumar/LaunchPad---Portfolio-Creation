"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AnimatePresence, m } from "motion/react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { getConsent, setConsent, subscribeConsent, type Consent } from "@/lib/analytics/consent";

const OPEN_EVENT = "bp:open-cookie-settings";

export function CookieSettingsLink() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      className="t-small text-text-2 hover:text-text-1 text-left"
    >
      Cookie settings
    </button>
  );
}

export function CookieCard() {
  const consent = useSyncExternalStore<Consent | null | "unknown">(subscribeConsent, getConsent, () => "unknown");
  const [settings, setSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const open = () => {
      setAnalytics(getConsent() === "all");
      setSettings(true);
    };
    window.addEventListener(OPEN_EVENT, open);
    return () => window.removeEventListener(OPEN_EVENT, open);
  }, []);

  const show = consent === null;

  // On phones the card is a bottom sheet: pad the page so it never covers focused content.
  useEffect(() => {
    if (!show || !window.matchMedia("(max-width: 767px)").matches) return;
    const prev = document.body.style.paddingBottom;
    document.body.style.paddingBottom = "200px";
    return () => {
      document.body.style.paddingBottom = prev;
    };
  }, [show]);

  return (
    <>
      <AnimatePresence>
        {show ? (
          <m.div
            role="region"
            aria-label="Cookie preferences"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[60] rounded-t-[20px] border border-line bg-surface-1 p-5 md:inset-x-auto md:bottom-5 md:right-5 md:w-[380px] md:rounded-[20px]"
          >
            <p className="t-h3 text-text-1">Cookies</p>
            <p className="mt-1.5 t-small text-text-2">
              We use essential cookies to keep you signed in. Analytics cookies help us improve the course, and only load if you accept.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="ghost" onClick={() => setSettings(true)}>
                Settings
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConsent("essential")}>
                Reject all
              </Button>
              <Button size="sm" onClick={() => setConsent("all")}>
                Accept all
              </Button>
            </div>
          </m.div>
        ) : null}
      </AnimatePresence>
      <Dialog open={settings} onClose={() => setSettings(false)} title="Cookie settings" description="Choose what we can store in your browser.">
        <div className="space-y-4">
          <label className="flex items-start justify-between gap-4 rounded-[14px] bg-surface-2 p-4">
            <span>
              <span className="block t-small font-medium text-text-1">Essential</span>
              <span className="block t-small text-text-2">Sign-in, security and your cookie choice. Always on.</span>
            </span>
            <input type="checkbox" checked disabled className="mt-1 accent-white" aria-label="Essential cookies (always on)" />
          </label>
          <label className="flex items-start justify-between gap-4 rounded-[14px] bg-surface-2 p-4">
            <span>
              <span className="block t-small font-medium text-text-1">Analytics</span>
              <span className="block t-small text-text-2">Anonymous usage, so we can see which modules help and where people get stuck.</span>
            </span>
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 accent-white" aria-label="Analytics cookies" />
          </label>
          <Button
            className="w-full"
            onClick={() => {
              setConsent(analytics ? "all" : "essential");
              setSettings(false);
            }}
          >
            Save choices
          </Button>
        </div>
      </Dialog>
    </>
  );
}
