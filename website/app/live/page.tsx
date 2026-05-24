import type { Metadata } from "next";
import Link from "next/link";
import { LivePlayer } from "@/components/LivePlayer";
import { SignupForm } from "@/components/SignupForm";
import { ShareButton } from "@/components/ShareButton";
import { getActiveLiveStream, liveStatusLabel } from "@/lib/live";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live",
  description:
    "Watch Ryan Nichols live on the site he owns. No algorithm, no platform middleman, no social media gatekeeping.",
  alternates: { canonical: "/live" },
};

export default async function LivePage() {
  const stream = await getActiveLiveStream();
  const emailSignupEnabled = Boolean(
    SITE.mailingAddress &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL
  );

  if (!stream) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10">
        <header className="border-b border-[var(--color-line)] pb-6">
          <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
            RealRyanNichols.com/live
          </p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">
            Ryan is not live right now.
          </h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">
            When the camera goes live, this is the page. Subscribe once and the
            next alert brings you back here, not to a social platform feed.
          </p>
        </header>
        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
            <h2 className="text-2xl font-black tracking-tight">
              Watch the archive
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Published videos stay on this site by channel.
            </p>
            <Link
              href="/videos"
              className="mt-5 inline-flex rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-black text-[var(--color-paper)]"
            >
              Open videos
            </Link>
          </div>
          <SignupForm emailEnabled={emailSignupEnabled} />
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:underline">
          Back to feed
        </Link>
      </nav>
      <header className="mb-5">
        <p className="text-xs uppercase tracking-wider text-red-700 font-black">
          {liveStatusLabel(stream.status)}
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
          {stream.title}
        </h1>
        {stream.description ? (
          <p className="mt-3 max-w-3xl text-[var(--color-ink-soft)]">
            {stream.description}
          </p>
        ) : null}
      </header>
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {stream.mux_playback_id ? (
            <LivePlayer playbackId={stream.mux_playback_id} title={stream.title} />
          ) : (
            <div className="aspect-video rounded-lg bg-black text-white grid place-items-center text-sm">
              Player is not ready yet.
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/live/${stream.slug}`}
              className="rounded-full bg-red-700 px-4 py-2 text-sm font-black text-white hover:bg-red-800"
            >
              Permanent live link
            </Link>
            <ShareButton
              url={`${SITE.url}/live/${stream.slug}`}
              title={stream.title}
              compact
            />
            <Link
              href="/support"
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-black hover:border-[var(--color-accent)]"
            >
              Support the work
            </Link>
          </div>
        </div>
        <aside className="space-y-4">
          <SignupForm emailEnabled={emailSignupEnabled} />
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Site-owned live
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Share the link. The attention comes back to RealRyanNichols.com.
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
