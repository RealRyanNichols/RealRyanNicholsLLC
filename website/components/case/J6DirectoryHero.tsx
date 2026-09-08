import Link from "next/link";
import type { getJ6ClaimCounts } from "@/lib/case";
import { J6_PROFILE_LIST_ID, type J6Filter } from "@/components/case/archive";

// The dark hero at the top of the J6 people directory (/case?view=people):
// the pitch for the active claim filter and four headline counts. Moved out
// of app/case/page.tsx verbatim.
export function J6DirectoryHero({
  counts,
  activeFilter,
}: {
  counts: Awaited<ReturnType<typeof getJ6ClaimCounts>>;
  activeFilter: J6Filter;
}) {
  const isUnclaimed = activeFilter === "unclaimed";
  const kicker =
    activeFilter === "verified"
      ? "Verified defendants"
      : activeFilter === "pending"
        ? "Claims under review"
        : activeFilter === "unclaimed"
          ? "J6 defendants · get in here"
          : "The January 6 People Archive";
  const title =
    activeFilter === "verified"
      ? "These J6 defendants are already building their public record."
      : activeFilter === "pending"
        ? "These claims are waiting on verification."
        : activeFilter === "unclaimed"
          ? "If you have the facts and evidence, build your case here."
          : "Search every name. Open the record. Help complete what is missing.";
  const lead =
    activeFilter === "verified"
      ? "A verified profile becomes a living case file: testimony, court documents, photos, videos, links, dates, witnesses, and updates in one place."
      : activeFilter === "pending"
        ? "Claims do not go public until Ryan verifies the person against the docket and public record. That protects the defendants and keeps the archive credible."
        : activeFilter === "unclaimed"
          ? "Every J6 defendant should have a place to organize what happened in plain English. Find your name, claim your profile, and start turning scattered facts into a record people can inspect."
          : "A searchable, evidence-first directory of public January 6 profiles. Find a person by name or case number, inspect the available record, and help fill an honest gap with a source.";

  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[#1f2f55] bg-[#071123] text-[#fdf8ea] shadow-2xl">
      <div className="grid gap-px bg-white/10 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="bg-[#071123] p-5 sm:p-7">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--color-gold-bright)]">
            {kicker}
          </p>
          <h1 className="mt-3 text-3xl font-black leading-[1.02] tracking-tight text-[#fdf8ea] sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#cfd9ea] sm:text-lg">
            {lead}
          </p>

          {isUnclaimed ? (
            <div className="mt-5 rounded-xl border border-[var(--color-gold-bright)]/30 bg-[var(--color-gold-bright)]/10 p-4">
              <p className="text-sm font-black uppercase tracking-wider text-[var(--color-gold-bright)]">
                What you can add after verification
              </p>
              <div className="mt-3 grid gap-2 text-sm text-[#fdf8ea] sm:grid-cols-2">
                {[
                  "Your timeline",
                  "Court filings",
                  "Photos and videos",
                  "Witness statements",
                  "Jail / medical records",
                  "Missing evidence requests",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[var(--color-gold-bright)]" aria-hidden />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href={`#${J6_PROFILE_LIST_ID}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-gold-bright)] px-5 py-3 text-sm font-black uppercase tracking-wider text-[#071123] transition hover:bg-[#a7efc4]"
            >
              Find your name
            </Link>
            <Link
              href="/submit?type=j6"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#7fa9e3]/60 bg-[#7fa9e3]/10 px-5 py-3 text-sm font-black uppercase tracking-wider text-[#dce8ff] transition hover:bg-[#7fa9e3] hover:text-[#071123]"
            >
              Send evidence or a lead
            </Link>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[#9fb0ca]">
            This is not a law firm and not legal advice. It is an evidence-first
            public-record and case-organization system. Private details stay
            private until they are safe and approved to publish.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4 lg:grid-cols-2">
          <J6HeroStat label="Total J6 profiles" value={counts.total} tone="blue" />
          <J6HeroStat label="Docket numbers" value={counts.withCaseNumber} tone="gold" />
          <J6HeroStat label="Verified" value={counts.verified} tone="green" />
          <J6HeroStat label="Under review" value={counts.pending} tone="blue" />
        </div>
      </div>
    </section>
  );
}

function J6HeroStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "gold" | "blue";
}) {
  const color =
    tone === "green" ? "text-[var(--color-gold-bright)]" : tone === "gold" ? "text-[var(--color-gold-light)]" : "text-[#7fa9e3]";
  return (
    <div className="bg-[#0d1a33] p-4 sm:p-5">
      <div className={`font-mono text-3xl font-black leading-none tabular-nums ${color}`}>
        {value.toLocaleString()}
      </div>
      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#cfd9ea]">
        {label}
      </div>
    </div>
  );
}
