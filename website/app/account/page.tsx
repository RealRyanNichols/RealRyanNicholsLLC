import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { ProfileEditor } from "@/components/ProfileEditor";
import { J6Workspace } from "@/components/J6Workspace";

export const dynamic = "force-dynamic";

const REACTION_ICON: Record<string, string> = {
  amen: "🙏",
  pray: "🕊️",
  support: "🤝",
};

export default async function AccountPage() {
  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const [
    { data: profile },
    { data: myComments, count: commentsCount },
    { data: myReactions, count: reactionsCount },
    { data: myJ6Profile },
    { data: mySubmissions },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, display_name, full_name, username, bio, location, avatar_url, status, verified_at, verified_linked_account"
      )
      .eq("id", data.user.id)
      .maybeSingle(),
    supabase
      .from("comments")
      .select("id, body, status, created_at, post_id", { count: "exact" })
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("reactions")
      .select("id, kind, created_at, post_id", { count: "exact" })
      .eq("user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(10),
    // If this user has been verified as the owner of a J6 defendant
    // profile, surface their workspace.
    supabase
      .from("case_people")
      .select(
        `id, slug, name, role, description, photo_url, claim_status, views_count, shares_count,
         case_number, court, judge_name, prosecutor_name, defense_attorney,
         arrest_date, plea_date, sentence_date, sentence_summary, disposition,
         charges, news_links, support_url`,
      )
      .eq("claimed_by_user_id", data.user.id)
      .eq("claim_status", "verified")
      .maybeSingle(),
    // Their own submissions queue (photos / docs / testimony drafts).
    supabase
      .from("case_documents")
      .select("id, title, doc_type, media_kind, file_url, embed_url, submission_status, created_at")
      .eq("submitted_by_user_id", data.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Hydrate post titles for the activity lists
  const postIds = new Set<string>([
    ...(myComments ?? []).map((c) => c.post_id),
    ...(myReactions ?? []).map((r) => r.post_id),
  ]);
  let postsById = new Map<string, { slug: string; title: string | null; body: string }>();
  if (postIds.size > 0) {
    const { data: posts } = await supabase
      .from("posts")
      .select("id, slug, title, body")
      .in("id", Array.from(postIds));
    if (posts) {
      postsById = new Map(posts.map((p) => [p.id, { slug: p.slug, title: p.title, body: p.body }]));
    }
  }

  const isPending = profile?.status === "pending";
  const isBanned = profile?.status === "banned";
  const isVerified = !!profile?.verified_at || profile?.verified_linked_account;
  const pendingComments = (myComments ?? []).filter((c) => c.status === "pending").length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-4xl font-bold tracking-tight">Your account</h1>
      <p className="text-[var(--color-ink-soft)] mt-2 text-sm">
        Signed in as <span className="font-mono">{data.user.email}</span>.
      </p>

      {myJ6Profile ? (
        <div className="mt-6">
          <J6Workspace
            j6Profile={myJ6Profile}
            submissions={mySubmissions ?? []}
            firstName={
              (profile?.full_name?.split(/\s+/)[0]) ||
              (profile?.display_name?.split(/\s+/)[0]) ||
              myJ6Profile.name.split(/\s+/)[0]
            }
          />
        </div>
      ) : null}

      {isBanned ? (
        <div className="mt-6 rounded-xl border border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3 text-sm text-[var(--color-accent)]">
          This account is banned. Contact the site admin if you think this is in error.
        </div>
      ) : isPending ? (
        <div className="mt-6 rounded-xl border border-amber-700 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          <strong>Pending review.</strong> An admin will verify your real name before your
          comments are visible publicly. Fill out your profile below to speed it up.
        </div>
      ) : isVerified ? (
        <div className="mt-6 rounded-xl border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-200">
          ✓ Verified account.
        </div>
      ) : null}

      {profile?.username ? (
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Public profile:{" "}
          <Link
            href={`/u/${profile.username}`}
            className="text-[var(--color-accent)] underline"
          >
            /u/{profile.username}
          </Link>
        </p>
      ) : null}

      {/* Quick stats */}
      <section className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Comments" value={commentsCount ?? 0} sub={pendingComments > 0 ? `${pendingComments} pending` : undefined} />
        <Stat label="Reactions" value={reactionsCount ?? 0} />
        <Stat
          label="Status"
          value={isBanned ? "Banned" : isVerified ? "Verified" : isPending ? "Pending" : "Active"}
        />
      </section>

      {/* Profile editor */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight mb-3">Profile</h2>
        <ProfileEditor
          initial={{
            id: data.user.id,
            display_name: profile?.display_name ?? "",
            full_name: profile?.full_name ?? "",
            username: profile?.username ?? "",
            bio: profile?.bio ?? "",
            location: profile?.location ?? "",
          }}
        />
      </section>

      {/* My comments */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight mb-3">
          My comments {commentsCount ? <span className="text-sm text-[var(--color-muted)] font-medium">· {commentsCount} total</span> : null}
        </h2>
        {(myComments ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">You haven&apos;t commented yet.</p>
        ) : (
          <ul className="space-y-3">
            {(myComments ?? []).map((c) => {
              const post = postsById.get(c.post_id);
              return (
                <li key={c.id} className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
                  <p className="text-sm text-[var(--color-ink)] line-clamp-3 whitespace-pre-wrap">{c.body}</p>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[var(--color-muted)]">
                    <span>
                      on{" "}
                      <Link
                        href={`/posts/${post?.slug ?? ""}`}
                        className="text-[var(--color-accent)] hover:underline"
                      >
                        {post?.title ?? post?.body?.slice(0, 60) ?? "post"}
                      </Link>{" "}
                      · {formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}
                    </span>
                    <StatusBadge status={c.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* My reactions */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight mb-3">
          My reactions {reactionsCount ? <span className="text-sm text-[var(--color-muted)] font-medium">· {reactionsCount} total</span> : null}
        </h2>
        {(myReactions ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-muted)] italic">No reactions yet. Hit Amen / Pray / Support on a post.</p>
        ) : (
          <ul className="space-y-2">
            {(myReactions ?? []).map((r) => {
              const post = postsById.get(r.post_id);
              return (
                <li
                  key={r.id}
                  className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm"
                >
                  <span className="text-base" aria-hidden>{REACTION_ICON[r.kind] ?? "•"}</span>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-accent)] w-16">
                    {r.kind}
                  </span>
                  <Link
                    href={`/posts/${post?.slug ?? ""}`}
                    className="flex-1 truncate hover:text-[var(--color-accent)] hover:underline"
                  >
                    {post?.title ?? post?.body?.slice(0, 60) ?? "post"}
                  </Link>
                  <span className="text-xs text-[var(--color-muted)] whitespace-nowrap">
                    {formatDistanceToNowStrict(new Date(r.created_at), { addSuffix: true })}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <div className="mt-10 flex items-center gap-4">
        <Link href="/" className="text-sm underline text-[var(--color-ink-soft)]">
          ← Back to feed
        </Link>
        <SignOutButton />
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5">
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-0.5 font-semibold">
        {label}
      </div>
      {sub ? <div className="text-[11px] text-amber-400 mt-0.5">{sub}</div> : null}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approved: {
      label: "approved",
      cls: "bg-emerald-950/40 border-emerald-700 text-emerald-300",
    },
    pending: {
      label: "pending review",
      cls: "bg-amber-950/40 border-amber-700 text-amber-300",
    },
    hidden: { label: "hidden", cls: "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]" },
    deleted: { label: "deleted", cls: "bg-[var(--color-accent-soft)] border-[var(--color-accent)] text-[var(--color-accent)]" },
  };
  const m = map[status] ?? { label: status, cls: "bg-[var(--color-surface-2)] border-[var(--color-line)] text-[var(--color-muted)]" };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider font-bold ${m.cls}`}>
      {m.label}
    </span>
  );
}
