import assert from "node:assert/strict";
import test from "node:test";
import React, { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PostBody } from "../components/PostBody";

// The standalone runner evaluates Next's preserved JSX outside its compiler.
Object.assign(globalThis, { React });

test("article water-report shortcode renders the dedicated private form", () => {
  const html = renderToStaticMarkup(
    createElement(PostBody, {
      body: "{{water-report}}",
      interactive: true,
      slug: "diana-water-notice-who-was-notified",
    }),
  );
  assert.match(html, /Share a private fiber or water incident report/);
  assert.match(html, /name="private_review_consent"/);
  assert.match(html, /name="knowledge_basis"/);
  assert.doesNotMatch(html, /\{\{water-report\}\}/);
  assert.doesNotMatch(html, /Share a tip/);
});

test("noninteractive article previews do not expose a working private form", () => {
  const html = renderToStaticMarkup(
    createElement(PostBody, { body: "{{water-report}}", interactive: false }),
  );
  assert.doesNotMatch(html, /<form/);
  assert.doesNotMatch(html, /\{\{water-report\}\}/);
});
