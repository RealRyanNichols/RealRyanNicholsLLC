import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";

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
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-[var(--color-accent)] text-[#0a0a0c] flex items-center justify-center text-3xl font-bold flex-shrink-0 ring-4 ring-[var(--color-paper)]"
              style={{ boxShadow: "0 0 40px var(--color-accent-glow)" }}
              aria-hidden
            >
              RN
            </div>
          )}
          <div className="flex-1 min-w-0 pt-2 sm:pb-2">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              {SITE.name}
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-ink-soft)] mt-1.5 font-medium">
              {SITE.tagline}
            </p>
          </div>
        </div>

        <p className="text-sm sm:text-[15px] text-[var(--color-muted)] mt-4 leading-relaxed max-w-prose">
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
            href="/case"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
          >
            Read the case
          </Link>
          <Link
            href="/about"
            className="inline-flex items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)] px-5 py-2 text-sm font-medium text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition"
          >
            About
          </Link>
        </div>
      </div>
    </section>
  );
}
