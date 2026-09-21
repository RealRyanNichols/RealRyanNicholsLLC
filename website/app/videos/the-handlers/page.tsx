import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { pageMetadata } from "@/lib/page-metadata";
import { SITE } from "@/lib/site";
import { HANDLERS_EPISODES, HANDLERS_SERIES } from "@/lib/the-handlers";

export const metadata = pageMetadata({
  title: "The Handlers",
  description:
    "Watch The Handlers, the recurring political cartoon series from Real Ryan Nichols. Truth is optional. Ridicule is mandatory.",
  path: "/videos/the-handlers",
});

const platformLinks = [
  ["YouTube", HANDLERS_SERIES.youtubeUrl],
  ["X", HANDLERS_SERIES.xUrl],
  ["Facebook", HANDLERS_SERIES.facebookUrl],
  ["TikTok", HANDLERS_SERIES.tiktokUrl],
  ["Instagram", HANDLERS_SERIES.instagramUrl],
] as const;

export default function TheHandlersPage() {
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "The Handlers episodes",
    url: `${SITE.url}/videos/the-handlers`,
    itemListElement: HANDLERS_EPISODES.map((episode, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "VideoObject",
        name: episode.title,
        description: episode.hook,
        uploadDate: episode.publishedAt,
        duration: episode.duration,
        embedUrl: `https://www.youtube-nocookie.com/embed/${episode.youtubeId}`,
        url: `https://www.youtube.com/watch?v=${episode.youtubeId}`,
      },
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={itemListLd} />
      <nav className="mb-6 text-sm text-[var(--color-muted)]">
        <Link href="/videos" className="inline-flex min-h-11 items-center hover:underline sm:min-h-0">
          Back to all videos
        </Link>
      </nav>

      <header className="relative overflow-hidden rounded-2xl border border-[var(--color-gold)] bg-[var(--color-surface)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] sm:p-10">
        <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--color-gold)]" aria-hidden />
        <p className="eyebrow text-[var(--color-gold)]">A Real Ryan Nichols original series</p>
        <h1 className="mt-3 font-display text-5xl font-black leading-none text-white sm:text-7xl">
          The Handlers
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
          {HANDLERS_SERIES.description}
        </p>
        <p className="mt-6 max-w-3xl border-l-2 border-[var(--color-gold)] pl-4 text-sm font-black tracking-[0.14em] text-white sm:text-lg">
          {HANDLERS_SERIES.motto}
        </p>
        <div className="mt-7 flex flex-wrap gap-2" aria-label="Follow The Handlers">
          {platformLinks.map(([label, href]) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-4 text-xs font-black text-white transition hover:border-[var(--color-gold)] hover:text-[var(--color-gold)]"
            >
              {label}
            </a>
          ))}
        </div>
      </header>

      {HANDLERS_EPISODES.length === 0 ? (
        <section className="py-12">
          <div className="panel p-7 text-center sm:p-10">
            <p className="eyebrow text-[var(--color-gold)]">Series premiere</p>
            <h2 className="mt-3 text-3xl font-black text-white">The first verified episodes are on the way.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
              New episodes appear here only after the final export, captions, public upload, and live link have all been checked.
            </p>
          </div>
        </section>
      ) : (
        <section className="mt-10 grid gap-8 md:grid-cols-2" aria-label="The Handlers episodes">
          {HANDLERS_EPISODES.map((episode) => (
            <article key={episode.youtubeId} className="panel overflow-hidden p-4 sm:p-5">
              <div className="mx-auto aspect-[9/16] max-h-[42rem] overflow-hidden rounded-xl bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${episode.youtubeId}`}
                  title={`${episode.title} — The Handlers`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="eyebrow mt-5 text-[var(--color-gold)]">Episode {episode.number}</p>
              <h2 className="mt-2 text-2xl font-black text-white">{episode.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">{episode.hook}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[var(--color-muted)]">
                <span>{episode.duration.replace("PT", "").replace("S", " seconds")}</span>
                <span aria-hidden>·</span>
                <time dateTime={episode.publishedAt}>{episode.publishedAt}</time>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
