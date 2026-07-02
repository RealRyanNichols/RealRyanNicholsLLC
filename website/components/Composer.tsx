"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  POST_VIDEO_BUCKET,
  POST_VIDEO_MAX_BYTES,
  formatBytes,
} from "@/lib/direct-video";
import { VIDEO_CHANNELS } from "@/lib/video-channels";
import {
  COMPOSER_ATTACHMENTS,
  MAX_COMPOSER_IMAGES,
  type AttachmentDef,
} from "@/lib/composer-attachments";
import type { VideoConfigStatus } from "@/lib/video-config";
import type { ComposePrefill } from "@/components/ComposeForm";

// The one-box composer. Facebook-simple: write in the box, tap to attach,
// hit Post. The post type (note / article / photo / video) is derived from
// what's actually in the box — never asked for. Phone-first: big targets,
// sticky action bar, camera-friendly file inputs.

type ImageDraft = {
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
};

type PosterDraft = { blob: Blob; previewUrl: string; custom: boolean };

type Busy = { label: string; progress?: number } | null;

const CATEGORY_SUGGESTIONS = [
  "Reflection",
  "Investigation",
  "Op-Ed",
  "Family",
  "Faith",
  "The Case",
];

// A long body with no headline can't publish as a note (the feed caps notes
// at 2,000 chars server-side).
const NOTE_MAX = 2000;

function readImageDimensions(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const out = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(url);
      resolve(out);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

// The video's OG/share image defaults to its FIRST FRAME, captured in the
// browser the moment the file is picked — no server round-trip. "Replace
// cover" overrides it with any image.
function captureFirstFrame(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    const done = (blob: Blob | null) => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    video.onerror = () => done(null);
    video.onloadeddata = () => {
      // Nudge past t=0 so we get a real frame, not a black decode buffer.
      video.currentTime = Math.min(0.1, video.duration || 0.1);
    };
    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx || !canvas.width || !canvas.height) return done(null);
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((b) => done(b), "image/jpeg", 0.85);
      } catch {
        done(null);
      }
    };
    video.src = url;
  });
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (fraction: number) => void,
  onXhr: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    onXhr(xhr);
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.onabort = () => reject(new Error("Upload canceled."));
    xhr.send(file);
  });
}

