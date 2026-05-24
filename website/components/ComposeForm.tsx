"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { POST_VIDEO_BUCKET, POST_VIDEO_MAX_BYTES, formatBytes } from "@/lib/direct-video";
import { VIDEO_CHANNELS } from "@/lib/video-channels";
import type { VideoConfigStatus } from "@/lib/video-config";

type Tab = "text" | "note" | "photo" | "video";

type Media = { url: string; width?: number; height?: number; alt?: string };

type State =
  | { kind: "idle" }
  | { kind: "submitting"; progress?: number; label?: string }
  | { kind: "error"; message: string };

export type ComposeInitial = {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  pinned: boolean;
};

export function ComposeForm({
  videoConfig,
  initial,
}: {
  videoConfig: VideoConfigStatus;
  initial?: ComposeInitial | null;
}) {
  const [tab, setTab] = useState<Tab>("text");

  // When editing an existing post we lock to its type and skip the picker.
  // Photo/video edits aren't supported in this form yet — text/body only.
  if (initial) {
    if (initial.type === "text") {
      return <TextForm initial={initial} />;
    }
    if (initial.type === "note") {
      return <NoteForm initial={initial} />;
    }
    return (
      <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] p-5">
        <h2 className="text-base font-bold">
          Editing {initial.type} posts isn&apos;t supported here yet.
        </h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          Use the admin row actions to pin / unpin, toggle draft / published, or
          delete. To replace the media, delete and recreate.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-line)] mb-6">
        <TabButton active={tab === "text"} onClick={() => setTab("text")}>
          Essay
        </TabButton>
        <TabButton active={tab === "note"} onClick={() => setTab("note")}>
          Note
        </TabButton>
        <TabButton active={tab === "photo"} onClick={() => setTab("photo")}>
          Photo
        </TabButton>
        <TabButton
          active={tab === "video"}
          onClick={() => setTab("video")}
        >
          Video
        </TabButton>
      </div>
      {tab === "text" && <TextForm />}
      {tab === "note" && <NoteForm />}
      {tab === "photo" && <PhotoForm />}
      {tab === "video" && <VideoForm videoConfig={videoConfig} />}
    </div>
  );
}

async function patchPost(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/posts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? "Could not save changes.");
  }
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
      title={props.title}
      className={[
        "px-4 py-2 -mb-px border-b-2 text-sm font-medium transition",
        props.active
          ? "border-[var(--color-accent)] text-[var(--color-ink)]"
          : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]",
        props.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {props.children}
    </button>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium text-[var(--color-ink)] mb-1">
        {label}
      </span>
      {children}
      {hint ? <span className="block mt-1 text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}

function ErrorBanner({ state }: { state: State }) {
  if (state.kind !== "error") return null;
  return (
    <p className="mt-3 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
      {state.message}
    </p>
  );
}

function ProgressBar({ state }: { state: State }) {
  if (state.kind !== "submitting") return null;
  return (
    <div className="mt-4">
      <p className="text-sm text-[var(--color-ink-soft)]">{state.label ?? "Working…"}</p>
      {state.progress !== undefined ? (
        <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-line)] overflow-hidden">
          <div
            className="h-full bg-[var(--color-accent)] transition-[width]"
            style={{ width: `${Math.round(state.progress * 100)}%` }}
          />
        </div>
      ) : null}
    </div>
  );
}

async function createPost(body: Record<string, unknown>) {
  const res = await fetch("/api/admin/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Could not create post.");
  }
  return json as {
    ok: true;
    post: { id: string; slug: string; type: string; mux_upload_id: string | null };
    mux_upload_url: string | null;
  };
}

