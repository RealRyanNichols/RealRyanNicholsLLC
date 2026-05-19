import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import type { Post } from "@/lib/types";
import { PostBody } from "@/components/PostBody";
import { ShareRow } from "@/components/ShareRow";
import { SITE } from "@/lib/site";

export function PostCard({
  post,
  commentCount,
  truncate = true,
}: {
  post: Post;
  commentCount: number;
  truncate?: boolean;
}) {
  const when = post.published_at
    ? formatDistanceToNowStrict(new Date(post.published_at), { addSuffix: true })
    : "";

  const body = truncate && post.body.length > 480 ? post.body.slice(0, 480) + "…" : post.body;
  const postUrl = `${SITE.url}/posts/${post.slug}`;

  return (
    <article className="border-b border-[var(--color-line)] py-7 first:pt-2">
      <header className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 text-xs text-[var(--color-muted)]">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 font-medium">
              Pinned
            </span>
          )}
          {post.category && (
            <span className="uppercase tracking-wider">{post.category}</span>
          )}
          <span aria-hidden>·</span>
          <time dateTime={post.published_at ?? undefined}>{when}</time>
        </div>
      </header>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        <Link href={`/posts/${post.slug}`} className="hover:underline underline-offset-4">
          {post.title}
        </Link>
      </h2>
      <div className="mt-3">
        <PostBody body={body} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <Link
          href={`/posts/${post.slug}`}
          className="text-[var(--color-accent)] hover:underline underline-offset-4 font-medium"
        >
          {commentCount === 0
            ? "Read & comment →"
            : `Read & ${commentCount} comment${commentCount === 1 ? "" : "s"} →`}
        </Link>
        <ShareRow url={postUrl} title={post.title} compact />
      </div>
    </article>
  );
}
