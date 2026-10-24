import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SHADE_ARMS, SHADE_LABELS } from "@/lib/shade";
import {
  ENGAGED_DWELL_SECONDS,
  engagedRateZ,
  scoreShades,
  type EventRow,
  type ExposureRow,
  type ShadeLine,
  type ViewRow,
} from "@/lib/shade-report";

export const metadata: Metadata = {
  title: "Color test",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// PostgREST returns at most 1,000 rows per request; read in pages.
const PAGE = 1000;
// Session ids per .in() filter, small enough to keep the URL short.
const ID_CHUNK = 150;
const MAX_EXPOSURES = 20_000;

type Supabase = Awaited<ReturnType<typeof getSupabaseServerClient>>;

async function readExposures(supabase: Supabase, since: string): Promise<ExposureRow[]> {
  const rows: ExposureRow[] = [];
  for (let from = 0; from < MAX_EXPOSURES; from += PAGE) {
    const { data, error } = await supabase
      .from("page_events")
      .select("session_id, target")
      .eq("kind", "shade_exposure")
      .gte("at", since)
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error || !data?.length) break;
    rows.push(...(data as ExposureRow[]));
    if (data.length < PAGE) break;
  }
  return rows;
}

async function readBySession<T>(
  supabase: Supabase,
  table: "page_views" | "page_events",
  columns: string,
  sessionIds: string[],
): Promise<T[]> {
  const chunks: string[][] = [];
  for (let i = 0; i < sessionIds.length; i += ID_CHUNK) {
    chunks.push(sessionIds.slice(i, i + ID_CHUNK));
  }
  const out: T[] = [];
  // Five chunks at a time: quick, without a burst of 100 parallel reads.
  for (let i = 0; i < chunks.length; i += 5) {
    const results = await Promise.all(
      chunks.slice(i, i + 5).map((ids) =>
        supabase.from(table).select(columns).in("session_id", ids).limit(PAGE),
      ),
    );
    for (const { data } of results) if (data) out.push(...(data as T[]));
  }
  return out;
}

export default async function ShadeTestPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/shade-test");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const { days: daysParam } = await searchParams;
  const parsedDays = Number.parseInt(daysParam ?? "", 10);
  const days = Number.isFinite(parsedDays) ? Math.min(Math.max(parsedDays, 1), 90) : 30;
  const since = subDays(new Date(), days).toISOString();

  const exposures = await readExposures(supabase, since);
  const sessionIds = [...new Set(exposures.map((e) => e.session_id))];
  const [views, events] = await Promise.all([
    readBySession<ViewRow>(
      supabase,
      "page_views",
      "session_id, started_at, last_activity_at, scroll_max",
      sessionIds,
    ),
    readBySession<EventRow>(supabase, "page_events", "session_id, kind", sessionIds),
  ]);
  const lines = scoreShades(exposures, views, events);
  const byShade = new Map(lines.map((l) => [l.shade, l]));
  const control = byShade.get("theater");
  const z = engagedRateZ(control, byShade.get("dusk"));

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/admin/analytics" className="hover:underline">
          ← Analytics
        </Link>
      </nav>
      <p className="eyebrow">Color test</p>
      <h1 className="display mt-2 text-4xl text-[var(--color-ink)] sm:text-5xl">
        Which shade keeps people?
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)]">
        Visitors are split 50/50 between {SHADE_ARMS.map((s) => SHADE_LABELS[s]).join(" and ")}.
        Scored on engaged sessions only (at least {ENGAGED_DWELL_SECONDS} seconds on a page, or a
        click or video play), because most raw sessions here are bots. Last {days} days.
      </p>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/admin/shade-test?days=${d}`}
            className={`btn-ghost inline-flex min-h-10 items-center px-3 ${d === days ? "border-[var(--color-gold)]" : ""}`}
          >
            {d} days
          </Link>
        ))}
      </div>

      <section className="panel mt-6 p-5">
        <h2 className="text-lg font-bold text-[var(--color-ink)]">Verdict</h2>
        <p className="mt-2 text-[var(--color-ink-soft)]">{verdict(control, byShade.get("dusk"), z)}</p>
      </section>

      {lines.length === 0 ? (
        <p className="mt-6 text-[var(--color-muted)]">
          No exposures logged yet. They start the first day this ships.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-[var(--color-muted)]">
              <tr>
                <th className="py-2 pr-3">Shade</th>
                <th className="py-2 pr-3">Sessions</th>
                <th className="py-2 pr-3">Engaged</th>
                <th className="py-2 pr-3">Pages / engaged</th>
                <th className="py-2 pr-3">Median time</th>
                <th className="py-2 pr-3">Read to 75%</th>
                <th className="py-2 pr-3">Clicks / 100</th>
                <th className="py-2 pr-3">Video plays / 100</th>
                <th className="py-2">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.shade} className="border-t border-[var(--color-line-soft)]">
                  <td className="py-2.5 pr-3 font-bold text-[var(--color-ink)]">{SHADE_LABELS[l.shade]}</td>
                  <td className="py-2.5 pr-3">{l.sessions.toLocaleString()}</td>
                  <td className="py-2.5 pr-3">
                    {l.engaged.toLocaleString()} ({pct(l.engagedRate)})
                  </td>
                  <td className="py-2.5 pr-3">{l.pagesPerEngaged.toFixed(2)}</td>
                  <td className="py-2.5 pr-3">{Math.round(l.medianDwellEngaged)}s</td>
                  <td className="py-2.5 pr-3">{pct(l.scroll75Rate)}</td>
                  <td className="py-2.5 pr-3">{l.clicksPer100}</td>
                  <td className="py-2.5 pr-3">{l.videoPlaysPer100}</td>
                  <td className="py-2.5">{l.conversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="mt-8 text-sm text-[var(--color-ink-soft)]">
        <h2 className="text-base font-bold text-[var(--color-ink)]">Look at each shade yourself</h2>
        {/* components/ShadeExposure.tsx applies ?shade= after a client-side
            hop too, so these can be ordinary links. */}
        <p className="mt-2">
          Each link sets that shade for your browser until you reset it.{" "}
          <Link href="/?shade=theater" className="text-[var(--color-gold)] underline">Theater</Link> ·{" "}
          <Link href="/?shade=dusk" className="text-[var(--color-gold)] underline">Dusk</Link> ·{" "}
          <Link href="/?shade=reset" className="text-[var(--color-gold)] underline">Reset to the random draw</Link>
        </p>
      </section>
    </article>
  );
}

function pct(rate: number): string {
  return `${Math.round(rate * 1000) / 10}%`;
}

function verdict(control: ShadeLine | undefined, dusk: ShadeLine | undefined, z: number | null): string {
  if (!control || !dusk) return "Waiting for both shades to log sessions.";
  if (z === null) {
    return `Too early to call: ${control.sessions} theater and ${dusk.sessions} dusk sessions so far. It needs at least 200 in each.`;
  }
  const diff = Math.round((dusk.engagedRate - control.engagedRate) * 1000) / 10;
  if (Math.abs(z) < 1.96) {
    return `No clear winner yet. Dusk is ${diff >= 0 ? "+" : ""}${diff} points on engaged rate (z = ${z.toFixed(2)}; it needs ±1.96).`;
  }
  return diff > 0
    ? `Dusk wins: ${diff} points more engaged sessions than theater (z = ${z.toFixed(2)}). Make dusk the default.`
    : `Theater wins: dusk is ${diff} points on engaged rate (z = ${z.toFixed(2)}). Keep the dark room.`;
}
