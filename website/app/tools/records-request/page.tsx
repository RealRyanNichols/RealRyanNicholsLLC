import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "@/lib/page-metadata";
import { RecordsRequestTool } from "@/components/RecordsRequestTool";

export const metadata: Metadata = pageMetadata({
  title: "Records & Bodycam Request Generator — demand the tape",
  description:
    "Free tool: build a correctly-formatted public-records request in seconds. Bodycam, dispatch, 911 audio, incident reports, jail medical and grievances — Texas Public Information Act or federal FOIA. Fill it in, copy it, send it.",
  path: "/tools/records-request",
});

export default function RecordsRequestPage() {
  return (
    <article className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-4 text-sm text-[var(--color-muted)]">
        <Link href="/tools" className="hover:underline">
          ← Tools
        </Link>{" "}
        ·{" "}
        <Link href="/case" className="hover:underline">
          The J6 Case
        </Link>
      </nav>

      <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--color-accent)]">
        Free tool · Demand the record
      </p>
      <h1 className="mt-2 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl">
        Release the bodycam.
        <br />
        Here&apos;s the letter that makes them.
      </h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-ink-soft)]">
        You should not have to be a lawyer to get the tape. Pick what you need,
        fill in a few blanks, and this builds a public-records request straight
        from the statute — Texas Public Information Act for local agencies,
        federal FOIA for the BOP, the Marshals, or the DOJ. Copy it, send it,
        keep your copy. The record doesn&apos;t lie — so make them hand it over.
      </p>

      <div className="mt-8">
        <RecordsRequestTool />
      </div>

      {/* Why + share */}
      <section className="mt-12 rounded-2xl border-2 border-[var(--color-navy)]/30 bg-[var(--color-blue-soft)]/40 p-6 sm:p-8">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-navy)]">
          Why this exists
        </p>
        <p className="mt-2 max-w-2xl font-display text-xl font-bold leading-snug text-[var(--color-ink)] sm:text-2xl">
          Rumor disarms you. The record defends you. This puts the record in
          reach of anyone with the nerve to ask for it.
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
          Send it. Note the date. If they blow the deadline or stonewall, that
          silence is its own evidence — bring it back and we&apos;ll help you
          escalate and put it on the record.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/tell-your-story"
            className="btn-accent rounded-full px-5 py-2.5 text-sm font-bold"
          >
            Tell your story
          </Link>
          <Link
            href="/case"
            className="rounded-full border-2 border-[var(--color-navy)]/40 px-5 py-2.5 text-sm font-bold text-[var(--color-navy)] transition hover:border-[var(--color-navy)]"
          >
            See how I built my own record →
          </Link>
        </div>
      </section>

      <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
        This is a free civic tool, not legal advice, and using it does not
        create an attorney-client relationship. Deadlines and exemptions vary by
        agency and situation; verify specifics for your matter.
      </p>
    </article>
  );
}
