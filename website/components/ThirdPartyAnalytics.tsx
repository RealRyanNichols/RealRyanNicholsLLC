"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Marketing/analytics pixels — only render when their IDs are configured,
// so the site ships clean and each lights up the moment Ryan adds the env
// var in Vercel. Meta + TikTok + X power retargeting on his top three social
// sources; GA4 gives deep behavioral analytics. Every pixel is paired with
// the first-party page_events stream (see lib/analytics) so no platform is
// the single source of truth.
const META = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const GA = process.env.NEXT_PUBLIC_GA_ID;
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const TWITTER = process.env.NEXT_PUBLIC_TWITTER_PIXEL_ID;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
    ttq?: { track?: (...args: unknown[]) => void; page?: (...args: unknown[]) => void } & Record<string, unknown>;
    twq?: (...args: unknown[]) => void;
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
    if (TIKTOK && window.ttq?.page) window.ttq.page();
    if (TWITTER && typeof window.twq === "function") window.twq("track", "PageView");
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

      {TIKTOK ? (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript";n.async=!0;n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${TIKTOK}');ttq.page();}(window,document,'ttq');`}
        </Script>
      ) : null}

      {TWITTER ? (
        <Script id="twitter-pixel" strategy="afterInteractive">
          {`!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments)},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');twq('config','${TWITTER}');`}
        </Script>
      ) : null}
    </>
  );
}
