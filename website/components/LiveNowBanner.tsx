import Link from "next/link";
import { liveStatusLabel } from "@/lib/live";
import type { LiveStream } from "@/lib/types";

export function LiveNowBanner({ stream }: { stream: LiveStream | null }) {
  if (!stream) return null;

  const isLive = stream.status === "live";
  return (
    <section className="mb-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 sm:p-5 text-[var(--color-danger)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--color-danger)]">
            {isLive ? "Live now" : liveStatusLabel(stream.status)}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
            {stream.title}
          </h2>
          {stream.description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
              {stream.description.length > 160
                ? `${stream.description.slice(0, 160)}...`
                : stream.description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/live/${stream.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-black text-[var(--color-cream)] transition hover:bg-[var(--color-accent-strong)]"
        >
          {isLive ? "Watch live" : "Open live room"}
        </Link>
      </div>
    </section>
  );
}
