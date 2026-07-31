import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getPostBySlug, getPublishedPosts, getCommentCount } from "@/lib/posts";
import { ShareButton } from "@/components/ShareButton";
import { FloatingShareBar } from "@/components/FloatingShareBar";
import { PostStatsPanel } from "@/components/PostStatsPanel";
import { ViewTracker } from "@/components/ViewTracker";
import { ReactionBar } from "@/components/ReactionBar";
import { CommentList } from "@/components/CommentList";
import { CommentForm } from "@/components/CommentForm";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { PostFollowCapture } from "@/components/PostLivePulse";
import { ReadNext, type CaseLink } from "@/components/ReadNext";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, orgRef, personRef, websiteRef } from "@/lib/jsonld";
import { NotifySubscribersButton } from "@/components/NotifySubscribersButton";
import { PostMain } from "@/components/PostMain";
import { StoryTipCTA } from "@/components/StoryTipCTA";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { muxThumbnailUrl } from "@/lib/mux";
import { getOgImage } from "@/lib/og-images";
import { BookCtaBand } from "@/components/BookCtaBand";
import type { Post, MediaItem } from "@/lib/types";

export const revalidate = 60;

export async function generateStaticParams() {
  const posts = await getPublishedPosts();
  return posts.map((p) => ({ slug: p.slug }));
}

function deriveExcerpt(body: string, title: string | null): string {
  const base = body
    .replace(/^\s*\{\{[\s\S]*?\}\}\s*$/gm, "")
    .replace(/\s+/g, " ")
    .trim() || title || "";
  return base.slice(0, 200).replace(/\s+/g, " ").trim();
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return new URL(url, SITE.url).toString();
}

function firstMarkdownImage(body: string): string | null {
  const match = body.match(/!\[[^\]]*]\((?<url>[^)\s]+)(?:\s+["'][^"']*["'])?\)/);
  return match?.groups?.url ?? null;
}

