import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PALETTE, CSS_TOKEN } from "../lib/palette";

const css = readFileSync(join(__dirname, "..", "styles", "tokens.css"), "utf8");

function cssValue(token: string): string | null {
  const m = css.match(new RegExp(`${token}\\s*:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  return m ? m[1]! : null;
}

test("every palette color has a matching CSS token with the same value", () => {
  for (const key of Object.keys(PALETTE) as (keyof typeof PALETTE)[]) {
    const token = CSS_TOKEN[key];
    const value = cssValue(token);
    assert.ok(value, `${token} is missing from styles/tokens.css`);
    assert.equal(
      value.toLowerCase(),
      PALETTE[key].toLowerCase(),
      `${token} in styles/tokens.css must equal PALETTE.${key}`,
    );
  }
});

test("styles/tokens.css defines no token that lib/palette.ts lacks", () => {
  const declared = Array.from(css.matchAll(/(--color-[a-z-]+)\s*:/g)).map((m) => m[1]);
  const known = new Set(Object.values(CSS_TOKEN));
  for (const token of declared) {
    assert.ok(known.has(token as (typeof CSS_TOKEN)[keyof typeof CSS_TOKEN]), `${token} has no PALETTE entry`);
  }
});
