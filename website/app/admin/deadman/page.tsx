import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { DeadmanSwitchForm } from "@/components/DeadmanSwitchForm";
import { DEADMAN_QUEUE_CATEGORY, getDeadmanState } from "@/lib/deadman";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Deadman switch",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDeadmanPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/deadman");
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

  const state = await getDeadmanState(supabase);
  const [{ count: queued }, { count: released }] = await Promise.all([
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft")
      .eq("category", DEADMAN_QUEUE_CATEGORY),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("category", DEADMAN_QUEUE_CATEGORY),
  ]);

  return (
    <article className="mx-auto max-w-5xl px-4 py-8">
      <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
        Admin · deadman protocol
      </p>
      <div className="mt-2 grid gap-5 lg:grid-cols-[1fr_0.72fr]">
        <section>
          <h1 className="font-display text-4xl font-black tracking-normal sm:text-5xl">
            Emergency publishing switch
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            This is built to protect the record without violating trust. It
            releases only drafts explicitly marked with category{" "}
            <code>{DEADMAN_QUEUE_CATEGORY}</code>. It never releases private
            messages, tips, contact info, evidence uploads, or unreviewed
            submissions.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Switch" value={state.active ? "Active" : "Off"} tone={state.active ? "red" : "green"} />
            <Stat label="Approved drafts" value={queued ?? 0} tone={(queued ?? 0) > 0 ? "gold" : "plain"} />
            <Stat label="Released" value={state.total_released || released || 0} tone="blue" />
          </div>
          <div className="mt-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-2xl font-black tracking-normal">
              How to stage safe material
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <li>1. Create or edit a post and save it as a draft.</li>
              <li>
                2. Mark it for release from the posts admin row, or set its
                category to <code>{DEADMAN_QUEUE_CATEGORY}</code>.
              </li>
              <li>
                3. Keep anything private, unverified, identifying, or legally
                risky out of this queue.
              </li>
            </ol>
          </div>
        </section>

        <aside>
          <DeadmanSwitchForm />
          <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed text-[var(--color-muted)]">
            <p>
              Last activated: {state.activated_at ? timeAgo(state.activated_at) : "never"}
            </p>
            <p>Last release: {state.last_release_at ? timeAgo(state.last_release_at) : "never"}</p>
            <p>Last reversed: {state.reversed_at ? timeAgo(state.reversed_at) : "never"}</p>
          </div>
        </aside>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: "red" | "green" | "gold" | "blue" | "plain";
}) {
  const tones = {
    red: "border-red-700 bg-red-700/10 text-red-900",
    green: "border-green-700 bg-green-700/10 text-green-900",
    gold: "border-[#d8ad43] bg-[#fff5d6] text-[#7a5100]",
    blue: "border-[var(--color-blue)] bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
    plain: "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)]",
  };
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-xs font-black uppercase tracking-normal">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function timeAgo(iso: string) {
  return formatDistanceToNowStrict(new Date(iso), { addSuffix: true });
}