async function uploadToBucket(
  bucket: string,
  folder: string,
  file: File | Blob,
  ext: string,
  contentType: string,
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function Composer({
  videoConfig,
  prefill,
}: {
  videoConfig: VideoConfigStatus;
  prefill?: ComposePrefill | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(prefill?.title ?? "");
  const [body, setBody] = useState(prefill?.body ?? "");
  const [category, setCategory] = useState(prefill?.category ?? "");
  const [pinned, setPinned] = useState(false);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [poster, setPoster] = useState<PosterDraft | null>(null);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const posterInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // The type is derived, never asked for.
  const postType: "note" | "text" | "photo" | "video" = video
    ? "video"
    : images.length > 0
      ? "photo"
      : title.trim()
        ? "text"
        : "note";

  const typeLabel =
    postType === "text"
      ? "Article"
      : postType === "note"
        ? "Note"
        : postType === "photo"
          ? "Photo"
          : "Video";

  const needsHeadline =
    (postType === "note" && body.length > NOTE_MAX) || postType === "video";

  const canPost = useMemo(() => {
    if (busy) return false;
    if (postType === "video") return !!video && title.trim().length > 0;
    if (postType === "photo") return images.length > 0;
    return body.trim().length > 0 || title.trim().length > 0;
  }, [busy, postType, video, title, images.length, body]);

  function pickFiles(def: AttachmentDef, files: FileList | null) {
    setError(null);
    if (!files || files.length === 0) return;
    if (def.kind === "video") {
      const f = files[0]!;
      setVideo(f);
      setImages([]);
      setPoster(null);
      // Capture the first frame in the background — it becomes the default
      // cover/OG image unless replaced.
      void captureFirstFrame(f).then((blob) => {
        if (blob) {
          setPoster({ blob, previewUrl: URL.createObjectURL(blob), custom: false });
        }
      });
      return;
    }
    // images
    const incoming = Array.from(files).slice(
      0,
      Math.max(0, MAX_COMPOSER_IMAGES - images.length),
    );
    setVideo(null);
    setPoster(null);
    void Promise.all(
      incoming.map(async (file) => {
        const dims = await readImageDimensions(file);
        return {
          file,
          previewUrl: URL.createObjectURL(file),
          width: dims?.width,
          height: dims?.height,
        } satisfies ImageDraft;
      }),
    ).then((drafts) => setImages((prev) => [...prev, ...drafts]));
  }

  function onPickPoster(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.currentTarget.files?.[0];
    e.currentTarget.value = "";
    if (!f) return;
    setPoster({ blob: f, previewUrl: URL.createObjectURL(f), custom: true });
  }

  async function submit(status: "published" | "draft") {
    setError(null);
    if (postType === "video" && !title.trim()) {
      setError("Give the video a headline — that's what the share card says.");
      return;
    }
    if (postType === "note" && body.length > NOTE_MAX && !title.trim()) {
      setError(
        "Long one. Add a headline and it posts as an article instead of a note.",
      );
      return;
    }
    try {
      if (postType === "photo") {
        setBusy({ label: "Uploading photos…", progress: 0.1 });
        const media = [];
        for (let i = 0; i < images.length; i++) {
          const img = images[i]!;
          const ext = img.file.name.split(".").pop()?.toLowerCase() || "jpg";
          const url = await uploadToBucket(
            "post-media",
            "images",
            img.file,
            ext,
            img.file.type || "image/jpeg",
          );
          setBusy({
            label: `Uploading photos… ${i + 1}/${images.length}`,
            progress: (i + 1) / (images.length + 1),
          });
          media.push({
            url,
            width: img.width,
            height: img.height,
            alt: title.trim() || undefined,
          });
        }
        await createPost({ type: "photo", media }, status);
        return;
      }

      if (postType === "video" && video) {
        // Cover first: custom pick wins, else the captured first frame.
        let thumbnailUrl: string | undefined;
        if (poster) {
          setBusy({ label: "Uploading cover frame…", progress: 0.05 });
          thumbnailUrl = await uploadToBucket(
            "post-media",
            "thumbs",
            poster.blob,
            "jpg",
            "image/jpeg",
          );
        }

        const muxable = videoConfig.muxConfigured;
        if (!muxable) {
          if (video.size > POST_VIDEO_MAX_BYTES) {
            throw new Error(
              `This file is ${formatBytes(video.size)}. Files over ${formatBytes(POST_VIDEO_MAX_BYTES)} need Mux, which isn't configured.`,
            );
          }
          setBusy({ label: "Uploading video…", progress: 0.15 });
          const ext =
            video.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            "mp4";
          const url = await uploadToBucket(
            POST_VIDEO_BUCKET,
            "videos",
            video,
            ext,
            video.type || "video/mp4",
          );
          await createPost(
            {
              type: "video",
              media: [{ url, alt: title.trim() || undefined }],
              thumbnail_url: thumbnailUrl,
            },
            status,
          );
          return;
        }

        // Mux path: create the post first (draft server-side until ready),
        // then stream the file straight to Mux with progress.
        setBusy({ label: "Creating post…", progress: 0.05 });
        const json = await createPostRaw(
          { type: "video", thumbnail_url: thumbnailUrl },
          status,
        );
        const uploadUrl = json.mux_upload_url as string | null;
        if (!uploadUrl) throw new Error("Mux did not return an upload URL.");
        await uploadWithProgress(
          uploadUrl,
          video,
          (p) =>
            setBusy({
              label: `Uploading ${Math.round(p * 100)}%…`,
              progress: 0.1 + p * 0.9,
            }),
          (xhr) => {
            xhrRef.current = xhr;
          },
        );
        xhrRef.current = null;
        setBusy({ label: "Uploaded. Mux is transcoding…", progress: 1 });
        router.push(`/admin/posts/${(json.post as { id: string }).id}/preview`);
        return;
      }

      // text / note
      setBusy({ label: status === "published" ? "Publishing…" : "Saving draft…" });
      await createPost({ type: postType }, status);
    } catch (err) {
      setBusy(null);
      setError(err instanceof Error ? err.message : "Something failed. Try again.");
    }
  }

  async function createPostRaw(
    extra: Record<string, unknown>,
    status: "published" | "draft",
  ) {
    const res = await fetch("/api/admin/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim() || undefined,
        body,
        status,
        category: category.trim() || undefined,
        pinned,
        ...(prefill?.sourceTipId
          ? {
              source_tip_id: prefill.sourceTipId,
              source_tip_mode: prefill.sourceTipMode ?? "article",
            }
          : {}),
        ...extra,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new Error((json.error as string) ?? "Could not create the post.");
    }
    return json;
  }

  async function createPost(
    extra: Record<string, unknown>,
    status: "published" | "draft",
  ) {
    const json = await createPostRaw(extra, status);
    const post = json.post as { slug?: string | null } | undefined;
    setBusy({ label: status === "published" ? "Published." : "Draft saved." });
    if (status === "published" && post?.slug) {
      router.push(`/posts/${post.slug}`);
    } else {
      router.push("/admin/posts");
    }
  }

  return (
    <div className="rounded-2xl border-2 border-[var(--color-line)] bg-[var(--color-surface)]">
      {/* The box */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--color-muted)]">
            Posting as: {typeLabel}
          </span>
          {prefill?.sourceTipId ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-muted)]">
              From a tip
            </span>
          ) : null}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            needsHeadline ? "Headline (required)" : "Headline (optional)"
          }
          maxLength={200}
          className="mt-3 w-full border-0 bg-transparent font-display text-xl sm:text-2xl font-bold tracking-tight placeholder:text-[var(--color-muted)] focus:outline-none"
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's the record today?"
          rows={Math.min(18, Math.max(4, Math.ceil(body.length / 80)))}
          className="mt-2 w-full resize-y border-0 bg-transparent text-base leading-relaxed placeholder:text-[var(--color-muted)] focus:outline-none"
        />

        {/* Image previews */}
        {images.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {images.map((img, i) => (
              <div key={img.previewUrl} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt=""
                  className="aspect-square w-full rounded-lg border border-[var(--color-line)] object-cover"
                />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() =>
                    setImages((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-xs shadow"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Video chip + cover */}
        {video ? (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)] p-3">
            {poster ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={poster.previewUrl}
                alt="Video cover"
                className="h-16 w-28 rounded-md border border-[var(--color-line)] object-cover"
              />
            ) : (
              <div className="grid h-16 w-28 place-items-center rounded-md border border-dashed border-[var(--color-line)] text-[10px] text-[var(--color-muted)]">
                capturing frame…
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{video.name}</p>
              <p className="text-xs text-[var(--color-muted)]">
                {formatBytes(video.size)} · cover ={" "}
                {poster?.custom ? "custom image" : "first frame"}
              </p>
              <div className="mt-1.5 flex gap-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => posterInputRef.current?.click()}
                  className="text-[var(--color-navy)] hover:underline"
                >
                  Replace cover
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVideo(null);
                    setPoster(null);
                  }}
                  className="text-[var(--color-muted)] hover:underline"
                >
                  Remove video
                </button>
              </div>
            </div>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickPoster}
            />
          </div>
        ) : null}

        {/* Attachment row — driven by the registry */}
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] pt-3">
          {COMPOSER_ATTACHMENTS.map((def) => (
            <span key={def.key}>
              <button
                type="button"
                onClick={() => inputRefs.current[def.key]?.click()}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3.5 py-2 text-sm font-bold text-[var(--color-ink)] transition hover:border-[var(--color-navy)]"
              >
                {def.kind === "image" ? <PhotoIcon /> : <VideoIcon />}
                {def.label}
              </button>
              <input
                ref={(el) => {
                  inputRefs.current[def.key] = el;
                }}
                type="file"
                accept={def.accept}
                multiple={def.multiple}
                className="hidden"
                onChange={(e) => {
                  pickFiles(def, e.currentTarget.files);
                  e.currentTarget.value = "";
                }}
              />
            </span>
          ))}

          <div className="ml-auto flex items-center gap-3">
            {postType === "video" ? (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="min-h-11 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-2 text-sm"
                aria-label="Video channel"
              >
                <option value="">Channel…</option>
                {VIDEO_CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ) : (
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                list="composer-categories"
                placeholder="Category"
                maxLength={60}
                className="min-h-11 w-32 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-2.5 py-2 text-sm"
              />
            )}
            <datalist id="composer-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <label className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 text-sm font-bold text-[var(--color-ink-soft)]">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="h-4 w-4"
              />
              Pin
            </label>
          </div>
        </div>
      </div>

      {/* Action bar — sticky on phones so Publish is always a thumb away */}
      <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-b-2xl border-t border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-3 sm:static">
        <div className="min-w-0 flex-1">
          {busy ? (
            <div>
              <p className="truncate text-xs font-bold text-[var(--color-ink-soft)]">
                {busy.label}
              </p>
              {typeof busy.progress === "number" ? (
                <div className="mt-1 h-1.5 w-full max-w-56 overflow-hidden rounded-full bg-[var(--color-line-soft)]">
                  <div
                    className="h-full bg-[var(--color-navy)] transition-[width]"
                    style={{ width: `${Math.round(busy.progress * 100)}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : error ? (
            <p className="text-xs font-bold text-[var(--color-danger)]">{error}</p>
          ) : (
            <p className="text-xs text-[var(--color-muted)]">
              Publishes to the feed and pings the search engines.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={!canPost}
            onClick={() => submit("draft")}
            className="min-h-11 rounded-lg px-3.5 py-2 text-sm font-bold text-[var(--color-ink-soft)] transition hover:text-[var(--color-ink)] disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={!canPost}
            onClick={() => submit("published")}
            className="btn-accent inline-flex min-h-11 items-center px-6 py-2.5 text-sm disabled:opacity-40"
          >
            Post →
          </button>
        </div>
      </div>
    </div>
  );
}

function PhotoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m21 15-4.5-4.5L7 20" />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
      <rect x="3" y="6" width="13" height="12" rx="2" />
      <path d="m16 10 5-3v10l-5-3" />
    </svg>
  );
}
