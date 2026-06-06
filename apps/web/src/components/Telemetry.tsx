"use client";
import React, { useEffect } from "react";

export function Telemetry() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Initialize Sentry Telemetry client
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (sentryDsn) {
      console.log("[Telemetry] Initializing Sentry error tracker...");
      window.addEventListener("error", (event) => {
        console.error("[Telemetry Captured Error]:", event.error || event.message);
      });
    }

    // 2. Initialize Google Analytics 4 (GA4)
    const gaId = process.env.NEXT_PUBLIC_GA_ID;
    if (gaId) {
      console.log(`[Telemetry] Initializing Google Analytics (${gaId})...`);
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag() {
        (window as any).dataLayer.push(arguments);
      }
      (window as any).gtag = gtag;
      gtag();
      (window as any).gtag("js", new Date());
      (window as any).gtag("config", gaId);
    }

    // 3. Initialize Microsoft Clarity — only when a real project ID is provided
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;
    if (clarityId) {
      console.log(`[Telemetry] Initializing Microsoft Clarity (${clarityId})...`);
      (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
        y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
      })(window, document, "clarity", "script", clarityId);
    }

    // 4. Initialize PostHog
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
    if (posthogKey) {
      console.log(`[Telemetry] Initializing PostHog (${posthogKey})...`);
      (function (p: any, o: any, s: any, t?: any, h?: any, o_g?: any) {
        p[h] = p[h] || function () { (p[h].q = p[h].q || []).push(arguments) };
        t = o.createElement(s); t.async = 1; t.src = "https://us.i.posthog.com/static/array.js";
        o_g = o.getElementsByTagName(s)[0]; o_g.parentNode.insertBefore(t, o_g);
      })(window, document, "script", 0, "posthog");
      (window as any).posthog("init", posthogKey, { api_host: posthogHost });
    }

  }, []);

  return null;
}
