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

type ResearchLeadSummary = {
  id: string;
  topic_key: string;
  title: string;
  jurisdiction: string | null;
  status: string;
  priority: number;
  subject_classification: string;
  identity_confidence: string;
  publication_ready: boolean;
  publication_gate_note: string;
  public_safe_scope: string;
  legal_restrictions: string[];
  source_count: number;
  proposition_count: number;
  limitation_count: number;
  last_source_review_at: string | null;
  review_stale: boolean;
  gate_actor: string | null;
  gate_action_at: string | null;
  gate_reason: string | null;
};

type ResearchConnectionSummary = {
  id: string;
  connection_key: string;
  from_title: string;
  to_title: string;
  connection_class: string;
  relationship_kind: string;
  confidence: string;
  status: string;
  publication_ready: boolean;
  publication_gate_note: string;
  public_summary: string;
  source_count: number;
  claim_count: number;
  limitation_count: number;
  review_stale: boolean;
  gate_actor: string | null;
  gate_action_at: string | null;
  gate_reason: string | null;
};

type ResearchDashboard = {
  leads: ResearchLeadSummary[];
  connections: ResearchConnectionSummary[];
  lead_count: number;
  connection_count: number;
  publication_ready_connection_count: number;
};

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
  const incidentScope = state.incident_id ?? "00000000-0000-0000-0000-000000000000";
  const stalePostingCutoff = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const [
    { count: ready },
    { count: released },
    { data: researchDashboardRaw, error: researchDashboardError },
    { count: failedSocial },
    { count: stuckSocial },
    { count: responseRequests },
  ] = await Promise.all([
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("incident_id", incidentScope)
      .eq("status", "ready"),
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("incident_id", incidentScope)
      .eq("status", "published"),
    supabase.rpc("get_deadman_research_dashboard", {
      p_incident_id: state.active ? state.incident_id : null,
    }),
    supabase
      .from("deadman_social_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("incident_id", incidentScope)
      .eq("status", "failed"),
    supabase
      .from("deadman_social_dispatches")
      .select("id", { count: "exact", head: true })
      .eq("incident_id", incidentScope)
      .eq("status", "posting")
      .lt("last_attempt_at", stalePostingCutoff),
    supabase
      .from("deadman_updates")
      .select("id", { count: "exact", head: true })
      .eq("incident_id", incidentScope)
      .eq("official_response_status", "requested"),
  ]);
  const researchDashboard = (researchDashboardRaw ?? null) as ResearchDashboard | null;
  const researchLeads = Array.isArray(researchDashboard?.leads)
    ? researchDashboard.leads
    : [];
  const researchConnections = Array.isArray(researchDashboard?.connections)
    ? researchDashboard.connections
    : [];

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
            <Stat label="Research leads" value={researchDashboardError ? "—" : researchDashboard?.lead_count ?? 0} tone="plain" />
            <Stat label="Connections mapped" value={researchDashboardError ? "—" : researchDashboard?.connection_count ?? 0} tone="plain" />
            <Stat label="Connections publishable" value={researchDashboardError ? "—" : researchDashboard?.publication_ready_connection_count ?? 0} tone={!researchDashboardError && (researchDashboard?.publication_ready_connection_count ?? 0) > 0 ? "gold" : "green"} />
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
              Nothing is excluded from lawful internal research. Every public
              update still separates verified facts, attributed allegations,
              editorial inferences, advocacy, and unanswered questions. A
              private lead or proposed connection cannot publish until its
              source, identity, legal, and public-scope gates are affirmatively
              opened.
            </p>
            {researchDashboardError ? (
              <p className="mt-3 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-bold text-red-900">
                The private research dashboard could not be loaded. Counts are not being treated as zero; inspect the database connection before relying on this panel.
              </p>
            ) : null}
            <div className="mt-4 space-y-3">
              {researchLeads.map((lead) => (
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
                  <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
                    <span>{lead.subject_classification.replaceAll("_", " ")}</span>
                    <span>·</span>
                    <span>{lead.identity_confidence.replaceAll("_", " ")}</span>
                    {lead.jurisdiction ? (
                      <>
                        <span>·</span>
                        <span>{lead.jurisdiction}</span>
                      </>
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                    {lead.source_count} sources · {lead.proposition_count} supported propositions · {lead.limitation_count} limitations
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                    Source review: {lead.last_source_review_at ? timeAgo(lead.last_source_review_at) : "never"}
                    {lead.review_stale ? " · stale or missing" : ""}
                    {lead.gate_actor ? ` · last gate action by ${lead.gate_actor}` : ""}
                    {lead.gate_action_at ? ` ${timeAgo(lead.gate_action_at)}` : ""}
                  </p>
                  {lead.gate_reason ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                      Gate audit: {lead.gate_reason}
                    </p>
                  ) : null}
                  {lead.public_safe_scope ? (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                      Public-safe scope: {lead.public_safe_scope}
                    </p>
                  ) : null}
                  {lead.legal_restrictions?.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {lead.legal_restrictions.map((restriction: string) => (
                        <span key={restriction} className="rounded-full border border-red-300 bg-red-50 px-2 py-1 text-[10px] font-bold text-red-900">
                          {restriction.replaceAll("_", " ")}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
            <h3 className="mt-6 font-display text-xl font-black tracking-normal">
              Connection hypotheses
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
              A row here records a question or overlap. It does not establish coordination. A public connection requires exact reviewed wording, claim-level source references, both endpoint gates, and its own human-opened gate.
            </p>
            <div className="mt-3 space-y-3">
              {researchConnections.length ? researchConnections.map((connection) => (
                <section
                  key={connection.id}
                  className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-black text-[var(--color-ink)]">
                      {connection.from_title} ↔ {connection.to_title}
                    </h4>
                    <span className="rounded-full border border-[var(--color-line)] px-2 py-1 text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
                      {connection.publication_ready ? "publication ready" : connection.status.replaceAll("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[var(--color-muted)]">
                    {connection.publication_gate_note}
                  </p>
                  <p className="mt-2 text-[11px] font-bold uppercase tracking-normal text-[var(--color-muted)]">
                    {connection.connection_class.replaceAll("_", " ")} · {connection.relationship_kind.replaceAll("_", " ")} · {connection.confidence.replaceAll("_", " ")}
                  </p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                    {connection.source_count} sources · {connection.claim_count} reviewed claims · {connection.limitation_count} limitations
                    {connection.review_stale ? " · stale review" : ""}
                  </p>
                  {connection.public_summary ? (
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-ink-soft)]">
                      Approved wording: {connection.public_summary}
                    </p>
                  ) : null}
                  {connection.gate_actor || connection.gate_reason ? (
                    <p className="mt-2 text-[11px] leading-relaxed text-[var(--color-muted)]">
                      Gate audit: {connection.gate_actor ?? "unknown actor"}
                      {connection.gate_action_at ? ` ${timeAgo(connection.gate_action_at)}` : ""}
                      {connection.gate_reason ? ` · ${connection.gate_reason}` : ""}
                    </p>
                  ) : null}
                </section>
              )) : (
                <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)] p-4 text-xs text-[var(--color-muted)]">
                  No cross-lead relationship has been entered. Similar timing or subject matter is not treated as a connection by default.
                </p>
              )}
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
