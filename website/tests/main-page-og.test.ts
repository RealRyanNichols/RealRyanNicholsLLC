import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Metadata } from "next";
import { MAIN_PAGE_OG_IMAGES, getMainPageOgImage } from "../lib/page-og-catalog";
import { pageMetadata, withMainPageOg } from "../lib/page-metadata";

test("every assigned main page has a unique, correctly sized social JPEG", async () => {
  const entries = Object.entries(MAIN_PAGE_OG_IMAGES);
  assert.equal(entries.length, 55);
  const hashes = new Set<string>();
  for (const [route, asset] of entries) {
    const image = getMainPageOgImage(route);
    assert.ok(image);
    assert.ok(asset.alt.trim());
    const bytes = await readFile(path.join(process.cwd(), "public", image.url));
    const info = await sharp(bytes).metadata();
    assert.equal(info.format, "jpeg", route);
    assert.equal(info.width, 1200, route);
    assert.equal(info.height, 630, route);
    assert.ok(bytes.length < 250_000, route);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.ok(!hashes.has(hash), "duplicate artwork: " + route);
    hashes.add(hash);
  }
});

test("changing a main-page image retains robots, canonical and article metadata", () => {
  const original: Metadata = {
    title: "Page title",
    description: "Page description",
    robots: { index: false, follow: true },
    alternates: { canonical: "/case/brief" },
    openGraph: {
      type: "article",
      title: "Existing share title",
      description: "Existing share description",
      url: "https://realryannichols.com/case/brief",
      publishedTime: "2026-09-06",
      authors: ["Ryan Nichols"],
      images: ["/old.jpg"],
    },
    twitter: {
      card: "summary",
      title: "Existing Twitter title",
      creator: "@RealRyanNichols",
      images: ["/old.jpg"],
    },
  };
  const updated = withMainPageOg("/case/brief", original);
  assert.deepEqual(updated.robots, original.robots);
  assert.deepEqual(updated.alternates, original.alternates);
  assert.ok(updated.openGraph && "type" in updated.openGraph && updated.openGraph.type === "article");
  assert.equal(updated.openGraph?.title, "Existing share title");
  assert.equal(updated.openGraph?.description, "Existing share description");
  assert.equal(updated.openGraph?.publishedTime, "2026-09-06");
  assert.deepEqual(updated.openGraph?.authors, ["Ryan Nichols"]);
  assert.equal(updated.twitter?.title, "Existing Twitter title");
  assert.equal(updated.twitter?.creator, "@RealRyanNichols");
  assert.ok(updated.twitter && "card" in updated.twitter);
  assert.equal(updated.twitter.card, "summary_large_image");
  assert.deepEqual(updated.openGraph?.images, [getMainPageOgImage("/case/brief")]);
  assert.deepEqual(original.openGraph?.images, ["/old.jpg"]);
});

test("unassigned articles and records keep their existing imagery", () => {
  const article: Metadata = { openGraph: { images: ["/article.jpg"] } };
  assert.strictEqual(withMainPageOg("/posts/example", article), article);
  assert.equal(getMainPageOgImage("/case/people/example"), null);
  assert.equal(getMainPageOgImage("/admin"), null);
  assert.equal(getMainPageOgImage("/case?view=documents"), null);
  assert.equal(getMainPageOgImage("/case?filter=unclaimed&view=people"), null);
});

test("the existing pageMetadata helper selects the finished card without changing page copy", () => {
  const metadata = pageMetadata({
    title: "The Story",
    description: "Existing page description.",
    path: "/the-story",
    image: "/og/the-story",
  });
  assert.equal(metadata.title, "The Story");
  assert.equal(metadata.description, "Existing page description.");
  assert.deepEqual(metadata.openGraph?.images, [getMainPageOgImage("/the-story")]);
  assert.ok(metadata.twitter && "card" in metadata.twitter);
  assert.equal(metadata.twitter.card, "summary_large_image");
});
