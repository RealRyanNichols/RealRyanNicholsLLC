import { getPublishedPosts, getCommentCount } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";
import { ProfileHero } from "@/components/ProfileHero";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import Link from "next/link";

export const revalidate = 60;

export default async function HomePage() {
  const posts = await getPublishedPosts();
  const counts = await Promise.all(
    posts.map(async (p) => [p.id, await getCommentCount(p.id)] as const)
  );
  const countMap = new Map(counts);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <ProfileHero />
        <section className="mt-8">
          <h2 className="sr-only">Feed</h2>
          {posts.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-muted)]">
              No posts yet. Check back soon.
            </p>
          ) : (
            <div className="divide-[var(--color-line)]">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} commentCount={countMap.get(p.id) ?? 0} />
              ))}
            </div>
          )}
        </section>
      </div>
      <aside className="space-y-5">
        <VerseSidebar />
        <SignupForm />
        <div className="rounded-2xl border border-[var(--color-line)] bg-white p-5 text-sm text-[var(--color-ink-soft)]">
          <p className="text-xs uppercase tracking-wider text-[var(--color-muted)] mb-2">
            About this site
          </p>
          <p>
            This is a domain I own and a feed I write. No algorithm. No throttling.
            Just my words, on my front porch.
          </p>
          <p className="mt-3">
            <Link href="/about" className="text-[var(--color-accent)] underline underline-offset-4">
              Read the full About
            </Link>
          </p>
        </div>
      </aside>
    </div>
  );
}