function TextForm({ initial }: { initial?: ComposeInitial } = {}) {
  const router = useRouter();
  const editing = !!initial;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting", label: editing ? "Saving…" : "Publishing…" });
    try {
      if (editing && initial) {
        await patchPost(initial.id, { title, body, pinned });
        router.push("/admin/posts");
        router.refresh();
      } else {
        const { post } = await createPost({ type: "text", title, body, pinned });
        router.push(`/posts/${post.slug}`);
      }
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Failed." });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Title">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="A clear, honest headline"
        />
      </Field>
      <Field label="Body" hint="Markdown supported.">
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={14}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="# Heading&#10;&#10;Write the post here."
        />
      </Field>
      <label className="flex items-center gap-2 text-sm mb-4">
        <input
          type="checkbox"
          checked={pinned}
          onChange={(e) => setPinned(e.target.checked)}
        />
        Pin to top of feed
      </label>
      <SubmitButton state={state}>
        {editing ? "Save changes" : "Publish essay"}
      </SubmitButton>
      <ErrorBanner state={state} />
      <ProgressBar state={state} />
    </form>
  );
}

function NoteForm({ initial }: { initial?: ComposeInitial } = {}) {
  const router = useRouter();
  const editing = !!initial;
  const [state, setState] = useState<State>({ kind: "idle" });
  const [body, setBody] = useState(initial?.body ?? "");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting", label: editing ? "Saving…" : "Posting…" });
    try {
      if (editing && initial) {
        await patchPost(initial.id, { body });
        router.push("/admin/posts");
        router.refresh();
      } else {
        const { post } = await createPost({ type: "note", body });
        router.push(`/posts/${post.slug}`);
      }
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Failed." });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Note" hint={`${body.length}/2000`}>
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 2000))}
          rows={5}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="A quick thought — shows up in the timeline without a headline."
        />
      </Field>
      <SubmitButton state={state}>
        {editing ? "Save changes" : "Post note"}
      </SubmitButton>
      <ErrorBanner state={state} />
      <ProgressBar state={state} />
    </form>
  );
}

