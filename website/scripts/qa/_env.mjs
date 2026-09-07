// Shared bits for the QA scripts: Supabase anon credentials (env first, then
// website/.env.production when run from website/) and the output folder.
import fs from "node:fs";
import path from "node:path";

export function supabaseEnv() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    const file = path.join(process.cwd(), ".env.production");
    if (fs.existsSync(file)) {
      const env = fs.readFileSync(file, "utf8");
      url ||= env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1]?.trim();
      key ||= env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1]?.trim();
    }
  }
  if (!url || !key) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, or run from website/ where .env.production lives.",
    );
  }
  return { url, key };
}

// Screenshots and JSON reports land here (gitignored). Override with QA_OUT.
export function outDir() {
  const dir = process.env.QA_OUT || path.join(process.cwd(), ".qa");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export const BASE = process.env.BASE || "http://localhost:3000";
export const UA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

// Playwright launch options: when the target is remote and the machine routes
// through an HTTPS proxy, hand it to Chromium too.
export function launchOptions() {
  const remote = /^https:/.test(BASE);
  return remote && process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {};
}

export function reporter() {
  const results = [];
  function rec(name, pass, detail) {
    results.push({ name, pass, detail });
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
  }
  function finish() {
    const failed = results.filter((r) => !r.pass);
    console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
    return failed.length ? 1 : 0;
  }
  return { results, rec, finish };
}
