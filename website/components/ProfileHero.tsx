import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getImageSource } from "@/lib/image-source";

// The home page title card, in the theater treatment: Ryan's real photo (the
// site avatar) on the left, navy falling off toward the copy so type never
// crosses his face, a gold eyebrow, the condensed headline, a gold rule, one
// support line, and the two doors. The headline and the support line are
// the words from his own cover art; nothing here is invented. The four
// audience doors stay folded under the card. Orientation merged into the
// hero: one block, no competing CTAs.
const AUDIENCES = [
  { href: "/support", label: "Supporter", desc: "Own a piece of the work — book, builds, store." },
  { href: "/case", label: "Journalist / Researcher", desc: "The documented record — filings, video." },
  { href: "/j6", label: "J6 Defendant / Source", desc: "Get on the record, or free claim help." },
  { href: "/services", label: "Client / Customer", desc: "Want a site like this? Hire Ryan." },
];

export async function ProfileHero() {
  const settings = await getSiteSettings();
  const avatarUrl = settings.avatar_url;
  const avatarImage = avatarUrl ? getImageSource(avatarUrl) : null;

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-[var(--color-line)] bg-[var(--color-navy)] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="grid sm:grid-cols-[1fr_1.1fr]">
        {/* The photo. Real, uncropped face, never under the type. */}
        <div className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[24rem]">
          {avatarImage ? (
            <Image
              {...avatarImage}
              // A new cache key avoids the stale large variant from the
              // earlier profile repair. This key was verified in production.
              src={avatarImage.src === "/avatar.jpg" ? "/avatar.jpg?v=20260920" : avatarImage.src}
              alt={SITE.name}
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 48vw, calc(100vw - 32px)"
              className="object-cover object-[24%_42%]"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-2)]">
              <span
                className="display text-7xl text-[var(--color-gold)]"
                aria-hidden
              >
                RN
              </span>
            </div>
          )}
          <div className="home-hero-shade" aria-hidden />
          <span className="absolute bottom-3 left-3 rounded-full border border-[var(--color-cream)]/25 bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-cream)] backdrop-blur-sm sm:bottom-4 sm:left-4">
            Real photo · Ryan, East Texas
          </span>
        </div>

        {/* The copy, on navy. */}
        <div className="relative flex flex-col justify-center px-5 pb-5 pt-2 sm:px-8 sm:py-8 lg:px-10">
          <p className="eyebrow">
            {SITE.name} · {SITE.tagline}
          </p>
          <h1 className="display mt-3 text-[2.75rem] text-[var(--color-cream)] sm:text-6xl lg:text-7xl">
            <span className="sr-only">{SITE.name}: </span>
            The record they can&rsquo;t bury.
          </h1>
          <div className="mt-4 h-1 w-16 rounded bg-[var(--color-gold)]" aria-hidden />
          <p className="mt-4 max-w-md font-display text-lg leading-snug text-[var(--color-ink-soft)] sm:text-xl">
            No algorithm. No throttling. Just the record.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href="/start-here"
              className="btn-accent inline-flex min-h-12 items-center justify-center px-5 py-2.5 text-sm sm:min-h-11"
            >
              Start Here
            </Link>
            <Link
              href="/book/preorder"
              className="btn-ghost inline-flex min-h-12 items-center justify-center px-5 py-2.5 text-sm sm:min-h-11"
            >
              Get the Book
            </Link>
          </div>
        </div>
      </div>

      {/* Orientation — collapsed by default into a dropdown so the feed is
          front and center. Most people come to read; the "four doors" are one
          tap away for those who want them. Native <details>, no client JS. */}
      <details className="group/doors border-t border-[var(--color-line)] px-5 pb-4 pt-3.5 sm:px-8 lg:px-10">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden sm:min-h-0">
          <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
            What brings you here?
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] transition group-hover/doors:text-[var(--color-gold)]">
            Pick your path
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 transition-transform group-open/doors:rotate-180"
              aria-hidden
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </summary>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {AUDIENCES.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 transition hover:border-[var(--color-gold)]"
            >
              <p className="text-sm font-bold text-[var(--color-ink)] transition group-hover:text-[var(--color-gold)]">
                {a.label} →
              </p>
              <p className="mt-1 text-xs leading-snug text-[var(--color-muted)]">
                {a.desc}
              </p>
            </Link>
          ))}
        </div>
      </details>
    </section>
  );
}
