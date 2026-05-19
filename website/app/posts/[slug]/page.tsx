import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getPostBySlug, getPublishedPosts } from "@/lib/posts";
import { PostBody } from "@/components/PostBody";
import { ShareRow } from "@/components/ShareRow";
import { CommentList } from "@/components/CommentList";
import { CommentForm } from "@/components/CommentForm";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { ReadNext } from "@/components/ReadNext";
import { NotifySubscribersButton } from "@/components/NotifySubscribersButton";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };
  const excerpt = post.body.slice(0, 200).replace(/\s+/g, " ").trim();
  const ogPath = `/og/${post.slug}`;
  return {
    title: post.title,
    description: excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: excerpt,
      url: `${SITE.url}/posts/${post.slug}`,
      publishedTime: post.published_at ?? undefined,
      authors: [SITE.author],
      images: [{ url: ogPath, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: excerpt,
      images: [ogPath],
    },
    alternates: { canonical: `/posts/${post.slug}` },
  };
}

export default async function PostPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const supabase = await getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  const signedIn = !!data.user;

  let canNotify = false;
  if (data.user) {
    if (post.author_id && post.author_id === data.user.id) {
      canNotify = true;
    } else {
      const { data: adminRow } = await supabase
        .from("admin_users")
        .select("user_id")
        .eq("user_id", data.user.id)
        .maybeSingle();
      canNotify = !!adminRow;
    }
  }

  const allPosts = await getPublishedPosts();
  const readNext = allPosts.filter((p) => p.id !== post.id).slice(0, 4);

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }}
      />
      <article className="lg:col-span-2">
        <nav className="text-sm text-[var(--color-muted)] mb-4">
          <Link href="/" className="hover:underline">
            ← Back to feed
          </Link>
        </nav>
        <header className="mb-5">
          <div className="flex items-center gap-2 text-xs text-[var(--color-muted)] mb-2">
            {post.pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent-soft)] text-[var(--color-accent)] px-2 py-0.5 font-medium">
                Pinned
              </span>
            )}
            {post.category && (
              <span className="uppercase tracking-wider">{post.category}</span>
            )}
            {post.published_at && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={post.published_at}>
                  {format(new Date(post.published_at), "MMMM d, yyyy")}
                </time>
              </>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {post.title}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-muted)]">By {SITE.author}</p>
        </header>
        <PostBody body={post.body} />
        {canNotify && (
          <div className="mt-8">
            <NotifySubscribersButton postId={post.id} />
          </div>
        )}
        <div className="mt-8 border-t border-[var(--color-line)] pt-6">
          <ShareRow url={`${SITE.url}/posts/${post.slug}`} title={post.title} />
        </div>
        <div className="mt-8">
          <SignupForm />
        </div>
        <ReadNext posts={readNext} />
        <section className="mt-12 border-t border-[var(--color-line)] pt-8">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          <CommentForm postId={post.id} signedIn={signedIn} />
          <div className="mt-6">
            <CommentList postId={post.id} />
          </div>
        </section>
      </article>
      <aside className="space-y-5">
        <VerseSidebar />
        <SignupForm />
      </aside>
    </div>
  );
}
