import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SubmissionActions } from "@/components/SubmissionActions";

export const metadata: Metadata = {
  title: "Submissions review",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type View = "pending" | "approved" | "rejected" | "all";

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/submissions");
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
  const view: View =
    filter === "approved" || filter === "rejected" || filter === "all"
      ? (filter as View)
      : "pending";

  let query = supabase
    .from("case_documents")
    .select(
      `id, slug, title, description, media_kind, file_url, embed_url, file_mime,
       submission_status, submission_notes, submitted_by_user_id, created_at,
       case_doc_person ( person_id, role, case_people:case_people!person_id ( id, slug, name ) )`,
    )
    .not("submitted_by_user_id", "is", null)
    .order("created_at", { ascending: false });
  if (view !== "all") {
    query = query.eq("submission_status", view);
  }
  const { data: rawSubs, error } = await query;
  const subs = rawSubs ?? [];

  // Hydrate the claimant's profile info.
  const userIds = Array.from(
    new Set(subs.map((s) => s.submitted_by_user_id).filter(Boolean) as string[]),
  );
  const claimantInfo = new Map<
    string,
    { email: string; full_name: string | null; username: string | null }
  >();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", userIds);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username")
      .in("id", userIds);
    const profileById = new Map(
      (profiles ?? []).map((p) => [p.id, p] as const),
    );
    for (const u of users ?? []) {
      const p = profileById.get(u.id);
      claimantInfo.set(u.id, {
        email: u.email ?? "",
        full_name: p?.full_name ?? null,
        username: p?.username ?? null,
      });
    }
  }

  const [
    { count: pendingCount },
    { count: approvedCount },
    { count: rejectedCount },
  ] = await Promise.all([
    supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true })
      .eq("submission_status", "pending")
      .not("submitted_by_user_id", "is", null),
    supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true })
      .eq("submission_status", "approved")
      .not("submitted_by_user_id", "is", null),
    supabase
      .from("case_documents")
      .select("id", { count: "exact", head: true })
      .eq("submission_status", "rejected")
      .not("submitted_by_user_id", "is", null),
  ]);

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · claimant submissions
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        J6 claimant submissions
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Photos and embeds verified J6 defendants have uploaded to their profile.
        Each one waits here for one review before going public on{" "}
        <code>/case/people/[slug]</code>.
      </p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink
          active={view === "pending"}
          href="/admin/submissions?filter=pending"
        >
          Pending ({pendingCount ?? 0})
        </TabLink>
        <TabLink
          active={view === "approved"}
          href="/admin/submissions?filter=approved"
        >
          Approved ({approvedCount ?? 0})
        </TabLink>
        <TabLink
          active={view === "rejected"}
          href="/admin/submissions?filter=rejected"
        >
          Rejected ({rejectedCount ?? 0})
        </TabLink>
        <TabLink active={view === "all"} href="/admin/submissions?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-[var(--color-accent)]">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {subs.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic py-6">
            Nothing in this bucket.
          </p>
        ) : (
          subs.map((s) => {
            const claimant = s.submitted_by_user_id
              ? claimantInfo.get(s.submitted_by_user_id)
              : null;
            const linkedPerson = Array.isArray(s.case_doc_person)
              ? s.case_doc_person[0]
              : null;
            const j6Person = linkedPerson
              ? Array.isArray(linkedPerson.case_people)
                ? linkedPerson.case_people[0]
                : linkedPerson.case_people
              : null;
            return (
              <article
                key={s.id}
                className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0 w-full sm:w-40">
                    {s.media_kind === "image" && s.file_url ? (
                      <a href={s.file_url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={s.file_url}
                          alt={s.title}
                          className="w-full aspect-square object-cover rounded-lg border border-[var(--color-line)]"
                        />
                      </a>
                    ) : s.media_kind === "video_embed" && s.embed_url ? (
                      <a
                        href={s.embed_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg flex items-center justify-center text-3xl"
                      >
                        🎬
                      </a>
                    ) : (
                      <div className="aspect-square bg-[var(--color-paper)] border border-[var(--color-line)] rounded-lg flex items-center justify-center text-2xl">
                        📄
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold tracking-tight">
                        {s.title}
                      </h2>
                      <StatusBadge status={s.submission_status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] uppercase tracking-wider font-semibold">
                      <span className="rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] px-2 py-0.5">
                        {s.media_kind}
                      </span>
                      {s.embed_url ? (
                        <a
                          href={s.embed_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-[var(--color-blue-soft)] text-[var(--color-blue)] px-2 py-0.5 hover:underline"
                        >
                          embed url ↗
                        </a>
                      ) : null}
                    </div>
                    {s.description ? (
                      <p className="mt-2 text-sm text-[var(--color-ink-soft)] leading-relaxed">
                        {s.description}
                      </p>
                    ) : null}
                    <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                      <div>
                        <dt className="inline text-[var(--color-muted)] font-bold">
                          From:{" "}
                        </dt>
                        <dd className="inline">
                          {claimant?.full_name ? (
                            <span className="font-mono">{claimant.full_name}</span>
                          ) : (
                            <em className="text-[var(--color-muted)]">no name</em>
                          )}
                          {claimant?.email ? (
                            <>
                              {" · "}
                              <a
                                href={`mailto:${claimant.email}`}
                                className="text-[var(--color-accent)] hover:underline"
                              >
                                {claimant.email}
                              </a>
                            </>
                          ) : null}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-[var(--color-muted)] font-bold">
                          On profile:{" "}
                        </dt>
                        <dd className="inline">
                          {j6Person ? (
                            <Link
                              href={`/case/people/${j6Person.slug}`}
                              target="_blank"
                              className="text-[var(--color-accent)] hover:underline"
                            >
                              {j6Person.name}
                            </Link>
                          ) : (
                            <em className="text-[var(--color-muted)]">unlinked</em>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-[var(--color-muted)] font-bold">
                          Submitted:{" "}
                        </dt>
                        <dd className="inline">
                          <span
                            title={format(new Date(s.created_at), "yyyy-MM-dd HH:mm:ss")}
                          >
                            {formatDistanceToNowStrict(new Date(s.created_at), {
                              addSuffix: true,
                            })}
                          </span>
                        </dd>
                      </div>
                    </dl>
                    {s.submission_notes ? (
                      <p className="mt-2 text-xs text-[var(--color-muted)] border-t border-[var(--color-line)] pt-2">
                        <strong>Your notes:</strong> {s.submission_notes}
                      </p>
                    ) : null}
                    {s.submission_status === "pending" ? (
                      <SubmissionActions id={s.id} />
                    ) : (
                      <div className="mt-3 border-t border-[var(--color-line)] pt-3">
                        <SubmissionActions id={s.id} compact />
                      </div>
                    )}
                  </div>
                </div>
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
  const styles: Record<string, { bg: string; label: string }> = {
    approved: { bg: "var(--color-success)", label: "PUBLIC" },
    pending: { bg: "var(--color-tag-procedural)", label: "PENDING" },
    rejected: { bg: "var(--color-accent)", label: "REJECTED" },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-paper)]"
      style={{ background: s.bg }}
    >
      {s.label}
    </span>
  );
}
