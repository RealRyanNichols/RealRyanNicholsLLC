import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { INTAKE_SECTIONS, BLUEPRINT_PACKAGES } from "@/lib/blueprint";

export const metadata: Metadata = {
  title: "Legal-Tech Blueprint — sales & leads",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// Map every questionnaire field id to its label + type, so saved responses can
// be rendered as readable feature chips and text answers.
const FIELD_META = new Map<string, { label: string; type: string }>();
for (const section of INTAKE_SECTIONS) {
  for (const f of section.fields) FIELD_META.set(f.id, { label: f.label, type: f.type });
}
const CONTACT_IDS = new Set([
  "contact_name",
  "contact_email",
  "firm_name",
  "phone",
  "practice_area",
  "firm_size",
  "anything_else",
]);

type Order = {
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  package_name: string | null;
  package_slug: string | null;
  amount_paid: number | null;
  payment_status: string | null;
  notes: string | null;
};

type Intake = {
  created_at: string;
  status: string | null;
  package_slug: string | null;
  contact_name: string | null;
  contact_email: string | null;
  firm_name: string | null;
  phone: string | null;
  practice_area: string | null;
  firm_size: string | null;
  anything_else: string | null;
  responses: Record<string, unknown> | null;
};

function usd(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

function checkedFeatures(responses: Record<string, unknown> | null): string[] {
  if (!responses) return [];
  const out: string[] = [];
  for (const [id, val] of Object.entries(responses)) {
    const meta = FIELD_META.get(id);
    if (meta && meta.type === "toggle" && val === true) out.push(meta.label);
  }
  return out;
}

function textAnswers(
  responses: Record<string, unknown> | null,
): { label: string; value: string }[] {
  if (!responses) return [];
  const out: { label: string; value: string }[] = [];
  for (const [id, val] of Object.entries(responses)) {
    if (CONTACT_IDS.has(id)) continue;
    const meta = FIELD_META.get(id);
    if (!meta || meta.type === "toggle") continue;
    if (typeof val === "string" && val.trim()) out.push({ label: meta.label, value: val.trim() });
  }
  return out;
}

export default async function AdminBlueprintPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/blueprint");
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }
  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Supabase not configured</h1>
      </article>
    );
  }

  const service = getSupabaseServiceClient();
  const [ordersRes, intakeRes] = await Promise.all([
    service
      .from("blueprint_orders")
      .select(
        "created_at, customer_name, customer_email, package_name, package_slug, amount_paid, payment_status, notes",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    service
      .from("blueprint_intake")
      .select(
        "created_at, status, package_slug, contact_name, contact_email, firm_name, phone, practice_area, firm_size, anything_else, responses",
      )
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const orders = (ordersRes.data ?? []) as Order[];
  const intake = (intakeRes.data ?? []) as Intake[];
  const submissions = intake.filter((r) => r.status !== "lead");
  const leads = intake.filter((r) => r.status === "lead");

  const paid = orders.filter((o) => o.payment_status === "paid");
  const grossCents = paid.reduce((sum, o) => sum + (o.amount_paid ?? 0), 0);

  const byPackage = BLUEPRINT_PACKAGES.map((p) => ({
    name: p.name,
    count: paid.filter((o) => o.package_slug === p.slug).length,
  }));

  const stats = [
    { label: "Paid sales", value: paid.length.toLocaleString() },
    { label: "Gross collected", value: usd(grossCents) },
    { label: "Questionnaires", value: submissions.length.toLocaleString() },
    { label: "Leads", value: leads.length.toLocaleString() },
  ];

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-line)] pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-blue)]">
            Legal-Tech Blueprint
          </p>
          <h1 className="mt-1 font-display text-3xl font-black tracking-tight">
            Sales &amp; leads
          </h1>
        </div>
        <Link href="/admin" className="text-sm font-bold text-[var(--color-accent)] hover:underline">
          ← Admin
        </Link>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <p className="font-display text-3xl font-black tabular-nums text-[var(--color-ink)]">
              {s.value}
            </p>
            <p className="mt-1 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {s.label}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-4 flex flex-wrap gap-2">
        {byPackage.map((p) => (
          <span
            key={p.name}
            className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)]"
          >
            {p.name}: <span className="font-black text-[var(--color-ink)]">{p.count}</span>
          </span>
        ))}
      </section>

      {/* Sales */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-normal">Sales</h2>
        {orders.length === 0 ? (
          <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm font-semibold text-[var(--color-muted)]">
            No purchases yet.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Buyer</th>
                  <th className="px-3 py-2">Package</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {orders.map((o, i) => {
                  const isDeposit = (o.notes ?? "").toLowerCase().includes("deposit");
                  return (
                    <tr key={i} className="bg-[var(--color-surface)]">
                      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                        {format(new Date(o.created_at), "MMM d, h:mma")}
                      </td>
                      <td className="px-3 py-2">
                        <span className="block font-bold text-[var(--color-ink)]">
                          {o.customer_name ?? "—"}
                        </span>
                        <span className="block text-xs text-[var(--color-ink-soft)]">
                          {o.customer_email ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--color-ink-soft)]">
                        {o.package_name ?? o.package_slug ?? "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 font-bold tabular-nums text-[var(--color-ink)]">
                        {usd(o.amount_paid ?? 0)}
                        {isDeposit ? (
                          <span className="ml-1.5 rounded-full bg-[var(--color-gold-soft)] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-[var(--color-support-strong)]">
                            deposit
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={[
                            "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider",
                            o.payment_status === "paid"
                              ? "bg-[var(--color-success-soft)] text-[var(--color-success)]"
                              : o.payment_status === "refunded"
                                ? "bg-[var(--color-accent-soft)] text-[var(--color-accent)]"
                                : "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
                          ].join(" ")}
                        >
                          {o.payment_status ?? "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Questionnaire submissions */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-normal">
          DIY questionnaires{" "}
          <span className="text-base font-bold text-[var(--color-muted)]">
            ({submissions.length})
          </span>
        </h2>
        {submissions.length === 0 ? (
          <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm font-semibold text-[var(--color-muted)]">
            No questionnaire submissions yet.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {submissions.map((r, i) => {
              const features = checkedFeatures(r.responses);
              const texts = textAnswers(r.responses);
              return (
                <div
                  key={i}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--color-ink)]">
                        {r.contact_name || r.firm_name || r.contact_email || "Anonymous"}
                        {r.firm_name && r.contact_name ? (
                          <span className="font-semibold text-[var(--color-muted)]">
                            {" "}
                            · {r.firm_name}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[var(--color-ink-soft)]">
                        {r.contact_email ?? "no email"}
                        {r.phone ? ` · ${r.phone}` : ""}
                        {r.practice_area ? ` · ${r.practice_area}` : ""}
                        {r.firm_size ? ` · ${r.firm_size}` : ""}
                      </p>
                    </div>
                    <span className="whitespace-nowrap font-mono text-[11px] text-[var(--color-muted)]">
                      {format(new Date(r.created_at), "MMM d, h:mma")}
                    </span>
                  </div>

                  {features.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {features.map((f) => (
                        <span
                          key={f}
                          className="rounded-full border border-[var(--color-blue)]/30 bg-[var(--color-blue-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--color-blue-strong)]"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {texts.length > 0 ? (
                    <dl className="mt-3 grid gap-1.5 text-sm">
                      {texts.map((t) => (
                        <div key={t.label}>
                          <dt className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                            {t.label}
                          </dt>
                          <dd className="text-[var(--color-ink-soft)]">{t.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}

                  {r.anything_else ? (
                    <div className="mt-3 rounded-md border-l-4 border-[var(--color-blue)] bg-[var(--color-paper)] px-3 py-2">
                      <p className="text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                        Anything else
                      </p>
                      <p className="text-sm text-[var(--color-ink)]">{r.anything_else}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Leads */}
      <section className="mt-8">
        <h2 className="font-display text-xl font-black tracking-normal">
          Leads{" "}
          <span className="text-base font-bold text-[var(--color-muted)]">
            ({leads.length})
          </span>
        </h2>
        {leads.length === 0 ? (
          <p className="mt-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm font-semibold text-[var(--color-muted)]">
            No leads yet. The &quot;Get the breakdown first&quot; band feeds this.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-[var(--color-surface-2)] text-[11px] font-black uppercase tracking-wider text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Their question</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-line)]">
                {leads.map((r, i) => (
                  <tr key={i} className="bg-[var(--color-surface)]">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-[var(--color-muted)]">
                      {format(new Date(r.created_at), "MMM d, h:mma")}
                    </td>
                    <td className="px-3 py-2 font-bold text-[var(--color-ink)]">
                      {r.contact_email ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-[var(--color-ink-soft)]">
                      {r.anything_else ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Sales are also in Stripe. Questionnaires and leads live in Supabase
          (blueprint_intake); purchases in blueprint_orders.
        </p>
      </section>
    </article>
  );
}
