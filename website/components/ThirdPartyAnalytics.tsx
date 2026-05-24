"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Marketing/analytics pixels — only render when their IDs are configured,
// so the site ships clean and these light up the moment Ryan adds the env
// vars. Meta Pixel powers Facebook retargeting + conversion tracking
// (his #2 traffic source); GA4 gives deep behavioral analytics.
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA = process.env.NEXT_PUBLIC_GA_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function ThirdPartyAnalytics() {
  const pathname = usePathname();

  // App-router client navigations don't reload the page, so fire a
  // pageview to each pixel on every route change.
  useEffect(() => {
    if (META && typeof window.fbq === "function") window.fbq("track", "PageView");
    if (GA && typeof window.gtag === "function")
      window.gtag("config", GA, { page_path: pathname });
  }, [pathname]);

  return (
    <>
      {META ? (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${META}');fbq('track','PageView');`}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              alt=""
              src={`https://www.facebook.com/tr?id=${META}&ev=PageView&noscript=1`}
            />
          </noscript>
        </>
      ) : null}

      {GA ? (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA}');`}
          </Script>
        </>
      ) : null}
    </>
  );
}