function looksLikeVideoUrl(url: string): boolean {
  return /\.(mp4|mov|m4v|webm)(?:\?|#|$)/i.test(url);
}

// Posts that touch the case get 1-2 deep links into the evidence archive in
// Read Next — a path from the story to the record behind it.
const CASE_HINT =
  /\b(j6|jan(?:uary)?\s*6|nichols|jail|detention|solitary|grievance|pardon|doj|fbi|court|judge|due[- ]?process|prosecut\w*|indict\w*|sentenc\w*|evidence|exhibit)\b/i;

function firstMediaImage(media: MediaItem[] | null): string | null {
  return media?.find((item) => item.url && !looksLikeVideoUrl(item.url))?.url ?? null;
}

function firstPostShareImage(post: Post): string | null {
  return (
    post.thumbnail_url ||
    post.image_urls?.find(Boolean) ||
    firstMediaImage(post.media) ||
    firstMarkdownImage(post.body)
  );
}

function relatedPostScore(current: Post, candidate: Post): number {
  let score = 0;
  if (current.category && candidate.category === current.category) score += 8;

  const currentTags = new Set(
    (current.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean),
  );
  for (const tag of candidate.tags ?? []) {
    if (currentTags.has(tag.trim().toLowerCase())) score += 3;
  }

  const currentCase = CASE_HINT.test(
    [current.title, current.category, ...(current.tags ?? [])].filter(Boolean).join(" "),
  );
  const candidateCase = CASE_HINT.test(
    [candidate.title, candidate.category, ...(candidate.tags ?? [])]
      .filter(Boolean)
      .join(" "),
  );
  if (currentCase === candidateCase) score += 2;

  return score;
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Not found" };

  const displayTitle = post.title ?? (deriveExcerpt(post.body, null).slice(0, 80) || "Note");
  const excerpt = post.seo_description ?? deriveExcerpt(post.body, post.title);

  // Per-post override from the /admin/og-images tool (path "/posts/<slug>").
  // Lets you set a custom share image + SEO title/description per post, live,
  // with no deploy. Falls back to the type-based image + auto excerpt.
  const override = await getOgImage(`/posts/${post.slug}`);

  let ogImage: string;
  let ogWidth = 1200;
  let ogHeight = 630;
  const postShareImage = firstPostShareImage(post);
  if (override?.image_url) {
    ogImage = absoluteUrl(override.image_url);
    ogWidth = override.width ?? 1200;
    ogHeight = override.height ?? 630;
  } else if (postShareImage) {
    // The selected article thumbnail should be the social thumbnail too.
    // This covers text articles, photos, videos with custom thumbnails,
    // admin-uploaded image_urls, and first markdown images in the body.
    ogImage = absoluteUrl(postShareImage);
  } else if (post.type === "video" && post.mux_playback_id) {
    // Same frame (time: 1) as the video thumbnail shown in the feed/player, so
    // the social share image matches the video's thumbnail.
    ogImage = muxThumbnailUrl(post.mux_playback_id, { width: 1200, height: 630, fitMode: "smartcrop", time: 1 });
  } else {
    ogImage = absoluteUrl(`/og/${post.slug}`);
  }

  const metaTitle = override?.title ?? post.seo_title ?? displayTitle;
  const metaDescription = override?.description ?? excerpt;
  const articleAuthor = post.byline_override?.trim() || SITE.author;

  const url = `${SITE.url}/posts/${post.slug}`;
  const meta: Metadata = {
    title: metaTitle,
    description: metaDescription,
    authors: [{ name: articleAuthor }],
    openGraph: {
      type: "article",
      title: metaTitle,
      description: metaDescription,
      url,
      publishedTime: post.published_at ?? undefined,
      authors: [articleAuthor],
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
  const [allPosts, commentCount, pulseRes, ldOg] = await Promise.all([
    getPublishedPosts(),
    getCommentCount(post.id),
    supabase.rpc("post_live_pulse", { p_path: path }),
    getOgImage(path),
  ]);
  const readNext = allPosts
    .filter((p) => p.id !== post.id)
    .map((candidate, index) => ({
      candidate,
      index,
      score: relatedPostScore(post, candidate),
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 4)
    .map(({ candidate }) => candidate);
  const caseHaystack = [post.title, post.category, ...(post.tags ?? [])]
    .filter(Boolean)
    .join(" ");
  const caseLinks: CaseLink[] = CASE_HINT.test(caseHaystack)
    ? [
        {
          href: "/case",
          title: "United States v. Nichols — the case",
          sub: "Timeline, people, documents — the whole file",
        },
        {
          href: "/case?view=documents",
          title: "The document archive",
          sub: "Every public scan, sourced and labeled",
        },
      ]
    : [];
  const pulseSeed = (pulseRes.data as
    | { reading_now: number; today: number; week: number; site_reading_now: number }
    | null) ?? undefined;

  const displayTitle = post.title ?? (deriveExcerpt(post.body, null).slice(0, 80) || "Note");
  const articleAuthor = post.byline_override?.trim() || SITE.author;
  const postUrl = `${SITE.url}/posts/${post.slug}`;
  const postShareImage = firstPostShareImage(post);
  const ldImage = ldOg?.image_url
    ? absoluteUrl(ldOg.image_url)
    : postShareImage
      ? absoluteUrl(postShareImage)
      : post.type === "video" && post.mux_playback_id
        ? muxThumbnailUrl(post.mux_playback_id, { width: 1200, time: 1 })
        : null;
  const articleLd = {
    "@context": "https://schema.org",
    "@type":
      post.type === "video"
        ? "VideoObject"
        : post.type === "photo"
          ? "ImageObject"
          : "NewsArticle",
    headline: displayTitle,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: post.byline_override?.trim()
      ? {
          "@type": "Organization",
          "@id": `${SITE.url}/#editorial-team`,
          name: articleAuthor,
          url: SITE.url,
        }
      : personRef(),
    publisher: orgRef(),
    isPartOf: websiteRef(),
    mainEntityOfPage: `${SITE.url}/posts/${post.slug}`,
    ...(post.category ? { articleSection: post.category } : {}),
    ...(ldImage ? { image: [ldImage] } : {}),
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
      <JsonLd
        data={[
          articleLd,
          breadcrumbLd([
            { name: "Feed", url: `${SITE.url}/` },
            { name: displayTitle, url: postUrl },
          ]),
        ]}
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
          {displayTitle ? (
            <h1 className="font-display text-4xl font-black leading-[1.05] tracking-tight text-[var(--color-ink)] sm:text-5xl">
              {displayTitle}
            </h1>
          ) : null}
          {post.seo_description ? (
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-[var(--color-ink-soft)] sm:text-xl">
              {post.seo_description}
            </p>
          ) : null}
          <div className={post.title ? "mt-3 flex items-center justify-between gap-3 flex-wrap" : "flex items-center justify-between gap-3 flex-wrap"}>
            <div>
              <p className="text-sm text-[var(--color-muted)]">By {articleAuthor}</p>
            </div>
            <div className="flex items-center gap-3">
              <ShareButton url={postUrl} title={displayTitle} slug={post.slug} shares={post.shares_count ?? 0} compact />
            </div>
          </div>
          {post.tags && post.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/search?q=${encodeURIComponent(tag)}`}
                  className="rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-bold text-[var(--color-ink-soft)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}
        </header>

        <FloatingShareBar url={postUrl} title={displayTitle} slug={post.slug} shares={post.shares_count ?? 0} />

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

        {/* Give a reader the strongest relevant next click while the story is
            still fresh. Sales, signup, reactions, and comments remain below. */}
        <ReadNext posts={readNext} caseLinks={caseLinks} />

        {post.category === "Investigation" ? (
          <StoryTipCTA subject={post.title ?? undefined} />
        ) : null}

        {/* Donations retired — the article-foot ask now sells the book. */}
        <BookCtaBand className="mt-8" />

        <PostFollowCapture
          path={path}
          seed={pulseSeed}
          emailEnabled={SITE.emailCaptureEnabled}
        />

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
          <ShareButton url={postUrl} title={displayTitle} slug={post.slug} shares={post.shares_count ?? 0} />
        </div>
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
          emailEnabled={SITE.emailCaptureEnabled}
        />
      </aside>
    </div>
  );
}
