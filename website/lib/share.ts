import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { trackEvent } from "@/lib/analytics";

// One shared brain for every share surface on the site (ShareButton dropdown,
// ShareRail bar, FloatingShareBar). Centralising it guarantees two things that
// used to drift apart: (1) every channel — including SMS — is offered the same
// way everywhere, and (2) EVERY completed share is recorded to both the
// analytics stream and the shares_count counter. Before this, ShareRail (used
// on ~10 pages) recorded nothing, so real shares never showed up.

export type CaseKind = "grievance" | "event" | "document" | "person";

export type ShareIntent = {
  /** Stable key + the label shown to users. */
  name: string;
  /** Platform share-intent URL (opens in a new tab) or a sms:/mailto: scheme. */
  href: string;
  /** Single-glyph icon used by the compact rails. */
  icon: string;
  /** Highlighted = the channels a J6 audience actually mobilises on. */
  accent?: boolean;
  /** sms:/mailto: open in the same tab; web intents open in a new tab. */
  scheme?: boolean;
};

/**
 * The text a recipient sees. We deliberately do NOT editorialise on the
 * author's behalf — the headline is the pre-written hook, and the OG card
 * (set in each page's metadata) carries the image + description. Honest by
 * construction, which is the whole point of this site.
 */
export function buildShareText(title: string, url: string): string {
  return `${title}\n\n${url}`;
}

/**
 * Every channel we offer, in priority order. SMS is first among the
 * person-to-person channels because this site captures phone numbers — a
 * texted link is the most natural, highest-trust share for that audience.
 */
export function buildShareIntents(url: string, title: string): ShareIntent[] {
  const t = encodeURIComponent(title);
  const u = encodeURIComponent(url);
  const body = encodeURIComponent(buildShareText(title, url));
  return [
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}`, icon: "𝕏", accent: true },
    { name: "Truth", href: `https://truthsocial.com/share?text=${body}`, icon: "🇺🇸", accent: true },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, icon: "f", accent: true },
    // sms:?&body= is the cross-platform form that both iOS and Android accept.
    { name: "Text", href: `sms:?&body=${body}`, icon: "✉", accent: true, scheme: true },
    { name: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}`, icon: "✈" },
    { name: "WhatsApp", href: `https://wa.me/?text=${body}`, icon: "✆" },
    { name: "Reddit", href: `https://www.reddit.com/submit?url=${u}&title=${t}`, icon: "r" },
    { name: "Email", href: `mailto:?subject=${t}&body=${body}`, icon: "@", scheme: true },
  ];
}

/** Compact, human share counts: 1240 → "1.2K". */
export function formatShareCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/**
 * Record a share to every sink at once. `action` distinguishes the gesture
 * (share_platform / share_copy / share_native / share_menu_open). Opening the
 * menu is tracked as an event but must NOT inflate the counter — only a real
 * outbound share does. When a slug is present we also bump the durable
 * shares_count via the matching RPC.
 */
export function recordShare(opts: {
  action: "share_platform" | "share_copy" | "share_native" | "share_menu_open";
  platform: string;
  title: string;
  slug?: string;
  caseKind?: CaseKind;
  compact?: boolean;
}): void {
  const { action, platform, title, slug, caseKind, compact } = opts;
  trackEvent(action, {
    platform,
    slug: slug ?? "none",
    kind: caseKind ?? "post",
    compact: compact ?? false,
    title: title.slice(0, 120),
  });

  const countsAsShare = action !== "share_menu_open";
  if (!slug || !countsAsShare) return;

  const supabase = getSupabaseBrowserClient();
  if (caseKind) {
    void supabase.rpc("increment_case_shares", { p_type: caseKind, p_slug: slug });
  } else {
    void supabase.rpc("increment_post_shares", { post_slug: slug });
  }
}
