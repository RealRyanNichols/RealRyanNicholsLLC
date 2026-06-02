import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getIntegrationHealth,
  countCriticalIssues,
  type CheckStatus,
  type IntegrationCheck,
} from "@/lib/integration-health";

export const metadata: Metadata = {
  title: "Connections",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · connections
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Connection health
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Which integrations are switched on. This checks whether each key is{" "}
        <em>set</em> in the environment — not whether the value is valid — because
        a missing key is the usual reason email, payments, tips, or messages go
        quiet. Set the values in{" "}
        <span className="font-semibold">Vercel → Settings → Environment Variables</span>,
        redeploy, then reload this page.
      </p>

      {/* At-a-glance banner */}
      <div
        className={[
          "mt-6 rounded-2xl border p-4 text-sm",
          criticalIssues === 0
            ? "border-green-600/40 bg-green-600/10 text-[var(--color-ink)]"
            : "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]",
        ].join(" ")}
      >
        {criticalIssues === 0 ? (
          <>
            <strong>All core connections are on.</strong> Email, payments, and the
            database are configured. (If something still misbehaves, a key may be
            set but invalid — re-check the value.)
          </>
        ) : (
          <>
            <strong>
              {criticalIssues} core connection{criticalIssues === 1 ? "" : "s"} need
              {criticalIssues === 1 ? "s" : ""} attention.
            </strong>{" "}
            Anything red below with a <Dot status="off" inline /> is why a money,
            contact, or email path feels broken. The fixes are just keys to paste
            into Vercel.
          </>
        )}
      </div>

      <div className="mt-8 space-y-8">
        {groups.map((group) => (
          <section key={group.group}>
            <h2 className="text-lg font-bold tracking-tight">{group.group}</h2>
            <p className="mt-1 text-xs text-[var(--color-muted)]">{group.blurb}</p>
            <ul className="mt-3 space-y-3">
              {group.checks.map((check) => (
                <li
                  key={check.id}
                  className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
                >
                  <CheckRow check={check} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin" className="underline">
          ← Admin dashboard
        </Link>
      </p>
    </article>
  );
}

function CheckRow({ check }: { check: IntegrationCheck }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Dot status={check.status} />
            <span className="font-semibold tracking-tight">{check.label}</span>
            {check.critical ? (
              <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
                core
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
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
              {check.missing.map((m, i) => (
                <span key={m}>
                  {i > 0 ? ", " : ""}
                  <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-[11px] text-[var(--color-ink)]">
                    {m}
                  </code>
                </span>
              ))}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs text-[var(--color-muted)] leading-relaxed">
            {check.where}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function Dot({
  status,
  inline,
}: {
  status: CheckStatus;
  inline?: boolean;
}) {
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
        inline ? "align-middle mx-0.5" : "",
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
  const m = map[status];
  return (
    <span
      className={`shrink-0 text-xs font-bold uppercase tracking-wider ${m.cls}`}
    >
      {m.text}
    </span>
  );
}
