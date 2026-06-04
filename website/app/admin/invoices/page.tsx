import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { AdminInvoiceForm } from "@/components/AdminInvoiceForm";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ServiceInvoice = {
  id: string;
  created_at: string;
  client_name: string;
  client_email: string | null;
  title: string;
  description: string;
  amount_cents: number;
  amount_paid_cents: number;
  payment_mode: "full" | "plan";
  down_payment_cents: number;
  installment_cents: number | null;
  installment_interval: "week" | "month" | null;
  installment_count: number | null;
  status: "draft" | "open" | "paid" | "void" | "uncollectible" | "failed";
  due_at: string | null;
  sent_at: string | null;
  paid_at: string | null;
  stripe_hosted_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  stripe_last_error: string | null;
};

function usd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function statusClass(status: ServiceInvoice["status"]): string {
  switch (status) {
    case "paid":
      return "border-green-300 bg-green-50 text-green-800";
    case "open":
      return "border-blue-300 bg-blue-50 text-blue-800";
    case "failed":
      return "border-red-300 bg-red-50 text-red-800";
    case "void":
    case "uncollectible":
      return "border-zinc-300 bg-zinc-100 text-zinc-700";
    default:
      return "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)]";
  }
}

export default async function AdminInvoicesPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/invoices");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const { data, error } = await svc
    .from("service_invoices")
    .select(
      "id, created_at, client_name, client_email, title, description, amount_cents, amount_paid_cents, payment_mode, down_payment_cents, installment_cents, installment_interval, installment_count, status, due_at, sent_at, paid_at, stripe_hosted_invoice_url, stripe_invoice_pdf, stripe_last_error",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const invoices = !error ? ((data ?? []) as ServiceInvoice[]) : [];
  const openInvoices = invoices.filter((i) => i.status === "open" || i.status === "failed");
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const planInvoices = invoices.filter((i) => i.payment_mode === "plan");
  const receivableCents = openInvoices.reduce(
    (sum, i) => sum + Math.max(0, i.amount_cents - i.amount_paid_cents),
    0,
  );
  const paidCents = paidInvoices.reduce((sum, i) => sum + i.amount_paid_cents, 0);
  const overdue = openInvoices.filter((i) => i.due_at && new Date(i.due_at) < new Date());

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-accent)]">
            Money control
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight font-display">
            Invoices & receivables
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted)]">
            Create a private invoice record, generate a Stripe payment page, and
            track who has paid without chasing payment status by memory.
          </p>
        </div>
        <a
          href="/admin/donations"
          className="rounded-full border border-[var(--color-line)] px-4 py-2 text-sm font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          Donations
        </a>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-bold">Invoice table is not available yet.</p>
          <p className="mt-1">
            Apply the latest Supabase migration, then refresh this page:
            <span className="font-mono"> 20260604021500_invoice_payment_plans.sql</span>
          </p>
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MoneyCard label="Collect now" value={usd(receivableCents)} sub={`${openInvoices.length} open`} hot={receivableCents > 0} />
        <MoneyCard label="Overdue" value={String(overdue.length)} sub="needs action" hot={overdue.length > 0} />
        <MoneyCard label="Payment plans" value={String(planInvoices.length)} sub="structured collections" />
        <MoneyCard label="Paid" value={usd(paidCents)} sub={`${paidInvoices.length} closed`} />
      </section>

      <section className="mt-6">
        <AdminInvoiceForm />
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold tracking-tight">Recent invoices</h2>
          <p className="text-xs font-semibold text-[var(--color-muted)]">
            {invoices.length} total
          </p>
        </div>

        {invoices.length === 0 ? (
          <p className="mt-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm text-[var(--color-muted)] italic">
            No invoices yet. Create the first draft above.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {invoices.map((invoice) => {
              const balance = Math.max(0, invoice.amount_cents - invoice.amount_paid_cents);
              return (
                <div
                  key={invoice.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold tracking-tight">
                          {invoice.client_name}
                        </h3>
                        <span
                          className={[
                            "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                            invoice.payment_mode === "plan"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : "border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink-soft)]",
                          ].join(" ")}
                        >
                          {invoice.payment_mode === "plan" ? "plan" : "invoice"}
                        </span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] ${statusClass(invoice.status)}`}
                        >
                          {invoice.status}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold">{invoice.title}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-[var(--color-muted)]">
                        {invoice.description}
                      </p>
                      <p className="mt-2 text-xs text-[var(--color-muted)]">
                        {invoice.client_email ?? "No email"} · created{" "}
                        {formatDistanceToNowStrict(new Date(invoice.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                      {invoice.payment_mode === "plan" &&
                      invoice.installment_cents &&
                      invoice.installment_interval &&
                      invoice.installment_count ? (
                        <p className="mt-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs font-semibold text-[var(--color-ink-soft)]">
                          {usd(invoice.down_payment_cents)} down ·{" "}
                          {invoice.installment_count}{" "}
                          {invoice.installment_interval === "week" ? "weekly" : "monthly"}{" "}
                          payments of {usd(invoice.installment_cents)}
                        </p>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-left md:text-right">
                      <p className="text-2xl font-bold tabular-nums">
                        {usd(balance)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--color-muted)]">
                        balance
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                        {usd(invoice.amount_paid_cents)} paid of {usd(invoice.amount_cents)}
                      </p>
                      {invoice.due_at ? (
                        <p className="mt-1 text-xs text-[var(--color-ink-soft)]">
                          Due {format(new Date(invoice.due_at), "MMM d, yyyy")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {invoice.stripe_last_error ? (
                    <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                      Stripe error: {invoice.stripe_last_error}
                    </p>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {invoice.stripe_hosted_invoice_url ? (
                      <a
                        href={invoice.stripe_hosted_invoice_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[var(--color-accent)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)]"
                      >
                        Payment page
                      </a>
                    ) : null}
                    {invoice.stripe_invoice_pdf ? (
                      <a
                        href={invoice.stripe_invoice_pdf}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)]"
                      >
                        PDF
                      </a>
                    ) : null}
                    {invoice.sent_at ? (
                      <span className="rounded-full border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-muted)]">
                        Sent {formatDistanceToNowStrict(new Date(invoice.sent_at), { addSuffix: true })}
                      </span>
                    ) : null}
                    {invoice.paid_at ? (
                      <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">
                        Paid {formatDistanceToNowStrict(new Date(invoice.paid_at), { addSuffix: true })}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </article>
  );
}

function MoneyCard({
  label,
  value,
  sub,
  hot,
}: {
  label: string;
  value: string;
  sub: string;
  hot?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        hot
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
          : "border-[var(--color-line)] bg-[var(--color-surface)]",
      ].join(" ")}
    >
      <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
        {value}
      </p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{sub}</p>
    </div>
  );
}
