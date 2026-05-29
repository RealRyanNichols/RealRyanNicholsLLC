"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { ImageCropper, type CropAspect } from "@/components/ImageCropper";
import { SITE } from "@/lib/site";
import type { MediaItem, Post } from "@/lib/types";

// Aspect presets reused for both the share card and the feed thumbnail.
const SHARE_ASPECTS: CropAspect[] = [
  { label: "Landscape 1200×630", ratio: 1200 / 630, outWidth: 1200 },
  { label: "Square 1080×1080", ratio: 1, outWidth: 1080 },
];

type Saving = "idle" | "saving" | "saved" | "error";

// Upload a Blob/File to the existing public post-media bucket (same mechanism
// ComposeForm uses) and return its public URL.
async function uploadToPostMedia(
  blob: Blob,
  prefix: string,
  ext = "jpg",
): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("post-media")
    .upload(path, blob, { contentType: blob.type || "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("post-media").getPublicUrl(path);
  return data.publicUrl;
}

function readImageDimensions(url: string): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function readingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 225));
}

function deriveExcerpt(body: string, title: string | null): string {
  const base = body || title || "";
  return base.slice(0, 200).replace(/\s+/g, " ").trim();
}

export function PostEditor({ post }: { post: Post }) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title ?? "");
  const [slug, setSlug] = useState(post.slug);
  const [category, setCategory] = useState(post.category ?? "");
  const [body, setBody] = useState(post.body ?? "");
  const [seoTitle, setSeoTitle] = useState(post.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(post.seo_description ?? "");
  const [ogImageUrl, setOgImageUrl] = useState<string | null>(post.og_image_url);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(post.thumbnail_url);
  const [media, setMedia] = useState<MediaItem[]>(post.media ?? []);

  const [saving, setSaving] = useState<Saving>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const isPhoto = post.type === "photo";
  const effectiveTitle = useMemo(
    () => seoTitle || title || deriveExcerpt(body, null).slice(0, 80) || "Note",
    [seoTitle, title, body],
  );
  const effectiveDescription = useMemo(
    () => seoDescription || deriveExcerpt(body, title),
    [seoDescription, body, title],
  );
  const previewImage = ogImageUrl ?? thumbnailUrl ?? (isPhoto ? media[0]?.url ?? null : null);

  async function save() {
    setSaving("saving");
    setMessage(null);
    // Only send fields the API accepts; empty SEO strings clear the override.
    const payload: Record<string, unknown> = {
      title: title.trim() === "" ? null : title,
      body,
      category: category.trim() === "" ? null : category,
      seo_title: seoTitle,
      seo_description: seoDescription,
      og_image_url: ogImageUrl,
      thumbnail_url: thumbnailUrl,
    };
    if (slug !== post.slug) payload.slug = slug;
    if (isPhoto) payload.media = media;

    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string; slug?: string };
      if (!res.ok) throw new Error(json.error ?? "Save failed.");
      setSaving("saved");
      setMessage(
        json.slug && json.slug !== post.slug
          ? `Saved. New URL: /posts/${json.slug} (old link now redirects).`
          : "Saved.",
      );
      // The edit page is keyed by id, so a refresh re-loads the post (with its
      // new slug, if changed) without losing the editor.
      router.refresh();
    } catch (err) {
      setSaving("error");
      setMessage(err instanceof Error ? err.message : "Save failed.");
    }
  }

  function wrapSelection(before: string, after: string, placeholder: string) {
    const el = bodyRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = body.slice(start, end) || placeholder;
    const next = body.slice(0, start) + before + selected + after + body.slice(end);
    setBody(next);
    // Restore focus + place caret after the inserted block.
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + before.length + selected.length + after.length;
      el.setSelectionRange(caret, caret);
    });
  }

  return (
    <div className="space-y-8">
      {/* Content */}
      <Section title="Content" subtitle="The headline and body people read on the post page.">
        {post.type !== "note" ? (
          <FieldLabel label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              placeholder="A clear, honest headline"
            />
          </FieldLabel>
        ) : null}

        <FieldLabel
          label={post.type === "note" ? "Note" : post.type === "photo" ? "Caption" : "Body"}
          hint={`Markdown supported · about ${readingTime(body)} min read`}
        >
          <div className="mb-1.5 flex flex-wrap gap-1.5">
            <ToolbarButton onClick={() => wrapSelection("\n> ", "\n", "Pull-quote that grabs attention")}>
              ❝ Pull-quote
            </ToolbarButton>
            <ToolbarButton onClick={() => wrapSelection("\n> **Note:** ", "\n", "Key takeaway or callout")}>
              ⚠ Callout
            </ToolbarButton>
            <ToolbarButton onClick={() => wrapSelection("**", "**", "bold")}>B</ToolbarButton>
            <ToolbarButton onClick={() => wrapSelection("## ", "\n", "Section heading")}>H2</ToolbarButton>
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={post.type === "note" ? 5 : 14}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Write the post here."
          />
        </FieldLabel>

        {post.type !== "note" ? (
          <FieldLabel label="Category (optional)">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
              placeholder="e.g. Updates"
            />
          </FieldLabel>
        ) : null}
      </Section>

      {/* Photos (photo posts only) */}
      {isPhoto ? (
        <Section title="Photos" subtitle="Add, replace, remove, reorder, and caption each image. The first photo is the lead.">
          <PhotoManager media={media} setMedia={setMedia} onError={(m) => { setSaving("error"); setMessage(m); }} />
        </Section>
      ) : null}

      {/* Share / OG card */}
      <Section
        title="Share card (social / OG image)"
        subtitle="The image shown when this post is shared on X, Facebook, iMessage, etc. Wins over every automatic image, for all post types."
      >
        <SingleImagePicker
          label="share card"
          value={ogImageUrl}
          aspects={SHARE_ASPECTS}
          prefix="og"
          onChange={setOgImageUrl}
          onError={(m) => { setSaving("error"); setMessage(m); }}
        />
      </Section>

      {/* Feed thumbnail */}
      <Section
        title="Feed thumbnail"
        subtitle="The image shown on the home feed card. Falls back to the share card / video frame when empty."
      >
        <SingleImagePicker
          label="thumbnail"
          value={thumbnailUrl}
          aspects={SHARE_ASPECTS}
          prefix="thumbs"
          onChange={setThumbnailUrl}
          onError={(m) => { setSaving("error"); setMessage(m); }}
        />
        {ogImageUrl ? (
          <button
            type="button"
            onClick={() => setThumbnailUrl(ogImageUrl)}
            className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline"
          >
            Use the share card as the thumbnail too
          </button>
        ) : null}
      </Section>

      {/* SEO */}
      <Section title="SEO" subtitle="Override the title, description, and URL that search engines and link previews use.">
        <FieldLabel label="URL slug" hint={`Lives at ${SITE.url}/posts/${slug || "…"}. Changing it 301-redirects the old link.`}>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-mono focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="my-post-slug"
          />
        </FieldLabel>
        <FieldLabel label="Meta title (optional)" hint={`${effectiveTitle.length} chars · aim for under 60`}>
          <input
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Leave blank to use the post title"
          />
        </FieldLabel>
        <FieldLabel label="Meta description (optional)" hint={`${effectiveDescription.length} chars · aim for under 160`}>
          <textarea
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-[var(--color-line)] px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-accent)]"
            placeholder="Leave blank to use the auto excerpt"
          />
        </FieldLabel>

        <SnippetPreviews
          url={`${SITE.url}/posts/${slug}`}
          title={effectiveTitle}
          description={effectiveDescription}
          image={previewImage}
        />
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-0 -mx-4 border-t border-[var(--color-line)] bg-[var(--color-paper)]/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
        <div className="flex items-center justify-between gap-3">
          <p
            className={[
              "text-sm",
              saving === "error"
                ? "text-[var(--color-accent)]"
                : saving === "saved"
                  ? "text-[var(--color-success)]"
                  : "text-[var(--color-muted)]",
            ].join(" ")}
          >
            {message ?? (post.status === "published" ? "Published — edits go live on save." : "Draft.")}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={post.status === "published" ? `/posts/${post.slug}` : `/admin/posts/${post.id}/preview`}
              target="_blank"
              className="rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-semibold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)]"
            >
              {post.status === "published" ? "View live" : "Preview"}
            </Link>
            <button
              type="button"
              onClick={save}
              disabled={saving === "saving"}
              className="btn-accent rounded-md px-5 py-2 text-sm font-bold disabled:opacity-60"
            >
              {saving === "saving" ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SingleImagePicker({
  label,
  value,
  aspects,
  prefix,
  onChange,
  onError,
}: {
  label: string;
  value: string | null;
  aspects: CropAspect[];
  prefix: string;
  onChange: (url: string | null) => void;
  onError: (message: string) => void;
}) {
  const [pending, setPending] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onCropped(blob: Blob) {
    setBusy(true);
    try {
      const url = await uploadToPostMedia(blob, prefix);
      onChange(url);
      setPending(null);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <label
          className={[
            "inline-flex cursor-pointer items-center rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-bold hover:border-[var(--color-accent)]",
            busy ? "opacity-60 pointer-events-none" : "",
          ].join(" ")}
        >
          {busy ? "Uploading…" : value ? `Replace ${label}` : `Upload ${label}`}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setPending(f);
              e.currentTarget.value = "";
            }}
          />
        </label>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs font-semibold text-[var(--color-ink-soft)] hover:underline"
          >
            Remove
          </button>
        ) : null}
      </div>

      {pending ? (
        <div className="mt-3">
          <ImageCropper
            file={pending}
            aspects={aspects}
            onCancel={() => setPending(null)}
            onCropped={onCropped}
          />
        </div>
      ) : value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt=""
          className="mt-3 w-full max-w-sm rounded-md border border-[var(--color-line)]"
        />
      ) : null}
    </div>
  );
}

