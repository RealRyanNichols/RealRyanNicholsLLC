import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";

export function ProfileHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-[var(--color-line)] bg-gradient-to-br from-[var(--color-surface-2)] to-[var(--color-surface)] p-6 sm:p-10">
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "var(--color-accent-glow)" }}
        aria-hidden
      />
      <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {SITE.avatarPath ? (
          <Image
            src={SITE.avatarPath}
            alt={SITE.name}
            width={120}
            height={120}
            className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover flex-shrink-0 ring-4 ring-[var(--color-accent-glow)]"
            priority
          />
        ) : (
          <div
            className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-[var(--color-accent)] text-[#0a0a0c] flex items-center justify-center text-3xl font-bold flex-shrink-0 ring-4 ring-[var(--color-accent-glow)]"
            style={{ boxShadow: "0 0 40px var(--color-accent-glow)" }}
            aria-hidden
          >
            RN
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.05]">
            {SITE.name}
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-ink-soft)] mt-2 font-medium">
            {SITE.tagline}
          </p>
          <p className="text-sm sm:text-[15px] text-[var(--color-muted)] mt-3 leading-relaxed max-w-prose">
            My own front porch — a domain I own, a feed I write, a place I can&apos;t
            be throttled off. Faith, family, building, and the long work of
            healing in public.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href="/support"
              className="btn-accent inline-flex items-center rounded-full px-5 py-2 text-sm transition"
            >
              Support the rebuild
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
            >
              Read my story
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
