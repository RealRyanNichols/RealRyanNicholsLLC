import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ComposeForm } from "@/components/ComposeForm";
import { getVideoConfigStatus } from "@/lib/video-config";
import { buildIntakeRoutePlan } from "@/lib/intake-routing";
import { buildTipDraft } from "@/lib/tip-draft";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; tip?: string; mode?: string }>;
}) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect("/login?next=/admin/new");
  }
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          You need to be signed in as an admin to create posts.
        </p>
      </article>
    );
  }

  const { id, tip, mode } = await searchParams;
  const editing = id && /^[0-9a-f-]{36}$/i.test(id) ? id : null;
  const tipId = !editing && tip && /^[0-9a-f-]{36}$/i.test(tip) ? tip : null;
  const tipDraftMode = mode === "solution" ? "solution" : "article";

  let initial: {
    id: string;
    type: string;
    title: string | null;
    body: string | null;
    pinned: boolean;
    status: string;
    category: string | null;
  } | null = null;
  let prefill: {
    title: string;
    body: string;
    category: string;
    sourceLabel: string;
  } | null = null;

  if (editing) {
    const { data: post } = await supabase
      .from("posts")
      .select("id, type, title, body, pinned, status, category")
      .eq("id", editing)
      .maybeSingle();
    if (!post) {
      redirect("/admin/posts");
    }
    initial = post;
  }
  if (tipId) {
    const { data: tipRecord } = await supabase
      .from("case_tips")
      .select("id, category, location, defendant_name, narrative, urls, created_at")
      .eq("id", tipId)
      .maybeSingle();

    if (tipRecord) {
      const urls = Array.isArray(tipRecord.urls) ? (tipRecord.urls as string[]) : [];
      const plan = buildIntakeRoutePlan({
        category: tipRecord.category,
        subject: tipRecord.defendant_name,
        location: tipRecord.location,
        narrative: tipRecord.narrative,
        urls,
      });
      const draft = buildTipDraft(
        {
          id: tipRecord.id,
          category: tipRecord.category,
          location: tipRecord.location,
          defendant_name: tipRecord.defendant_name,
          urls,
          created_at: tipRecord.created_at,
        },
        plan,
        tipDraftMode,
      );
      prefill = {
        ...draft,
        sourceLabel: `tip ${tipRecord.id.slice(0, 8)} · ${plan.label} · ${tipDraftMode === "solution" ? "solution brief" : "article lead"}`,
      };
    }
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">
        {initial ? "Edit post" : "New post"}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-muted)]">
        {initial ? (
          <>
            Editing an existing post. Changes save in place.{" "}
            <Link
              href="/admin/posts"
              className="text-[var(--color-accent)] hover:underline"
            >
              ← Back to posts
            </Link>
          </>
        ) : prefill ? (
          <>
            Draft starter loaded from {prefill.sourceLabel}. It is saved as a
            draft by default; verify and redact before publishing.{" "}
            <Link
              href="/admin/tips"
              className="text-[var(--color-accent)] hover:underline"
            >
              Back to tips
            </Link>
          </>
        ) : (
          <>
            Pick a type, write or upload, hit publish. The feed at <code>/</code>{" "}
            renders all four types in one timeline.
          </>
        )}
      </p>
      <div className="mt-8">
        <ComposeForm
          videoConfig={getVideoConfigStatus()}
          initial={initial}
          prefill={prefill}
        />
      </div>
    </article>
  );
}
