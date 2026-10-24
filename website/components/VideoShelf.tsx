import Link from "next/link";
import Image from "next/image";
import { FeaturedVideo } from "@/components/FeaturedVideo";
import { getImageSource } from "@/lib/image-source";
import { formatVideoDuration, type ShelfVideo } from "@/lib/video-shelf";

// Ryan's own videos, the first thing on the homepage. The lead plays in
// place. On a phone the most-watched rest is one thumb-swipe wide under it;
// on a desktop the first four stack beside the lead (the way a video site
// reads) and the rest sit in a row below.
const SIDE_COUNT = 4;

export function VideoShelf({
  featured,
  rail,
  placement = "home",
  className = "",
}: {
  featured: ShelfVideo | null;
  rail: ShelfVideo[];
  placement?: string;
  className?: string;
}) {
  if (!featured) return null;
  const side = rail.slice(0, SIDE_COUNT);
  const below = rail.slice(SIDE_COUNT);
  return (
    <section aria-labelledby={`shelf-${placement}`} className={className}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow">On camera. On the record.</p>
          <h2
            id={`shelf-${placement}`}
            className="display mt-1 text-3xl text-[var(--color-ink)] sm:text-4xl"
          >
            Watch Ryan
          </h2>
        </div>
        <Link
          href="/videos"
          className="inline-flex min-h-11 shrink-0 items-center text-sm font-bold text-[var(--color-gold)] hover:underline underline-offset-4"
        >
          All videos →
        </Link>
      </div>

      <div className="lg:grid lg:grid-cols-3 lg:gap-6">
        <div className="lg:col-span-2">
          <FeaturedVideo video={featured} placement={placement} />
          <p className="mt-3 font-display text-lg font-bold leading-snug text-[var(--color-ink)]">
            <Link
              href={featured.href}
              className="transition hover:text-[var(--color-gold)] hover:underline underline-offset-4"
            >
              {featured.title}
            </Link>
          </p>
        </div>
        {side.length > 0 ? (
          <ul className="hidden lg:flex lg:flex-col lg:gap-3" aria-label="Most watched">
            {side.map((v) => (
              <li key={v.id}>
                <VideoRow video={v} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {/* Phones and tablets: every rail video, swipe or grid. */}
      {rail.length > 0 ? (
        <ul
          className="-mx-4 mt-5 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:scroll-px-0 sm:grid-cols-3 sm:gap-4 sm:overflow-visible sm:px-0 lg:hidden"
          aria-label="More videos"
        >
          {rail.map((v) => (
            <li key={v.id} className="w-[68%] shrink-0 snap-start sm:w-auto">
              <VideoTile video={v} />
            </li>
          ))}
        </ul>
      ) : null}
      {/* Desktop: what did not fit beside the lead. */}
      {below.length > 0 ? (
        <ul className="mt-6 hidden gap-4 lg:grid lg:grid-cols-4" aria-label="More videos">
          {below.map((v) => (
            <li key={v.id}>
              <VideoTile video={v} />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function PlayBadge({ size }: { size: "sm" | "md" }) {
  return (
    <span className="absolute inset-0 flex items-center justify-center">
      <span
        className={`flex items-center justify-center rounded-full bg-[var(--color-cream)]/95 text-[var(--color-navy)] shadow-md transition group-hover:scale-105 ${size === "md" ? "h-11 w-11" : "h-8 w-8"}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={size === "md" ? "ml-0.5 h-5 w-5" : "ml-0.5 h-4 w-4"}
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

function Thumb({ video, sizes }: { video: ShelfVideo; sizes: string }) {
  const duration = formatVideoDuration(video.durationSeconds);
  return (
    <>
      {video.thumb ? (
        <Image
          {...getImageSource(video.thumb)}
          alt=""
          fill
          loading="lazy"
          sizes={sizes}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
        />
      ) : null}
      {duration ? (
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-cream)]">
          {duration}
        </span>
      ) : null}
    </>
  );
}

export function VideoTile({ video }: { video: ShelfVideo }) {
  return (
    <Link href={video.href} className="group block">
      <span className="relative block aspect-video overflow-hidden rounded-lg border border-[var(--color-line)] bg-black">
        <Thumb video={video} sizes="(min-width: 1024px) 240px, (min-width: 640px) 33vw, 68vw" />
        <PlayBadge size="md" />
      </span>
      <span className="mt-2 line-clamp-2 block text-sm font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-gold)]">
        {video.title}
      </span>
    </Link>
  );
}

// A compact row for the desktop column beside the lead video.
function VideoRow({ video }: { video: ShelfVideo }) {
  return (
    <Link href={video.href} className="group flex gap-3">
      <span className="relative block aspect-video w-36 shrink-0 overflow-hidden rounded-md border border-[var(--color-line)] bg-black">
        <Thumb video={video} sizes="144px" />
        <PlayBadge size="sm" />
      </span>
      <span className="line-clamp-3 text-sm font-bold leading-snug text-[var(--color-ink)] group-hover:text-[var(--color-gold)]">
        {video.title}
      </span>
    </Link>
  );
}