function PhotoManager({
  media,
  setMedia,
  onError,
}: {
  media: MediaItem[];
  setMedia: (m: MediaItem[]) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const addRef = useRef<HTMLInputElement | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const added: MediaItem[] = [];
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const url = await uploadToPostMedia(file, "photos", ext);
        const dims = await readImageDimensions(url);
        added.push({ url, width: dims?.width, height: dims?.height });
      }
      setMedia([...media, ...added]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (addRef.current) addRef.current.value = "";
    }
  }

  function update(i: number, patch: Partial<MediaItem>) {
    setMedia(media.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  }
  function remove(i: number) {
    setMedia(media.filter((_, j) => j !== i));
  }
  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= media.length) return;
    const next = [...media];
    [next[i], next[j]] = [next[j], next[i]];
    setMedia(next);
  }

  return (
    <div className="space-y-3">
      {media.map((m, i) => (
        <div
          key={m.url}
          className="flex gap-3 rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] p-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={m.url} alt="" className="h-20 w-20 flex-shrink-0 rounded object-cover border border-[var(--color-line)]" />
          <div className="min-w-0 flex-1">
            <input
              value={m.alt ?? ""}
              onChange={(e) => update(i, { alt: e.target.value })}
              placeholder="Alt text (describe the image for accessibility + SEO)"
              className="w-full rounded-md border border-[var(--color-line)] px-2 py-1.5 text-xs focus:outline-none focus:border-[var(--color-accent)]"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {i === 0 ? (
                <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 font-bold text-[var(--color-accent)]">Lead</span>
              ) : null}
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded border border-[var(--color-line)] px-2 py-0.5 font-semibold disabled:opacity-40 hover:border-[var(--color-accent)]">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === media.length - 1} className="rounded border border-[var(--color-line)] px-2 py-0.5 font-semibold disabled:opacity-40 hover:border-[var(--color-accent)]">↓</button>
              <ReplacePhotoButton
                onReplaced={(url, dims) => update(i, { url, width: dims?.width, height: dims?.height })}
                onError={onError}
              />
              <button type="button" onClick={() => remove(i)} className="rounded border border-[var(--color-accent)] px-2 py-0.5 font-semibold text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)]">Remove</button>
            </div>
          </div>
        </div>
      ))}

      <label
        className={[
          "inline-flex cursor-pointer items-center rounded-md border border-[var(--color-line)] px-3 py-2 text-sm font-bold hover:border-[var(--color-accent)]",
          busy ? "opacity-60 pointer-events-none" : "",
        ].join(" ")}
      >
        {busy ? "Uploading…" : "Add photos"}
        <input
          ref={addRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => onFiles(e.target.files)}
        />
      </label>
      {media.length === 0 ? (
        <p className="text-xs text-[var(--color-accent)]">A photo post needs at least one image before you save.</p>
      ) : null}
    </div>
  );
}

