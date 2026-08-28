import { cookies, headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { RECORD_COOKIE, readRecordKey } from "@/lib/record-key";

// The archive is free. It is not anonymous.
//
// Anyone can find a case and read what it is. Going deep into the actual
// record — the documents, the exhibits, the full file — costs a real name and
// a working email. That is the whole trade, and it is the same for everyone.
//
// Search engines and AI crawlers are always let through in full. If Google
// can't read the record, nobody finds the record, and the archive dies. The
// point of the wall is to know who is reading, not to hide from the world.

const CRAWLER = new RegExp(
  [
    "bot", "crawler", "spider", "googlebot", "bingbot", "duckduckbot",
    "baiduspider", "yandex", "slurp", "applebot", "facebookexternalhit",
    "twitterbot", "linkedinbot", "whatsapp", "telegram", "discordbot",
    "embedly", "quora link preview", "pinterest", "redditbot",
    // AI answer engines — being cited by these is how the record travels now
    "gptbot", "oai-searchbot", "chatgpt", "claudebot", "anthropic",
    "perplexity", "ccbot", "amazonbot", "meta-externalagent", "bytespider",
    "google-extended", "applebot-extended",
  ].join("|"),
  "i",
);

export type GateState = {
  open: boolean;
  reason: "crawler" | "member" | "unlocked" | "locked";
  signedIn: boolean;
  unconfirmed: boolean;
};

export async function getGateState(): Promise<GateState> {
  let ua = "";
  try {
    const h = await headers();
    ua = h.get("user-agent") ?? "";
  } catch {
    // headers() unavailable (static context) — fall through to locked.
  }

  if (ua && CRAWLER.test(ua)) {
    return { open: true, reason: "crawler", signedIn: false, unconfirmed: false };
  }

  // The archive key. One email on the document itself opens the whole
  // archive — no account, no password, no confirmation click. See
  // lib/record-key.ts and /api/record-unlock.
  try {
    const jar = await cookies();
    if (readRecordKey(jar.get(RECORD_COOKIE)?.value)) {
      return { open: true, reason: "unlocked", signedIn: false, unconfirmed: false };
    }
  } catch {
    // cookies() unavailable in a static context — fall through.
  }

  try {
    const supabase = await getSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    const user = data?.user;
    if (user) {
      const confirmed = Boolean(
        (user as { email_confirmed_at?: string | null }).email_confirmed_at ??
          (user as { confirmed_at?: string | null }).confirmed_at,
      );
      if (confirmed) {
        return { open: true, reason: "member", signedIn: true, unconfirmed: false };
      }
      // Registered but hasn't clicked the link in their inbox yet.
      return { open: false, reason: "locked", signedIn: true, unconfirmed: true };
    }
  } catch {
    // Auth unavailable — treat as logged out rather than throwing the page.
  }

  return { open: false, reason: "locked", signedIn: false, unconfirmed: false };
}
