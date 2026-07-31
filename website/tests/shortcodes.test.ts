import { test } from "node:test";
import assert from "node:assert/strict";
import { parseBodySegments, parsePayload } from "../lib/shortcodes";

test("valid pipe block on its own line", () => {
  const segs = parseBodySegments("intro\n{{callout: pull | Read that again.}}\noutro");
  assert.equal(segs.length, 3);
  assert.equal(segs[0]!.kind, "markdown");
  const block = segs[1]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block") {
    assert.equal(block.name, "callout");
    assert.deepEqual(block.parsed, { type: "args", args: ["pull", "Read that again."] });
  }
});

test("valid single-line JSON block", () => {
  const segs = parseBodySegments('{{receipt: {"label": "FACT", "claim": "x"}}}');
  assert.equal(segs.length, 1);
  const block = segs[0]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block" && block.parsed.type === "json") {
    assert.equal(block.parsed.value.label, "FACT");
  } else {
    assert.fail("expected parsed json");
  }
});

test("multi-line JSON block with nested braces inside strings", () => {
  const body = [
    "before",
    "{{receipt: {",
    '  "label": "FACT",',
    '  "claim": "The filing shows {no charge} on record",',
    '  "source": "Docket"',
    "}}}",
    "after",
  ].join("\n");
  const segs = parseBodySegments(body);
  assert.equal(segs.length, 3);
  const block = segs[1]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block" && block.parsed.type === "json") {
    assert.match(String(block.parsed.value.claim), /\{no charge\}/);
  } else {
    assert.fail("expected parsed json with nested braces preserved");
  }
});

test("malformed JSON degrades to invalid payload, never throws", () => {
  const segs = parseBodySegments('{{receipt: {"label": "FACT", broken}}}');
  const block = segs[0]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block") {
    assert.equal(block.parsed.type, "invalid");
    assert.ok(block.raw.includes("broken"));
  }
});

test("unknown shortcode name still parses as a block (renderer shows literal)", () => {
  const segs = parseBodySegments("{{definitelynotreal: a | b}}");
  const block = segs[0]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block") assert.equal(block.name, "definitelynotreal");
});

test("shortcode inside a fenced code block is NOT parsed", () => {
  const body = ["```", "{{poll: Q? | A | B}}", "```"].join("\n");
  const segs = parseBodySegments(body);
  assert.equal(segs.length, 1);
  assert.equal(segs[0]!.kind, "markdown");
  if (segs[0]!.kind === "markdown") assert.ok(segs[0]!.text.includes("{{poll:"));
});

test("tilde fences also protect shortcodes", () => {
  const body = ["~~~", "{{callout: pull | x}}", "~~~"].join("\n");
  const segs = parseBodySegments(body);
  assert.equal(segs.length, 1);
  assert.equal(segs[0]!.kind, "markdown");
});

test("indented braces are prose, not blocks", () => {
  const segs = parseBodySegments("  {{callout: pull | not a block}}");
  assert.equal(segs.length, 1);
  assert.equal(segs[0]!.kind, "markdown");
});

test("unclosed block at EOF degrades to markdown", () => {
  const segs = parseBodySegments('{{receipt: {\n  "label": "FACT"');
  assert.equal(segs.length, 1);
  assert.equal(segs[0]!.kind, "markdown");
  if (segs[0]!.kind === "markdown") assert.ok(segs[0]!.text.includes("{{receipt:"));
});

test("plain markdown with no shortcodes is one chunk, byte-identical", () => {
  const body = "# Title\n\nJust prose with {inline braces} and `code`.\n";
  const segs = parseBodySegments(body);
  assert.equal(segs.length, 1);
  if (segs[0]!.kind === "markdown") assert.equal(segs[0]!.text, body);
});

test("bare {{name}} with no payload parses with none payload", () => {
  const segs = parseBodySegments("{{share}}");
  const block = segs[0]!;
  assert.equal(block.kind, "block");
  if (block.kind === "block") {
    assert.equal(block.name, "share");
    assert.deepEqual(block.parsed, { type: "none" });
  }
});

test("parsePayload treats array JSON as invalid", () => {
  assert.equal(parsePayload("[1,2]").type, "args"); // not object-open → args
  assert.equal(parsePayload('{"a": 1}').type, "json");
  assert.equal(parsePayload("{oops}").type, "invalid");
});
