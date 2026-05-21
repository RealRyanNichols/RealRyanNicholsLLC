import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { TipActions } from "@/components/TipActions";

export const metadata: Metadata = {
  title: "Tips",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Status = "pending" | "reviewed" | "merged" | "rejected" | "all";

export default async function AdminTipsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
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

  const { filter } = await searchParams;
  const view: Status =
    filter === "reviewed" ||
    filter === "merged" ||
    filter === "rejected" ||
    filter === "all"
      ? (filter as Status)
      : "pending";

  let query = supabase
    .from("case_tips")
    .select(
      "id, submitter_name, submitter_email, defendant_name, narrative, urls, status, reviewed_at, reviewed_notes, created_at"
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

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · tip line
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Tips
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Public submissions from <code>/submit</code>. Read, then act:
        <em> merged</em> if you added it to a case_people row,{" "}
        <em>reviewed</em> if seen but no action needed,{" "}
        <em>rejected</em> if spam.
      </p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "pending"} href="/admin/tips?filter=pending">
          Pending ({pendingCount ?? 0})
        </TabLink>
        <TabLink active={view === "reviewed"} href="/admin/tips?filter=reviewed">
          Reviewed ({reviewedCount ?? 0})
        </TabLink>
        <TabLink active={view === "merged"} href="/admin/tips?filter=merged">
          Merged ({mergedCount ?? 0})
        </TabLink>
        <TabLink active={view === "rejected"} href="/admin/tips?filter=rejected">
          Rejected ({rejectedCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href="/admin/tips?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-red-400">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-4">
        {!tips || tips.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">
            No tips in this bucket.
          </p>
        ) : (
          tips.map((t) => {
            const urls = Array.isArray(t.urls)
              ? (t.urls as string[])
              : [];
            return (
              <article
                key={t.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      About: {t.defendant_name}
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-[var(--color-accent)] text-white",
    reviewed: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
    merged: "bg-green-600/80 text-white",
    rejected: "bg-zinc-800 text-zinc-400",
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
