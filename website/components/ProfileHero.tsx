import Link from "next/link";
import Image from "next/image";
import { SITE } from "@/lib/site";
import { getSiteSettings } from "@/lib/site-settings";
import { getImageSource } from "@/lib/image-source";
import { SignupForm } from "@/components/SignupForm";

// The home page title card, in the theater treatment: Ryan's real photo (the
// site avatar), navy falling off toward the copy so type never crosses his
// face, a gold eyebrow, the condensed headline, a gold rule, one support
// line, and one job: follow the record. The headline and the support line
// are the words from his own cover art; nothing here is invented.
//
// The one job is the inline email capture (id="join", the target of every
// "Join" link on the site), with the book as a text link under it. On a
// 390x844 phone the whole form sits inside the first ~600px, above the
// ~660px an in-app browser leaves visible: the photo is a short banner
// there, the eyebrow is cut to two words, and the audience doors and Start
// Here wait folded under the card. The measured median scroll on / is 1.5%,
// so anything below that line is, for most visitors, not on the page.
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
        {/* The photo. Real, uncropped face, never under the type. A short
            banner on a phone (about 150px at 390 wide), a full column from
            sm up. */}
        <div className="relative aspect-[12/5] sm:aspect-auto sm:min-h-[26rem]">
          {avatarImage ? (
            <Image
              {...avatarImage}
              // A new cache key avoids the stale large variant from the
              // earlier profile repair. This key was verified in production.
              src={avatarImage.src === "/avatar.jpg" ? "/avatar.jpg?v=20260920" : avatarImage.src}
              alt={SITE.name}
              fill
              sizes="(min-width: 1024px) 480px, (min-width: 640px) 48vw, calc(100vw - 32px)"
              className="object-cover object-[24%_40%]"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-surface-2)]">
              <span
                className="display text-6xl text-[var(--color-gold)] sm:text-7xl"
                aria-hidden
              >
                RN
              </span>
            </div>
          )}
          <div className="home-hero-shade" aria-hidden />
          {/* Top right on a phone, clear of the face on the left. */}
          <span className="absolute right-2.5 top-2.5 rounded-full border border-[var(--color-cream)]/25 bg-black/45 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-cream)] backdrop-blur-sm sm:bottom-4 sm:left-4 sm:right-auto sm:top-auto">
            Real photo · Ryan, East Texas
          </span>
        </div>

        {/* The copy, on navy. */}
        <div className="relative flex flex-col justify-center px-5 pb-5 pt-3 sm:px-8 sm:py-8 lg:px-10">
          <p className="eyebrow">
            <span className="sm:hidden">{SITE.name} · J6 survivor</span>
            <span className="hidden sm:inline">
              {SITE.name} · {SITE.tagline}
            </span>
          </p>
          <h1 className="display mt-2 text-[2.75rem] text-[var(--color-cream)] sm:mt-3 sm:text-6xl lg:text-7xl">
            <span className="sr-only">{SITE.name}: </span>
            The record they can&rsquo;t bury.
          </h1>
          <div className="mt-3 h-1 w-16 rounded bg-[var(--color-gold)] sm:mt-4" aria-hidden />
          <p className="mt-3 max-w-md font-display text-base leading-snug text-[var(--color-ink-soft)] sm:mt-4 sm:text-xl">
            No algorithm. No throttling. Just the record.
          </p>

          {/* The one job. Every "Join" link on the site lands here. */}
          <div id="join" className="mt-5 max-w-md scroll-mt-24 sm:mt-6">
            <SignupForm
              variant="inline"
              emailEnabled={SITE.emailCaptureEnabled}
              placement="home-hero"
              buttonLabel="Follow"
              blurb="Follow the record. One email when something new drops on it."
              fineprint="Unsubscribe in one click."
            />
          </div>
          <Link
            href="/book"
            data-track="home-hero-book"
            className="btn-support mt-2 inline-flex min-h-11 items-center gap-1.5 self-start text-sm"
          >
            Get the book <span aria-hidden>&rarr;</span>
          </Link>
        </div>
      </div>

      {/* Orientation, folded under the capture so nothing competes with it:
          Start Here and the four audience doors are one tap away for those
          who want them. Native <details>, no client JS. */}
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
        <Link
          href="/start-here"
          data-track="home-hero-start-here"
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-sm font-black text-[var(--color-gold-bright)] hover:underline"
        >
          New here? Start here <span aria-hidden>&rarr;</span>
        </Link>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
