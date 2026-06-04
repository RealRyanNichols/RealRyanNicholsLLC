import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Free tool signals",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type ToolRun = {
  id: string;
  created_at: string;
  tool_slug: string;
  public_ref: string;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  community: string | null;
  location: string | null;
  subject: string | null;
  privacy_level: string;
  input_json: Record<string, unknown>;
  result_json: {
    title?: string;
    summary?: string;
    nextPath?: { label?: string; href?: string };
  } | null;
  clue_tags: string[] | null;
  status: string;
};

type ToolWish = {
  id: string;
  created_at: string;
  public_ref: string;
  tool_name: string;
  problem: string;
  who_it_helps: string | null;
  desired_output: string | null;
  current_workaround: string | null;
  urgency: string;
  contact_email: string | null;
  free_slot_number: number | null;
  pricing_status: string;
  estimated_starting_price_cents: number;
  status: string;
  clue_tags: string[] | null;
};

const toolLabels: Record<string, string> = {
  "records-request": "Records requests",
  "timeline-builder": "Timelines",
  "next-three-moves": "Next moves",
};

export default async function AdminToolsPage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/tools");
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

  const { data, error } = await supabase
    .from("free_tool_runs")
    .select(
      "id, created_at, tool_slug, public_ref, display_name, email, phone, community, location, subject, privacy_level, input_json, result_json, clue_tags, status",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  const { data: wishData, error: wishError } = await supabase
    .from("tool_wishes")
    .select(
      "id, created_at, public_ref, tool_name, problem, who_it_helps, desired_output, current_workaround, urgency, contact_email, free_slot_number, pricing_status, estimated_starting_price_cents, status, clue_tags",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  const runs = (data ?? []) as ToolRun[];
  const wishes = (wishData ?? []) as ToolWish[];
  const counts = runs.reduce<Record<string, number>>((acc, run) => {
    acc[run.tool_slug] = (acc[run.tool_slug] ?? 0) + 1;
    return acc;
  }, {});
  const paidWishCount = wishes.filter(
    (wish) => wish.pricing_status !== "free_request",
  ).length;

  return (
    <article className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-[var(--color-accent)]">
            Admin / free tools
          </p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-normal">
            Tool runs and community signals
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-ink-soft)]">
            These are the people using free tools to ask for records, organize
            timelines, and figure out their next move. This is where the next
            service, article, case file, or paid offer shows itself.
          </p>
        </div>
        <Link
          href="/tools"
          className="rounded-lg border-2 border-[var(--color-success)] bg-[var(--color-success-soft)] px-4 py-2 text-sm font-black text-[var(--color-ink)] transition hover:bg-[var(--color-paper)]"
        >
          Open public tools
        </Link>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Object.entries(toolLabels).map(([slug, label]) => (
          <div
            key={slug}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
              {label}
            </p>
            <p className="mt-2 text-4xl font-black tabular-nums">
              {counts[slug] ?? 0}
            </p>
          </div>
        ))}
        <div className="rounded-lg border-2 border-[var(--color-support)] bg-[var(--color-support-soft)] p-4">
          <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-support-strong)]">
            Tool wishes
          </p>
          <p className="mt-2 text-4xl font-black tabular-nums">
            {wishes.length}
          </p>
          <p className="mt-1 text-xs font-bold text-[var(--color-ink-soft)]">
            {paidWishCount} paid/quote lane
          </p>
        </div>
      </section>

      {error ? (
        <p className="mt-6 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 text-sm font-bold text-[var(--color-accent)]">
          Could not read free tool runs: {error.message}
        </p>
      ) : null}
      {wishError ? (
        <p className="mt-6 rounded-lg border border-[var(--color-accent)] bg-[var(--color-accent-soft)] p-4 text-sm font-bold text-[var(--color-accent)]">
          Could not read tool wishes: {wishError.message}
        </p>
      ) : null}

      <section className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-[var(--color-support-strong)]">
              Tool builder wish queue
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              Requests people want Ryan to build
            </h2>
          </div>
          <Link
            href="/tools#tool-wish"
            className="rounded-lg border-2 border-[var(--color-support)] bg-[var(--color-support)] px-4 py-2 text-sm font-black text-[var(--color-ink)] transition hover:bg-[var(--color-support-soft)]"
          >
            Open wish form
          </Link>
        </div>
        <div className="mt-3 grid gap-3">
          {wishes.length === 0 && !wishError ? (
            <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
              No tool wishes yet.
            </p>
          ) : null}
          {wishes.map((wish) => (
            <article
              key={wish.id}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-support-strong)]">
                    {wish.public_ref} · {wish.urgency} · {wish.status}
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-tight">
                    {wish.tool_name}
                  </h3>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    {formatDistanceToNowStrict(new Date(wish.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-xs font-black uppercase text-[var(--color-muted)]">
                  {wish.free_slot_number
                    ? `Free ${wish.free_slot_number}/3`
                    : `$${(wish.estimated_starting_price_cents / 100).toFixed(2)}+ quote`}
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <InfoBlock
                  label="Problem"
                  lines={[
                    wish.problem,
                    wish.who_it_helps ? `Who it helps: ${wish.who_it_helps}` : null,
                    wish.contact_email ? `Contact: ${wish.contact_email}` : null,
                  ]}
                />
                <InfoBlock
                  label="Build direction"
                  lines={[
                    wish.desired_output ? `Output: ${wish.desired_output}` : null,
                    wish.current_workaround
                      ? `Current workaround: ${wish.current_workaround}`
                      : null,
                    `Pricing: ${wish.pricing_status}`,
                  ]}
                />
              </div>
              {wish.clue_tags && wish.clue_tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {wish.clue_tags.slice(0, 12).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-3">
        {runs.length === 0 && !error ? (
          <p className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-muted)]">
            No free tool runs yet.
          </p>
        ) : null}
        {runs.map((run) => (
          <article
            key={run.id}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-success)]">
                  {toolLabels[run.tool_slug] ?? run.tool_slug} / {run.public_ref}
                </p>
                <h2 className="mt-1 text-xl font-black tracking-tight">
                  {run.subject || run.result_json?.title || "Untitled tool run"}
                </h2>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {formatDistanceToNowStrict(new Date(run.created_at), {
                    addSuffix: true,
                  })}{" "}
                  · {run.status} · {run.privacy_level}
                </p>
              </div>
              <div className="text-xs text-[var(--color-ink-soft)] sm:text-right">
                <p className="font-bold">{run.display_name || "No name"}</p>
                {run.email ? <p className="font-mono">{run.email}</p> : null}
                {run.phone ? <p className="font-mono">{run.phone}</p> : null}
              </div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InfoBlock
                label="Signal"
                lines={[
                  run.community ? `Community: ${run.community}` : null,
                  run.location ? `Location: ${run.location}` : null,
                  run.result_json?.summary ?? null,
                ]}
              />
              <InfoBlock
                label="Input"
                lines={Object.entries(run.input_json ?? {})
                  .slice(0, 5)
                  .map(([key, value]) => `${key}: ${String(value).slice(0, 220)}`)}
              />
            </div>
            {run.clue_tags && run.clue_tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {run.clue_tags.slice(0, 12).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </article>
  );
}

function InfoBlock({
  label,
  lines,
}: {
  label: string;
  lines: Array<string | null | undefined>;
}) {
  const visible = lines.filter((line): line is string => Boolean(line));
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
      <p className="text-[10px] font-black uppercase tracking-normal text-[var(--color-muted)]">
        {label}
      </p>
      <div className="mt-2 space-y-1 text-sm leading-relaxed text-[var(--color-ink-soft)]">
        {visible.length > 0 ? (
          visible.map((line, index) => <p key={`${label}-${index}`}>{line}</p>)
        ) : (
          <p className="italic text-[var(--color-muted)]">No data.</p>
        )}
      </div>
    </div>
  );
}
