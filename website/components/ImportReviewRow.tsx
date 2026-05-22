"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const THEME_LABEL: Record<string, string> = {
  entrapment: "🪤 entrapment",
  excessive_force: "💥 force",
  death_or_injury: "🏥 death/injury",
  police_misconduct: "🚓 police",
  government_lies: "🤥 govt lies",
  contradiction: "🔁 contradiction",
  due_process: "⚖️ due process",
  abuse_in_custody: "🔒 custody",
};

export function ImportReviewRow({
  id,
  title,
  description,
  docType,
  documentDate,
  externalUrl,
  sourceLabel,
  reviewStatus,
  evidenceThemes,
  importanceScore,
  matchConfidence,
  createdAtRelative,
  createdAtAbsolute,
  person,
}: {
  id: string;
  title: string;
  description: string | null;
  docType: string | null;
  documentDate: string | null;
  externalUrl: string | null;
  sourceLabel: string | null;
  reviewStatus: string;
  evidenceThemes: string[];
  importanceScore: number;
  matchConfidence: number | null;
  createdAt: string;
  createdAtRelative: string;
  createdAtAbsolute: string;
  person: { id: string; slug: string; name: string } | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function act(action: "approve" | "reject", body?: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/imports/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `${action} failed.`);
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : `${action} failed.`);
    } finally {
      setBusy(false);
    }
  }

  function onReject() {
    const reason = prompt("Reject this import — reason? (optional)") ?? null;
    act("reject", { reason });
  }

  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex items-start gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {importanceScore > 0 ? (
              <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-2 py-0.5 font-bold uppercase tracking-wider">
                ★ {importanceScore}
              </span>
            ) : null}
            {docType ? (
              <span className="rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] px-2 py-0.5 font-bold uppercase tracking-wider">
                {docType}
              </span>
            ) : null}
            {reviewStatus !== "pending" ? (
              <span
                className={[
                  "rounded-full px-2 py-0.5 font-bold uppercase tracking-wider",
                  reviewStatus === "approved"
                    ? "bg-[var(--color-success)] text-[var(--color-paper)]"
                    : "bg-[var(--color-accent-soft)] text-[var(--color-accent)] border border-[var(--color-accent)]",
                ].join(" ")}
              >
                {reviewStatus}
              </span>
            ) : null}
            <span
              className="text-[var(--color-muted)]"
              title={createdAtAbsolute}
            >
              {createdAtRelative}
            </span>
          </div>

          <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight">
            {title}
          </h3>

          {evidenceThemes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {evidenceThemes.map((t) => (
                <span
                  key={t}
                  className="text-[11px] rounded-full border border-[var(--color-accent)] text-[var(--color-accent)] px-2 py-0.5 font-bold"
                >
                  {THEME_LABEL[t] ?? t}
                </span>
              ))}
            </div>
          ) : null}

          {description ? (
            <p className="mt-2 text-sm text-[var(--color-ink-soft)] line-clamp-3 whitespace-pre-wrap">
              {description}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
            {person ? (
              <Link
                href={`/case/people/${person.slug}`}
                target="_blank"
                className="text-[var(--color-accent)] hover:underline font-semibold"
              >
                {person.name}
                {matchConfidence != null
                  ? ` (${Math.round(matchConfidence * 100)}%)`
                  : ""}
              </Link>
            ) : (
              <span className="italic">Unmatched</span>
            )}
            {documentDate ? <span>· {documentDate}</span> : null}
            {sourceLabel ? <span>· {sourceLabel}</span> : null}
            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-accent)] hover:underline"
              >
                Open source →
              </a>
            ) : null}
          </div>
        </div>

        {reviewStatus === "pending" ? (
          <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch flex-shrink-0 sm:min-w-[120px]">
            <button
              type="button"
              disabled={busy}
              onClick={() => act("approve")}
              className="rounded-md bg-[var(--color-success)] text-[var(--color-paper)] hover:opacity-90 px-3 py-1.5 text-xs font-bold disabled:opacity-50"
            >
              ✓ Approve
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onReject}
              className="rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            >
              ✗ Reject
            </button>
          </div>
        ) : null}
      </div>
      {err ? (
        <p className="mt-2 text-xs text-[var(--color-accent)]">{err}</p>
      ) : null}
    </article>
  );
}
