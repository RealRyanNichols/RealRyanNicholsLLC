import { notFound, permanentRedirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import {
  getPostBySlug,
  getPublishedPosts,
  getCommentCount,
  getSlugRedirectTarget,
} from "@/lib/posts";
import { ShareButton } from "@/components/ShareButton";
import { PostStatsPanel } from "@/components/PostStatsPanel";
import { ViewTracker } from "@/components/ViewTracker";
import { ReactionBar } from "@/components/ReactionBar";
import { CommentList } from "@/components/CommentList";
import { CommentForm } from "@/components/CommentForm";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { PostFollowCapture } from "@/components/PostLivePulse";
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
  if (!post) {
    // A renamed slug resolves to the current one so shared links + search
    // results keep their preview/title instead of saying "Not found".
    const target = await getSlugRedirectTarget(slug);
    if (target) {
      const redirected = await getPostBySlug(target);
      if (redirected) return generateMetadata({ params: Promise.resolve({ slug: target }) });
    }
    return { title: "Not found" };
  }

  const displayTitle = post.title ?? (deriveExcerpt(post.body, null).slice(0, 80) || "Note");
  const excerpt = deriveExcerpt(post.body, post.title);

  // Per-post override from the /admin/og-images tool (path "/posts/<slug>").
  // Lets you set a custom share image + SEO title/description per page, live.
  const override = await getOgImage(`/posts/${post.slug}`);

  let ogImage: string;
  let ogWidth = 1200;
  let ogHeight = 630;
  if (post.og_image_url) {
    // The per-post custom share card set in the editor wins for ALL types.
    ogImage = post.og_image_url;
  } else if (override?.image_url) {
    ogImage = override.image_url;
    ogWidth = override.width ?? 1200;
    ogHeight = override.height ?? 630;
  } else if (post.type === "video" && post.thumbnail_url) {
    // A custom thumbnail the author chose at upload wins over the Mux frame.
    ogImage = post.thumbnail_url;
  } else if (post.type === "video" && post.mux_playback_id) {
    // Same frame (time: 1) as the video thumbnail shown in the feed/player, so
    // the social share image matches the video's thumbnail.
    ogImage = muxThumbnailUrl(post.mux_playback_id, { width: 1200, height: 630, fitMode: "smartcrop", time: 1 });
  } else if (post.thumbnail_url) {
    // Any post type can carry a custom feed/share thumbnail now.
    ogImage = post.thumbnail_url;
  } else if (post.type === "photo" && post.media && post.media[0]) {
    ogImage = post.media[0].url;
  } else {
    ogImage = `/og/${post.slug}`;
  }

  // Per-post SEO overrides win, then the per-path override, then auto.
  const metaTitle = post.seo_title ?? override?.title ?? displayTitle;
  const metaDescription = post.seo_description ?? override?.description ?? excerpt;

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
  if (!post) {
    // Permanent (308) redirect from a renamed slug to its current URL.
    const target = await getSlugRedirectTarget(slug);
    if (target) permanentRedirect(`/posts/${target}`);
    notFound();
  }

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
    ...(post.og_image_url || post.thumbnail_url
      ? { image: [post.og_image_url ?? post.thumbnail_url] }
      : {}),
    ...(post.type === "video" && post.mux_playback_id
      ? {
          thumbnailUrl: muxThumbnailUrl(post.mux_playback_id, { width: 1200, time: 1 }),
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
            </div>
            <div className="flex items-center gap-3">
              <ShareButton url={postUrl} title={displayTitle} slug={post.slug} compact />
            </div>
          </div>
        </header>

        <PostStatsPanel
          path={path}
          totalReach={post.views_count ?? 0}
          shares={post.shares_count ?? 0}
          inboundShares={post.inbound_shares_count ?? 0}
          comments={commentCount}
          seed={pulseSeed}
        />

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
