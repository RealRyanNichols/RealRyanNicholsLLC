import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { SITE } from "@/lib/site";

// Social Studio — turns a published article into platform-ready posts in
// Ryan's voice: one Facebook post, one X post, one Instagram caption, one
// TikTok script. One model call per article, strict JSON out, stored as
// drafts an admin can copy/download/regenerate/mark-posted at /admin/social.
// Never runs for the public; never posts anywhere by itself.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";

export type SocialPlatform = "facebook" | "x" | "instagram" | "tiktok";

export type SocialVariant = {
  platform: SocialPlatform;
  angle: string;
  body: string;
};

const SYSTEM_PROMPT = `You write social media posts AS Ryan Nichols, in his voice, promoting an article from his own website.

WHO RYAN IS: United States Marine Corps veteran. Search and rescue. Father. Christian. East Texas. Pardoned January 6 defendant (63 months and a $200,000 fine, the largest fine in any January 6 case; pardoned January 20, 2025; dismissed with prejudice). Independent investigative journalist building his own platform so no algorithm can silence him. Builder of tools and websites.

HOW RYAN WRITES: Plainspoken. Direct. Short lines for rhythm. Receipts first, drama never. East Texas, not corporate. Hopeful but real. He can be loud by himself: post the truth and walk away.

HARD RULES, ABSOLUTE:
1. Never invent a fact, quote, number, name, or date that is not in the article you are given.
2. Never discuss his family, divorce, custody, or children. Never mention the sealed family-court matter.
3. Never solicit donations, gifts, or "support". Ryan sells and publishes; he does not pass the hat. Selling the book or a tool is fine when the article does.
4. No defamation: no stating a living person committed a crime unless the article states an established public conviction.
5. No em dashes anywhere. Use periods, commas, or line breaks.
6. Never imply he deployed to a combat theater. He served 2010 to 2014 and was honorably discharged.

PLATFORM RULES:
- x: 280 characters MAX including the URL. Punchy. At most 1 hashtag. End with the article URL.
- facebook: 2 to 5 short paragraphs. Story first, then the point, then the link on its own final line.
- instagram: caption with a hook first line, line breaks between thoughts, no URL in the body (say "link in bio"), then 5 to 8 hashtags on the last line.
- tiktok: a 45 to 75 second spoken script. HOOK in the first sentence. Written to be read aloud. You may include [ON SCREEN: ...] cues sparingly. No hashtags.

ANGLES, pick the strongest ONE per platform for this article (they may differ): receipts (lead with the hardest fact), testimony (first person, what I lived), contrast (what they said vs what the record shows), question (open with the question the article answers), list (three tight beats), quote-pull (the article's strongest line), behind-the-build (what I built and why), call-to-read (direct ask to read it), stat (lead with the number).

OUTPUT: strict JSON only, no prose around it:
{"variants":[{"platform":"x","angle":"receipts","body":"..."},{"platform":"facebook","angle":"...","body":"..."},{"platform":"instagram","angle":"...","body":"..."},{"platform":"tiktok","angle":"...","body":"..."}]}`;

/** Strip shortcode blocks so the model sees prose, not markup. */
function plainBody(body: string): string {
  return body
    .replace(/^\{\{[\s\S]*?\}\}\s*$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 6000);
}

export async function generateSocialPosts(
  postId: string,
): Promise<{ ok: boolean; count?: number; error?: string }> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, error: "ANTHROPIC_API_KEY is not set." };
    if (!isSupabaseServiceConfigured()) {
      return { ok: false, error: "Service role is not configured." };
    }
    const svc = getSupabaseServiceClient();

    const { data: post } = await svc
      .from("posts")
      .select("id, slug, title, body, category, status")
      .eq("id", postId)
      .maybeSingle();
    if (!post || post.status !== "published") {
      return { ok: false, error: "Post not found or not published." };
    }

    const url = `${SITE.url}/posts/${post.slug}`;
    const userMessage = [
      `ARTICLE TITLE: ${post.title ?? "(untitled note)"}`,
      `ARTICLE URL: ${url}`,
      post.category ? `CATEGORY: ${post.category}` : "",
      "",
      "ARTICLE BODY:",
      plainBody(post.body ?? ""),
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    if (!res.ok) {
      return { ok: false, error: `Model call failed (${res.status}).` };
    }
    const json = (await res.json()) as {
      content?: { type: string; text?: string }[];
    };
    const text =
      json.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    // The model returns bare JSON; tolerate accidental code fences.
    const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    let variants: SocialVariant[] = [];
    try {
      const parsed = JSON.parse(cleaned) as { variants?: SocialVariant[] };
      variants = (parsed.variants ?? []).filter(
        (v) =>
          ["facebook", "x", "instagram", "tiktok"].includes(v.platform) &&
          typeof v.body === "string" &&
          v.body.trim().length > 0,
      );
    } catch {
      return { ok: false, error: "Model returned unparseable output. Try again." };
    }
    if (variants.length === 0) {
      return { ok: false, error: "Model returned no usable variants." };
    }

    // Fresh drafts replace old drafts; posted/dismissed history stays.
    await svc
      .from("social_studio_posts")
      .delete()
      .eq("post_id", postId)
      .eq("status", "draft");
    const { error: insertError } = await svc.from("social_studio_posts").insert(
      variants.map((v) => ({
        post_id: postId,
        platform: v.platform,
        angle: (v.angle ?? "").slice(0, 60),
        body: v.body.trim(),
      })),
    );
    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true, count: variants.length };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Generation failed.",
    };
  }
}
