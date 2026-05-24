import type { Metadata } from "next";
import Link from "next/link";
import { getCommentCount, getPublishedPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Videos",
  description:
    "Watch Ryan Nichols videos on the site he owns. No social media gatekeeping, no algorithm between you and the record.",
  alternates: { canonical: "/videos" },
};

export default async function VideosPage() {
  const posts = (await getPublishedPosts()).filter((p) => p.type === "video");
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const),
  );
  const countMap = new Map(counts);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <nav className="mb-5 text-sm text-[var(--color-muted)]">
        <Link href="/" className="hover:underline">
          Back to feed
        </Link>
      </nav>
      <header className="border-b border-[var(--color-line)] pb-5">
        <p className="text-xs uppercase tracking-wider text-[var(--color-accent)] font-bold">
          Site-owned video
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
          Watch here. Not on social media.
        </h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">
          Videos live on RealRyanNichols.com. Share the link, but the playback
          happens here.
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-muted)]">
          No videos are public yet.
        </p>
      ) : (
        <section>
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
              commentCount={countMap.get(p.id) ?? 0}
            />
          ))}
        </section>
      )}
    </main>
  );
}
