import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getAdminPostById } from "@/lib/posts";
import { PostMain } from "@/components/PostMain";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview post",
  robots: { index: false, follow: false },
};

export default async function AdminPostPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const post = await getAdminPostById(id);
  if (!post) notFound();

  const isReadyVideo =
    post.type === "video" && post.mux_status === "ready" && !!post.mux_playback_id;

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
        <Link href="/admin/posts" className="hover:underline">
          Back to posts
        </Link>
        {post.status === "published" ? (
          <Link href={`/posts/${post.slug}`} className="hover:underline" target="_blank">
            Public post
          </Link>
        ) : null}
      </nav>

      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 font-bold uppercase tracking-wider">
          {post.type}
        </span>
        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 font-bold uppercase tracking-wider">
          {post.status}
        </span>
        {post.type === "video" ? (
          <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 font-bold uppercase tracking-wider">
            {isReadyVideo ? "ready to publish" : post.mux_status ?? "not ready"}
          </span>
        ) : null}
        <span>
          Created {format(new Date(post.created_at), "MMM d, yyyy h:mma")}
        </span>
      </div>

      {post.title ? (
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          {post.title}
        </h1>
      ) : null}

      <div className="mt-6">
        <PostMain post={post} />
      </div>

      {post.type === "video" && post.status !== "published" ? (
        <p className="mt-5 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-ink-soft)]">
          This video is not public yet. Once it says ready to publish, use the
          Publish video button from the admin posts list to put it on the feed.
        </p>
      ) : null}
    </article>
  );
}
