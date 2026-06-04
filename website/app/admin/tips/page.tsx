import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TipActions } from "@/components/TipActions";
import {
  buildIntakeRoutePlan,
  type IntakeRouteKind,
  type IntakeRoutePlan,
} from "@/lib/intake-routing";

export const metadata: Metadata = {
  title: "Tips",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Status = "pending" | "reviewed" | "merged" | "rejected" | "all";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; route?: string; urgency?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/tips");
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

  const { filter, route, urgency } = await searchParams;
  const view: Status =
    filter === "reviewed" ||
    filter === "merged" ||
    filter === "rejected" ||
    filter === "all"
      ? (filter as Status)
      : "pending";
  const routeView = isRouteKind(route) ? route : null;
  const urgencyView = isUrgency(urgency) ? urgency : null;

  let query = supabase
    .from("case_tips")
    .select(
      "id, category, location, submitter_name, submitter_email, defendant_name, narrative, urls, status, reviewed_at, reviewed_notes, created_at"
    )
    .order("created_at", { ascending: false });
  if (view !== "all") {
    query = query.eq("status", view);
  }
  const { data: tips, error } = await query;

  const [
    { count: pendingCount },
    { count: reviewedCount },
    { count: mergedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase.from("case_tips").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("case_tips").select("id", { count: "exact", head: true }).eq("status", "reviewed"),
    supabase.from("case_tips").select("id", { count: "exact", head: true }).eq("status", "merged"),
    supabase.from("case_tips").select("id", { count: "exact", head: true }).eq("status", "rejected"),
  ]);
  const routedTips = (tips ?? []).map((tip) => {
    const urls = Array.isArray(tip.urls) ? (tip.urls as string[]) : [];
    return {
      tip,
      urls,
      plan: buildIntakeRoutePlan({
        category: tip.category,
        subject: tip.defendant_name,
        location: tip.location,
        narrative: tip.narrative,
        urls,
      }),
    };
  });
  const routeCounts = routedTips.reduce(
    (acc, item) => {
      acc[item.plan.kind] = (acc[item.plan.kind] ?? 0) + 1;
      return acc;
    },
    {
      case_map: 0,
      verify: 0,
      article: 0,
      service: 0,
      watch: 0,
    } as Record<IntakeRouteKind, number>,
  );
  const hotTipCount = routedTips.filter((item) => item.plan.urgency === "hot").length;
  const visibleTips = routedTips.filter((item) => {
    if (routeView && item.plan.kind !== routeView) return false;
    if (urgencyView && item.plan.urgency !== urgencyView) return false;
    return true;
  });

  return (
    <article className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · tip line
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Tips
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Every tip gets an immediate route: map it, verify it, turn it into an
        article, follow up privately, or hold it in the watch file. Nothing
        should sit here without a next move.
      </p>

      <section className="mt-6 border border-[#203a64] bg-[#071126] p-4 text-[#fdf8ea] shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#7fe3a9]">
              Tip action radar
            </p>
            <h2 className="mt-1 font-sans text-2xl font-black text-[#fdf8ea]">
              Route it before it gets forgotten.
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#cfd9ea]">
              This queue now turns each tip into a specific admin action. Hot
              leads are tips with source, map, or verification signals.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <RadarStat
              label="Hot"
              value={hotTipCount}
              href={tipsHref({ filter: view, urgency: "hot" })}
              active={urgencyView === "hot"}
              tone="red"
            />
            <RadarStat
              label="Verify"
              value={routeCounts.verify}
              href={tipsHref({ filter: view, route: "verify", urgency: urgencyView })}
              active={routeView === "verify"}
            />
            <RadarStat
              label="Map"
              value={routeCounts.case_map}
              href={tipsHref({ filter: view, route: "case_map", urgency: urgencyView })}
              active={routeView === "case_map"}
            />
            <RadarStat
              label="Article"
              value={routeCounts.article}
              href={tipsHref({ filter: view, route: "article", urgency: urgencyView })}
              active={routeView === "article"}
            />
            <RadarStat
              label="Follow up"
              value={routeCounts.service}
              href={tipsHref({ filter: view, route: "service", urgency: urgencyView })}
              active={routeView === "service"}
            />
            <RadarStat
              label="Watch"
              value={routeCounts.watch}
              href={tipsHref({ filter: view, route: "watch", urgency: urgencyView })}
              active={routeView === "watch"}
            />
          </div>
        </div>
        {routeView || urgencyView ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border border-white/10 bg-white/[0.055] p-3">
            <p className="text-sm font-bold leading-6 text-[#cfd9ea]">
              Showing {visibleTips.length} of {routedTips.length} tips
              {urgencyView ? ` in the ${urgencyView} lane` : ""}
              {routeView ? ` routed to ${routeLabel(routeView).toLowerCase()}` : ""}.
            </p>
            <Link
              href={tipsHref({ filter: view })}
              className="border border-[#7fe3a9]/50 px-3 py-2 text-xs font-black uppercase tracking-normal text-[#7fe3a9] transition hover:bg-[#7fe3a9]/15"
            >
              Clear radar
            </Link>
          </div>
        ) : null}
      </section>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "pending"} href={tipsHref({ filter: "pending", route: routeView, urgency: urgencyView })}>
          Pending ({pendingCount ?? 0})
        </TabLink>
        <TabLink active={view === "reviewed"} href={tipsHref({ filter: "reviewed", route: routeView, urgency: urgencyView })}>
          Reviewed ({reviewedCount ?? 0})
        </TabLink>
        <TabLink active={view === "merged"} href={tipsHref({ filter: "merged", route: routeView, urgency: urgencyView })}>
          Merged ({mergedCount ?? 0})
        </TabLink>
        <TabLink active={view === "rejected"} href={tipsHref({ filter: "rejected", route: routeView, urgency: urgencyView })}>
          Rejected ({rejectedCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href={tipsHref({ filter: "all", route: routeView, urgency: urgencyView })}>
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-[var(--color-accent)]">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-4">
        {!tips || tips.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">
            No tips in this bucket.
          </p>
        ) : visibleTips.length === 0 ? (
          <div className="border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <p className="font-bold">No tips in this radar lane.</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              Clear the radar or switch lanes to keep working the queue.
            </p>
          </div>
        ) : (
          visibleTips.map(({ tip: t, urls, plan }) => {
            return (
              <article
                key={t.id}
                className="border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm sm:p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <CategoryChip category={t.category} />
                      {t.location ? (
                        <span className="text-[11px] text-[var(--color-muted)] font-mono">
                          {t.location}
                        </span>
                      ) : null}
                    </div>
                    <h2 className="text-lg font-bold tracking-tight">
                      {t.defendant_name
                        ? `About: ${t.defendant_name}`
                        : "(no subject given)"}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      {t.submitter_name || "anonymous"}
                      {t.submitter_email ? (
                        <>
                          {" · "}
                          <a
                            href={`mailto:${t.submitter_email}`}
                            className="text-[var(--color-accent)] hover:underline"
                          >
                            {t.submitter_email}
                          </a>
                        </>
                      ) : (
                        " · no email"
                      )}{" "}
                      ·{" "}
                      {formatDistanceToNowStrict(new Date(t.created_at), {
                        addSuffix: true,
                      })}
                      {" · "}
                      <span title={format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss")}>
                        {format(new Date(t.created_at), "MMM d, yyyy")}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={t.status} />
                </header>

                <TipRoutePanel plan={plan} tipId={t.id} />

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {t.narrative}
                </p>

                {urls.length > 0 ? (
                  <ul className="mt-3 space-y-1 border-t border-[var(--color-line)] pt-3">
                    {urls.map((u) => (
                      <li key={u} className="text-xs">
                        <a
                          href={u}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[var(--color-accent)] hover:underline break-all"
                        >
                          {u}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {t.reviewed_notes ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-line)] pt-3">
                    <strong>Your notes:</strong> {t.reviewed_notes}
                  </p>
                ) : null}

                <TipActions
                  id={t.id}
                  currentStatus={t.status}
                  currentNotes={t.reviewed_notes}
                />
              </article>
            );
          })
        )}
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}

function RadarStat({
  label,
  value,
  href,
  active,
  tone = "green",
}: {
  label: string;
  value: number;
  href: string;
  active: boolean;
  tone?: "green" | "red";
}) {
  return (
    <Link
      href={href}
      className={[
        "border p-3 transition",
        active ? "ring-2 ring-[#7fe3a9]" : "hover:border-[#7fe3a9]",
        tone === "red"
          ? "border-[#e0362c]/70 bg-[#e0362c]/15"
          : "border-[#7fe3a9]/40 bg-white/[0.055]",
      ].join(" ")}
    >
      <p className="font-sans text-2xl font-black text-[#fdf8ea]">
        {value}
      </p>
      <p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#cfd9ea]">
        {label}
      </p>
    </Link>
  );
}

function TipRoutePanel({
  plan,
  tipId,
}: {
  plan: IntakeRoutePlan;
  tipId: string;
}) {
  const tone =
    plan.urgency === "hot"
      ? "border-[var(--color-accent)] bg-[var(--color-accent-soft)]"
      : plan.urgency === "next"
        ? "border-[var(--color-support)] bg-[var(--color-support-soft)]"
        : "border-[var(--color-line)] bg-[var(--color-paper)]";
  const labelTone =
    plan.urgency === "hot"
      ? "bg-[var(--color-accent)] text-white"
      : plan.urgency === "next"
        ? "bg-[var(--color-support)] text-[#1a1410]"
        : "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]";

  return (
    <section className={`mt-4 border p-3 ${tone}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-muted)]">
            Auto route
          </p>
          <h3 className="mt-1 font-sans text-xl font-black">
            {plan.label}
          </h3>
        </div>
        <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-normal ${labelTone}`}>
          {plan.urgency} · {plan.score}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold leading-6 text-[var(--color-ink-soft)]">
        {plan.reason}
      </p>
      <ol className="mt-3 grid gap-2 md:grid-cols-3">
        {plan.nextActions.map((action, index) => (
          <li
            key={action}
            className="border border-black/10 bg-white/45 p-2 text-xs font-semibold leading-5 text-[var(--color-ink-soft)]"
          >
            <span className="mr-1 font-black text-[var(--color-accent)]">
              {index + 1}.
            </span>
            {action}
          </li>
        ))}
      </ol>
      {plan.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {plan.tags.map((tag) => (
            <span
              key={tag}
              className="border border-black/10 bg-white/55 px-2 py-1 text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-black/10 pt-3">
        <Link
          href={`/admin/new?tip=${tipId}`}
          className="border border-[var(--color-accent)] bg-[var(--color-accent)] px-3 py-2 text-xs font-black uppercase tracking-normal text-white transition hover:bg-[var(--color-accent-strong)]"
        >
          Article draft
        </Link>
        <Link
          href={`/admin/new?tip=${tipId}&mode=solution`}
          className="border border-[#7fe3a9]/60 bg-[#7fe3a9]/15 px-3 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:bg-[#7fe3a9]/25"
        >
          Solution brief
        </Link>
        <Link
          href={`/case/intake?route=${plan.kind}`}
          className="border border-black/10 bg-white/45 px-3 py-2 text-xs font-black uppercase tracking-normal text-[var(--color-ink)] transition hover:border-[var(--color-accent)]"
        >
          Public lane
        </Link>
      </div>
    </section>
  );
}

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "px-4 py-2.5 -mb-px border-b-2 text-sm font-semibold transition",
        active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function isRouteKind(value?: string | null): value is IntakeRouteKind {
  return (
    value === "case_map" ||
    value === "verify" ||
    value === "article" ||
    value === "service" ||
    value === "watch"
  );
}

function isUrgency(value?: string | null): value is IntakeRoutePlan["urgency"] {
  return value === "hot" || value === "next" || value === "watch";
}

function routeLabel(route: IntakeRouteKind) {
  const labels: Record<IntakeRouteKind, string> = {
    case_map: "Map this clue",
    verify: "Verify evidence",
    article: "Article lead",
    service: "Follow up",
    watch: "Watch file",
  };
  return labels[route];
}

function tipsHref({
  filter,
  route,
  urgency,
}: {
  filter: Status;
  route?: IntakeRouteKind | null;
  urgency?: IntakeRoutePlan["urgency"] | null;
}) {
  const params = new URLSearchParams();
  params.set("filter", filter);
  if (route) params.set("route", route);
  if (urgency) params.set("urgency", urgency);
  return `/admin/tips?${params.toString()}`;
}

function CategoryChip({ category }: { category?: string | null }) {
  const cat = category ?? "j6";
  const map: Record<string, { label: string; cls: string }> = {
    j6: { label: "J6 case", cls: "bg-[var(--color-accent)] text-white" },
    national: { label: "National news", cls: "bg-[var(--color-blue)] text-white" },
    local: { label: "Local news", cls: "bg-green-700 text-white" },
    other: { label: "Other", cls: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]" },
  };
  const m = map[cat] ?? map.other;
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.cls}`}>
      {m.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[var(--color-accent)] text-white",
    reviewed: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
    merged: "bg-green-600/80 text-white",
    rejected: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
        styles[status] ?? styles.reviewed
      }`}
    >
      {status}
    </span>
  );
}
