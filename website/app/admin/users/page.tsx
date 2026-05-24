import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UserModerationRow } from "@/components/UserModerationRow";

export const metadata: Metadata = {
  title: "User moderation",
  robots: { index: false, follow: false },
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/users");
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
  const view: "pending" | "active" | "banned" | "all" =
    filter === "active" || filter === "banned" || filter === "all"
      ? filter
      : "pending";

  let query = supabase
    .from("profiles")
    .select(
      "id, display_name, full_name, username, bio, location, status, verified_at, verified_linked_account, admin_notes, is_supporter, created_at"
    )
    .order("created_at", { ascending: false });

  if (view !== "all") {
    query = query.eq("status", view);
  }

  const { data: profiles, error } = await query;

  // Match each profile to its auth.users email — easiest via the admin's
  // server-side service role would be cleaner, but since we're already RLS-
  // authorized as admin, we can pull the email from auth.users via a join.
  const userEmails = new Map<string, string>();
  // Suggested J6 profile matches per user, keyed by user id.
  const j6Matches = new Map<
    string,
    {
      person_id: string;
      slug: string;
      name: string;
      role: string | null;
      claim_status: string;
      score: number;
    }[]
  >();
  if (profiles && profiles.length > 0) {
    const ids = profiles.map((p) => p.id);
    const { data: users } = await supabase
      .schema("auth")
      .from("users")
      .select("id, email")
      .in("id", ids);
    if (users) {
      for (const u of users) userEmails.set(u.id, u.email ?? "");
    }
    // Fetch J6 matches for every user that has a full_name. One RPC call
    // per user is fine at this list size (admin page, low traffic).
    await Promise.all(
      profiles.map(async (p) => {
        if (!p.full_name?.trim()) return;
        const { data: matches } = await supabase.rpc("match_j6_defendants", {
          p_full_name: p.full_name,
          p_limit: 5,
        });
        if (Array.isArray(matches) && matches.length > 0) {
          // Filter weak matches (score < 0.3) unless it's the only hit
          const filtered = matches.filter(
            (m: { score: number }) => m.score >= 0.3,
          );
          if (filtered.length > 0) {
            j6Matches.set(p.id, filtered);
          }
        }
      }),
    );
  }

  return (
    <article className="mx-auto max-w-4xl px-4 py-10">
      <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
        Admin · user moderation
      </p>
      <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
        User moderation
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
        Every new signup lands in <strong>pending</strong>. Verify real-name
        matches before letting their comments go public. Ban anyone obvious.
      </p>

      <nav className="mt-6 flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        <TabLink active={view === "pending"} href="/admin/users?filter=pending">
          Pending
        </TabLink>
        <TabLink active={view === "active"} href="/admin/users?filter=active">
          Active
        </TabLink>
        <TabLink active={view === "banned"} href="/admin/users?filter=banned">
          Banned
        </TabLink>
        <TabLink active={view === "all"} href="/admin/users?filter=all">
          All
        </TabLink>
      </nav>

      {error ? (
        <p className="mt-6 text-sm text-[var(--color-accent)]">{error.message}</p>
      ) : null}

      <div className="mt-6 space-y-3">
        {(profiles ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">No users in this bucket.</p>
        ) : (
          (profiles ?? []).map((p) => (
            <UserModerationRow
              key={p.id}
              profile={{
                ...p,
                email: userEmails.get(p.id) ?? "",
              }}
              j6Matches={j6Matches.get(p.id) ?? []}
            />
          ))
        )}
      </div>

      <p className="mt-10 text-xs text-[var(--color-muted)]">
        <Link href="/admin/new" className="underline">Compose post</Link> ·{" "}
        <Link href="/admin/case" className="underline">Upload case document</Link> ·{" "}
        <Link href="/admin/profile" className="underline">Profile photos</Link>
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
