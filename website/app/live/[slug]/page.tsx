import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LivePlayer } from "@/components/LivePlayer";
import { SignupForm } from "@/components/SignupForm";
import { getLiveStreamBySlug, liveStatusLabel, liveUrl } from "@/lib/live";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stream = await getLiveStreamBySlug(slug);
  if (!stream) return {};
  return {
    title: stream.title,
    description:
      stream.description ||
      "Watch Ryan Nichols live on RealRyanNichols.com.",
    alternates: { canonical: `/live/${stream.slug}` },
    openGraph: {
      title: stream.title,
      description:
        stream.description ||
        "Watch Ryan Nichols live on RealRyanNichols.com.",
      url: liveUrl(stream.slug),
      type: "video.other",
    },
  };
}

export default async function LiveStreamPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const stream = await getLiveStreamBySlug(slug);
  if (!stream) notFound();

  const emailSignupEnabled = Boolean(
    SITE.mailingAddress &&
      process.env.RESEND_API_KEY &&
      process.env.RESEND_FROM_EMAIL
  );
  const isEnded = stream.status === "ended";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:underline">
          Back to feed
        </Link>
        <span className="mx-2">/</span>
        <Link href="/live" className="hover:underline">
          Live
        </Link>
      </nav>

      <header className="mb-5">
        <p
          className={[
            "text-xs uppercase tracking-wider font-black",
            stream.status === "live" ? "text-red-700" : "text-[var(--color-accent)]",
          ].join(" ")}
        >
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
            <LivePlayer
              playbackId={stream.mux_playback_id}
              title={stream.title}
              streamType={isEnded ? "on-demand" : "live"}
            />
          ) : (
            <div className="aspect-video rounded-lg bg-black text-white grid place-items-center px-6 text-center text-sm">
              {isEnded
                ? "This live stream has ended. If a replay is published, it will show up in Videos."
                : "The live player is waiting for video."}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/support"
              className="rounded-full bg-[var(--color-accent)] px-4 py-2 text-sm font-black text-[var(--color-paper)]"
            >
              Support the work
            </Link>
            <Link
              href="/videos"
              className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-black hover:border-[var(--color-accent)]"
            >
              Video archive
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <SignupForm emailEnabled={emailSignupEnabled} />
          <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] font-bold">
              Share this page
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--color-ink)]">
              {liveUrl(stream.slug)}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
