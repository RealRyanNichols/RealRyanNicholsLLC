import test from "node:test";
import assert from "node:assert/strict";
import { getImageProps } from "next/image";
import { getImageSource } from "../lib/image-source";

test("local image paths retain cache versions when optimized", () => {
  const src = "/avatar.jpg?v=20260920";
  assert.deepEqual(getImageSource(src), { src, unoptimized: false });
});

test("production image URLs become local without dropping query parameters", () => {
  for (const host of ["realryannichols.com", "www.realryannichols.com"]) {
    assert.deepEqual(getImageSource(`https://${host}/social-cards/example.jpg?v=2&crop=face`), {
      src: "/social-cards/example.jpg?v=2&crop=face",
      unoptimized: false,
    });
  }
});

test("Supabase HTTPS media remains absolute and can use the configured optimizer", () => {
  for (const host of ["rpchhzncxigczfojfdtc.supabase.co", "another-project.supabase.co"]) {
    const src = `https://${host}/storage/v1/object/public/post-media/card.png?v=3`;
    assert.deepEqual(getImageSource(src), { src, unoptimized: false });
  }
});

test("outside, insecure, or authenticated sources keep their existing URL and bypass optimization", () => {
  const sources = [
    "https://image.mux.com/example/thumbnail.jpg?width=1200",
    "https://supabase.co.example.com/card.png",
    "https://realryannichols.com.example.com/card.png",
    "http://realryannichols.com/card.jpg",
    "http://project.supabase.co/card.jpg",
    "//realryannichols.com/card.jpg",
    "https://realryannichols.com:8443/card.jpg",
    "https://reader:password@realryannichols.com/card.jpg",
    "https://reader:password@project.supabase.co/card.jpg",
  ];
  for (const src of sources) {
    assert.deepEqual(getImageSource(src), { src, unoptimized: true }, src);
  }
});

test("malformed and non-URL sources retain the browser fallback", () => {
  for (const src of ["", "not a URL", "https://", "data:image/png;base64,example"]) {
    assert.deepEqual(getImageSource(src), { src, unoptimized: true }, src);
  }
});

test("Next keeps SVG files out of the optimizer, including versioned local URLs", () => {
  const { props } = getImageProps({
    ...getImageSource("https://realryannichols.com/graphic.svg?v=2"),
    alt: "",
    width: 1200,
    height: 630,
  });
  assert.equal(props.src, "/graphic.svg?v=2");
  assert.equal(props.srcSet, undefined);
});
