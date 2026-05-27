import Link from "next/link";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Pattern panels: mini-visualizations that surface shapes hidden in
// the case-archive data. Each panel uses ONLY the fields that are
// already populated (no scraper dependency), so the page looks alive
// from day one. When the DOJ + Court Listener scrapers light up,
// new panels (top judges, charge histogram, sentence distribution)
// drop in below this set.

export async function MapRoomPatterns() {
  const supabase = getSupabaseStaticClient();

  // Defendant status + document-type histogram come from case_pattern_stats()
  // (server-side) so they're correct past PostgREST's 1000-row fetch cap —
  // case_people (1571) and case_documents (1044) both exceed it. Grievances
  // (~34) and events (~39) stay direct fetches; they carry the per-row detail
  // (title / severity / date) the panels need and are well under the cap.
  const [
    { data: stats },
    { data: grievances },
    { data: yearCounts },
  ] = await Promise.all([
    supabase.rpc("case_pattern_stats"),
    supabase
      .from("case_grievances")
      .select("slug, title, severity")
      .eq("visibility", "public"),
    supabase
      .from("case_events")
      .select("event_date")
      .eq("visibility", "public")
      .not("event_date", "is", null),
  ]);

  const cp = (stats ?? {}) as {
    defendants_total?: number;
    defendants_verified?: number;
    defendants_pending?: number;
    defendants_unclaimed?: number;
    documents_total?: number;
    doc_types?: { type: string; n: number }[];
  };
  const defendantTotal = cp.defendants_total ?? 0;
  const statusCount = {
    verified: cp.defendants_verified ?? 0,
    pending: cp.defendants_pending ?? 0,
    unclaimed: cp.defendants_unclaimed ?? 0,
  };

  // Roll up severity 1..5
  const sev: Record<1 | 2 | 3 | 4 | 5, { n: number; top: string | null }> = {
    1: { n: 0, top: null },
    2: { n: 0, top: null },
    3: { n: 0, top: null },
    4: { n: 0, top: null },
    5: { n: 0, top: null },
  };
  for (const g of grievances ?? []) {
    const s = Math.min(5, Math.max(1, g.severity ?? 1)) as 1 | 2 | 3 | 4 | 5;
    sev[s].n += 1;
    if (!sev[s].top) sev[s].top = g.title ?? null;
  }
  const grievanceMax = Math.max(...Object.values(sev).map((s) => s.n), 1);

  // Document-type histogram — already aggregated + sorted server-side.
  const documentsTotal = cp.documents_total ?? 0;
  const docTop: [string, number][] = (cp.doc_types ?? [])
    .slice(0, 8)
    .map((d) => [d.type, d.n]);
  const docMax = Math.max(...docTop.map(([, n]) => n), 1);

  // Roll events by year
  const yearMap = new Map<number, number>();
  for (const e of yearCounts ?? []) {
    if (!e.event_date) continue;
    const y = new Date(e.event_date).getUTCFullYear();
    if (!Number.isFinite(y)) continue;
    yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
  }
  const sortedYears = Array.from(yearMap.entries()).sort(
    ([a], [b]) => a - b,
  );
  const yearsMax = Math.max(...sortedYears.map(([, n]) => n), 1);

  return (
    <section className="mt-10">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)] font-bold">
        Patterns
      </p>
      <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight font-display">
        Shapes hidden in the archive.
      </h2>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-3xl">
        Four small panels — what the data on file looks like right now,
        before any scraper enrichment. Click any band to deep-link into
        the cases behind the number.
      </p>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PANEL 1 — claim-status breakdown of every J6 defendant */}
        <Panel
          title={`${defendantTotal.toLocaleString()} J6 defendants — by claim status`}
          hint="Free, forever, no gatekeeping — every defendant gets a profile they own."
        >
          <StatusBar
            defendantTotal={defendantTotal}
            verified={statusCount.verified}
            pending={statusCount.pending}
            unclaimed={statusCount.unclaimed}
          />
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Legend
              label="Verified"
              n={statusCount.verified}
              color="var(--color-success)"
              href="/case?filter=verified&view=people"
            />
            <Legend
              label="Pending"
              n={statusCount.pending}
              color="var(--color-tag-procedural)"
              href="/case?filter=pending&view=people"
            />
            <Legend
              label="Unclaimed"
              n={statusCount.unclaimed}
              color="var(--color-accent)"
              href="/case?filter=unclaimed&view=people"
            />
          </div>
        </Panel>

        {/* PANEL 2 — grievances by severity */}
        <Panel
          title={`${(grievances ?? []).length} grievances — by severity`}
          hint="5 = severe. The case archive is anchored by the most-severe filings — Brady violations, constitutional-right violations, abuse in custody."
        >
          <div className="space-y-2 mt-2">
            {[5, 4, 3, 2, 1].map((s) => {
              const k = s as 1 | 2 | 3 | 4 | 5;
              const pct = (sev[k].n / grievanceMax) * 100;
              return (
                <div
                  key={s}
                  className="grid grid-cols-[24px_1fr_36px] items-center gap-2"
                >
                  <span className="text-xs font-bold text-[var(--color-muted)] tabular-nums">
                    {s}/5
                  </span>
                  <div className="h-3 rounded-full bg-[var(--color-paper)] overflow-hidden border border-[var(--color-line-soft)]">
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background:
                          s >= 4
                            ? "var(--color-accent)"
                            : s === 3
                              ? "var(--color-tag-procedural)"
                              : "var(--color-blue)",
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-right">
                    {sev[k].n}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/case?view=grievances"
            className="mt-4 inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            See every grievance →
          </Link>
        </Panel>

        {/* PANEL 3 — documents by type */}
        <Panel
          title={`${documentsTotal.toLocaleString()} documents — by type`}
          hint="The shape of the evidence file. Mostly motions, orders, transcripts, exhibits — the procedural trail and the corroborating media."
        >
          <div className="space-y-1.5 mt-2">
            {docTop.map(([type, n]) => {
              const pct = (n / docMax) * 100;
              return (
                <div
                  key={type}
                  className="grid grid-cols-[90px_1fr_36px] items-center gap-2"
                >
                  <span className="text-xs text-[var(--color-ink-soft)] truncate">
                    {type}
                  </span>
                  <div className="h-2.5 rounded-full bg-[var(--color-paper)] overflow-hidden border border-[var(--color-line-soft)]">
                    <div
                      className="h-full bg-[var(--color-accent)]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold tabular-nums text-right">
                    {n}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/case?view=documents"
            className="mt-4 inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            See every document →
          </Link>
        </Panel>

        {/* PANEL 4 — events on the case timeline by year */}
        <Panel
          title={`${(yearCounts ?? []).length} timeline events — by year`}
          hint="When the procedural choreography happened. The shape tells the story of the case across years."
        >
          <div className="flex items-end gap-2 h-32 mt-3 px-1">
            {sortedYears.length === 0 ? (
              <p className="text-xs text-[var(--color-muted)] italic w-full text-center">
                No dated events yet.
              </p>
            ) : (
              sortedYears.map(([year, n]) => {
                const pct = (n / yearsMax) * 100;
                return (
                  <div
                    key={year}
                    className="flex-1 flex flex-col items-center gap-1.5 min-w-0"
                  >
                    <div className="text-[10px] font-bold tabular-nums">
                      {n}
                    </div>
                    <div
                      className="w-full rounded-t bg-[var(--color-accent)] min-h-[3px]"
                      style={{ height: `${pct}%` }}
                    />
                    <div className="text-[10px] text-[var(--color-muted)] tabular-nums">
                      {year}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <Link
            href="/case?view=timeline"
            className="mt-4 inline-block text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            See the timeline →
          </Link>
        </Panel>
      </div>

      <p className="mt-4 text-xs text-[var(--color-muted)] italic">
        Top judges, charge histogram, and sentence distribution panels
        light up once the DOJ and Court Listener scrapers run.
      </p>
    </section>
  );
}

function Panel({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
      <h3 className="text-base sm:text-lg font-bold tracking-tight">{title}</h3>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted)] leading-snug">
          {hint}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StatusBar({
  defendantTotal,
  verified,
  pending,
  unclaimed,
}: {
  defendantTotal: number;
  verified: number;
  pending: number;
  unclaimed: number;
}) {
  const total = Math.max(1, defendantTotal);
  const vP = (verified / total) * 100;
  const pP = (pending / total) * 100;
  const uP = (unclaimed / total) * 100;
  return (
    <div className="h-8 rounded-lg overflow-hidden border border-[var(--color-line-soft)] flex">
      <div
        className="h-full flex items-center justify-center text-[10px] font-bold text-[var(--color-paper)] tabular-nums"
        style={{
          width: `${vP}%`,
          background: "var(--color-success)",
        }}
        title={`${verified} verified`}
      >
        {vP >= 6 ? verified.toLocaleString() : ""}
      </div>
      <div
        className="h-full flex items-center justify-center text-[10px] font-bold text-[var(--color-paper)] tabular-nums"
        style={{
          width: `${pP}%`,
          background: "var(--color-tag-procedural)",
        }}
        title={`${pending} pending`}
      >
        {pP >= 6 ? pending.toLocaleString() : ""}
      </div>
      <div
        className="h-full flex items-center justify-center text-[10px] font-bold text-[var(--color-paper)] tabular-nums"
        style={{
          width: `${uP}%`,
          background: "var(--color-accent)",
        }}
        title={`${unclaimed} unclaimed`}
      >
        {uP >= 6 ? unclaimed.toLocaleString() : ""}
      </div>
    </div>
  );
}

function Legend({
  label,
  n,
  color,
  href,
}: {
  label: string;
  n: number;
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-1.5 hover:border-[var(--color-accent)] transition"
    >
      <div className="flex items-center gap-1.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{ background: color }}
        />
        <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] group-hover:text-[var(--color-accent)]">
          {label}
        </span>
      </div>
      <div className="text-base font-bold tabular-nums mt-0.5">
        {n.toLocaleString()}
      </div>
    </Link>
  );
}
