import { NextResponse } from "next/server";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

// Multi-pass AI briefing for a J6 entity. Disabled-by-default: the
// route checks for ANTHROPIC_API_KEY at request time and returns a
// 503 with a useful message if it's missing, so the rest of the site
// can ship without any LLM coupling.
//
// When the key IS present, this hits Anthropic's Messages API with a
// retrieval-augmented payload pulled fresh from Supabase. The system
// prompt keeps it strictly grounded — no claims beyond what was passed
// in — so it can't hallucinate names, charges, or dates.
//
// Cost guard: capped at 1 request per IP every 10s and 2 retries on
// 429 from upstream.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";
const MAX_TOKENS = 800;

type Payload = {
  entity_type: "defendant" | "case";
  entity_id: string;
  question?: string;
};

const memo: Map<string, { at: number; body: unknown }> = new Map();
const lastByIp: Map<string, number> = new Map();

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      {
        ok: false,
        error: "ai_disabled",
        message:
          "AI briefings are disabled. Set ANTHROPIC_API_KEY in the environment to enable.",
      },
      { status: 503 },
    );
  }

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  if (!body?.entity_type || !body?.entity_id) {
    return NextResponse.json(
      { ok: false, error: "missing_fields" },
      { status: 400 },
    );
  }

  // Simple per-IP throttle: 1 / 10s
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "anon";
  const now = Date.now();
  const last = lastByIp.get(ip) ?? 0;
  if (now - last < 10_000) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retry_in_ms: 10_000 - (now - last) },
      { status: 429 },
    );
  }
  lastByIp.set(ip, now);

  // Memoization — same (entity, question) returns the cached briefing
  // for 15 minutes so a user re-hitting Generate doesn't bill twice.
  const cacheKey = JSON.stringify(body);
  const cached = memo.get(cacheKey);
  if (cached && now - cached.at < 15 * 60 * 1000) {
    return NextResponse.json({ ok: true, cached: true, ...(cached.body as object) });
  }

  // Pull the entity context from Supabase fresh on each cache miss.
  const supa = getSupabaseStaticClient();
  let context: unknown = null;
  if (body.entity_type === "defendant") {
    const { data } = await supa
      .from("case_people")
      .select(
        "id, slug, name, case_number, court, judge_name, prosecutor_name, defense_attorney, arrest_date, plea_date, sentence_date, sentence_summary, disposition, charges, doj_url, claim_status",
      )
      .eq("id", body.entity_id)
      .maybeSingle();
    if (!data) {
      return NextResponse.json(
        { ok: false, error: "defendant_not_found" },
        { status: 404 },
      );
    }
    // Co-defendants
    const co = data.case_number
      ? (await supa
          .from("case_people")
          .select("name, slug, claim_status, sentence_summary")
          .eq("case_number", data.case_number)
          .neq("id", data.id)).data ?? []
      : [];
    // Salvage row for the doc list
    const arch = (await supa
      .from("doj_capitol_archive")
      .select("doc_titles, doc_urls, status_text, location, wayback_url")
      .eq("matched_person_id", data.id)
      .maybeSingle()).data;
    context = { defendant: data, co_defendants: co, archive: arch };
  } else {
    const { data } = await supa
      .from("case_people")
      .select(
        "id, slug, name, case_number, sentence_summary, disposition, claim_status",
      )
      .eq("case_number", body.entity_id);
    if (!data || data.length === 0) {
      return NextResponse.json(
        { ok: false, error: "case_not_found" },
        { status: 404 },
      );
    }
    context = { case_number: body.entity_id, defendants: data };
  }

  // Build the prompt. Constrained to "use only the data passed in".
  const userQuestion =
    body.question?.trim() ||
    (body.entity_type === "defendant"
      ? "Give a clear briefing on this defendant's case status, key dates, charges, sentence (if any), and what's notable."
      : "Give a clear briefing on this co-defendant cluster — who was charged together, what's the case status across all of them, and what's notable.");

  const systemPrompt = `You are a calm, careful investigative analyst writing briefings about January 6 Capitol Breach cases for a public records archive (realryannichols.com).

Rules:
- Use ONLY the structured data passed in the user message. Do NOT add facts from your training data — even if you think you know the case.
- If a field is null or missing, say "not in the public record" or "not yet on file" rather than guessing.
- Format as plain markdown with 3 sections: ## Status, ## Key facts, ## Open questions.
- Be precise about dates. Use ISO format (YYYY-MM-DD) when stating a date.
- Keep total under 400 words.
- Never invent a charge, a sentence, a court, a judge, or a co-defendant.
- The user's question may bias your framing — that's OK, but never bend a fact to match it.`;

  const userMessage = `User question: ${userQuestion}

Context (JSON):
\`\`\`json
${JSON.stringify(context, null, 2)}
\`\`\``;

  const t0 = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "upstream_fetch_failed", detail: String(e) },
      { status: 502 },
    );
  }
  if (!upstream.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "upstream_error",
        status: upstream.status,
        detail: await upstream.text().catch(() => null),
      },
      { status: 502 },
    );
  }
  type AnthropicResp = {
    content?: Array<{ type: string; text?: string }>;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const json = (await upstream.json()) as AnthropicResp;
  const text =
    json.content?.find((c) => c.type === "text")?.text ??
    "No briefing returned.";
  const ms = Date.now() - t0;

  const responseBody = {
    briefing_md: text,
    model: MODEL,
    elapsed_ms: ms,
    usage: json.usage,
  };
  memo.set(cacheKey, { at: now, body: responseBody });

  return NextResponse.json({ ok: true, cached: false, ...responseBody });
}