function ReplacePhotoButton({
  onReplaced,
  onError,
}: {
  onReplaced: (url: string, dims: { width: number; height: number } | null) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <label
      className={[
        "cursor-pointer rounded border border-[var(--color-line)] px-2 py-0.5 font-semibold hover:border-[var(--color-accent)]",
        busy ? "opacity-60 pointer-events-none" : "",
      ].join(" ")}
    >
      {busy ? "…" : "Replace"}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.currentTarget.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
            const url = await uploadToPostMedia(file, "photos", ext);
            const dims = await readImageDimensions(url);
            onReplaced(url, dims);
          } catch (err) {
            onError(err instanceof Error ? err.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </label>
  );
}

function SnippetPreviews({
  url,
  title,
  description,
  image,
}: {
  url: string;
  title: string;
  description: string;
  image: string | null;
}) {
  let displayUrl = url;
  try {
    const u = new URL(url);
    displayUrl = `${u.hostname}${u.pathname}`.replace(/\/$/, "");
  } catch {
    /* keep raw */
  }
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Google result</p>
        <div className="rounded-lg border border-[var(--color-line)] bg-white p-3">
          <p className="truncate text-xs text-[#202124]">{displayUrl}</p>
          <p className="truncate text-[18px] leading-tight text-[#1a0dab]">{title}</p>
          <p className="mt-0.5 line-clamp-2 text-[13px] text-[#4d5156]">{description}</p>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-[var(--color-muted)]">Social card</p>
        <div className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-white">
          <div className="aspect-[1200/630] w-full bg-[var(--color-surface-2)]">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-[var(--color-muted)]">
                No image — a generated card is used
              </div>
            )}
          </div>
          <div className="border-t border-[var(--color-line)] p-2.5">
            <p className="truncate text-[11px] uppercase text-[var(--color-muted)]">{displayUrl}</p>
            <p className="truncate text-sm font-semibold text-[var(--color-ink)]">{title}</p>
            <p className="line-clamp-2 text-xs text-[var(--color-ink-soft)]">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-5">
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-1 mb-3 text-xs text-[var(--color-muted)] leading-relaxed">{subtitle}</p> : <div className="mb-3" />}
      {children}
    </section>
  );
}

function FieldLabel({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-[var(--color-muted)]">{hint}</span> : null}
    </label>
  );
}

function ToolbarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md border border-[var(--color-line)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
    >
      {children}
    </button>
  );
}
