import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getPostBySlug, getPublishedPosts, getCommentCount } from "@/lib/posts";
import { ShareButton } from "@/components/ShareButton";
import { PostStats } from "@/components/PostStats";
import { ViewTracker } from "@/components/ViewTracker";
import { ReactionBar } from "@/components/ReactionBar";
import { CommentList } from "@/components/CommentList";
import { CommentForm } from "@/components/CommentForm";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { PostLivePulse, PostFollowCapture } from "@/components/PostLivePulse";
import { ReadNext } from "@/components/ReadNext";
import { NotifySubscribersButton } from "@/components/NotifySubscribersButton";
import { PostMain } from "@/components/PostMain";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { muxThumbnailUrl } from "@/lib/mux";
import { getOgImage } from "@/lib/og-images";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

function deriveExcerpt(body: string, title: string | null): string {
  const base = body || title || "";
  return base.slice(0, 200).replace(/\s+/g, " ").trim();
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const displayTitle = post.title ?? (deriveExcerpt(post.body, null).slice(0, 80) || "Note");
  const excerpt = deriveExcerpt(post.body, post.title);

  // Per-post override from the /admin/og-images tool (path "/posts/<slug>").
  // Lets you set a custom share image + SEO title/description per post, live,
  // with no deploy. Falls back to the type-based image + auto excerpt.
  const override = await getOgImage(`/posts/${post.slug}`);

  let ogImage: string;
  let ogWidth = 1200;
  let ogHeight = 630;
  if (override?.image_url) {
    ogImage = override.image_url;
    ogWidth = override.width ?? 1200;
    ogHeight = override.height ?? 630;
  } else if (post.type === "video" && post.mux_playback_id) {
    ogImage = muxThumbnailUrl(post.mux_playback_id, { width: 1200, height: 630, fitMode: "smartcrop" });
  } else if (post.type === "photo" && post.media && post.media[0]) {
    ogImage = post.media[0].url;
  } else {
    ogImage = `/og/${post.slug}`;
  }

  const metaTitle = override?.title ?? displayTitle;
  const metaDescription = override?.description ?? excerpt;

  const url = `${SITE.url}/posts/${post.slug}`;
  const meta: Metadata = {
    title: metaTitle,
    description: metaDescription,
    openGraph: {
      type: "article",
      title: metaTitle,
      description: metaDescription,
      url,
      publishedTime: post.published_at ?? undefined,
      authors: [SITE.author],
      images: [{ url: ogImage, width: ogWidth, height: ogHeight, alt: metaTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [ogImage],
    },
    alternates: { canonical: `/posts/${post.slug}` },
  };

  return meta;
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
    const { data: adminCheck } = await supabase.rpc("is_admin", { uid: data.user.id });
    canNotify = adminCheck === true || (post.author_id ? post.author_id === data.user.id : false);
  }

  const path = `/posts/${post.slug}`;
  const [allPosts, commentCount, pulseRes] = await Promise.all([
    getPublishedPosts(),
    getCommentCount(post.id),
    supabase.rpc("post_live_pulse", { p_path: path }),
  ]);
  const readNext = allPosts.filter((p) => p.id !== post.id).slice(0, 4);
  const pulseSeed = (pulseRes.data as
    | { reading_now: number; today: number; week: number; site_reading_now: number }
    | null) ?? undefined;

  const displayTitle = post.title ?? (deriveExcerpt(post.body, null).slice(0, 80) || "Note");
  const postUrl = `${SITE.url}/posts/${post.slug}`;
  const articleLd = {
    "@context": "https://schema.org",
    "@type":
      post.type === "video"
        ? "VideoObject"
        : post.type === "photo"
          ? "ImageObject"
          : "Article",
    headline: displayTitle,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: { "@type": "Person", name: SITE.author, url: SITE.url },
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
    ...(post.type === "video" && post.mux_playback_id
      ? {
          thumbnailUrl: muxThumbnailUrl(post.mux_playback_id, { width: 1200 }),
          embedUrl: `${SITE.url}/posts/${post.slug}`,
          duration: post.duration_seconds
            ? `PT${Math.round(post.duration_seconds)}S`
            : undefined,
        }
      : {}),
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
          {post.title ? (
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              {post.title}
            </h1>
          ) : null}
          <div className={post.title ? "mt-3 flex items-center justify-between gap-3 flex-wrap" : "flex items-center justify-between gap-3 flex-wrap"}>
            <div>
              <p className="text-sm text-[var(--color-muted)]">By {SITE.author}</p>
              <div className="mt-1">
                <PostLivePulse
                  path={path}
                  totalViews={post.views_count ?? 0}
                  seed={pulseSeed}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <PostStats
                views={post.views_count ?? 0}
                comments={commentCount}
                shares={post.shares_count ?? 0}
                size="sm"
              />
              <ShareButton url={postUrl} title={displayTitle} slug={post.slug} compact />
            </div>
          </div>
        </header>

        <ViewTracker slug={post.slug} />
        <PostMain post={post} />

        <PostFollowCapture path={path} seed={pulseSeed} />

        <div className="mt-6">
          <ReactionBar targetType="post" targetId={post.id} />
        </div>

        {canNotify && post.status === "published" && (
          <div className="mt-8">
            <NotifySubscribersButton postId={post.id} />
          </div>
        )}
        <div className="mt-8 border-t border-[var(--color-line)] pt-6 flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-[var(--color-ink-soft)] font-medium">
            Share this post — get it back in front of people
          </p>
          <ShareButton url={postUrl} title={displayTitle} slug={post.slug} />
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
        <SignupForm
          emailEnabled={Boolean(
            SITE.mailingAddress &&
              process.env.RESEND_API_KEY &&
              process.env.RESEND_FROM_EMAIL,
          )}
        />
      </aside>
    </div>
  );
}
