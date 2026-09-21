import Link from "next/link";
import { HANDLERS_EPISODES, HANDLERS_SERIES } from "@/lib/the-handlers";

export function HandlersSeriesShelf({ compact = false }: { compact?: boolean }) {
  const latest = HANDLERS_EPISODES[0];

  return (
    <section
      className="relative mt-8 overflow-hidden rounded-2xl border border-[var(--color-gold)] bg-[var(--color-surface)] shadow-[0_24px_80px_rgba(0,0,0,0.45)]"
      aria-labelledby="handlers-heading"
    >
      <div className="absolute inset-y-0 left-0 w-1.5 bg-[var(--color-gold)]" aria-hidden />
      <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <p className="eyebrow text-[var(--color-gold)]">Original political cartoon series</p>
          <h2
            id="handlers-heading"
            className="mt-3 font-display text-4xl font-black leading-none text-white sm:text-5xl"
          >
            The Handlers
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--color-ink-soft)] sm:text-lg">
            {HANDLERS_SERIES.description}
          </p>
          <p className="mt-5 max-w-xl border-l-2 border-[var(--color-gold)] pl-4 text-sm font-black tracking-[0.13em] text-white sm:text-base">
            {HANDLERS_SERIES.motto}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/videos/the-handlers"
              className="btn-accent inline-flex min-h-11 items-center rounded-md px-5 text-sm"
            >
              Watch The Handlers
            </Link>
            <a
              href={HANDLERS_SERIES.youtubeUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex min-h-11 items-center rounded-md px-5 text-sm font-black"
            >
              Follow on YouTube
            </a>
          </div>
        </div>

        <div className="flex min-h-72 items-center justify-center border-t border-[var(--color-line)] bg-[var(--color-surface-2)] p-6 lg:border-l lg:border-t-0">
          {latest ? (
            <div className="w-full max-w-sm">
              <div className="mx-auto aspect-[9/16] max-h-[30rem] overflow-hidden rounded-xl border border-[var(--color-line)] bg-black">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${latest.youtubeId}`}
                  title={`${latest.title} — The Handlers`}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="mt-3 text-center text-sm font-black text-white">Latest: {latest.title}</p>
            </div>
          ) : (
            <div className="max-w-sm text-center">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-gold)]">
                First release loading
              </p>
              <p className="mt-3 font-display text-2xl font-black text-white">
                The recurring cast is reporting for duty.
              </p>
              {!compact ? (
                <p className="mt-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  Every episode appears here after the public video and its exact live link are verified.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
