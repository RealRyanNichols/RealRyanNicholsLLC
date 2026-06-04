const VENMO = "https://venmo.com/u/TheRealRyanNichols";
const CASHAPP = "https://cash.app/$TheRealRyanNichols";

// A standard "support" block placed at the foot of every article: instant
// donate (Venmo/Cash App) plus the paid-work pitch (/build). Light-theme to
// match the article page. This is the one ask the post template was missing.
export function PostSupportCTA() {
  return (
    <section className="not-prose mt-8 rounded-2xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-6 sm:p-7">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Stand with me
      </p>
      <h2 className="mt-1 font-display text-xl sm:text-2xl text-[var(--color-ink)]">
        Keep this work going.
      </h2>
      <p className="mt-2 text-sm sm:text-base text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
        I document all of this on a site I own — no platform in the middle, nothing that can be throttled or banned. If it&apos;s worth something to you, here&apos;s how to help me keep going:
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <a
          href={VENMO}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#3D95CE] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Donate · Venmo
        </a>
        <a
          href={CASHAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-[#00C244] px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
        >
          Donate · Cash App
        </a>
        <a
          href="/build"
          className="rounded-full border-2 border-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]"
        >
          Hire me — a site or dashboard →
        </a>
      </div>
    </section>
  );
}
