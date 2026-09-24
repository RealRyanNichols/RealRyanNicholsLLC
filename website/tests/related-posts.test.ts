import assert from "node:assert/strict";
import test from "node:test";
import {
  RELATED_LIMIT,
  categoryWords,
  isCaseRelated,
  normalizeCategory,
  pickRelatedPosts,
  relatedPostScore,
  sameCategory,
  type RelatedCandidate,
} from "../lib/related-posts";

function post(
  id: string,
  category: string | null,
  tags: string[] = [],
  title: string | null = `Post ${id}`,
): RelatedCandidate {
  return { id, slug: `slug-${id}`, title, category, tags };
}

const ids = (posts: RelatedCandidate[]) => posts.map((p) => p.id);

test("normalizeCategory folds case, ampersands, and punctuation", () => {
  assert.equal(normalizeCategory("Business & Technology"), "business and technology");
  assert.equal(normalizeCategory("business and technology"), "business and technology");
  assert.equal(normalizeCategory("  Behind the Scenes "), "behind the scenes");
  assert.equal(normalizeCategory("Ryan's Take"), "ryans take");
  assert.equal(normalizeCategory("History, Service & Communication"), "history service and communication");
  assert.equal(normalizeCategory(null), "");
});

test("sameCategory treats obvious variants as one and blanks as none", () => {
  assert.equal(sameCategory("Behind the scenes", "Behind the Scenes"), true);
  assert.equal(sameCategory("Business & Technology", "Business and Technology"), true);
  assert.equal(sameCategory("Motivation", "Motivation & Resilience"), false);
  assert.equal(sameCategory(null, null), false);
  assert.equal(sameCategory("", "  "), false);
});

test("categoryWords drops joiners", () => {
  assert.deepEqual([...categoryWords("Motivation & Resilience")], ["motivation", "resilience"]);
  assert.deepEqual([...categoryWords("History, Business & Technology")], ["history", "business", "technology"]);
});

test("isCaseRelated reads title, category, and tags", () => {
  assert.equal(isCaseRelated({ title: "What the judge said", category: "Reflection", tags: [] }), true);
  assert.equal(isCaseRelated({ title: "Fence posts", category: "January 6", tags: null }), true);
  assert.equal(isCaseRelated({ title: "Fence posts", category: "Rebuild", tags: ["pardon"] }), true);
  assert.equal(isCaseRelated({ title: "Fence posts", category: "Rebuild", tags: ["farm"] }), false);
});

test("relatedPostScore weighs category, category words, tags, and the case line", () => {
  const current = post("c", "Motivation & Resilience", ["grit", "Faith"]);
  assert.equal(relatedPostScore(current, post("a", "motivation and resilience")), 8 + 2);
  assert.equal(relatedPostScore(current, post("b", "Motivation")), 4 + 2);
  assert.equal(relatedPostScore(current, post("d", "Rebuild", [" faith ", "GRIT"])), 6 + 2);
  assert.equal(relatedPostScore(current, post("e", "Rebuild", [], "Inside the D.C. jail")), 0);
});

test("pickRelatedPosts never returns the current post and returns exactly three", () => {
  const current = post("c", "Reflection");
  const pool = [post("c", "Reflection"), post("1", "Rebuild"), post("2", "Reflection"), post("3", "News"), post("4", "Reflection")];
  const picked = pickRelatedPosts(current, pool);
  assert.equal(picked.length, RELATED_LIMIT);
  assert.ok(!ids(picked).includes("c"));
});

test("pickRelatedPosts puts same category first, variants included, before tag matches", () => {
  const current = post("c", "Business & Technology", ["ai"]);
  const pool = [
    post("tags", "Reflection", ["ai"]),
    post("other", "News"),
    post("variant", "business and technology"),
    post("exact", "Business & Technology"),
  ];
  assert.deepEqual(ids(pickRelatedPosts(current, pool)), ["variant", "exact", "tags"]);
});

test("pickRelatedPosts ranks the rest by score, then incoming order", () => {
  const current = post("c", "Motivation & Resilience", ["grit"]);
  const pool = [
    post("plain-1", "Rebuild"),
    post("family", "Motivation"),
    post("plain-2", "Rebuild"),
    post("tagged", "Reflection", ["grit", "faith"]),
  ];
  // tagged: 3 + 2 = 5; family: 4 + 2 = 6; plain: 2 each, in incoming order.
  assert.deepEqual(ids(pickRelatedPosts(current, pool, { limit: 4 })), ["family", "tagged", "plain-1", "plain-2"]);
});

test("pickRelatedPosts keeps automatic links first, in edge order, deduped", () => {
  const current = post("c", "Reflection");
  const pool = [post("same", "Reflection"), post("auto-a", "News"), post("auto-b", "Rebuild"), post("same-2", "Reflection")];
  const picked = pickRelatedPosts(current, pool, {
    autoLinkedIds: ["auto-b", "missing", "c", "auto-b", "auto-a"],
  });
  assert.deepEqual(ids(picked), ["auto-b", "auto-a", "same"]);
});

test("pickRelatedPosts returns what it has when the archive is small", () => {
  const current = post("c", "Reflection");
  assert.deepEqual(ids(pickRelatedPosts(current, [post("c", "Reflection"), post("1", "News")])), ["1"]);
  assert.deepEqual(pickRelatedPosts(current, []), []);
  assert.deepEqual(pickRelatedPosts(current, [post("1", "News")], { limit: 0 }), []);
});

test("pickRelatedPosts ignores duplicate candidates", () => {
  const current = post("c", "Reflection");
  const dup = post("1", "Reflection");
  assert.deepEqual(ids(pickRelatedPosts(current, [dup, dup, post("2", "News")])), ["1", "2"]);
});
