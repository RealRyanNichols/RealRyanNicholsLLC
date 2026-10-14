import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site";
import { getOgImage } from "@/lib/og-images";

export async function generateMetadata(): Promise<Metadata> {
  const override = await getOgImage("/jan-6");
  const title = override?.title ?? "Jan 6";
  const description = override?.description ?? "Ryan Nichols' January 6 story in his own words — the arrest, the DC jail, the trial, and the pardon on January 20, 2025.";
  const url = `${SITE.url}/jan-6`;
  const ogImageUrl = override?.image_url ?? null;
  return {
    title: "Ryan Nichols — January 6: In His Own Words",
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: override?.width ?? 1200,
              height: override?.height ?? 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export default function JanSixPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* The kicker the page already carried, moved above the title so the
          front door reads the way the theater does: eyebrow, display, rule. */}
      <p className="eyebrow" data-reveal>
        In my own words. Updated periodically.
      </p>
      <h1
        className="display mt-3 text-5xl sm:text-7xl"
        data-reveal
        style={{ "--d": 1 } as React.CSSProperties}
      >
        Jan 6
      </h1>
      <div
        className="mt-5 h-[3px] w-[4.5rem] bg-[var(--color-gold)]"
        aria-hidden
        data-reveal
        style={{ "--d": 2 } as React.CSSProperties}
      />

      <figure
        className="panel mt-6 overflow-hidden"
        data-reveal
        style={{ "--d": 3 } as React.CSSProperties}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/ryan-dc-jail.jpg"
          alt="Ryan Nichols inside the DC Jail during pretrial detention."
          className="w-full h-auto block"
        />
        <figcaption className="border-t border-[var(--color-line-soft)] px-4 py-3 text-xs text-[var(--color-muted)]">
          Inside the DC Jail. Pretrial detention, before the pardon.
        </figcaption>
      </figure>

      <div className="prose-body mt-6">
        <p>
          January 6th, 2021 changed the trajectory of my life. I&apos;m not going to relitigate
          every minute of that day on this page. What you&apos;ll find here, over time, is the
          plain account: what happened, what I did, what I didn&apos;t do, what the government
          said about me, what was true, what wasn&apos;t, and where I am now.
        </p>
        <p>
          I went to prison. I came home. I was pardoned. I lost a business. I lost time with
          my kids. I gained perspective I would not trade.
        </p>
        <p>
          When I write here about Jan 6, I&apos;m writing it the way I would tell it on my
          porch, not the way a press release would tell it. The newer posts on the
          <Link href="/" className="underline mx-1">feed</Link>
          are where I&apos;m working through it in real time. This page collects the longer,
          settled pieces.
        </p>
        <p className="text-[var(--color-muted)] italic">
          More long-form pieces are being written. Subscribe in the sidebar to get them
          when they go up.
        </p>
      </div>
    </article>
  );
}
