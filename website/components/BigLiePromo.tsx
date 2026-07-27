import Link from "next/link";

/**
 * Cross-promo card for The BIG Lie, built to sit alongside <BookPromo /> so the
 * free report and the paid memoir read as a matched pair. The hook is the
 * price: name and email, nothing else.
 *
 * COVER IS A PLACEHOLDER. Ryan is supplying real cover art. To swap it, drop
 * the new file at public/uploads/biglie-cover.png at roughly 1000x1333 and
 * nothing else needs to change — every reference points at that one path.
 */
export function BigLiePromo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/thebiglie"
      className={`group block rounded-2xl border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] transition hover:border-[#e1bd5b]/60 ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/uploads/biglie-cover.png"
          alt="The BIG Lie — a report by Ryan Nichols"
          width={1000}
          height={1333}
          className="w-16 shrink-0 rounded border border-white/15 shadow-lg shadow-black/40"
        />
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#e1bd5b]">
            Free report · Written in solitary
          </p>
          <p className="mt-0.5 font-display text-xl font-black leading-none tracking-tight text-[#fdf8ea]">
            The BIG Lie
          </p>
          <p className="mt-1.5 text-xs font-semibold leading-snug text-[#cfd9ea]">
            26,102 words and 12 charts, off the government&rsquo;s own footage.{" "}
            <span className="font-black text-[#e1bd5b]">Free</span> — all it
            takes is a name and email.{" "}
            <span className="whitespace-nowrap text-[#e1bd5b] group-hover:underline">
              Get the report →
            </span>
          </p>
        </div>
      </div>
    </Link>
  );
}
