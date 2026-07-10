import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminEmailTestButton } from "@/components/AdminEmailTestButton";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import {
  getIntegrationHealth,
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
  const ops = await getOperationalHealth(supabase);
  const diagnostics = buildDiagnostics(groups, ops);

  const allChecks = groups.flatMap((g) => g.checks);
  const setupChecks = allChecks.filter((c) => c.status !== "ok");
  const okChecks = allChecks.filter((c) => c.status === "ok");
  // Operational alerts only — the config-off diagnostics would just repeat the
  // "needs setup" connection rows below, so we drop them here.
  const opsAlerts = diagnostics.filter(
    (d) =>
      !d.id.startsWith("config-") &&
      (d.severity === "critical" || d.severity === "warning"),
  );

  const nothingToDo = setupChecks.length === 0 && opsAlerts.length === 0;

  return (
    <article className="mx-auto max-w-3xl px-4 py-7">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · system health
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        What&apos;s connected
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        What&apos;s on, what still needs setup, and how the site is doing right
        now. Admin only — never public.
      </p>

      {/* Needs setup or attention */}
      <section className="mt-6 grid gap-2">
        {nothingToDo ? (
          <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6">
            <p className="text-lg font-bold tracking-tight">
              Everything&apos;s connected.
            </p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              All core services are on and nothing needs your attention.
            </p>
          </div>
        ) : (
          <>
            {opsAlerts.map((d) => (
              <AlertRow key={d.id} diagnostic={d} />
            ))}
            {setupChecks.map((c) => (
              <SetupRow key={c.id} check={c} />
            ))}
          </>
        )}
      </section>

      {/* Connected & working — quiet, collapsed */}
      {okChecks.length > 0 ? (
        <section className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
              Connected &amp; working
            </p>
            <AdminEmailTestButton />
          </div>
          <div className="mt-3 grid gap-y-2 sm:grid-cols-2">
            {okChecks.map((c) => (
              <div key={c.id} className="flex items-center gap-2">
                <Dot status="ok" />
                <span className="text-sm font-semibold text-[var(--color-ink)]">
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Live reads — the whole telemetry console, at whisper volume */}
      <section className="mt-6 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-4">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
          Live reads
        </p>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <Pulse
            n={metricText(ops.activeNow)}
            label="live now"
            live={countOrZero(ops.activeNow) > 0}
          />
          <Pulse n={metricText(ops.arrivals24h)} label="arrivals · 24h" />
          <Pulse n={metricText(ops.arrivals7d)} label="arrivals · 7d" />
          <Pulse n={metricText(ops.newMessages)} label="new messages" />
          <Pulse
            n={String(
              sumMetrics(ops.pendingTips, ops.pendingClaims, ops.pendingUploads),
            )}
            label="intake waiting"
          />
          <Pulse n={usd(ops.receivableCents)} label="receivable" />
          <Pulse n={metricText(ops.stripeEvents7d)} label="stripe events · 7d" />
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-muted)]">
          Updated {formatTime(ops.generatedAt)}. Keys and secrets are never
          shown here — only whether a service is on.
        </p>
      </section>

      {ops.queryErrors.length > 0 ? (
        <section className="mt-6 rounded-md border border-amber-500/40 bg-amber-500/10 p-5 text-sm">
          <p className="font-bold">Some health readers could not run.</p>
          <p className="mt-1 text-[var(--color-ink-soft)]">
            Usually a missing table, policy, or service role — a health signal,
            not just a page error.
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
          Back to dashboard
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
      [
        "support_intent_failed",
        "tip_submit_failed",
        "subscribe_failed",
        "private_message_failed",
      ],
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
    });
  }

  if (
    countOrZero(ops.newMessages) > 0 &&
    checkById.get("admin-notify")?.status !== "ok"
  ) {
    diagnostics.push({
      id: "messages-email-alerts",
      severity: "critical",
      label: "People are messaging while email alerts are not fully on",
      finding: `${metricText(ops.newMessages)} new private messages need attention.`,
      fix: "Open the inbox now, then finish Resend so new private messages alert you instead of hiding in admin.",
      href: "/admin/messages?filter=new",
    });
  }

  if (
    countOrZero(ops.pendingTips) > 0 &&
    checkById.get("admin-notify")?.status !== "ok"
  ) {
    diagnostics.push({
      id: "tips-email-alerts",
      severity: "critical",
      label: "Tips are waiting while admin email alerts are not fully on",
      finding: `${metricText(ops.pendingTips)} pending tips need review.`,
      fix: "Open the tip queue now, then finish Resend/admin-alert wiring so new tips reach you immediately.",
      href: "/admin/tips?filter=pending",
    });
  }

  if (ops.overdueInvoices > 0 || countOrZero(ops.failedInvoices) > 0) {
    diagnostics.push({
      id: "invoice-collection-risk",
      severity: "critical",
      label: "Invoice money can go stale",
      finding: `${ops.overdueInvoices} overdue and ${metricText(ops.failedInvoices)} failed invoices are visible.`,
      fix: "Open invoices, resend hosted Stripe links, and set a next follow-up date before work continues.",
      href: "/admin/invoices",
    });
  } else if (ops.receivableCents > 0) {
    diagnostics.push({
      id: "open-receivables",
      severity: "warning",
      label: "Receivables are open",
      finding: `${usd(ops.receivableCents)} is still collectible through active invoices.`,
      fix: "Send one clear follow-up with the Stripe-hosted invoice link and note what gets delivered after payment.",
      href: "/admin/invoices",
    });
  }

  const intakeQueue = sumMetrics(
    ops.pendingTips,
    ops.pendingClaims,
    ops.pendingUploads,
    ops.pendingProfiles,
  );
  if (intakeQueue > 7) {
    diagnostics.push({
      id: "intake-queue",
      severity: "warning",
      label: "Case intake is stacking up",
      finding: `${intakeQueue} tips, claims, uploads, or profile approvals are waiting.`,
      fix: "Clear the oldest items first from the inbox, then archive anything not usable.",
      href: "/admin/inbox",
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
    });
  }

  if (ops.arrivals24h.value === null) {
    diagnostics.push({
      id: "traffic-reader-broken",
      severity: "warning",
      label: "Traffic reader could not query arrivals",
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
      fix: "Set STRIPE_WEBHOOK_SECRET in Vercel and confirm webhook events land after a test payment.",
      href: "/admin/invoices",
    });
  }

  if (countOrZero(ops.paidOrdersNeedingFulfillment) > 0) {
    diagnostics.push({
      id: "paid-orders",
      severity: "warning",
      label: "Paid orders need fulfillment",
      finding: `${metricText(ops.paidOrdersNeedingFulfillment)} paid orders are not marked fulfilled.`,
      fix: "Open orders, fulfill what is paid, then mark each order complete.",
      href: "/admin/orders",
    });
  }

  if (countOrZero(ops.stripeErrors7d) > 0) {
    diagnostics.push({
      id: "stripe-errors",
      severity: "critical",
      label: "Stripe webhook errors were recorded",
      finding: `${metricText(ops.stripeErrors7d)} Stripe events had errors in the last 7 days.`,
      fix: "Inspect the errors, then retest invoice and store checkout after the fix.",
      href: "/admin/invoices",
    });
  }

  return diagnostics.sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  );
}

function AlertRow({ diagnostic }: { diagnostic: Diagnostic }) {
  const body = (
    <div
      className={[
        "flex items-start gap-3 rounded-md border px-4 py-3.5 transition",
        severitySurface(diagnostic.severity),
        diagnostic.href ? "hover:border-[var(--color-accent)]" : "",
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]",
          severityPill(diagnostic.severity),
        ].join(" ")}
      >
        {diagnostic.severity}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-bold leading-tight text-[var(--color-ink)]">
          {diagnostic.label}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-ink-soft)]">
          {diagnostic.finding}
        </span>
        <span className="mt-1 block text-xs text-[var(--color-muted)]">
          <span className="font-bold text-[var(--color-ink-soft)]">Fix:</span>{" "}
          {diagnostic.fix}
        </span>
      </span>
      {diagnostic.href ? (
        <span className="shrink-0 text-[var(--color-accent)]" aria-hidden>
          →
        </span>
      ) : null}
    </div>
  );
  return diagnostic.href ? (
    <Link href={diagnostic.href} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

function SetupRow({ check }: { check: IntegrationCheck }) {
  const severity: Severity = check.critical ? "critical" : "warning";
  return (
    <div
      className={[
        "flex items-start gap-3 rounded-md border px-4 py-3.5",
        severitySurface(severity),
      ].join(" ")}
    >
      <span
        className={[
          "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.16em]",
          severityPill(severity),
        ].join(" ")}
      >
        {check.status === "partial" ? "set up" : "off"}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.95rem] font-bold leading-tight text-[var(--color-ink)]">
          {check.label}
        </span>
        <span className="mt-0.5 block text-xs text-[var(--color-ink-soft)]">
          {check.summary}
        </span>
        <span className="mt-1 block text-xs text-[var(--color-muted)]">
          <span className="font-bold text-[var(--color-ink-soft)]">How:</span>{" "}
          {check.where}
        </span>
      </span>
    </div>
  );
}

function Pulse({
  n,
  label,
  live,
}: {
  n: string;
  label: string;
  live?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      {live ? (
        <span
          className="inline-block h-2 w-2 self-center rounded-full bg-green-500 animate-pulse"
          aria-hidden
        />
      ) : null}
      <span className="text-lg font-bold tabular-nums tracking-tight text-[var(--color-ink)]">
        {n}
      </span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
    </span>
  );
}

function Dot({ status }: { status: CheckStatus }) {
  const color =
    status === "ok"
      ? "bg-green-500"
      : status === "partial"
        ? "bg-amber-500"
        : "bg-[var(--color-accent)]";
  return (
    <span
      className={["inline-block h-2.5 w-2.5 shrink-0 rounded-full", color].join(" ")}
      aria-hidden
    />
  );
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
