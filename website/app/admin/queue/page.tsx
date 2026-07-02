import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { QueueActions } from "@/components/QueueActions";

export const metadata: Metadata = {
  title: "Content queue",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const BEAT_LABEL: Record<string, string> = {
  ryan: "Ryan",
  national: "National",
  local: "East Texas",
  liberty: "Liberty",
};

type QueueRow = {
  id: string;
  beat: string;
  title: string;
  body: string;
  status: string;
  requires_manual_review: boolean | null;
  gag_order_flag: boolean | null;
  rejected_reason: string | null;
  created_at: string;
};

export default async function AdminQueuePage() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login?next=/admin/queue");
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

  if (!isSupabaseServiceConfigured()) {
    return (
      <article className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold">Content queue</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
          The Supabase service role is not configured here, so the queue cannot
          be read.
        </p>
      </article>
    );
  }

  const svc = getSupabaseServiceClient();
  const { data } = await svc
    .from("content_queue")
    .select(
      "id, beat, title, body, status, requires_manual_review, gag_order_flag, rejected_reason, created_at",
    )
    .in("status", ["draft", "approved"])
    .order("status", { ascending: true }) // approved before draft
    .order("created_at", { ascending: false })
    .limit(50);
  const rows = (data ?? []) as QueueRow[];
  const approved = rows.filter((r) => r.status === "approved");
  const drafts = rows.filter((r) => r.status === "draft");

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Content queue</h1>
        <p className="text-sm text-[var(--color-muted)]">
          {approved.length} ready to publish · {drafts.length} awaiting review
        </p>
      </header>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        Drafts written by the daily engine. Nothing reaches the public feed
        until you approve it and press Publish — that click is the manual
        review. Publishing creates the post and pings the search engines.{" "}
        <Link href="/admin/new" className="text-[var(--color-navy)] font-bold hover:underline">
          Write fresh instead →
        </Link>
      </p>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-sm text-[var(--color-ink-soft)]">
          Queue&apos;s clear. New drafts land here when the daily engine runs.
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {[...approved, ...drafts].map((row) => (
            <section
              key={row.id}
              className={[
                "rounded-2xl border-2 p-5",
                row.status === "approved"
                  ? "border-[var(--color-navy)] bg-[var(--color-surface)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
                <span className="rounded border border-[var(--color-line)] px-1.5 py-0.5">
                  {BEAT_LABEL[row.beat] ?? row.beat}
                </span>
                <span
                  className={
                    row.status === "approved"
                      ? "text-[var(--color-navy)]"
                      : undefined
                  }
                >
                  {row.status}
                </span>
                {row.gag_order_flag ? (
                  <span className="text-[var(--color-danger)]">gag-flagged</span>
                ) : null}
                <span className="ml-auto font-normal normal-case">
                  {formatDistanceToNowStrict(new Date(row.created_at))} ago
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold leading-snug">
                {row.title}
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--color-ink-soft)]">
                {row.body.length > 600 ? `${row.body.slice(0, 600)}…` : row.body}
              </p>
              <div className="mt-4">
                <QueueActions id={row.id} status={row.status} />
              </div>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
