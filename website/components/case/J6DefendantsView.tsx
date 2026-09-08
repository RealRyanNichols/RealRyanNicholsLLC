import Link from "next/link";
import { J6ProfileImage } from "@/components/J6ProfileImage";
import { PaginationControls } from "@/components/case/PaginationControls";
import { J6_PROFILE_LIST_ID, type J6Filter } from "@/components/case/archive";
import { Highlight } from "@/components/case/Highlight";
import type { CasePerson } from "@/lib/case";

// The J6 people directory list (/case?view=people): the bucket heading,
// the claim-status pills, the card grid, and its pager. Moved out of
// app/case/page.tsx verbatim.
export function J6DefendantsView({
  people,
  j6Filter,
  q,
  totalCount,
  page = 1,
  pageSize = people.length || 1,
}: {
  people: CasePerson[];
  j6Filter: J6Filter;
  q: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
}) {
  const shownTotal = totalCount ?? people.length;
  const pageCount = Math.max(1, Math.ceil(shownTotal / pageSize));
  const first = shownTotal === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(shownTotal, first + people.length - 1);
  const heading =
    j6Filter === "all"
      ? `${shownTotal.toLocaleString()} searchable January 6 profiles`
      : j6Filter === "unclaimed"
      ? `${shownTotal.toLocaleString()} J6 defendant profiles waiting to be claimed`
      : j6Filter === "verified"
        ? `${shownTotal.toLocaleString()} J6 defendants verified`
        : `${shownTotal.toLocaleString()} J6 claims pending review`;
  const lead =
    j6Filter === "all"
      ? "The free public directory, ordered A–Z. Search a name, case number, or role, then select any person to open the full profile."
      : j6Filter === "unclaimed"
      ? "Public profiles that are free for anyone to read and ready for the named person to claim. Claims are verified before editing access is granted."
      : j6Filter === "verified"
        ? "Public profiles whose owners have completed identity verification."
        : "Public profiles with ownership claims awaiting review.";
  return (
    <div id={J6_PROFILE_LIST_ID} className="scroll-mt-24">
      <div className="mb-5 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="grid gap-px bg-[var(--color-line)] md:grid-cols-[1fr_0.8fr]">
          <div className="bg-[var(--color-surface)] p-5">
            <p className="text-xs uppercase tracking-wider text-[var(--color-navy)] font-bold">
              Anti-Weaponization Case Builder
            </p>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight">
              {heading}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed max-w-2xl">
              {lead}
            </p>
          </div>
          <div className="bg-[var(--color-paper)] p-5">
            <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] font-black">
              The build path
            </p>
            <ol className="mt-3 grid gap-2 text-sm text-[var(--color-ink-soft)]">
              <li><strong className="text-[var(--color-ink)]">1.</strong> Find your name.</li>
              <li><strong className="text-[var(--color-ink)]">2.</strong> Claim the profile with proof it is you.</li>
              <li><strong className="text-[var(--color-ink)]">3.</strong> Build your page with facts, documents, media, and testimony.</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Sub-filter pills */}
      <nav className="mb-5 flex flex-wrap gap-2">
        {(["unclaimed", "verified", "pending", "all"] as const).map((f) => {
          const active = f === j6Filter;
          const href = `/case?view=people${f !== "all" ? `&filter=${f}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
          const label =
            f === "all"
              ? "All J6 profiles"
              : f === "unclaimed"
                ? "Ready to claim"
                : f === "verified"
                  ? "Verified"
                  : "Pending review";
          return (
            <Link
              key={f}
              href={href}
              className={[
                "inline-flex min-h-11 items-center rounded-full px-3 py-1.5 text-xs font-bold border-2 transition sm:min-h-0",
                active
                  ? "border-[var(--color-navy)] bg-[var(--color-navy)] text-[var(--color-paper)]"
                  : "border-[var(--color-line)] hover:border-[var(--color-navy)]",
              ].join(" ")}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">
          Showing {first.toLocaleString()}-{last.toLocaleString()} of{" "}
          {shownTotal.toLocaleString()}
        </p>
        <PaginationControls
          page={page}
          pageCount={pageCount}
          view="people"
          j6Filter={j6Filter}
          q={q}
          label="J6 profile pages"
        />
      </div>

      <div className="mb-4 rounded-xl border border-[var(--color-success)]/40 bg-[var(--color-success-soft)] px-4 py-3 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        <strong className="text-[var(--color-ink)]">
          Every J6 profile is public and free to view.
        </strong>{" "}
        An account is only required to claim a profile, manage a claimed
        profile, or suggest a correction.
      </div>

      {people.length === 0 ? (
        <p className="text-sm text-[var(--color-muted)] italic py-10 text-center">
          No profiles in this bucket yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((p) => {
            const badge =
              p.claim_status === "verified"
                ? { label: "Verified", bg: "var(--color-success)" }
                : p.claim_status === "pending"
                  ? { label: "Claim pending", bg: "var(--color-blue)" }
                  : { label: "Ready to claim", bg: "var(--color-support)" };
            return (
              <Link
                key={p.id}
                href={`/case/people/${p.slug}`}
                aria-label={`View ${p.name}'s free public January 6 profile`}
                className="group flex min-h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] transition hover:-translate-y-0.5 hover:border-[var(--color-blue)] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)]"
              >
                <J6ProfileImage person={p} variant="card" />
                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-black leading-tight tracking-tight text-[var(--color-ink)] group-hover:text-[var(--color-blue)]">
                      <Highlight text={p.name} q={q} />
                    </h3>
                    <span
                      className="whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-paper)]"
                      style={{ background: badge.bg }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  {p.role ? (
                    <p className="mt-1 text-sm leading-snug text-[var(--color-muted)]">
                      <Highlight text={p.role} q={q} />
                    </p>
                  ) : null}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-[var(--color-muted)]">
                    <span className="rounded-md border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-2 py-1">
                      {p.case_number ? <Highlight text={p.case_number} q={q} /> : "Case # needed"}
                    </span>
                    <span className="rounded-md border border-[var(--color-line-soft)] bg-[var(--color-paper)] px-2 py-1 text-right">
                      {p.views_count.toLocaleString()} views
                    </span>
                  </div>
                  <span className="mt-auto pt-4 text-sm font-black text-[var(--color-blue)]">
                    View free public profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {pageCount > 1 ? (
        <div className="mt-6">
          <PaginationControls
            page={page}
            pageCount={pageCount}
            view="people"
            j6Filter={j6Filter}
            q={q}
            label="J6 profile pages"
          />
        </div>
      ) : null}
    </div>
  );
}
