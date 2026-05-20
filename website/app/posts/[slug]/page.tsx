import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { getPostBySlug, getPublishedPosts, getCommentCount } from "@/lib/posts";
import { PostBody } from "@/components/PostBody";
import { ShareButton } from "@/components/ShareButton";
import { PostStats } from "@/components/PostStats";
import { ViewTracker } from "@/components/ViewTracker";
import { ReactionRow } from "@/components/ReactionRow";
import { getReactionsForPost } from "@/lib/reactions";
import { CommentList } from "@/components/CommentList";
import { CommentForm } from "@/components/CommentForm";
import { VerseSidebar } from "@/components/VerseSidebar";
import { SignupForm } from "@/components/SignupForm";
import { ReadNext } from "@/components/ReadNext";
import { NotifySubscribersButton } from "@/components/NotifySubscribersButton";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { SITE } from "@/lib/site";
import { muxThumbnailUrl } from "@/lib/mux";

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

  // Pick an OG image based on type. Video gets the Mux thumbnail; photo gets
  // the first image; everything else uses the generated /og/[slug] card.
  let ogImage: string;
  if (post.type === "video" && post.mux_playback_id) {
    ogImage = muxThumbnailUrl(post.mux_playback_id, { width: 1200, height: 630, fitMode: "smartcrop" });
  } else if (post.type === "photo" && post.media && post.media[0]) {
    ogImage = post.media[0].url;
  } else {
    ogImage = `/og/${post.slug}`;
  }

  const url = `${SITE.url}/posts/${post.slug}`;
  const meta: Metadata = {
    title: displayTitle,
    description: excerpt,
    openGraph: {
      type: "article",
      title: displayTitle,
      description: excerpt,
      url,
      publishedTime: post.published_at ?? undefined,
      authors: [SITE.author],
      images: [{ url: ogImage, width: 1200, height: 630, alt: displayTitle }],
    },
    twitter: {
      card: post.type === "video" ? "player" : "summary_large_image",
      title: displayTitle,
      description: excerpt,
      images: [ogImage],
    },
    alternates: { canonical: `/posts/${post.slug}` },
  };

  // Add og:video tags for video posts so Facebook/LinkedIn can embed.
  if (post.type === "video" && post.mux_playback_id) {
    meta.openGraph!.videos = [
      {
        url: `https://stream.mux.com/${post.mux_playback_id}.m3u8`,
        type: "application/x-mpegURL",
        width: 1280,
        height: 720,
      },
    ];
  }

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

  const [allPosts, commentCount, reactions] = await Promise.all([
    getPublishedPosts(),
    getCommentCount(post.id),
    getReactionsForPost(post.id),
  ]);
  const readNext = allPosts.filter((p) => p.id !== post.id).slice(0, 4);

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
          contentUrl: `https://stream.mux.com/${post.mux_playback_id}.m3u8`,
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
            <p className="text-sm text-[var(--color-muted)]">By {SITE.author}</p>
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

        <div className="mt-6">
          <ReactionRow
            postId={post.id}
            initialCounts={reactions.counts}
            initialUserReactions={reactions.mine}
            signedIn={signedIn}
          />
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
        <div className="mt-8">
          <SignupForm disabled={!SITE.mailingAddress} />
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

function PostMain({ post }: { post: Awaited<ReturnType<typeof getPostBySlug>> }) {
  if (!post) return null;

  if (post.type === "video") {
    const ready = post.mux_status === "ready" && !!post.mux_playback_id;
    return (
      <>
        {ready ? (
          <VideoPlayer
            playbackId={post.mux_playback_id!}
            poster={muxThumbnailUrl(post.mux_playback_id!, { width: 1280, time: 1 })}
            title={post.title ?? undefined}
          />
        ) : (
          <div className="aspect-video w-full rounded-lg bg-black/90 flex items-center justify-center text-white text-sm">
            {post.mux_status === "errored"
              ? "Video failed to process."
              : "Video is still processing — refresh in a minute."}
          </div>
        )}
        {post.body ? (
          <div className="mt-5">
            <PostBody body={post.body} />
          </div>
        ) : null}
      </>
    );
  }

  if (post.type === "photo") {
    const media = post.media ?? [];
    return (
      <>
        <div className="space-y-3">
          {media.map((m) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={m.url}
              src={m.url}
              alt={m.alt ?? ""}
              className="w-full rounded-lg border border-[var(--color-line)]"
              width={m.width}
              height={m.height}
            />
          ))}
        </div>
        {post.body ? (
          <div className="mt-5">
            <PostBody body={post.body} />
          </div>
        ) : null}
      </>
    );
  }

  if (post.type === "note") {
    return (
      <p className="text-xl leading-relaxed whitespace-pre-wrap">{post.body}</p>
    );
  }

  // text
  return <PostBody body={post.body} />;
}
