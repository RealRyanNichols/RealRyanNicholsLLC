import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LivePlayer } from "@/components/LivePlayer";
import { SignupForm } from "@/components/SignupForm";
import { ShareButton } from "@/components/ShareButton";
import { LiveDiscussion } from "@/components/LiveDiscussion";
import { PrivateMessageBox } from "@/components/PrivateMessageBox";
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
        <Link href="/" className="inline-flex min-h-11 items-center hover:underline sm:min-h-0">
          Back to feed
        </Link>
        <span className="mx-2">/</span>
        <Link href="/live" className="inline-flex min-h-11 items-center hover:underline sm:min-h-0">
          Live
        </Link>
      </nav>

      <header className="mb-5">
        <p
          className={[
            "text-xs uppercase tracking-wider font-black",
            stream.status === "live" ? "text-[var(--color-danger)]" : "text-[var(--color-accent)]",
          ].join(" ")}
        >
          {liveStatusLabel(stream.status)}
        </p>
        <h1
          className="display mt-2 text-4xl sm:text-6xl"
          data-reveal
          style={{ "--d": 1 } as React.CSSProperties}
        >
          {stream.title}
        </h1>
        <div
          className="mt-4 h-[3px] w-[4.5rem] bg-[var(--color-gold)]"
          aria-hidden
          data-reveal
          style={{ "--d": 2 } as React.CSSProperties}
        />
        {stream.description ? (
          <p className="mt-4 max-w-3xl text-[var(--color-ink-soft)]">
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
            <div className="aspect-video rounded-lg bg-black text-[var(--color-cream)] grid place-items-center px-6 text-center text-sm">
              {isEnded
                ? "This live stream has ended. If a replay is published, it will show up in Videos."
                : "The live player is waiting for video."}
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/support"
              className="btn-accent rounded-full px-4 py-2 text-sm"
            >
              Support the work
            </Link>
            <ShareButton url={liveUrl(stream.slug)} title={stream.title} compact />
            <Link
              href="/videos"
              className="btn-ghost rounded-full px-4 py-2 text-sm font-black"
            >
              Video archive
            </Link>
          </div>
        </div>

        <aside className="space-y-4">
          <SignupForm emailEnabled={emailSignupEnabled} />
          <div className="panel p-5">
            <p className="eyebrow">
              Share this page
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-[var(--color-ink)]">
              {liveUrl(stream.slug)}
            </p>
          </div>
          <PrivateMessageBox
            title="Sensitive detail for Ryan?"
            source="live-detail-sidebar"
          />
        </aside>
      </section>
      <LiveDiscussion liveStreamId={stream.id} />
    </main>
  );
}
