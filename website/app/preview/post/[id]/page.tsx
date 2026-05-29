import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { format } from "date-fns";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { POST_COLUMNS } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { PostMain } from "@/components/PostMain";
import { InteractiveArticle } from "@/components/InteractiveArticle";
import { SITE } from "@/lib/site";

// Private, unlisted draft preview. Renders a single post by its UUID using the
// service client so an unpublished draft can be read for review WITHOUT
// publishing it or requiring an admin login. The UUID is the secret — the page
// is noindexed and never linked from the site, so only someone with the exact
// link can open it. Anyone with the link can read it, so it must not be posted
// publicly while the piece is still a draft.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Draft preview",
  robots: { index: false, follow: false },
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function DraftPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  if (!isSupabaseServiceConfigured()) notFound();

  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  const post = (data ?? null) as Post | null;
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 rounded-xl border-2 border-[var(--color-accent)] bg-[var(--color-accent-soft)] px-4 py-3">
        <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--color-accent)]">
          Private draft preview · {post.status}
        </p>
        <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
          This is an unpublished draft, shared privately for review. Please
          don&apos;t post this link publicly — it&apos;s a private review link,
          not the final published article.
        </p>
      </div>

      <article>
        {post.title ? (
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            {post.title}
          </h1>
        ) : null}
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          By {SITE.author}
          {post.category ? ` · ${post.category}` : ""}
        </p>
        <div className="mt-6">
          {post.type === "text" ? (
            <InteractiveArticle body={post.body} />
          ) : (
            <PostMain post={post} />
          )}
        </div>
      </article>

      <p className="mt-10 border-t border-[var(--color-line)] pt-4 text-xs text-[var(--color-muted)]">
        Draft preview · not published · created{" "}
        {format(new Date(post.created_at), "MMMM d, yyyy")}
      </p>
    </div>
  );
}
