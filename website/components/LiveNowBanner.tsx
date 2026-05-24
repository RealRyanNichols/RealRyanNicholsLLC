import Link from "next/link";
import { liveStatusLabel } from "@/lib/live";
import type { LiveStream } from "@/lib/types";

export function LiveNowBanner({ stream }: { stream: LiveStream | null }) {
  if (!stream) return null;

  const isLive = stream.status === "live";
  return (
    <section className="mb-6 rounded-xl border-2 border-red-700 bg-red-50 p-4 sm:p-5 text-red-950">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">
            {isLive ? "Live now" : liveStatusLabel(stream.status)}
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">
            {stream.title}
          </h2>
          {stream.description ? (
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-red-900/80">
              {stream.description.length > 160
                ? `${stream.description.slice(0, 160)}...`
                : stream.description}
            </p>
          ) : null}
        </div>
        <Link
          href={`/live/${stream.slug}`}
          className="inline-flex items-center justify-center rounded-full bg-red-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-red-800"
        >
          {isLive ? "Watch live" : "Open live room"}
        </Link>
      </div>
    </section>
  );
}
