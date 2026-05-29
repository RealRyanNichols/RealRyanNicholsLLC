import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdminPostById } from "@/lib/posts";
import { PostEditor } from "@/components/PostEditor";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPostEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/admin/posts/${id}/edit`);
  const { data: adminCheck } = await supabase.rpc("is_admin", {
    uid: auth.user.id,
  });
  if (adminCheck !== true) {
    return (
      <article className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">Not authorized</h1>
      </article>
    );
  }

  const post = await getAdminPostById(id);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <nav className="mb-2 flex flex-wrap items-center gap-3 text-sm text-[var(--color-muted)]">
        <Link href="/admin/posts" className="hover:underline">
          ← Back to posts
        </Link>
        <Link
          href={`/admin/posts/${post.id}/preview`}
          className="hover:underline"
          target="_blank"
        >
          Preview
        </Link>
      </nav>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Edit post</h1>
        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
          {post.type}
        </span>
        <span className="rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-ink-soft)]">
          {post.status}
        </span>
      </div>
      <p className="mt-1 mb-6 text-sm text-[var(--color-ink-soft)]">
        Images, share card, SEO, and slug — all editable after publishing.
      </p>

      <PostEditor post={post} />
    </article>
  );
}
