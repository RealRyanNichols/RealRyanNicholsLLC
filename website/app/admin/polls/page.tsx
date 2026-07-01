import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Poll command center: create feed polls, watch votes come in, and see the
// emails each poll captured. Inline {{poll}} shortcode polls auto-register
// here on their first vote.

export const metadata: Metadata = {
  title: "Polls",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PollRow = {
  id: string;
  poll_key: string;
  question: string;
  options: string[];
  placement: string;
  post_slug: string | null;
  status: string;
  created_at: string;
};

type VoteRow = { poll_id: string; option_idx: number };
type UnlockRow = {
  poll_id: string | null;
  email: string;
  created_at: string;
};

async function requireAdmin() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/polls");
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  return adminCheck === true;
}

async function createPoll(formData: FormData) {
  "use server";
  if (!(await requireAdmin()) || !isSupabaseServiceConfigured()) return;
  const question = String(formData.get("question") ?? "").trim().slice(0, 200);
  const placement =
    String(formData.get("placement") ?? "feed") === "inline" ? "inline" : "feed";
  const options = String(formData.get("options") ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
  if (!question || options.length < 2) return;

  const keySlug = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const pollKey = `${placement}:${Date.now().toString(36)}:${keySlug}`;

  const svc = getSupabaseServiceClient();
  // One live feed poll at a time: creating a new one closes the old one.
  if (placement === "feed") {
    await svc
      .from("polls")
      .update({ status: "closed" })
      .eq("placement", "feed")
      .eq("status", "open");
  }
  await svc.from("polls").insert({
    poll_key: pollKey,
    question,
    options,
    placement,
  });
  revalidatePath("/admin/polls");
  revalidatePath("/");
}

async function setPollStatus(formData: FormData) {
  "use server";
  if (!(await requireAdmin()) || !isSupabaseServiceConfigured()) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") === "open" ? "open" : "closed";
  if (!id) return;
  const svc = getSupabaseServiceClient();
  await svc.from("polls").update({ status }).eq("id", id);
  revalidatePath("/admin/polls");
  revalidatePath("/");
}

export default async function AdminPollsPage() {
  if (!(await requireAdmin())) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }
  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold tracking-tight">Polls</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          Poll storage needs the Supabase service key.
        </p>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const [{ data: polls }, { data: votes }, { data: unlocks }] =
    await Promise.all([
      svc
        .from("polls")
        .select("id, poll_key, question, options, placement, post_slug, status, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      svc.from("poll_votes").select("poll_id, option_idx").limit(20000),
      svc
        .from("poll_unlocks")
        .select("poll_id, email, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  const pollRows = (polls ?? []) as PollRow[];
  const voteRows = (votes ?? []) as VoteRow[];
  const unlockRows = (unlocks ?? []) as UnlockRow[];

  // Aggregate votes per poll per option.
  const tally = new Map<string, Map<number, number>>();
  for (const v of voteRows) {
    let m = tally.get(v.poll_id);
    if (!m) {
      m = new Map();
      tally.set(v.poll_id, m);
    }
    m.set(v.option_idx, (m.get(v.option_idx) ?? 0) + 1);
  }
  const unlocksByPoll = new Map<string, number>();
  for (const u of unlockRows) {
    if (u.poll_id) {
      unlocksByPoll.set(u.poll_id, (unlocksByPoll.get(u.poll_id) ?? 0) + 1);
    }
  }
  const totalVotes = voteRows.length;
  const totalEmails = unlockRows.length;

  return (
    <article className="mx-auto max-w-4xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Polls</h1>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          {totalVotes.toLocaleString()} votes · {totalEmails.toLocaleString()}{" "}
          emails captured. Voting is free; results cost an email.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)]">
          New poll
        </h2>
        <form action={createPoll} className="mt-3 space-y-3">
          <input
            name="question"
            required
            maxLength={200}
            placeholder="The question. Make it one they have to answer."
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
          <textarea
            name="options"
            required
            rows={4}
            placeholder={"One option per line. 2 to 6 options."}
            className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
              <select
                name="placement"
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-1.5 text-sm"
                defaultValue="feed"
              >
                <option value="feed">Homepage feed (replaces current)</option>
                <option value="inline">Standalone (embed by key)</option>
              </select>
            </label>
            <button
              type="submit"
              className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-bold text-[var(--color-paper)]"
            >
              Launch poll
            </button>
          </div>
        </form>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          In articles, drop {"{{poll: Question? | Option A | Option B}}"} into
          the markdown — it registers itself here on the first vote.
        </p>
      </section>

      <section className="space-y-4">
        {pollRows.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            No polls yet. Launch one above or drop a {"{{poll}}"} shortcode in
            an article.
          </p>
        ) : (
          pollRows.map((p) => {
            const m = tally.get(p.id) ?? new Map<number, number>();
            const total = Array.from(m.values()).reduce((a, b) => a + b, 0);
            const emails = unlocksByPoll.get(p.id) ?? 0;
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-bold text-[var(--color-ink)]">
                      {p.question}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                      {p.placement === "feed" ? "Homepage feed" : p.post_slug ? `In ${p.post_slug}` : "Inline"}
                      {" · "}
                      {formatDistanceToNowStrict(new Date(p.created_at))} ago
                      {" · "}
                      <span className={p.status === "open" ? "font-bold text-green-700" : "font-bold"}>
                        {p.status}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold tabular-nums text-[var(--color-ink)]">
                      {total.toLocaleString()} votes · {emails.toLocaleString()} emails
                    </span>
                    <form action={setPollStatus}>
                      <input type="hidden" name="id" value={p.id} />
                      <input
                        type="hidden"
                        name="status"
                        value={p.status === "open" ? "closed" : "open"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
                      >
                        {p.status === "open" ? "Close" : "Reopen"}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {(p.options ?? []).map((label, idx) => {
                    const n = m.get(idx) ?? 0;
                    const pct = total > 0 ? Math.round((n / total) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="relative overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)]"
                      >
                        <div
                          aria-hidden
                          className="absolute inset-y-0 left-0 bg-[var(--color-accent-soft)]"
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center justify-between gap-3 px-3 py-1.5">
                          <span className="text-sm text-[var(--color-ink-soft)]">
                            {label}
                          </span>
                          <span className="font-mono text-xs font-bold tabular-nums">
                            {pct}% · {n.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </section>

      {unlockRows.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-accent)]">
            Latest unlock emails
          </h2>
          <ul className="mt-3 space-y-1.5">
            {unlockRows.slice(0, 50).map((u, i) => (
              <li
                key={`${u.email}-${i}`}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="font-semibold text-[var(--color-ink)]">
                  {u.email}
                </span>
                <span className="whitespace-nowrap text-xs text-[var(--color-muted)]">
                  {formatDistanceToNowStrict(new Date(u.created_at))} ago
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
