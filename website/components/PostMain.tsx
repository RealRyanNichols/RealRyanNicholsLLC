import type { Post } from "@/lib/types";
import { muxThumbnailUrl } from "@/lib/mux";
import { PostBody } from "@/components/PostBody";
import { VideoPlayer } from "@/components/VideoPlayer";

export function PostMain({ post }: { post: Post }) {
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
              : "Video is still processing. Check back in a minute."}
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
    return <p className="text-xl leading-relaxed whitespace-pre-wrap">{post.body}</p>;
  }

  return <PostBody body={post.body} />;
}
