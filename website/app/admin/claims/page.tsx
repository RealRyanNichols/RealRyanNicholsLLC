import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ClaimActions } from "@/components/ClaimActions";

export const metadata: Metadata = {
  title: "Profile claims",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Status = "pending" | "approved" | "rejected" | "all";

export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/claims");
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
    filter === "approved" || filter === "rejected" || filter === "all"
      ? (filter as Status)
      : "pending";

  let query = supabase
    .from("case_person_claims")
    .select(
      `
      id, claimant_user_id, claimant_email, doj_case_number, proof, status,
      reviewed_at, reviewed_notes, created_at,
      person:case_people!person_id ( id, slug, name, claim_status )
    `
    )
    .order("created_at", { ascending: false });
  if (view !== "all") {
    query = query.eq("status", view);
  }
  const { data: claims, error } = await query;

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase
      .from("case_person_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("case_person_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "approved"),
    supabase
      .from("case_person_claims")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),
  ]);

  // Pull claimant emails from auth.users for any rows missing claimant_email
  const userIds = Array.from(
    new Set((claims ?? []).map((c) => c.claimant_user_id))
  );
  const authEmails = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", userIds);
    for (const u of users ?? []) authEmails.set(u.id, u.email ?? "");
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · profile claims
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        Profile claims
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        People asking to claim a J6 defendant profile. <strong>Approve</strong> the
        one that matches the docket; the system auto-rejects every other
        pending claim on that same profile.
      </p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "pending"} href="/admin/claims?filter=pending">
          Pending ({pendingCount ?? 0})
        </TabLink>
        <TabLink active={view === "approved"} href="/admin/claims?filter=approved">
          Approved ({approvedCount ?? 0})
        </TabLink>
        <TabLink active={view === "rejected"} href="/admin/claims?filter=rejected">
          Rejected ({rejectedCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href="/admin/claims?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-red-500">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-4">
        {!claims || claims.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">
            No claims in this bucket.
          </p>
        ) : (
          claims.map((c) => {
            const person = Array.isArray(c.person) ? c.person[0] : c.person;
            const claimantEmail =
              c.claimant_email || authEmails.get(c.claimant_user_id) || "—";
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      Claiming:{" "}
                      {person ? (
                        <Link
                          href={`/case/people/${person.slug}`}
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        "(unknown)"
                      )}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      <a
                        href={`mailto:${claimantEmail}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {claimantEmail}
                      </a>
                      {c.doj_case_number ? (
                        <>
                          {" · DOJ "}
                          <span className="font-mono">{c.doj_case_number}</span>
                        </>
                      ) : null}
                      {" · "}
                      {formatDistanceToNowStrict(new Date(c.created_at), {
                        addSuffix: true,
                      })}
                      {" · "}
                      <span title={format(new Date(c.created_at), "yyyy-MM-dd HH:mm:ss")}>
                        {format(new Date(c.created_at), "MMM d, yyyy")}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </header>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
                  {c.proof}
                </p>

                {c.reviewed_notes ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)] border-t border-[var(--color-line)] pt-3">
                    <strong>Your notes:</strong> {c.reviewed_notes}
                  </p>
                ) : null}

                {c.status === "pending" ? (
                  <ClaimActions claimId={c.id} />
                ) : null}
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
    approved: "bg-[var(--color-success)] text-white",
    rejected: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
        styles[status] ?? styles.rejected
      }`}
    >
      {status}
    </span>
  );
}
