import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { readToken } from "@/lib/biglie/token";
import { syncAnswerToNotion } from "@/lib/biglie/notion";
import { DAYS } from "@/lib/biglie/days";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function labelFor(questionKey: string, answerKey: string): string {
  for (const d of DAYS) {
    for (const b of d.blocks) {
      if (b.type === "poll" && b.poll.questionKey === questionKey) {
        const o = b.poll.options.find((x) => x.key === answerKey);
        if (o) return o.label;
      }
    }
  }
  return answerKey;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const email = readToken(sp.get("t"));
  const q = sp.get("q");
  const a = sp.get("a");
  const thanks = new URL("/thebiglie/answered", SITE.url);

  if (!email || !q || !a) {
    thanks.searchParams.set("status", "invalid");
    return NextResponse.redirect(thanks);
  }

  if (isSupabaseServiceConfigured()) {
    try {
      const supabase = getSupabaseServiceClient();
      await supabase.from("biglie_answers").upsert(
        { email, day: guessDay(q), question_key: q, answer: a },
        { onConflict: "email,day,question_key" },
      );
      await syncAnswerToNotion({
        email,
        day: guessDay(q),
        questionKey: q,
        answer: a,
        answerLabel: labelFor(q, a),
      });
    } catch {
      // fall through to the thank-you either way
    }
  }

  thanks.searchParams.set("status", "ok");
  thanks.searchParams.set("q", q);
  thanks.searchParams.set("a", a);
  return NextResponse.redirect(thanks);
}

function guessDay(questionKey: string): number {
  for (const d of DAYS)
    for (const b of d.blocks)
      if (b.type === "poll" && b.poll.questionKey === questionKey) return d.day;
  return 0;
}
