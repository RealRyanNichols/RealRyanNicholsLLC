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

  // Pull richer claimant info: auth email + account creation, plus the
  // user's onboarding profile data (full_name, display_name, username,
  // location, status). Everything we have for verifying who they are.
  const userIds = Array.from(
    new Set((claims ?? []).map((c) => c.claimant_user_id)),
  );
  type ClaimantMeta = {
    auth_email: string;
    account_created_at: string | null;
    last_sign_in_at: string | null;
    profile_full_name: string | null;
    profile_display_name: string | null;
    profile_username: string | null;
    profile_status: string | null;
    profile_location: string | null;
    match_score: number | null;
  };
  const claimantMeta = new Map<string, ClaimantMeta>();
  if (userIds.length > 0) {
    const { data: users } = await supabase
      .schema("auth")
      .from("users")
      .select("id, email, created_at, last_sign_in_at")
      .in("id", userIds);
    const { data: profilesRows } = await supabase
      .from("profiles")
      .select("id, full_name, display_name, username, status, location")
      .in("id", userIds);
    const profileById = new Map(
      (profilesRows ?? []).map((p) => [p.id, p] as const),
    );
    for (const u of users ?? []) {
      const p = profileById.get(u.id);
      claimantMeta.set(u.id, {
        auth_email: u.email ?? "",
        account_created_at: u.created_at ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        profile_full_name: p?.full_name ?? null,
        profile_display_name: p?.display_name ?? null,
        profile_username: p?.username ?? null,
        profile_status: p?.status ?? null,
        profile_location: p?.location ?? null,
        match_score: null,
      });
    }
    // For each claim, compute a name-match score against the J6 profile
    // they're trying to claim. High score = same name as the defendant.
    await Promise.all(
      (claims ?? []).map(async (c) => {
        const meta = claimantMeta.get(c.claimant_user_id);
        const person = Array.isArray(c.person) ? c.person[0] : c.person;
        if (!meta || !meta.profile_full_name || !person?.name) return;
        const { data: matches } = await supabase.rpc("match_j6_defendants", {
          p_full_name: meta.profile_full_name,
          p_limit: 10,
        });
        if (!Array.isArray(matches)) return;
        const hit = matches.find(
          (m: { slug: string }) => m.slug === person.slug,
        );
        if (hit) meta.match_score = (hit as { score: number }).score;
      }),
    );
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
            const meta = claimantMeta.get(c.claimant_user_id);
            const claimantEmail =
              c.claimant_email || meta?.auth_email || "—";
            const accountAgeMs = meta?.account_created_at
              ? Date.now() - new Date(meta.account_created_at).getTime()
              : null;
            const accountIsBrandNew =
              accountAgeMs !== null && accountAgeMs < 1000 * 60 * 60; // <1 hr
            const nameMatchPct =
              meta?.match_score !== null && meta?.match_score !== undefined
                ? Math.round(meta.match_score * 100)
                : null;
            return (
              <article
                key={c.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      Claim on:{" "}
                      {person ? (
                        <Link
                          href={`/case/people/${person.slug}`}
                          target="_blank"
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          {person.name}
                        </Link>
                      ) : (
                        "(unknown)"
                      )}
                    </h2>
                    <p className="text-xs text-[var(--color-muted)] mt-0.5">
                      Submitted{" "}
                      {formatDistanceToNowStrict(new Date(c.created_at), {
                        addSuffix: true,
                      })}{" "}
                      ·{" "}
                      <span title={format(new Date(c.created_at), "yyyy-MM-dd HH:mm:ss")}>
                        {format(new Date(c.created_at), "MMM d, yyyy h:mma")}
                      </span>
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </header>

                {/* Identity panel — every field we have on this claimant */}
                <div className="mt-3 rounded-xl border border-[var(--color-line-soft)] bg-[var(--color-paper)] p-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] mb-2">
                    Claimant identity (what you can verify)
                  </p>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <IdRow
                      label="Email"
                      value={
                        <a
                          href={`mailto:${claimantEmail}?subject=${encodeURIComponent(
                            `Verifying your claim on ${person?.name ?? "your J6 profile"} (realryannichols.com)`,
                          )}`}
                          className="font-mono text-[var(--color-accent)] hover:underline"
                        >
                          {claimantEmail}
                        </a>
                      }
                    />
                    <IdRow
                      label="DOJ case #"
                      value={
                        c.doj_case_number ? (
                          <a
                            href={`https://www.google.com/search?q=%22${encodeURIComponent(
                              c.doj_case_number,
                            )}%22+January+6`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-mono text-[var(--color-accent)] hover:underline"
                            title="Search the public docket"
                          >
                            {c.doj_case_number} ↗
                          </a>
                        ) : (
                          <em className="text-[var(--color-accent)]">not provided</em>
                        )
                      }
                    />
                    <IdRow
                      label="Account name"
                      value={
                        meta?.profile_full_name ? (
                          <span className="font-mono">
                            {meta.profile_full_name}
                          </span>
                        ) : (
                          <em className="text-[var(--color-accent)]">missing</em>
                        )
                      }
                    />
                    <IdRow
                      label="Profile name (J6)"
                      value={<span className="font-mono">{person?.name ?? "—"}</span>}
                    />
                    <IdRow
                      label="Username"
                      value={
                        meta?.profile_username ? (
                          <Link
                            href={`/u/${meta.profile_username}`}
                            target="_blank"
                            className="font-mono text-[var(--color-accent)] hover:underline"
                          >
                            @{meta.profile_username}
                          </Link>
                        ) : (
                          <em className="text-[var(--color-muted)]">not set</em>
                        )
                      }
                    />
                    <IdRow
                      label="Display name"
                      value={
                        meta?.profile_display_name ? (
                          <span>{meta.profile_display_name}</span>
                        ) : (
                          <em className="text-[var(--color-muted)]">not set</em>
                        )
                      }
                    />
                    <IdRow
                      label="Account created"
                      value={
                        meta?.account_created_at ? (
                          <span
                            className={
                              accountIsBrandNew
                                ? "font-bold text-[var(--color-accent)]"
                                : "text-[var(--color-ink-soft)]"
                            }
                            title={format(
                              new Date(meta.account_created_at),
                              "yyyy-MM-dd HH:mm:ss",
                            )}
                          >
                            {formatDistanceToNowStrict(
                              new Date(meta.account_created_at),
                              { addSuffix: true },
                            )}
                            {accountIsBrandNew ? " ⚠ brand new" : ""}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <IdRow
                      label="Last signed in"
                      value={
                        meta?.last_sign_in_at ? (
                          <span className="text-[var(--color-ink-soft)]">
                            {formatDistanceToNowStrict(
                              new Date(meta.last_sign_in_at),
                              { addSuffix: true },
                            )}
                          </span>
                        ) : (
                          <em className="text-[var(--color-muted)]">never</em>
                        )
                      }
                    />
                    <IdRow
                      label="Account status"
                      value={
                        <span className="font-mono text-[var(--color-ink-soft)]">
                          {meta?.profile_status ?? "—"}
                        </span>
                      }
                    />
                    <IdRow
                      label="Name match"
                      value={
                        nameMatchPct !== null ? (
                          <span
                            className={`font-bold ${
                              nameMatchPct >= 85
                                ? "text-[var(--color-success)]"
                                : nameMatchPct >= 50
                                  ? "text-[var(--color-tag-procedural)]"
                                  : "text-[var(--color-accent)]"
                            }`}
                          >
                            {nameMatchPct}% to {person?.name}
                          </span>
                        ) : (
                          <em className="text-[var(--color-muted)]">
                            no scoreable name on file
                          </em>
                        )
                      }
                    />
                  </dl>
                </div>

                {/* Their proof text */}
                <div className="mt-3">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] mb-1">
                    What they wrote as proof
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)] bg-[var(--color-paper)] border border-[var(--color-line-soft)] rounded-md p-3">
                    {c.proof}
                  </p>
                </div>

                {/* Verification questions Ryan can ask */}
                {c.status === "pending" ? (
                  <details className="mt-3">
                    <summary className="text-xs font-bold text-[var(--color-blue)] cursor-pointer hover:underline">
                      Verification questions to ask before approving →
                    </summary>
                    <div className="mt-2 rounded-md border border-[var(--color-blue)] bg-[var(--color-blue-soft)] p-3 text-xs space-y-2">
                      <p className="text-[var(--color-ink)]">
                        Send one or two of these to{" "}
                        <span className="font-mono">{claimantEmail}</span>. Pick
                        details only the real {person?.name?.split(/\s+/)[0]}{" "}
                        would know:
                      </p>
                      <ul className="list-disc ml-5 space-y-1 text-[var(--color-ink-soft)]">
                        <li>What was your sentencing date and the name of the federal judge?</li>
                        <li>Who was the lead AUSA (federal prosecutor) on your case?</li>
                        <li>Who represented you — public defender or private attorney name?</li>
                        <li>What's your BOP register number, if you were held?</li>
                        <li>Which facility were you held at? Any block / unit assignments?</li>
                        <li>Send a photo of yourself holding a piece of paper with today's date.</li>
                        <li>Send a clear photo of any pardon paperwork or release documentation.</li>
                        <li>A short video of you on a video call saying your full name and the URL of this site.</li>
                      </ul>
                      <a
                        href={`mailto:${claimantEmail}?subject=${encodeURIComponent(
                          `Quick verification on your claim — realryannichols.com`,
                        )}&body=${encodeURIComponent(
                          `Hi${meta?.profile_display_name ? ` ${meta.profile_display_name.split(/\s+/)[0]}` : ""},\n\nThank you for claiming the profile for ${person?.name ?? "the J6 defendant"} at realryannichols.com. Before I verify your claim and hand over edit access to your profile, I need to confirm you're the right person.\n\nCould you please reply with:\n  - Your sentencing date and the federal judge's name\n  - The name of the AUSA (federal prosecutor) on your case\n  - Your defense counsel's name\n  - A photo of yourself holding a piece of paper with today's date written on it\n\nThis is the same gate I apply to every claim. Once I confirm, you'll have full control of your profile to upload your evidence and tell your story.\n\nThank you,\nRyan Nichols`,
                        )}`}
                        className="inline-block rounded-md bg-[var(--color-blue)] hover:bg-[var(--color-blue-strong)] px-3 py-1.5 text-xs font-bold text-[var(--color-paper)]"
                      >
                        ✉ Open prefilled email →
                      </a>
                    </div>
                  </details>
                ) : null}

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

function IdRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[10px] uppercase tracking-wider font-bold text-[var(--color-muted)] flex-shrink-0 w-[100px]">
        {label}
      </dt>
      <dd className="text-xs break-all">{value}</dd>
    </div>
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