function PhotoForm() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<Media[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const supabase = getSupabaseBrowserClient();
    setState({ kind: "submitting", label: "Uploading photos…" });
    try {
      const newItems: Media[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage
          .from("post-media")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message);
        const { data: pub } = supabase.storage.from("post-media").getPublicUrl(path);
        const img = await readImageDimensions(file);
        newItems.push({ url: pub.publicUrl, width: img?.width, height: img?.height });
        setState({ kind: "submitting", label: `Uploaded ${i + 1}/${files.length}` });
      }
      setMedia((prev) => [...prev, ...newItems]);
      setState({ kind: "idle" });
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (media.length === 0) {
      setState({ kind: "error", message: "Add at least one photo." });
      return;
    }
    setState({ kind: "submitting", label: "Publishing…" });
    try {
      const { post } = await createPost({
        type: "photo",
        title: title || null,
        body,
        media,
      });
      router.push(`/posts/${post.slug}`);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Failed." });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Title (optional)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="Caption a moment, or leave blank"
        />
      </Field>
      <Field label="Caption (optional)">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="What's happening here?"
        />
      </Field>
      <Field label="Photos" hint="JPEG, PNG, WebP, AVIF, GIF up to 50 MB each.">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="block text-sm"
        />
      </Field>
      {media.length > 0 ? (
        <div className="mb-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
          {media.map((m, i) => (
            <div key={m.url} className="relative aspect-square rounded-md overflow-hidden border border-[var(--color-line)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setMedia((prev) => prev.filter((_, j) => j !== i))}
                className="absolute top-1 right-1 rounded-full bg-black/70 text-white w-6 h-6 text-xs"
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}
      <SubmitButton state={state}>Publish photo post</SubmitButton>
      <ErrorBanner state={state} />
      <ProgressBar state={state} />
    </form>
  );
}

function VideoForm({ videoConfig }: { videoConfig: VideoConfigStatus }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(VIDEO_CHANNELS[0]);
  const [file, setFile] = useState<File | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setState({ kind: "error", message: "Pick a video file." });
      return;
    }
    setState({ kind: "submitting", label: "Creating post…", progress: 0 });
    try {
      if (!videoConfig.muxConfigured) {
        if (file.size > POST_VIDEO_MAX_BYTES) {
          throw new Error(
            `This file is ${formatBytes(file.size)}. Videos over ${formatBytes(
              POST_VIDEO_MAX_BYTES,
            )} need Mux. Missing in Vercel: ${videoConfig.missing.join(", ") || "Mux credentials"}.`
          );
        }
        const supabase = getSupabaseBrowserClient();
        const ext = sanitizeVideoExtension(file.name);
        const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        setState({ kind: "submitting", label: "Uploading owned video file…", progress: 0.1 });
        const { error } = await supabase.storage
          .from(POST_VIDEO_BUCKET)
          .upload(path, file, {
            contentType: file.type || "video/mp4",
            upsert: false,
          });
        if (error) throw new Error(error.message);
        const { data: pub } = supabase.storage.from(POST_VIDEO_BUCKET).getPublicUrl(path);
        setState({ kind: "submitting", label: "Saving draft…", progress: 0.95 });
        const { post } = await createPost({
          type: "video",
          title,
          body,
          category,
          media: [{ url: pub.publicUrl, alt: title }],
        });
        router.push(`/admin/posts/${post.id}/preview`);
        return;
      }

      const { post, mux_upload_url } = await createPost({
        type: "video",
        title,
        body,
        category,
      });
      if (!mux_upload_url) {
        throw new Error("Mux upload URL missing. Check /admin/new video setup and Vercel env.");
      }
      // Direct browser → Mux upload with progress.
      await uploadWithProgress(mux_upload_url, file, (p) =>
        setState({ kind: "submitting", label: `Uploading ${Math.round(p * 100)}%…`, progress: p })
      );
      setState({
        kind: "submitting",
        label: "Upload complete. Mux is transcoding. Review it in admin, then publish when it is ready.",
        progress: 1,
      });
      router.push(`/admin/posts/${post.id}/preview`);
    } catch (err) {
      setState({ kind: "error", message: err instanceof Error ? err.message : "Failed." });
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Field label="Title">
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="What is this video about?"
        />
      </Field>
      <Field label="Description (optional)">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
          placeholder="Set the scene — what should viewers know?"
        />
      </Field>
      <Field label="Channel">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
        >
          {VIDEO_CHANNELS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>
      <Field
        label="Video file"
        hint={
          videoConfig.muxConfigured
            ? "MP4 / MOV / MKV. HD recommended. Mux handles transcoding to adaptive bitrate."
            : `Temporary owned fallback: MP4 / MOV / WebM up to ${formatBytes(POST_VIDEO_MAX_BYTES)}. Larger videos need Mux credentials or a handoff file.`
        }
      >
        <input
          required
          type="file"
          accept="video/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
      </Field>
      {!videoConfig.muxConfigured ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Large video upload is waiting on Mux credentials.</p>
          <p className="mt-1">
            Add these Vercel production env vars, then redeploy:{" "}
            <code>{videoConfig.missing.join(", ") || "MUX_TOKEN_ID, MUX_TOKEN_SECRET"}</code>.
          </p>
          <p className="mt-1">
            Mux webhook URL: <code>{videoConfig.webhookUrl}</code>
          </p>
        </div>
      ) : !videoConfig.readyForProcessingUpdates ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">Uploads can start, but processing updates are incomplete.</p>
          <p className="mt-1">
            Add <code>{videoConfig.missing.join(", ")}</code> so Mux can flip uploaded videos
            from processing to ready automatically.
          </p>
          <p className="mt-1">
            Mux webhook URL: <code>{videoConfig.webhookUrl}</code>
          </p>
        </div>
      ) : null}
      <SubmitButton state={state}>Upload for review</SubmitButton>
      <ErrorBanner state={state} />
      <ProgressBar state={state} />
    </form>
  );
}

function sanitizeVideoExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "mov" || ext === "m4v" || ext === "webm" || ext === "mkv" || ext === "avi") {
    return ext;
  }
  return "mp4";
}

function SubmitButton({
  state,
  children,
}: {
  state: State;
  children: React.ReactNode;
}) {
  const busy = state.kind === "submitting";
  return (
    <button
      type="submit"
      disabled={busy}
      className="btn-accent rounded-md px-5 py-2.5 text-sm disabled:opacity-60"
    >
      {busy ? "Working…" : children}
    </button>
  );
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (fraction: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(file);
  });
}

function readImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
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
