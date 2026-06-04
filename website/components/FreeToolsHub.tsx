"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics";

type ToolSlug = "records-request" | "timeline-builder" | "next-three-moves";

type RecordsInput = {
  agency: string;
  jurisdiction: string;
  records: string;
  date_range: string;
  people: string;
  delivery: string;
};

type TimelineInput = {
  event_date: string;
  place: string;
  people: string;
  happened: string;
  proof: string;
  missing: string;
};

type MovesInput = {
  issue_type: string;
  deadline: string;
  proof: string;
  goal: string;
};

type ToolResult = {
  title: string;
  summary: string;
  sections: { label: string; body: string[] }[];
  copyText: string;
  nextPath: { label: string; href: string };
};

type ApiResponse =
  | { ok: true; saved: boolean; public_ref: string; result: ToolResult }
  | { error?: string };

function isToolSuccess(response: ApiResponse): response is Extract<ApiResponse, { ok: true }> {
  return "ok" in response && response.ok === true;
}

const TOOLS: {
  slug: ToolSlug;
  label: string;
  short: string;
  eyebrow: string;
  body: string;
  button: string;
}[] = [
  {
    slug: "records-request",
    label: "Records Request Builder",
    short: "Records",
    eyebrow: "Get the missing record",
    body: "Turn a messy ask into a cleaner public-records request you can send.",
    button: "Build request",
  },
  {
    slug: "timeline-builder",
    label: "Timeline Starter",
    short: "Timeline",
    eyebrow: "Make facts readable",
    body: "Convert one incident into a dated, proof-backed timeline card.",
    button: "Build timeline",
  },
  {
    slug: "next-three-moves",
    label: "Next 3 Moves",
    short: "Moves",
    eyebrow: "Stop spinning",
    body: "Get a simple evidence-first checklist for what to do next.",
    button: "Get moves",
  },
];

const input =
  "w-full rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]";

const USE_GATE = 5;

function readUsage(slug: ToolSlug): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(`free_tool_success_count:${slug}`);
  const count = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(count) ? Math.max(0, count) : 0;
}

