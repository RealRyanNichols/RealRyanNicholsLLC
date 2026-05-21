"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type State =
  | { kind: "idle" }
  | { kind: "uploading"; label: string }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

export function ProfileUploadForm({
  currentAvatar,
  currentCover,
}: {
  currentAvatar: string | null;
  currentCover: string | null;
}) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  async function uploadAndGetUrl(file: File, kind: "avatar" | "cover"): Promise<string> {
    const supabase = getSupabaseBrowserClient();
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `profile/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("post-media")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`${kind} upload failed: ${error.message}`);
    const { data } = supabase.storage.from("post-media").getPublicUrl(path);
    return data.publicUrl;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!avatarFile && !coverFile) {
      setState({ kind: "error", message: "Pick at least one file." });
      return;
    }
    setState({ kind: "uploading", label: "Uploading…" });
    try {
      const supabase = getSupabaseBrowserClient();
      let newAvatar: string | null = currentAvatar;
      let newCover: string | null = currentCover;
      if (avatarFile) {
        setState({ kind: "uploading", label: "Uploading avatar…" });
        newAvatar = await uploadAndGetUrl(avatarFile, "avatar");
      }
      if (coverFile) {
        setState({ kind: "uploading", label: "Uploading cover…" });
        newCover = await uploadAndGetUrl(coverFile, "cover");
      }
      setState({ kind: "uploading", label: "Saving…" });
      const { error: updErr } = await supabase
        .from("site_settings")
        .update({ avatar_url: newAvatar, cover_url: newCover })
        .eq("id", "default");
      if (updErr) throw new Error(updErr.message);
      setState({
        kind: "success",
        message: "Saved. Reloading…",
      });
      setAvatarFile(null);
      setCoverFile(null);
      setTimeout(() => router.refresh(), 400);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed.",
      });
    }
  }

  async function clearOne(kind: "avatar_url" | "cover_url") {
    setState({ kind: "uploading", label: `Clearing ${kind === "avatar_url" ? "avatar" : "cover"}…` });
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updErr } = await supabase
        .from("site_settings")
        .update({ [kind]: null })
        .eq("id", "default");
      if (updErr) throw new Error(updErr.message);
      setState({ kind: "success", message: "Cleared." });
      setTimeout(() => router.refresh(), 400);
    } catch (err) {
      setState({
        kind: "error",
        message: err instanceof Error ? err.message : "Could not clear.",
      });
    }
  }

  const busy = state.kind === "uploading";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-semibold mb-2">Profile picture</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
        {currentAvatar ? (
          <button
            type="button"
            onClick={() => clearOne("avatar_url")}
            disabled={busy}
            className="mt-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] underline underline-offset-4"
          >
            Remove current avatar
          </button>
        ) : null}
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Cover photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="block text-sm"
        />
        {currentCover ? (
          <button
            type="button"
            onClick={() => clearOne("cover_url")}
            disabled={busy}
            className="mt-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-accent)] underline underline-offset-4"
          >
            Remove current cover
          </button>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={busy}
        className="btn-accent rounded-full px-6 py-2.5 text-sm font-bold disabled:opacity-60"
      >
        {busy ? state.label : "Save"}
      </button>
      {state.kind === "error" ? (
        <p className="text-sm text-[var(--color-accent)]">{state.message}</p>
      ) : null}
      {state.kind === "success" ? (
        <p className="text-sm text-emerald-400">{state.message}</p>
      ) : null}
    </form>
  );
}
