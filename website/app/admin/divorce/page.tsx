import { getSupabaseServerClient } from "@/lib/supabase/server";

// Private family-court dashboard. This file intentionally contains NO case
// data — every row lives in Supabase behind admin-only RLS, so the public
// repo never carries anything about this matter. The admin layout gates the
// route; RLS gates the data even if the route were ever misconfigured.
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Family Case Dashboard",
  robots: { index: false, follow: false },
};

type DocketRow = {
  id: number;
  case_number: string;
  case_role: string;
  court: string | null;
  judge: string | null;
  submitted_at: string;
  envelope: string;
  status: string;
  filing_code: string | null;
  title: string;
};

type ActionRow = {
  id: number;
  priority: number;
  title: string;
  detail: string | null;
  done: boolean;
};

export default async function FamilyCaseDashboard() {
  const supabase = await getSupabaseServerClient();
  const [{ data: docket }, { data: actions }] = await Promise.all([
    supabase
      .from("family_case_docket")
      .select("*")
      .order("submitted_at", { ascending: false })
      .order("envelope", { ascending: false }),
    supabase
      .from("family_case_actions")
      .select("*")
      .order("priority")
      .order("id"),
  ]);

  const rows = (docket ?? []) as DocketRow[];
  const todos = (actions ?? []) as ActionRow[];
  const main = rows.filter((r) => r.case_number === "25-0847");
  const others = rows.filter((r) => r.case_number !== "25-0847");
  const rejected = main.filter((r) => r.status === "Rejected");
  const rejectedOrders = rejected.filter((r) =>
    r.title.toLowerCase().includes("order"),
  );

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--color-accent)]">
        Private · never published · initials only
      </p>
      <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
        Family Case Dashboard
      </h1>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Cause 25-0847 · 71st District Court, Harrison County · pro se
      </p>

      {/* Stat band */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Filings (this case)" value={main.length} />
        <Stat
          label="Accepted"
          value={main.filter((r) => r.status === "Accepted").length}
        />
        <Stat label="Rejected" value={rejected.length} alert={rejected.length > 0} />
        <Stat label="Other matters" value={others.length} />
      </div>

      {/* The one blocking problem */}
      {rejectedOrders.length > 0 ? (
        <div className="mt-6 rounded-2xl border-l-4 border-red-600 bg-red-50 p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">
            The bottleneck
          </p>
          <p className="mt-1 font-display text-lg font-bold leading-snug">
            {rejectedOrders.length} proposed orders rejected — every one filed.
            The motions get accepted; the orders bounce. One procedural fix
            (rejection reason → clerk call → resubmit) unlocks all pending
            relief.
          </p>
        </div>
      ) : null}

      {/* Action list */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-tight">
          Next actions
        </h2>
        <div className="mt-3 space-y-2">
          {todos.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <span
                className={[
                  "mt-0.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-black uppercase",
                  t.priority === 1
                    ? "bg-red-100 text-red-700"
                    : t.priority === 2
                      ? "bg-amber-100 text-amber-800"
                      : "bg-[var(--color-blue-soft)] text-[var(--color-navy)]",
                ].join(" ")}
              >
                P{t.priority}
              </span>
              <div>
                <p className="font-bold leading-snug">{t.title}</p>
                {t.detail ? (
                  <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">
                    {t.detail}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Docket */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-black tracking-tight">
          Docket — cause 25-0847
        </h2>
        <DocketTable rows={main} />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-black tracking-tight">
          Related matters
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Criminal (2026-0226, Judge Black) and nonparty (25-0877) filings from
          the same eFile account.
        </p>
        <DocketTable rows={others} showCase />
      </section>
    </article>
  );
}

function Stat({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        alert
          ? "border-red-300 bg-red-50"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <p className={["font-display text-3xl font-black", alert ? "text-red-700" : ""].join(" ")}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </p>
    </div>
  );
}

function DocketTable({
  rows,
  showCase = false,
}: {
  rows: DocketRow[];
  showCase?: boolean;
}) {
  if (rows.length === 0)
    return (
      <p className="mt-3 text-sm text-[var(--color-muted)]">No rows loaded.</p>
    );
  return (
    <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--color-line)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--color-surface)] text-left text-[11px] uppercase tracking-wider text-[var(--color-muted)]">
            <th className="px-3 py-2">Date</th>
            {showCase ? <th className="px-3 py-2">Case</th> : null}
            <th className="px-3 py-2">Filing</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Envelope</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-t border-[var(--color-line)]">
              <td className="whitespace-nowrap px-3 py-2">{r.submitted_at}</td>
              {showCase ? (
                <td className="whitespace-nowrap px-3 py-2 font-semibold">
                  {r.case_number}
                </td>
              ) : null}
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2">
                <span
                  className={[
                    "inline-block rounded px-1.5 py-0.5 text-[10px] font-black uppercase",
                    r.status === "Accepted"
                      ? "bg-green-100 text-green-800"
                      : r.status === "Rejected"
                        ? "bg-red-100 text-red-700"
                        : "bg-[var(--color-blue-soft)] text-[var(--color-navy)]",
                  ].join(" ")}
                >
                  {r.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-[var(--color-muted)]">
                {r.envelope}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