export function FreeToolsHub() {
  const [active, setActive] = useState<ToolSlug>("records-request");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [community, setCommunity] = useState("");
  const [location, setLocation] = useState("");
  const [subject, setSubject] = useState("");
  const [publicSummary, setPublicSummary] = useState(true);
  const [busy, setBusy] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [usage, setUsage] = useState<Record<ToolSlug, number>>({
    "records-request": 0,
    "timeline-builder": 0,
    "next-three-moves": 0,
  });
  const [result, setResult] = useState<{
    publicRef: string;
    saved: boolean;
    result: ToolResult;
  } | null>(null);

  const [records, setRecords] = useState({
    agency: "",
    jurisdiction: "Texas",
    records: "",
    date_range: "",
    people: "",
    delivery: "Email or portal delivery",
  });
  const [timeline, setTimeline] = useState({
    event_date: "",
    place: "",
    people: "",
    happened: "",
    proof: "",
    missing: "",
  });
  const [moves, setMoves] = useState({
    issue_type: "records problem",
    deadline: "",
    proof: "",
    goal: "",
  });

  const activeTool = useMemo(
    () => TOOLS.find((tool) => tool.slug === active) ?? TOOLS[0],
    [active],
  );
  const activeUses = usage[active] || 0;
  const supportReady = activeUses >= USE_GATE;

  useEffect(() => {
    setUsage({
      "records-request": readUsage("records-request"),
      "timeline-builder": readUsage("timeline-builder"),
      "next-three-moves": readUsage("next-three-moves"),
    });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setResult(null);
    const inputPayload =
      active === "records-request"
        ? records
        : active === "timeline-builder"
          ? timeline
          : moves;
    trackEvent("free_tool_attempt", { tool: active });

    try {
      const response = await fetch("/api/free-tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool_slug: active,
          display_name: displayName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          community: community || undefined,
          location: location || undefined,
          subject: subject || undefined,
          privacy_level: publicSummary ? "public_summary" : "private",
          input: inputPayload,
        }),
      });
      const json = (await response.json().catch(() => ({}))) as ApiResponse;
      if (!response.ok || !isToolSuccess(json)) {
        trackEvent("free_tool_failed", { tool: active, reason: "api" });
        setError(
          isToolSuccess(json)
            ? "Could not run the tool."
            : json.error ?? "Could not run the tool.",
        );
        return;
      }
      trackEvent("free_tool_success", {
        tool: active,
        saved: json.saved,
        public_summary: publicSummary,
      });
      const nextCount = readUsage(active) + 1;
      try {
        window.localStorage.setItem(
          `free_tool_success_count:${active}`,
          String(nextCount),
        );
      } catch {
        // Local usage is only for the on-page prompt; server analytics still track use.
      }
      setUsage((current) => ({ ...current, [active]: nextCount }));
      if (nextCount === USE_GATE) {
        trackEvent("free_tool_support_prompt_seen", {
          tool: active,
          use_count: nextCount,
        });
      }
      setResult({
        publicRef: json.public_ref,
        saved: json.saved,
        result: json.result,
      });
    } catch {
      trackEvent("free_tool_failed", { tool: active, reason: "network" });
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function copyResult() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.result.copyText);
      trackEvent("free_tool_copy", { tool: active });
    } catch {
      // Clipboard is a convenience; the visible result remains usable.
    }
  }

  async function startToolPass() {
    if (payBusy) return;
    setPayBusy(true);
    setPayError(null);
    trackEvent("free_tool_pass_click", { tool: active, use_count: activeUses });
    try {
      const response = await fetch("/api/checkout/tool-pass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tool_slug: active }),
      });
      const json = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!response.ok || !json.url) {
        setPayError(json.error ?? "Tool pass checkout is not configured yet.");
        trackEvent("free_tool_pass_failed", { tool: active, reason: "api" });
        return;
      }
      window.location.href = json.url;
    } catch {
      setPayError("Checkout failed. Try again.");
      trackEvent("free_tool_pass_failed", { tool: active, reason: "network" });
    } finally {
      setPayBusy(false);
    }
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
      <aside className="min-w-0 lg:sticky lg:top-24">
        <div className="grid grid-cols-3 gap-1.5 lg:grid-cols-1 lg:gap-2">
          {TOOLS.map((tool) => (
            <button
              key={tool.slug}
              type="button"
              onClick={() => {
                setActive(tool.slug);
                setError(null);
                setResult(null);
                trackEvent("free_tool_select", { tool: tool.slug });
              }}
              aria-pressed={active === tool.slug}
              className={[
                "min-h-[5rem] rounded-md border p-2.5 text-left transition sm:p-3 lg:min-h-[5.9rem]",
                active === tool.slug
                  ? "border-[var(--color-success)] bg-[var(--color-success-soft)] shadow-sm"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--color-success)]",
              ].join(" ")}
            >
              <p className="hidden text-[10px] font-black uppercase tracking-normal text-[var(--color-success)] sm:block">
                {tool.eyebrow}
              </p>
              <h2 className="text-sm font-black leading-tight tracking-tight sm:mt-1 sm:text-base lg:text-lg">
                <span className="sm:hidden">{tool.short}</span>
                <span className="hidden sm:inline">{tool.label}</span>
              </h2>
              <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-[var(--color-ink-soft)] sm:text-xs lg:text-sm">
                {tool.body}
              </p>
              <p className="mt-2 font-mono text-[10px] font-black uppercase text-[var(--color-muted)]">
                {Math.min(usage[tool.slug] || 0, USE_GATE)}/{USE_GATE}
              </p>
            </button>
          ))}
        </div>
        <div className="mt-2 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3 text-xs leading-relaxed text-[var(--color-ink-soft)]">
          <p className="font-black uppercase tracking-normal text-[var(--color-muted)]">
            Data rule
          </p>
          <p className="mt-1">
            We track use, completion, copy clicks, and checkout interest before
            turning any tool into a tiny paid pass.
          </p>
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
        <div className="border-b border-[var(--color-line)] p-4 sm:p-5">
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            Free tool
          </p>
          <h2 className="mt-1 font-display text-2xl font-bold leading-tight tracking-normal sm:text-3xl">
            {activeTool.label}
          </h2>
          <div className="mt-3 grid gap-2 text-sm leading-relaxed text-[var(--color-ink-soft)] md:grid-cols-[1fr_auto] md:items-center">
            <p>
              You get the output immediately. Ryan gets a structured signal to
              spot patterns, missing records, local issues, and tools worth
              funding.
            </p>
            <div className="grid grid-cols-[1fr_auto] items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 md:min-w-48">
              <span className="text-[11px] font-black uppercase text-[var(--color-muted)]">
                Successful uses
              </span>
              <span className="font-mono text-lg font-black text-[var(--color-success)]">
                {activeUses}/{USE_GATE}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="grid gap-3 p-4 sm:p-5">
          {active === "records-request" ? (
            <RecordsFields value={records} onChange={setRecords} />
          ) : active === "timeline-builder" ? (
            <TimelineFields value={timeline} onChange={setTimeline} />
          ) : (
            <MovesFields value={moves} onChange={setMoves} />
          )}

          <details className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)]">
            <summary className="grid min-h-11 cursor-pointer list-none grid-cols-[1fr_auto] items-center gap-3 px-3 py-2 text-sm font-black [&::-webkit-details-marker]:hidden">
              <span>
                Optional: help map the pattern
                <span className="mt-0.5 block text-xs font-semibold text-[var(--color-muted)]">
                  Add community, location, subject, or contact.
                </span>
              </span>
              <span className="text-xl text-[var(--color-success)]" aria-hidden>
                +
              </span>
            </summary>
            <div className="grid gap-3 border-t border-[var(--color-line)] p-3 sm:grid-cols-2">
              <Field label="Community">
                <input
                  value={community}
                  onChange={(event) => setCommunity(event.target.value)}
                  maxLength={180}
                  placeholder="J6 families, East Texas parents..."
                  className={input}
                />
              </Field>
              <Field label="Location">
                <input
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={180}
                  placeholder="City, county, state"
                  className={input}
                />
              </Field>
              <Field label="Subject">
                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  maxLength={220}
                  placeholder="Agency, court, company, issue"
                  className={input}
                />
              </Field>
              <Field label="Contact">
                <div className="grid gap-2">
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="email, optional"
                    className={input}
                  />
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    type="tel"
                    placeholder="phone, optional"
                    className={input}
                  />
                </div>
              </Field>
              <Field label="Name">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={120}
                  placeholder="optional"
                  className={input}
                />
              </Field>
              <label className="flex gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3 text-xs font-semibold leading-relaxed sm:col-span-2">
                <input
                  type="checkbox"
                  checked={publicSummary}
                  onChange={(event) => setPublicSummary(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-[var(--color-success)]"
                />
                <span>
                  Add an anonymous public signal to the intake ledger. Private
                  details and contact info stay private; the public only sees
                  that this type of issue/tool run came in.
                </span>
              </label>
            </div>
          </details>

          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-3 text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)] disabled:opacity-60"
          >
            {busy ? "Building..." : activeTool.button}
          </button>
        </form>

        {error ? (
          <p className="mx-4 mb-4 rounded-md border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-3 text-sm font-bold text-[var(--color-accent)] sm:mx-5">
            {error}
          </p>
        ) : null}

        {result ? (
          <section className="border-t border-[var(--color-line)] bg-[var(--color-success-soft)] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
                  {result.saved ? `Saved ${result.publicRef}` : "Built"}
                </p>
                <h3 className="mt-1 text-2xl font-black tracking-tight">
                  {result.result.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
                  {result.result.summary}
                </p>
              </div>
              <button
                type="button"
                onClick={copyResult}
                className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs font-black uppercase tracking-normal transition hover:border-[var(--color-success)]"
              >
                Copy
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {result.result.sections.map((section) => (
                <div
                  key={section.label}
                  className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-3"
                >
                  <p className="text-xs font-black uppercase tracking-normal text-[var(--color-success)]">
                    {section.label}
                  </p>
                  <div className="mt-2 space-y-1.5 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {section.body.map((line, index) => (
                      <p key={`${section.label}-${index}`}>{line || "\u00a0"}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Link
                href={result.result.nextPath.href}
                className="grid min-h-11 place-items-center rounded-md border-2 border-[var(--color-accent)] bg-[var(--color-accent)] px-4 py-2 text-center text-sm font-black text-[var(--color-paper)] transition hover:bg-[var(--color-accent-strong)]"
              >
                {result.result.nextPath.label}
              </Link>
              <Link
                href="/store/strategy-call-30"
                className="grid min-h-11 place-items-center rounded-md border-2 border-[var(--color-support)] bg-[var(--color-support-soft)] px-4 py-2 text-center text-sm font-black text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
              >
                Have Ryan build it with me
              </Link>
            </div>

            <section className="mt-4 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
                    {supportReady ? "Tool pass ready" : "Prove it first"}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
                    {supportReady
                      ? "You have used this successfully enough times to justify a tiny support ask. The long-term plan is 99 cents/month for heavy repeat use, only after the data proves people want it."
                      : `Use this ${USE_GATE} successful times first. Then the site can ask for a tiny monthly tool pass only if the heatmap and completion data say it is worth keeping.`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startToolPass}
                  disabled={payBusy || !supportReady}
                  className={[
                    "min-h-11 rounded-md border px-4 py-2 text-sm font-black transition",
                    supportReady
                      ? "border-[var(--color-support)] bg-[var(--color-support)] text-[#1a1410] hover:bg-[#e1b94e]"
                      : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]",
                  ].join(" ")}
                >
                  {payBusy ? "Opening..." : supportReady ? "Keep using" : `${activeUses}/${USE_GATE} uses`}
                </button>
              </div>
              {payError ? (
                <p className="mt-2 text-xs font-bold text-[var(--color-accent)]">
                  {payError}
                </p>
              ) : null}
            </section>
          </section>
        ) : null}
      </section>
    </div>
  );
}

function RecordsFields({
  value,
  onChange,
}: {
  value: RecordsInput;
  onChange: (value: RecordsInput) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Agency / office" required>
          <input
            required
            value={value.agency}
            onChange={(event) => onChange({ ...value, agency: event.target.value })}
            placeholder="Sheriff, school district, court clerk..."
            className={input}
          />
        </Field>
        <Field label="State / jurisdiction">
          <input
            value={value.jurisdiction}
            onChange={(event) => onChange({ ...value, jurisdiction: event.target.value })}
            placeholder="Texas, federal, county..."
            className={input}
          />
        </Field>
      </div>
      <Field label="What records do you want?" required>
        <textarea
          required
          value={value.records}
          onChange={(event) => onChange({ ...value, records: event.target.value })}
          rows={5}
          placeholder="Bodycam, emails, incident report, dispatch logs, policies, meeting minutes..."
          className={input}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date range">
          <input
            value={value.date_range}
            onChange={(event) => onChange({ ...value, date_range: event.target.value })}
            placeholder="Jan 1, 2025 through today"
            className={input}
          />
        </Field>
        <Field label="Names / case numbers">
          <input
            value={value.people}
            onChange={(event) => onChange({ ...value, people: event.target.value })}
            placeholder="Names, report number, cause number"
            className={input}
          />
        </Field>
      </div>
    </div>
  );
}

function TimelineFields({
  value,
  onChange,
}: {
  value: TimelineInput;
  onChange: (value: TimelineInput) => void;
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Date / time" required>
          <input
            required
            value={value.event_date}
            onChange={(event) => onChange({ ...value, event_date: event.target.value })}
            placeholder="Exact or approximate"
            className={input}
          />
        </Field>
        <Field label="Place">
          <input
            value={value.place}
            onChange={(event) => onChange({ ...value, place: event.target.value })}
            placeholder="City, building, court, jail, agency"
            className={input}
          />
        </Field>
      </div>
      <Field label="People / agencies involved">
        <input
          value={value.people}
          onChange={(event) => onChange({ ...value, people: event.target.value })}
          placeholder="Names, offices, agencies, witnesses"
          className={input}
        />
      </Field>
      <Field label="What happened?" required>
        <textarea
          required
          value={value.happened}
          onChange={(event) => onChange({ ...value, happened: event.target.value })}
          rows={5}
          placeholder="Plain English. One event. No speech. What happened?"
          className={input}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Proof you have">
          <textarea
            value={value.proof}
            onChange={(event) => onChange({ ...value, proof: event.target.value })}
            rows={4}
            placeholder="Screenshot, filing, video, text, email..."
            className={input}
          />
        </Field>
        <Field label="Missing record">
          <textarea
            value={value.missing}
            onChange={(event) => onChange({ ...value, missing: event.target.value })}
            rows={4}
            placeholder="Bodycam, transcript, order, policy, log..."
            className={input}
          />
        </Field>
      </div>
    </div>
  );
}

function MovesFields({
  value,
  onChange,
}: {
  value: MovesInput;
  onChange: (value: MovesInput) => void;
}) {
  return (
    <div className="grid gap-3">
      <Field label="What kind of problem is this?">
        <select
          value={value.issue_type}
          onChange={(event) => onChange({ ...value, issue_type: event.target.value })}
          className={input}
        >
          <option>records problem</option>
          <option>court / filing problem</option>
          <option>family court issue</option>
          <option>criminal case organization</option>
          <option>public corruption tip</option>
          <option>business dispute</option>
          <option>online cancellation / censorship</option>
        </select>
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Deadline">
          <input
            value={value.deadline}
            onChange={(event) => onChange({ ...value, deadline: event.target.value })}
            placeholder="Hearing date, appeal date, records deadline..."
            className={input}
          />
        </Field>
        <Field label="Goal">
          <input
            value={value.goal}
            onChange={(event) => onChange({ ...value, goal: event.target.value })}
            placeholder="Expose, organize, respond, request records..."
            className={input}
          />
        </Field>
      </div>
      <Field label="What proof do you already have?" required>
        <textarea
          required
          value={value.proof}
          onChange={(event) => onChange({ ...value, proof: event.target.value })}
          rows={5}
          placeholder="List the first documents, links, screenshots, videos, dates, or messages."
          className={input}
        />
      </Field>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1 text-sm font-bold text-[var(--color-ink)]">
      <span>
        {label}
        {required ? <span className="text-[var(--color-accent)]"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
