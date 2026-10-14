import assert from "node:assert/strict";
import test from "node:test";
import type { Post } from "../lib/types";
import { formatVideoDuration, pickShelf, toShelfVideo } from "../lib/video-shelf";
import { doSpacesBase, resolveDoSpacesKey, resolveVideoSrc } from "../lib/video-source";
import { getDirectVideoUrl } from "../lib/direct-video";

function post(over: Partial<Post>): Post {
  return {
    id: "id",
    slug: "slug",
    type: "video",
    title: "A video",
    body: "",
    seo_title: null,
    seo_description: null,
    image_urls: null,
    media: null,
    mux_asset_id: null,
    mux_upload_id: null,
    mux_playback_id: "pb",
    mux_status: "ready",
    duration_seconds: 105.13,
    thumbnail_url: null,
    og_image_url: null,
    pinned: false,
    status: "published",
    author_id: null,
    byline_override: null,
    category: null,
    tags: null,
    published_at: "2026-06-01T00:00:00Z",
    created_at: "2026-06-01T00:00:00Z",
    updated_at: "2026-06-01T00:00:00Z",
    views_count: 0,
    shares_count: 0,
    inbound_shares_count: 0,
    ...over,
  };
}

test("a ready Mux video becomes a shelf video with a Mux poster", () => {
  const v = toShelfVideo(post({ id: "a", slug: "s" }));
  assert.ok(v);
  assert.equal(v.href, "/posts/s");
  assert.equal(v.muxPlaybackId, "pb");
  assert.equal(v.directUrl, null);
  assert.match(v.thumb ?? "", /^https:\/\/image\.mux\.com\/pb\/thumbnail\.jpg/);
  assert.equal(v.durationSeconds, 105.13);
});

test("processing, sourceless and non-video posts are left off the shelf", () => {
  assert.equal(toShelfVideo(post({ mux_status: "processing" })), null);
  assert.equal(toShelfVideo(post({ mux_playback_id: null, mux_status: null })), null);
  assert.equal(toShelfVideo(post({ type: "text" })), null);
});

test("a direct-file video plays from its media URL", () => {
  const v = toShelfVideo(
    post({
      mux_playback_id: null,
      mux_status: null,
      media: [{ url: "https://x.supabase.co/storage/v1/object/public/post-videos/a.mp4" }],
    }),
  );
  assert.ok(v);
  assert.equal(v.muxPlaybackId, null);
  assert.match(v.directUrl ?? "", /a\.mp4$/);
});

test("string durations and view counts from Postgres are coerced", () => {
  const v = toShelfVideo(
    post({
      duration_seconds: "457.16" as unknown as number,
      views_count: "3822" as unknown as number,
    }),
  );
  assert.equal(v?.durationSeconds, 457.16);
  assert.equal(v?.views, 3822);
});

test("the newest video leads and the rest are ordered by views", () => {
  const { featured, rail } = pickShelf([
    post({ id: "old-hit", published_at: "2026-06-07T00:00:00Z", views_count: 4173 }),
    post({ id: "newest", published_at: "2026-10-10T00:00:00Z", views_count: 3 }),
    post({ id: "mid", published_at: "2026-07-10T00:00:00Z", views_count: 2648 }),
    post({ id: "processing", published_at: "2026-10-12T00:00:00Z", mux_status: "processing" }),
  ]);
  assert.equal(featured?.id, "newest");
  assert.deepEqual(
    rail.map((v) => v.id),
    ["old-hit", "mid"],
  );
});

test("the rail is capped and an empty list has no lead", () => {
  const many = Array.from({ length: 12 }, (_, i) =>
    post({ id: `v${i}`, published_at: `2026-06-${String(i + 1).padStart(2, "0")}T00:00:00Z` }),
  );
  assert.equal(pickShelf(many, 8).rail.length, 8);
  assert.deepEqual(pickShelf([]), { featured: null, rail: [] });
});

test("durations format as m:ss and h:mm:ss", () => {
  assert.equal(formatVideoDuration(105.13), "1:45");
  assert.equal(formatVideoDuration(8), "0:08");
  assert.equal(formatVideoDuration(3725), "1:02:05");
  assert.equal(formatVideoDuration(null), "");
  assert.equal(formatVideoDuration(0), "");
});

const BASE = "https://ryan-videos.nyc3.cdn.digitaloceanspaces.com";

test("the Spaces base must be https and loses its trailing slash", () => {
  assert.equal(doSpacesBase(`${BASE}/`), BASE);
  assert.equal(doSpacesBase("http://insecure.example.com"), null);
  assert.equal(doSpacesBase(""), null);
  assert.equal(doSpacesBase(undefined), null);
  assert.equal(doSpacesBase("not a url"), null);
});

test("do: keys resolve against the bucket and cannot climb out of it", () => {
  assert.equal(resolveDoSpacesKey("do:clips/a b.mp4", BASE), `${BASE}/clips/a%20b.mp4`);
  assert.equal(resolveDoSpacesKey("do:/clips/a.mp4", BASE), `${BASE}/clips/a.mp4`);
  assert.equal(resolveDoSpacesKey("do:../secret.mp4", BASE), null);
  assert.equal(resolveDoSpacesKey("do:clips/./a.mp4", BASE), null);
  assert.equal(resolveDoSpacesKey("do:", BASE), null);
  assert.equal(resolveDoSpacesKey("do:clips/a.mp4", null), null);
});

test("video sources: site paths, https and do: keys only", () => {
  assert.equal(resolveVideoSrc("/uploads/a.mp4", BASE), "/uploads/a.mp4");
  assert.equal(resolveVideoSrc("https://cdn.example.com/a.mp4", BASE), "https://cdn.example.com/a.mp4");
  assert.equal(resolveVideoSrc("do:a.mp4", BASE), `${BASE}/a.mp4`);
  assert.equal(resolveVideoSrc("do:a.mp4", null), null);
  assert.equal(resolveVideoSrc("//evil.example.com/a.mp4", BASE), null);
  assert.equal(resolveVideoSrc("http://example.com/a.mp4", BASE), null);
  assert.equal(resolveVideoSrc("javascript:alert(1)", BASE), null);
  assert.equal(resolveVideoSrc("", BASE), null);
});

test("an unconfigured do: media URL yields no direct video, others pass through", () => {
  const saved = process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL;
  delete process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL;
  try {
    assert.equal(getDirectVideoUrl([{ url: "do:clips/a.mp4" }]), null);
    assert.equal(getDirectVideoUrl([{ url: "https://x.supabase.co/a.mp4" }]), "https://x.supabase.co/a.mp4");
    assert.equal(getDirectVideoUrl(null), null);
  } finally {
    if (saved !== undefined) process.env.NEXT_PUBLIC_DO_SPACES_CDN_URL = saved;
  }
});
