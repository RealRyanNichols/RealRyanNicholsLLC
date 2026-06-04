import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import {
  getIntegrationHealth,
  countCriticalIssues,
  type CheckStatus,
  type IntegrationCheck,
  type IntegrationGroup,
} from "@/lib/integration-health";

export const metadata: Metadata = {
  title: "System health",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type AdminSupabase = Awaited<ReturnType<typeof getSupabaseServerClient>>;
type Severity = "critical" | "warning" | "watch" | "good";

type CountMetric = {
  value: number | null;
  error: string | null;
};

type LatestMetric = {
  iso: string | null;
  error: string | null;
};

type InvoiceRow = {
  id: string;
  client_name: string | null;
  amount_cents: number | null;
  amount_paid_cents: number | null;
  status: string | null;
  due_at: string | null;
  created_at: string | null;
  stripe_last_error: string | null;
};

type OperationalHealth = {
  generatedAt: string;
  queryErrors: string[];
  activeNow: CountMetric;
  arrivals1h: CountMetric;
  arrivals24h: CountMetric;
  arrivals7d: CountMetric;
  pageEvents7d: CountMetric;
  checkoutOpens7d: CountMetric;
  supportSaved7d: CountMetric;
  tipSuccess7d: CountMetric;
  knownFailures7d: CountMetric;
  newMessages: CountMetric;
  pendingTips: CountMetric;
  pendingClaims: CountMetric;
  pendingUploads: CountMetric;
  pendingProfiles: CountMetric;
  supportStarted7d: CountMetric;
  supportPaid7d: CountMetric;
  openInvoices: CountMetric;
  failedInvoices: CountMetric;
  overdueInvoices: number;
  receivableCents: number;
  invoiceRows: InvoiceRow[];
  paidOrdersNeedingFulfillment: CountMetric;
  pendingOrders: CountMetric;
  stripeErrors7d: CountMetric;
  stripeEvents7d: CountMetric;
  latestArrival: LatestMetric;
  latestStripeEvent: LatestMetric;
};

type Diagnostic = {
  id: string;
  severity: Severity;
  label: string;
  finding: string;
  fix: string;
  href?: string;
  metric?: string;
};

export default async function AdminHealthPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/health");
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

  const groups = getIntegrationHealth();
  const criticalIssues = countCriticalIssues(groups);
  const ops = await getOperationalHealth(supabase);
  const diagnostics = buildDiagnostics(groups, ops);
  const urgentCount = diagnostics.filter((d) => d.severity === "critical").length;
  const warningCount = diagnostics.filter((d) => d.severity === "warning").length;
  const watchCount = diagnostics.filter((d) => d.severity === "watch").length;

  return (
    <article className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
      <section className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-accent)]">
            Admin · health command
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
            Find the weak point before people feel it.
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-soft)] sm:text-base">
            This page reads the site like an operator: connections, inboxes,
            payments, traffic telemetry, support intent, and fulfillment. Red
            means something can block money, messages, or trust. Yellow means
            the system is still working, but it needs attention before it stacks
            up.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ScoreCard
              label="Urgent"
              value={urgentCount}
              severity={urgentCount > 0 ? "critical" : "good"}
              sub="blocking risk"
            />
            <ScoreCard
              label="Warnings"
              value={warningCount}
              severity={warningCount > 0 ? "warning" : "good"}
              sub="needs action"
            />
            <ScoreCard
              label="Watch"
              value={watchCount}
              severity={watchCount > 0 ? "watch" : "good"}
              sub="trend risk"
            />
            <ScoreCard
              label="Updated"
              value={formatTime(ops.generatedAt)}
              severity="good"
              sub="live read"
            />
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Fix next
          </p>
          <div className="mt-4 space-y-3">
            {diagnostics.slice(0, 4).map((diagnostic) => (
              <HealthAction key={diagnostic.id} diagnostic={diagnostic} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <LiveMetric
          label="Inbox risk"
          value={metricText(ops.newMessages)}
          sub="new private messages"
          severity={metricSeverity(ops.newMessages, 1, 6)}
          href="/admin/messages?filter=new"
        />
        <LiveMetric
          label="Case intake"
          value={String(sumMetrics(ops.pendingTips, ops.pendingClaims, ops.pendingUploads))}
          sub="tips, claims, uploads waiting"
          severity={
            sumMetrics(ops.pendingTips, ops.pendingClaims, ops.pendingUploads) > 4
              ? "warning"
              : sumMetrics(ops.pendingTips, ops.pendingClaims, ops.pendingUploads) > 0
                ? "watch"
                : "good"
          }
          href="/admin/tips?filter=pending"
        />
        <LiveMetric
          label="Money exposed"
          value={usd(ops.receivableCents)}
          sub={`${countOrZero(ops.openInvoices) + countOrZero(ops.failedInvoices)} active invoices`}
          severity={
            ops.overdueInvoices > 0 || countOrZero(ops.failedInvoices) > 0
              ? "critical"
              : ops.receivableCents > 0
                ? "warning"
                : "good"
          }
          href="/admin/invoices"
        />
        <LiveMetric
          label="Traffic signal"
          value={metricText(ops.arrivals24h)}
          sub="public arrivals in 24h"
          severity={
            ops.arrivals24h.value === null
              ? "warning"
              : ops.arrivals24h.value === 0
                ? "watch"
                : "good"
          }
          href="/admin/analytics"
        />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Problems found
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">
                Red, yellow, then watch.
              </h2>
            </div>
            <StatusPill
              status={criticalIssues > 0 || urgentCount > 0 ? "off" : "ok"}
              text={criticalIssues > 0 || urgentCount > 0 ? "Action" : "Stable"}
            />
          </div>
          <div className="mt-5 space-y-3">
            {diagnostics.length > 0 ? (
              diagnostics.map((diagnostic) => (
                <HealthAction key={diagnostic.id} diagnostic={diagnostic} />
              ))
            ) : (
              <div className="rounded-2xl border border-green-600/30 bg-green-600/10 p-4 text-sm">
                <strong>Nothing urgent found.</strong> The core paths are on and
                the live queues are under control.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
            Live data reads
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">
            What the site is telling you.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <SignalCard
              label="Live readers"
              value={metricText(ops.activeNow)}
              detail="last 5 minutes"
              status={metricStatus(ops.activeNow)}
            />
            <SignalCard
              label="Arrivals"
              value={metricText(ops.arrivals7d)}
              detail={`7 days · latest ${timeAgo(ops.latestArrival.iso)}`}
              status={metricStatus(ops.arrivals7d)}
            />
            <SignalCard
              label="Attention events"
              value={metricText(ops.pageEvents7d)}
              detail={`${metricText(ops.checkoutOpens7d)} checkout/donate opens`}
              status={metricStatus(ops.pageEvents7d)}
            />
            <SignalCard
              label="Form wins"
              value={String(sumMetrics(ops.supportSaved7d, ops.tipSuccess7d))}
              detail="support intents + successful tips"
              status={
                sumMetrics(ops.supportSaved7d, ops.tipSuccess7d) > 0 ? "ok" : "partial"
              }
            />
            <SignalCard
              label="Known failures"
              value={metricText(ops.knownFailures7d)}
              detail="tracked form/checkout failures"
              status={countOrZero(ops.knownFailures7d) > 0 ? "off" : "ok"}
            />
            <SignalCard
              label="Stripe webhook"
              value={metricText(ops.stripeEvents7d)}
              detail={`7 days · latest ${timeAgo(ops.latestStripeEvent.iso)}`}
              status={stripeStatus(groups, ops)}
            />
            <SignalCard
              label="Orders to fulfill"
              value={metricText(ops.paidOrdersNeedingFulfillment)}
              detail={`${metricText(ops.pendingOrders)} pending checkout orders`}
              status={
                countOrZero(ops.paidOrdersNeedingFulfillment) > 0 ? "partial" : "ok"
              }
            />
            <SignalCard
              label="Support intent"
              value={metricText(ops.supportStarted7d)}
              detail={`${metricText(ops.supportPaid7d)} marked paid in 7 days`}
              status={metricStatus(ops.supportStarted7d)}
            />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
              Core connections
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">
              Keys, webhooks, and service switches.
            </h2>
          </div>
          <div className="text-xs text-[var(--color-muted)]">
            Values are never shown here. Only presence and operational effect.
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {groups.map((group) => (
            <ConnectionGroup key={group.group} group={group} />
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 sm:p-6">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--color-muted)]">
          Receivables watch
        </p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">
          Money that can go stale.
        </h2>
        {ops.invoiceRows.length > 0 ? (
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {ops.invoiceRows.slice(0, 6).map((invoice) => (
              <InvoiceWatch key={invoice.id} invoice={invoice} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-sm text-[var(--color-muted)]">
            No open, failed, or draft invoices are visible right now.
          </p>
        )}
      </section>

      {ops.queryErrors.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <p className="font-bold">Some health readers could not run.</p>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            This usually means a table, policy, or service role is missing. It
            is a health signal, not just a page error.
          </p>
          <ul className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
            {ops.queryErrors.slice(0, 8).map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="mt-8 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          Back to admin dashboard
        </Link>
      </p>
    </article>
  );
}

async function getOperationalHealth(
  supabase: AdminSupabase,
): Promise<OperationalHealth> {
  const now = new Date();
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(
    now.getTime() - 7 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const eventCount = (kinds: string[], label: string) =>
    safeCount(
      label,
      supabase
        .from("page_events")
        .select("id", { count: "exact", head: true })
        .gte("at", sevenDaysAgo)
        .in("kind", kinds),
    );

  const [
    activeNow,
    arrivals1h,
    arrivals24h,
    arrivals7d,
    pageEvents7d,
    checkoutOpens7d,
    supportSaved7d,
    tipSuccess7d,
    knownFailures7d,
    newMessages,
    pendingTips,
    pendingClaims,
    pendingUploads,
    pendingProfiles,
    supportStarted7d,
    supportPaid7d,
    openInvoices,
    failedInvoices,
    invoiceRowsMetric,
    latestArrival,
  ] = await Promise.all([
    safeCount(
      "Active page views",
      supabase
        .from("page_views")
        .select("id", { count: "exact", head: true })
        .gte("last_activity_at", fiveMinAgo),
    ),
    safeCount(
      "Page arrivals last hour",
      supabase
        .from("page_arrivals")
        .select("id", { count: "exact", head: true })
        .gte("at", oneHourAgo),
    ),
    safeCount(
      "Page arrivals last 24h",
      supabase
        .from("page_arrivals")
        .select("id", { count: "exact", head: true })
        .gte("at", oneDayAgo),
    ),
    safeCount(
      "Page arrivals last 7d",
      supabase
        .from("page_arrivals")
        .select("id", { count: "exact", head: true })
        .gte("at", sevenDaysAgo),
    ),
    safeCount(
      "Page events last 7d",
      supabase
        .from("page_events")
        .select("id", { count: "exact", head: true })
        .gte("at", sevenDaysAgo),
    ),
    eventCount(["support_checkout_open", "donate_click"], "Checkout opens"),
    eventCount(["support_intent_saved"], "Support intents saved"),
    eventCount(["tip_submit_success"], "Successful tips"),
    eventCount(
      ["support_intent_failed", "tip_submit_failed", "subscribe_failed"],
      "Tracked failures",
    ),
    safeCount(
      "New private messages",
      supabase
        .from("private_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
    ),
    safeCount(
      "Pending tips",
      supabase
        .from("case_tips")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    safeCount(
      "Pending claims",
      supabase
        .from("case_person_claims")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    safeCount(
      "Pending uploads",
      supabase
        .from("case_documents")
        .select("id", { count: "exact", head: true })
        .eq("submission_status", "pending")
        .not("submitted_by_user_id", "is", null),
    ),
    safeCount(
      "Pending profiles",
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    safeCount(
      "Support intents started",
      supabase
        .from("support_intents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),
    ),
    safeCount(
      "Support intents paid",
      supabase
        .from("support_intents")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid")
        .gte("created_at", sevenDaysAgo),
    ),
    safeCount(
      "Open invoices",
      supabase
        .from("service_invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "open"),
    ),
    safeCount(
      "Failed invoices",
      supabase
        .from("service_invoices")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed"),
    ),
    safeRows<InvoiceRow>(
      "Invoice rows",
      supabase
        .from("service_invoices")
        .select(
          "id, client_name, amount_cents, amount_paid_cents, status, due_at, created_at, stripe_last_error",
        )
        .in("status", ["draft", "open", "failed"])
        .order("created_at", { ascending: false })
        .limit(50),
    ),
    safeLatest(
      "Latest arrival",
      supabase
        .from("page_arrivals")
        .select("at")
        .order("at", { ascending: false })
        .limit(1),
      "at",
    ),
  ]);

  const invoiceRows = invoiceRowsMetric.rows;
  const overdueInvoices = invoiceRows.filter((invoice) => {
    if (!invoice.due_at || invoice.status === "draft") return false;
    return new Date(invoice.due_at).getTime() < now.getTime();
  }).length;
  const receivableCents = invoiceRows
    .filter((invoice) => invoice.status === "open" || invoice.status === "failed")
    .reduce((sum, invoice) => {
      const amount = invoice.amount_cents ?? 0;
      const paid = invoice.amount_paid_cents ?? 0;
      return sum + Math.max(0, amount - paid);
    }, 0);

  const serviceConfigured = isSupabaseServiceConfigured();
  const [
    paidOrdersNeedingFulfillment,
    pendingOrders,
    stripeErrors7d,
    stripeEvents7d,
    latestStripeEvent,
  ] = serviceConfigured
    ? await getServiceRoleHealth(sevenDaysAgo)
    : [
        missingServiceMetric("Paid orders needing fulfillment"),
        missingServiceMetric("Pending orders"),
        missingServiceMetric("Stripe errors"),
        missingServiceMetric("Stripe events"),
        {
          iso: null,
          error: "Latest Stripe event needs SUPABASE_SERVICE_ROLE_KEY.",
        },
      ];

  const queryErrors = [
    activeNow,
    arrivals1h,
    arrivals24h,
    arrivals7d,
    pageEvents7d,
    checkoutOpens7d,
    supportSaved7d,
    tipSuccess7d,
    knownFailures7d,
    newMessages,
    pendingTips,
    pendingClaims,
    pendingUploads,
    pendingProfiles,
    supportStarted7d,
    supportPaid7d,
    openInvoices,
    failedInvoices,
    paidOrdersNeedingFulfillment,
    pendingOrders,
    stripeErrors7d,
    stripeEvents7d,
  ]
    .map((metric) => metric.error)
    .concat(invoiceRowsMetric.error, latestArrival.error, latestStripeEvent.error)
    .filter((error): error is string => Boolean(error));

  return {
    generatedAt: now.toISOString(),
    queryErrors,
    activeNow,
    arrivals1h,
    arrivals24h,
    arrivals7d,
    pageEvents7d,
    checkoutOpens7d,
    supportSaved7d,
    tipSuccess7d,
    knownFailures7d,
    newMessages,
    pendingTips,
    pendingClaims,
    pendingUploads,
    pendingProfiles,
    supportStarted7d,
    supportPaid7d,
    openInvoices,
    failedInvoices,
    overdueInvoices,
    receivableCents,
    invoiceRows,
    paidOrdersNeedingFulfillment,
    pendingOrders,
    stripeErrors7d,
    stripeEvents7d,
    latestArrival,
    latestStripeEvent,
  };
}

async function getServiceRoleHealth(
  sevenDaysAgo: string,
): Promise<[CountMetric, CountMetric, CountMetric, CountMetric, LatestMetric]> {
  const svc = getSupabaseServiceClient();
  return Promise.all([
    safeCount(
      "Paid orders needing fulfillment",
      svc
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "paid"),
    ),
    safeCount(
      "Pending orders",
      svc
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ),
    safeCount(
      "Stripe webhook errors",
      svc
        .from("stripe_events")
        .select("event_id", { count: "exact", head: true })
        .gte("received_at", sevenDaysAgo)
        .not("error", "is", null),
    ),
    safeCount(
      "Stripe webhook events",
      svc
        .from("stripe_events")
        .select("event_id", { count: "exact", head: true })
        .gte("received_at", sevenDaysAgo),
    ),
    safeLatest(
      "Latest Stripe event",
      svc
        .from("stripe_events")
        .select("received_at")
        .order("received_at", { ascending: false })
        .limit(1),
      "received_at",
    ),
  ]);
}

async function safeCount(
  label: string,
  query: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<CountMetric> {
  const result = await query;
  if (result.error) {
    return { value: null, error: `${label}: ${result.error.message}` };
  }
  return { value: result.count ?? 0, error: null };
}

async function safeRows<T>(
  label: string,
  query: PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
): Promise<{ rows: T[]; error: string | null }> {
  const result = await query;
  if (result.error) {
    return { rows: [], error: `${label}: ${result.error.message}` };
  }
  return { rows: result.data ?? [], error: null };
}

async function safeLatest(
  label: string,
  query: PromiseLike<{
    data: Record<string, string | null>[] | null;
    error: { message: string } | null;
  }>,
  column: string,
): Promise<LatestMetric> {
  const result = await query;
  if (result.error) {
    return { iso: null, error: `${label}: ${result.error.message}` };
  }
  return { iso: result.data?.[0]?.[column] ?? null, error: null };
}

function missingServiceMetric(label: string): CountMetric {
  return {
    value: null,
    error: `${label}: needs SUPABASE_SERVICE_ROLE_KEY for admin-only service reads.`,
  };
}

function buildDiagnostics(
  groups: IntegrationGroup[],
  ops: OperationalHealth,
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const flatChecks = groups.flatMap((group) => group.checks);
  const checkById = new Map(flatChecks.map((check) => [check.id, check]));
  const criticalOff = flatChecks.filter(
    (check) => check.critical && check.status !== "ok",
  );

  for (const check of criticalOff) {
    diagnostics.push({
      id: `config-${check.id}`,
      severity: "critical",
      label: `${check.label} is ${check.status === "off" ? "off" : "partial"}`,
      finding: check.summary,
      fix:
        check.missing.length > 0
          ? `Set ${check.missing.join(", ")} in Vercel, redeploy, then reload health.`
          : check.where,
      metric: check.critical ? "core path" : "optional",
    });
  }

  if (countOrZero(ops.newMessages) > 0 && checkById.get("resend")?.status !== "ok") {
    diagnostics.push({
      id: "messages-email-alerts",
      severity: "critical",
      label: "People are messaging while email alerts are not fully on",
      finding: `${metricText(ops.newMessages)} new private messages need attention.`,
      fix: "Open the inbox now, then finish Resend so new private messages alert the team instead of hiding in admin.",
      href: "/admin/messages?filter=new",
      metric: `${metricText(ops.newMessages)} new`,
    });
  }

  if (ops.overdueInvoices > 0 || countOrZero(ops.failedInvoices) > 0) {
    diagnostics.push({
      id: "invoice-collection-risk",
      severity: "critical",
      label: "Invoice money can go stale",
      finding: `${ops.overdueInvoices} overdue and ${metricText(ops.failedInvoices)} failed invoices are visible.`,
      fix: "Open invoices, resend hosted Stripe links, and mark a next follow-up date before work continues.",
      href: "/admin/invoices",
      metric: usd(ops.receivableCents),
    });
  } else if (ops.receivableCents > 0) {
    diagnostics.push({
      id: "open-receivables",
      severity: "warning",
      label: "Receivables are open",
      finding: `${usd(ops.receivableCents)} is still collectible through active invoices.`,
      fix: "Send one clear follow-up with the Stripe-hosted invoice link and note what gets delivered after payment.",
      href: "/admin/invoices",
      metric: usd(ops.receivableCents),
    });
  }

  const intakeQueue = sumMetrics(
    ops.pendingTips,
    ops.pendingClaims,
    ops.pendingUploads,
    ops.pendingProfiles,
  );
  if (intakeQueue > 0) {
    diagnostics.push({
      id: "intake-queue",
      severity: intakeQueue > 7 ? "warning" : "watch",
      label: "Case intake is waiting on review",
      finding: `${intakeQueue} tips, claims, uploads, or profile approvals are waiting.`,
      fix: "Clear the oldest items first, connect related facts into a case record, and archive anything not usable.",
      href: "/admin/tips?filter=pending",
      metric: String(intakeQueue),
    });
  }

  if (countOrZero(ops.knownFailures7d) > 0) {
    diagnostics.push({
      id: "tracked-form-failures",
      severity: "warning",
      label: "Users hit tracked failures",
      finding: `${metricText(ops.knownFailures7d)} form, tip, subscribe, or support failures were logged in 7 days.`,
      fix: "Open analytics, find the path that failed, then test that form on mobile before adding more traffic.",
      href: "/admin/analytics",
      metric: `${metricText(ops.knownFailures7d)} failures`,
    });
  }

  if (ops.arrivals24h.value === 0) {
    diagnostics.push({
      id: "traffic-quiet",
      severity: "watch",
      label: "Traffic telemetry is quiet",
      finding: "No page arrivals were recorded in the last 24 hours.",
      fix: "Confirm middleware is still recording page_arrivals, then check Vercel deployment logs and analytics.",
      href: "/admin/analytics",
      metric: "0 arrivals",
    });
  } else if (ops.arrivals24h.value === null) {
    diagnostics.push({
      id: "traffic-reader-broken",
      severity: "warning",
      label: "Traffic health reader could not query arrivals",
      finding: ops.arrivals24h.error ?? "The page_arrivals read did not return.",
      fix: "Check the page_arrivals table, admin read policy, and Supabase connection before trusting traffic numbers.",
      href: "/admin/analytics",
    });
  }

  if (
    checkById.get("stripe-webhook")?.status !== "ok" &&
    (countOrZero(ops.openInvoices) > 0 || countOrZero(ops.pendingOrders) > 0)
  ) {
    diagnostics.push({
      id: "stripe-webhook-risk",
      severity: "warning",
      label: "Payment updates may not return cleanly",
      finding: "Stripe payment activity exists, but the webhook is not fully configured.",
      fix: "Set STRIPE_WEBHOOK_SECRET in Vercel and confirm webhook events land in stripe_events after a test payment.",
      href: "/admin/invoices",
      metric: `${metricText(ops.stripeEvents7d)} events`,
    });
  }

  if (countOrZero(ops.paidOrdersNeedingFulfillment) > 0) {
    diagnostics.push({
      id: "paid-orders",
      severity: "warning",
      label: "Paid orders need fulfillment",
      finding: `${metricText(ops.paidOrdersNeedingFulfillment)} paid orders are not marked fulfilled.`,
      fix: "Open orders, fulfill what is paid, then mark each order complete so the public trust loop stays clean.",
      href: "/admin/orders",
      metric: metricText(ops.paidOrdersNeedingFulfillment),
    });
  }

  if (countOrZero(ops.stripeErrors7d) > 0) {
    diagnostics.push({
      id: "stripe-errors",
      severity: "critical",
      label: "Stripe webhook errors were recorded",
      finding: `${metricText(ops.stripeErrors7d)} Stripe events had errors in the last 7 days.`,
      fix: "Inspect stripe_events errors, then retest donation, invoice, and store checkout after the fix.",
      href: "/admin/health",
      metric: `${metricText(ops.stripeErrors7d)} errors`,
    });
  }

  if (
    countOrZero(ops.supportStarted7d) > 0 &&
    countOrZero(ops.checkoutOpens7d) === 0
  ) {
    diagnostics.push({
      id: "support-dropoff",
      severity: "watch",
      label: "Support intent is not reaching checkout",
      finding: `${metricText(ops.supportStarted7d)} support intents were saved, but checkout opens read as zero.`,
      fix: "Test the donation path on mobile and make sure every support form lands at a clear payment option.",
      href: "/admin/donations",
      metric: metricText(ops.supportStarted7d),
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      id: "all-clear",
      severity: "good",
      label: "Core paths are clear",
      finding: "No urgent config, traffic, inbox, or payment risk was detected.",
      fix: "Keep watching the queues and retest donation/contact paths after every deploy.",
      href: "/admin",
      metric: "stable",
    });
  }

  return diagnostics.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function ConnectionGroup({ group }: { group: IntegrationGroup }) {
  return (
    <section className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight">{group.group}</h3>
          <p className="mt-1 text-xs leading-relaxed text-[var(--color-muted)]">
            {group.blurb}
          </p>
        </div>
        <StatusPill
          status={groupStatus(group)}
          text={groupStatus(group) === "ok" ? "On" : "Check"}
        />
      </div>
      <ul className="mt-4 space-y-3">
        {group.checks.map((check) => (
          <li
            key={check.id}
            className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <CheckRow check={check} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function CheckRow({ check }: { check: IntegrationCheck }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Dot status={check.status} />
            <span className="font-bold tracking-tight">{check.label}</span>
            {check.critical ? (
              <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                core
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
                optional
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-[var(--color-ink-soft)]">
            {check.summary}
          </p>
        </div>
        <StatusLabel status={check.status} />
      </div>

      <p className="mt-2 text-xs text-[var(--color-muted)]">
        <span className="font-semibold text-[var(--color-ink-soft)]">Unlocks:</span>{" "}
        {check.unlocks}
      </p>

      {check.status !== "ok" ? (
        <div className="mt-3 border-t border-[var(--color-line)] pt-3">
          {check.missing.length > 0 ? (
            <p className="text-xs">
              <span className="font-semibold text-[var(--color-ink-soft)]">
                Still needs:
              </span>{" "}
              {check.missing.map((missing, index) => (
                <span key={missing}>
                  {index > 0 ? ", " : ""}
                  <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-ink)]">
                    {missing}
                  </code>
                </span>
              ))}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--color-muted)]">
            {check.where}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function HealthAction({
  diagnostic,
  compact,
}: {
  diagnostic: Diagnostic;
  compact?: boolean;
}) {
  const content = (
    <div
      className={[
        "rounded-2xl border p-4 transition",
        severitySurface(diagnostic.severity),
        diagnostic.href ? "hover:-translate-y-0.5 hover:shadow-sm" : "",
        compact ? "p-3" : "",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.18em]",
                severityPill(diagnostic.severity),
              ].join(" ")}
            >
              {diagnostic.severity}
            </span>
            {diagnostic.metric ? (
              <span className="text-xs font-bold text-[var(--color-muted)]">
                {diagnostic.metric}
              </span>
            ) : null}
          </div>
          <h3 className="mt-2 text-lg font-black tracking-tight">
            {diagnostic.label}
          </h3>
          {!compact ? (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {diagnostic.finding}
            </p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
            <span className="font-bold text-[var(--color-ink-soft)]">Fix:</span>{" "}
            {diagnostic.fix}
          </p>
        </div>
        {diagnostic.href ? (
          <span className="shrink-0 text-sm font-black text-[var(--color-accent)]">
            →
          </span>
        ) : null}
      </div>
    </div>
  );

  if (!diagnostic.href) return content;
  return (
    <Link href={diagnostic.href} className="block">
      {content}
    </Link>
  );
}

function ScoreCard({
  label,
  value,
  severity,
  sub,
}: {
  label: string;
  value: number | string;
  severity: Severity;
  sub: string;
}) {
  return (
    <div className={["rounded-2xl border p-4", severitySurface(severity)].join(" ")}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-ink-soft)]">{sub}</p>
    </div>
  );
}

function LiveMetric({
  label,
  value,
  sub,
  severity,
  href,
}: {
  label: string;
  value: string;
  sub: string;
  severity: Severity;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "rounded-3xl border p-5 transition hover:-translate-y-0.5 hover:shadow-sm",
        severitySurface(severity),
      ].join(" ")}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-4xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{sub}</p>
    </Link>
  );
}

function SignalCard({
  label,
  value,
  detail,
  status,
}: {
  label: string;
  value: string;
  detail: string;
  status: CheckStatus;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--color-muted)]">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black tracking-tight">{value}</p>
        </div>
        <Dot status={status} />
      </div>
      <p className="mt-2 text-xs text-[var(--color-ink-soft)]">{detail}</p>
    </div>
  );
}

function InvoiceWatch({ invoice }: { invoice: InvoiceRow }) {
  const remaining = Math.max(
    0,
    (invoice.amount_cents ?? 0) - (invoice.amount_paid_cents ?? 0),
  );
  const overdue =
    invoice.due_at &&
    invoice.status !== "draft" &&
    new Date(invoice.due_at).getTime() < Date.now();

  return (
    <Link
      href="/admin/invoices"
      className={[
        "rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm",
        overdue || invoice.status === "failed"
          ? severitySurface("critical")
          : severitySurface("watch"),
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-black tracking-tight">
            {invoice.client_name || "Unnamed client"}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            {invoice.status || "unknown"}
            {invoice.due_at ? ` · due ${timeAgo(invoice.due_at)}` : ""}
          </p>
        </div>
        <p className="shrink-0 text-xl font-black">{usd(remaining)}</p>
      </div>
      {invoice.stripe_last_error ? (
        <p className="mt-3 line-clamp-2 text-xs text-[var(--color-accent)]">
          Stripe: {invoice.stripe_last_error}
        </p>
      ) : null}
    </Link>
  );
}

function Dot({ status, inline }: { status: CheckStatus; inline?: boolean }) {
  const color =
    status === "ok"
      ? "bg-green-500"
      : status === "partial"
        ? "bg-amber-500"
        : "bg-[var(--color-accent)]";
  return (
    <span
      className={[
        "inline-block h-2.5 w-2.5 rounded-full",
        color,
        inline ? "mx-0.5 align-middle" : "",
      ].join(" ")}
      aria-hidden
    />
  );
}

function StatusLabel({ status }: { status: CheckStatus }) {
  const map: Record<CheckStatus, { text: string; cls: string }> = {
    ok: { text: "On", cls: "text-green-600" },
    partial: { text: "Partial", cls: "text-amber-600" },
    off: { text: "Off", cls: "text-[var(--color-accent)]" },
  };
  const value = map[status];
  return (
    <span
      className={`shrink-0 text-xs font-bold uppercase tracking-wider ${value.cls}`}
    >
      {value.text}
    </span>
  );
}

function StatusPill({ status, text }: { status: CheckStatus; text: string }) {
  const cls =
    status === "ok"
      ? "border-green-600/30 bg-green-600/10 text-green-700"
      : status === "partial"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-700"
        : "border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10 text-[var(--color-accent)]";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.18em] ${cls}`}
    >
      <Dot status={status} />
      {text}
    </span>
  );
}

function groupStatus(group: IntegrationGroup): CheckStatus {
  if (group.checks.every((check) => check.status === "ok")) return "ok";
  if (group.checks.some((check) => check.status === "ok")) return "partial";
  return "off";
}

function metricStatus(metric: CountMetric): CheckStatus {
  if (metric.error) return "partial";
  return "ok";
}

function stripeStatus(groups: IntegrationGroup[], ops: OperationalHealth): CheckStatus {
  const webhook = groups
    .flatMap((group) => group.checks)
    .find((check) => check.id === "stripe-webhook");
  if (countOrZero(ops.stripeErrors7d) > 0) return "off";
  if (webhook?.status !== "ok" || ops.stripeEvents7d.error) return "partial";
  return "ok";
}

function severityRank(severity: Severity) {
  const order: Record<Severity, number> = {
    critical: 0,
    warning: 1,
    watch: 2,
    good: 3,
  };
  return order[severity];
}

function severitySurface(severity: Severity) {
  const cls: Record<Severity, string> = {
    critical:
      "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]",
    warning: "border-amber-500/40 bg-amber-500/10 text-[var(--color-ink)]",
    watch: "border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ink)]",
    good: "border-green-600/30 bg-green-600/10 text-[var(--color-ink)]",
  };
  return cls[severity];
}

function severityPill(severity: Severity) {
  const cls: Record<Severity, string> = {
    critical: "bg-[var(--color-accent)] text-white",
    warning: "bg-amber-500 text-black",
    watch: "bg-[var(--color-surface)] text-[var(--color-ink-soft)]",
    good: "bg-green-600 text-white",
  };
  return cls[severity];
}

function metricSeverity(metric: CountMetric, watchAt: number, warningAt: number): Severity {
  if (metric.value === null) return "warning";
  if (metric.value >= warningAt) return "warning";
  if (metric.value >= watchAt) return "watch";
  return "good";
}

function countOrZero(metric: CountMetric) {
  return metric.value ?? 0;
}

function metricText(metric: CountMetric) {
  if (metric.value === null) return "Needs fix";
  return metric.value.toLocaleString("en-US");
}

function sumMetrics(...metrics: CountMetric[]) {
  return metrics.reduce((sum, metric) => sum + countOrZero(metric), 0);
}

function usd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function timeAgo(iso: string | null) {
  if (!iso) return "unknown";
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}
