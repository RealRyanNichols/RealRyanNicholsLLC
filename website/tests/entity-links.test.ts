import { test } from "node:test";
import assert from "node:assert/strict";
import { linkFirstMentions, extractInternalPostSlugs } from "../lib/entity-links";

test("first mention becomes a link, second stays plain", () => {
  const { chunks, linked } = linkFirstMentions([
    "I wrote Fighting Shadows in a cell.\n\nBuy Fighting Shadows today.",
  ]);
  const text = chunks[0]!;
  assert.ok(text.includes("[Fighting Shadows](/book)"));
  assert.equal(text.match(/\[Fighting Shadows\]/g)?.length, 1);
  assert.equal(linked.length, 1);
});

test("first-mention tracking spans multiple chunks", () => {
  const { chunks } = linkFirstMentions([
    "Fighting Shadows opens the story.",
    "Fighting Shadows again in a later chunk.",
  ]);
  assert.ok(chunks[0]!.includes("[Fighting Shadows](/book)"));
  assert.ok(!chunks[1]!.includes("[Fighting Shadows]"));
});

test("never links inside headings", () => {
  const { chunks } = linkFirstMentions(["## Fighting Shadows chapter\n\nFighting Shadows body."]);
  const lines = chunks[0]!.split("\n");
  assert.ok(lines[0]!.startsWith("## Fighting Shadows"));
  assert.ok(!lines[0]!.includes("["));
  assert.ok(chunks[0]!.includes("[Fighting Shadows](/book)"));
});

test("never links inside fenced code", () => {
  const { chunks, linked } = linkFirstMentions(["```\nFighting Shadows\n```"]);
  assert.ok(!chunks[0]!.includes("["));
  assert.equal(linked.length, 0);
});

test("never double-links an existing markdown link", () => {
  const { chunks } = linkFirstMentions(["Read [Fighting Shadows](/book/preorder) now."]);
  assert.ok(chunks[0]!.includes("[Fighting Shadows](/book/preorder)"));
  assert.ok(!chunks[0]!.includes("[[Fighting Shadows]"));
});

test("longest term wins on overlap", () => {
  const { chunks } = linkFirstMentions(["Premier Dental Academy of Longview opened."]);
  assert.ok(
    chunks[0]!.includes("[Premier Dental Academy of Longview](https://premierdentalacademyoflongview.com)"),
  );
});

test("extractInternalPostSlugs finds inline links and related blocks", () => {
  const body = [
    "See [the receipts wall](/posts/the-receipts-wall) for more.",
    "Also [this](https://realryannichols.com/posts/judge-hogan-on-the-record).",
    "{{related: out-of-runway | george-tanios-pleaded-first-walked}}",
  ].join("\n");
  const found = extractInternalPostSlugs(body);
  const slugs = found.map((f) => f.slug);
  assert.deepEqual(slugs, [
    "the-receipts-wall",
    "judge-hogan-on-the-record",
    "out-of-runway",
    "george-tanios-pleaded-first-walked",
  ]);
});
