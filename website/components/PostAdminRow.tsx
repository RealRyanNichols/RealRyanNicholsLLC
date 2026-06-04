"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PostAdminRow({
  id,
  slug,
  title,
  bodyExcerpt,
  type,
  category,
  muxStatus,
  muxPlaybackId,
  directVideoUrl,
  pinned,
  status,
  viewsCount,
  sharesCount,
  publishedAtRelative,
  publishedAtAbsolute,
}: {
  id: string;
  slug: string;
  title: string | null;
  bodyExcerpt: string | null;
  type: string;
  category: string | null;
  muxStatus: string | null;
  muxPlaybackId: string | null;
  directVideoUrl: string | null;
  pinned: boolean;
  status: string;
  viewsCount: number;
  sharesCount: number;
  publishedAtRelative: string;
  publishedAtAbsolute: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isVideo = type === "video";
  const directVideoReady = isVideo && !!directVideoUrl && !muxPlaybackId;
  const videoReady =
    isVideo && ((muxStatus === "ready" && !!muxPlaybackId) || !!directVideoUrl);
  const canPublish = !isVideo || videoReady;
  const deadmanQueued = category === "deadman-release";
  const inspectHref =
    status === "published" ? `/posts/${slug}` : `/admin/posts/${id}/preview`;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Update failed.");
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function destroy() {
    if (
      !confirm(
        `Delete this post? This is permanent. (Title: "${title ?? bodyExcerpt?.slice(0, 60) ?? "(no title)"}")`,
      )
    ) {
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Delete failed.");
      }
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-xs text-[var(--color-muted)]">
            <TypeBadge type={type} />
            {pinned ? (
              <span className="rounded-full bg-[var(--color-accent)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                📌 PINNED
              </span>
            ) : null}
            {status === "draft" ? (
              <span className="rounded-full bg-[var(--color-tag-procedural)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                DRAFT
              </span>
            ) : null}
            {deadmanQueued ? (
              <span className="rounded-full bg-[#d8ad43] text-[#1a1410] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                DEADMAN READY
              </span>
            ) : null}
            {isVideo ? (
              <VideoStateBadge
                status={muxStatus}
                ready={videoReady}
                direct={directVideoReady}
              />
            ) : null}
            {category ? <span className="uppercase">{category}</span> : null}
            <span title={publishedAtAbsolute}>· {publishedAtRelative}</span>
          </div>
          <h3 className="mt-1 text-base sm:text-lg font-bold tracking-tight">
            <Link
              href={inspectHref}
              target="_blank"
              className="hover:text-[var(--color-accent)]"
            >
              {title || bodyExcerpt?.slice(0, 80) || "(no title)"}
            </Link>
          </h3>
          {bodyExcerpt && title ? (
            <p className="mt-1 text-xs text-[var(--color-ink-soft)] line-clamp-2">
              {bodyExcerpt}
            </p>
          ) : null}
          <p className="mt-1.5 text-[11px] text-[var(--color-muted)] tabular-nums">
            {viewsCount.toLocaleString()} views · {sharesCount.toLocaleString()}{" "}
            shares · /{slug}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch flex-shrink-0 sm:min-w-[140px]">
          <button
            type="button"
            disabled={busy}
            onClick={() => patch({ pinned: !pinned })}
            className={[
              "rounded-md px-3 py-1.5 text-xs font-bold transition disabled:opacity-50",
              pinned
                ? "border border-[var(--color-line)] hover:border-[var(--color-accent)]"
                : "bg-[var(--color-accent)] text-[var(--color-paper)] hover:bg-[var(--color-accent-strong)]",
            ].join(" ")}
            title={pinned ? "Remove pin" : "Pin to top of feed"}
          >
            {pinned ? "Unpin" : "📌 Pin"}
          </button>
          {status === "published" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => patch({ status: "draft" })}
              className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
              title="Move to drafts — hides from public feed"
            >
              Make draft
            </button>
          ) : (
            <button
              type="button"
              disabled={busy || !canPublish}
              onClick={() => patch({ status: "published" })}
              className="rounded-md bg-[var(--color-success)] hover:opacity-90 px-3 py-1.5 text-xs font-bold text-[var(--color-paper)] disabled:opacity-50 disabled:cursor-not-allowed"
              title={
                canPublish
                  ? "Publish - show in public feed"
                  : "Video needs an uploaded file or finished Mux processing before it can be published"
              }
            >
              {videoReady ? "Publish video" : "Publish"}
            </button>
          )}
          {status === "draft" ? (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                patch({
                  category: deadmanQueued ? null : "deadman-release",
                })
              }
              className={[
                "rounded-md px-3 py-1.5 text-xs font-bold transition disabled:opacity-50",
                deadmanQueued
                  ? "border border-[#d8ad43] text-[#7a5100] hover:bg-[#fff5d6]"
                  : "bg-[#d8ad43] text-[#1a1410] hover:bg-[#e1b94e]",
              ].join(" ")}
              title={
                deadmanQueued
                  ? "Remove from deadman release queue"
                  : "Approve this draft for deadman release"
              }
            >
              {deadmanQueued ? "Unqueue" : "Safe release"}
            </button>
          ) : null}
          <Link
            href={`/admin/posts/${id}/preview`}
            className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-center"
            title="Preview this post inside admin"
          >
            Preview
          </Link>
          <Link
            href={`/admin/new?id=${id}`}
            className="rounded-md border border-[var(--color-line)] hover:border-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-center"
            title="Edit (compose form, prefilled)"
          >
            ✏️ Edit
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={destroy}
            className="rounded-md border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
            title="Delete permanently"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
      {err ? (
        <p className="mt-2 text-xs text-[var(--color-accent)]">{err}</p>
      ) : null}
    </article>
  );
}

function VideoStateBadge({
  status,
  ready,
  direct,
}: {
  status: string | null;
  ready: boolean;
  direct: boolean;
}) {
  if (direct) {
    return (
      <span className="rounded-full bg-[var(--color-success)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
        DIRECT FILE READY
      </span>
    );
  }
  if (ready) {
    return (
      <span className="rounded-full bg-[var(--color-success)] text-[var(--color-paper)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
        READY TO PUBLISH
      </span>
    );
  }
  const label =
    status === "errored"
      ? "VIDEO ERROR"
      : status === "processing"
        ? "PROCESSING"
        : status === "uploading"
          ? "UPLOADING"
          : "VIDEO NOT READY";
  return (
    <span className="rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
      {label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    text: "bg-[var(--color-surface-2)] text-[var(--color-ink-soft)]",
    note: "bg-[var(--color-blue-soft)] text-[var(--color-blue)]",
    photo: "bg-[var(--color-tag-procedural)] text-[var(--color-paper)]",
    video: "bg-[var(--color-accent)] text-[var(--color-paper)]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
        styles[type] ?? styles.text
      }`}
    >
      {type}
    </span>
  );
}
