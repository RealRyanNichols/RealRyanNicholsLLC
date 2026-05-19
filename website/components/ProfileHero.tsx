import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";

export function ProfileHero() {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
      {SITE.avatarPath ? (
        <Image
          src={SITE.avatarPath}
          alt={SITE.name}
          width={80}
          height={80}
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover flex-shrink-0"
          priority
        />
      ) : (
        <div
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-[var(--color-accent)] text-white flex items-center justify-center text-xl font-semibold flex-shrink-0"
          aria-hidden
        >
          RN
        </div>
      )}
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          {SITE.name}
        </h1>
        <p className="text-[var(--color-ink-soft)] mt-1">{SITE.tagline}</p>
        <p className="text-sm text-[var(--color-muted)] mt-3 leading-relaxed">
          This is my own front porch — a domain I own, a feed I write, a place I&apos;m not going to be throttled off. Faith, family, building, and the long work of healing in public.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/about"
            className="inline-flex items-center rounded-full bg-[var(--color-ink)] px-4 py-1.5 text-white text-sm font-medium hover:bg-[var(--color-accent)] transition"
          >
            About
          </Link>
          <Link
            href="/support"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-white px-4 py-1.5 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
          >
            Support the rebuild
          </Link>
        </div>
      </div>
    </section>
  );
}
