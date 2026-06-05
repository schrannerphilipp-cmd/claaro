"use client";

import { useEffect } from "react";
import Script from "next/script";
import { getConsent } from "@/lib/consent";

const GA4_ID    = process.env.NEXT_PUBLIC_GA4_ID    ?? "";
const PIXEL_ID  = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "";

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    fbq:  (...args: unknown[]) => void;
    dataLayer: unknown[];
    _fbq: unknown;
  }
}

export default function AnalyticsScripts() {
  useEffect(() => {
    function initFromConsent() {
      const consent = getConsent();
      if (!consent) return;

      // GA4 — only if analytics consent
      if (consent.analytics && GA4_ID) {
        if (typeof window.gtag === "function") {
          window.gtag("consent", "update", {
            analytics_storage: "granted",
          });
        }
      }

      // Meta Pixel — only if marketing consent
      if (consent.marketing && PIXEL_ID) {
        if (typeof window.fbq === "function") {
          window.fbq("consent", "grant");
          window.fbq("init", PIXEL_ID);
          window.fbq("track", "PageView");
        }
      }
    }

    initFromConsent();
    window.addEventListener("claaro:consent-updated", initFromConsent);
    return () => window.removeEventListener("claaro:consent-updated", initFromConsent);
  }, []);

  return (
    <>
      {/* GA4 — loaded but consent-gated */}
      {GA4_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              // Default: deny until consent
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                wait_for_update: 2000
              });
              gtag('config', '${GA4_ID}', { send_page_view: false });
            `}
          </Script>
        </>
      )}

      {/* Meta Pixel — loaded but consent-gated */}
      {PIXEL_ID && (
        <Script id="meta-pixel-init" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            // Do NOT call fbq('init') here — wait for consent
          `}
        </Script>
      )}
    </>
  );
}
