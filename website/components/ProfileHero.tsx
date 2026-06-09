import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";

// Orientation merged into the hero — one block, no competing CTAs. Four doors
// for the four audiences.
const AUDIENCES = [
  { href: "/support", label: "Supporter", desc: "Keep the record public and funded." },
  { href: "/case", label: "Journalist / Researcher", desc: "The documented record — filings, video." },
  { href: "/j6", label: "J6 Defendant / Source", desc: "Get on the record, or free claim help." },
  { href: "/services", label: "Client / Customer", desc: "Want a site like this? Hire Ryan." },
];

export async function ProfileHero() {
  const settings = await getSiteSettings();
  const coverUrl = settings.cover_url;
  const avatarUrl = settings.avatar_url;
  const hasCover = !!coverUrl;
  const hasAvatar = !!avatarUrl;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)]">
      <div className="relative h-32 sm:h-48 md:h-56 w-full overflow-hidden">
        {hasCover ? (
          <Image
            src={coverUrl!}
            alt=""
            fill
            sizes="(min-width: 1024px) 768px, 100vw"
            className="object-cover"
            priority
            unoptimized={coverUrl!.startsWith("http")}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-2)] to-black" />
        )}
        <div
          className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "var(--color-accent-glow)" }}
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[var(--color-surface)]/95 to-transparent" />
      </div>

      <div className="relative px-5 sm:px-8 pb-7 -mt-12 sm:-mt-16">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
          {hasAvatar ? (
            <Image
              src={avatarUrl!}
              alt={SITE.name}
              width={144}
              height={144}
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover flex-shrink-0 ring-4 ring-[var(--color-paper)] bg-[var(--color-surface)]"
              priority
              unoptimized={avatarUrl!.startsWith("http")}
            />
          ) : (
            <div
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] flex items-center justify-center text-3xl font-bold flex-shrink-0 ring-4 ring-[var(--color-paper)]"
              style={{ boxShadow: "0 0 40px var(--color-accent-glow)" }}
              aria-hidden
            >
              RN
            </div>
          )}
          <div className="flex-1 min-w-0 pt-2 sm:pb-2">
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95]">
              {SITE.name}
            </h1>
            <p className="mt-2 text-sm font-black uppercase tracking-[0.04em] text-[var(--color-accent)] sm:text-base">
              {SITE.tagline}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-[15px] text-[var(--color-muted)] mt-4 leading-relaxed max-w-prose">
          My own front porch — a domain I own, a feed I write, a place I can&apos;t
          be throttled off. Faith, family, building, and the long work of
          healing in public.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href="/start-here"
            className="btn-accent inline-flex items-center rounded-full px-5 py-2 text-sm transition"
          >
            Start Here
          </Link>
          <Link
            href="/support"
            className="btn-support inline-flex items-center rounded-full px-5 py-2 text-sm font-semibold transition"
          >
            Support the Work
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-[var(--color-muted)] underline-offset-4 transition hover:text-[var(--color-accent)] hover:underline"
          >
            About
          </Link>
        </div>

        {/* Orientation — collapsed by default into a dropdown so the feed is
            front and center. Most people come to read; the "four doors" are one
            tap away for those who want them. Native <details>, no client JS. */}
        <details className="group/doors mt-6 border-t border-[var(--color-line)] pt-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 [&::-webkit-details-marker]:hidden">
            <span className="text-[11px] font-black uppercase tracking-[0.16em] text-[var(--color-muted)]">
              What brings you here?
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)] transition group-hover/doors:text-[var(--color-accent)]">
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
                className="group rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 transition hover:border-[var(--color-accent)]"
              >
                <p className="text-sm font-bold text-[var(--color-ink)] transition group-hover:text-[var(--color-accent)]">
                  {a.label} →
                </p>
                <p className="mt-1 text-xs leading-snug text-[var(--color-muted)]">
                  {a.desc}
                </p>
              </Link>
            ))}
          </div>
        </details>
      </div>
    </section>
  );
}
