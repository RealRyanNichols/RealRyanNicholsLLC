import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNowStrict } from "date-fns";
import { DeadmanSwitchForm } from "@/components/DeadmanSwitchForm";
import { getDeadmanState } from "@/lib/deadman";
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
  const stalePostingCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [
    { count: ready },
    { count: released },
    { data: researchLeads },
    { count: failedSocial },
    { count: stuckSocial },
    { count: responseRequests },
  ] = await Promise.all([
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("status", "ready"),
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("deadman_research_leads")
      .select("topic_key, title, status, priority, publication_ready, publication_gate_note")
      .order("priority", { ascending: false }),
    supabase
      .from("deadman_social_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("status", "failed"),
    supabase
      .from("deadman_social_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("status", "posting")
      .lt("last_attempt_at", stalePostingCutoff),
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("official_response_status", "requested"),
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
            publishes a verified first bulletin immediately, then one
            source-labeled status update at the top of each hour. The response
            worker creates the updates; it does not wait for owner-approved
            drafts. It never releases private messages, tips, contact info,
            sealed material, or evidence uploads.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Stat label="Switch" value={state.active ? "Active" : "Off"} tone={state.active ? "red" : "green"} />
            <Stat label="Ready updates" value={ready ?? 0} tone={(ready ?? 0) > 0 ? "gold" : "plain"} />
            <Stat label="Released" value={state.total_released || released || 0} tone="blue" />
            <Stat label="Research leads" value={researchLeads?.length ?? 0} tone="plain" />
            <Stat label="Official replies due" value={responseRequests ?? 0} tone={(responseRequests ?? 0) > 0 ? "gold" : "plain"} />
            <Stat label="Social attention" value={(failedSocial ?? 0) + (stuckSocial ?? 0)} tone={(failedSocial ?? 0) + (stuckSocial ?? 0) > 0 ? "red" : "green"} />
          </div>
          <div className="mt-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-2xl font-black tracking-normal">
              How hourly reporting works
            </h2>
            <ol className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              <li>1. A trusted contact or authoritative record confirms custody.</li>
              <li>2. The first sourced bulletin publishes immediately.</li>
              <li>3. Codex researches and publishes a timestamped update at each hour, including a no-new-information bulletin when appropriate.</li>
              <li>4. X and Facebook captions are prepared for each public article and logged until successfully posted.</li>
            </ol>
          </div>
          <div className="mt-6 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
            <h2 className="font-display text-2xl font-black tracking-normal">
              Evidence-led accountability queue
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-ink-soft)]">
              Every public update must separate verified facts, attributed
              allegations, editorial inferences, advocacy, and unanswered
              questions. A named person requires a sourced public role. Private
              leads cannot publish until their gate is affirmatively opened.
            </p>
            <div className="mt-4 space-y-3">
              {(researchLeads ?? []).map((lead) => (
                <section
                  key={lead.topic_key}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-[var(--color-ink)]">
                      {lead.title}
                    </h3>
                    <span className="rounded-full border border-[var(--color-line)] px-2 py-1 text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
                      {lead.publication_ready ? "publication ready" : lead.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                    {lead.publication_gate_note}
                  </p>
                </section>
              ))}
            </div>
            <p className="mt-4 text-xs text-[var(--color-muted)]">
              Failed social dispatches: {failedSocial ?? 0} · ambiguous/stuck
              dispatches: {stuckSocial ?? 0}. Ambiguous deliveries are held for
              reconciliation so an automatic retry cannot create duplicates.
            </p>
          </div>
        </section>

        <aside>
          <DeadmanSwitchForm allowReverse />
          <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-xs leading-relaxed text-[var(--color-muted)]">
            <p>
              Incident: {state.incident_code ?? "none"}
            </p>
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
