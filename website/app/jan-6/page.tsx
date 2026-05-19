import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jan 6",
  description: "Ryan Nichols' Jan 6 story, in his own words.",
};

export default function JanSixPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Jan 6</h1>
      <p className="mt-3 text-sm text-[var(--color-muted)]">
        In my own words. Updated periodically.
      </p>
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
          <a href="/" className="underline mx-1">feed</a>
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
