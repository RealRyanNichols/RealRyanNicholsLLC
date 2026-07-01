import { NextResponse } from "next/server";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

// Upsert a lead profile by visitor_id, merging in whatever answers the person
// just gave (mood, name, why they reached out, which social, political leaning,
// email…). This is the backbone of the data + sales engine — every capture
// surface posts here and the profile grows over time.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function str(v: unknown, max = 200): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function POST(req: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const visitorId = str(body.visitorId, 64);
  if (!visitorId) {
    return NextResponse.json({ ok: false, error: "no_visitor" }, { status: 400 });
  }

  const email =
    typeof body.email === "string" && body.email.includes("@")
      ? str(body.email)
      : null;
  const name = str(body.name, 120);
  const source = str(body.source, 60);
  const political = str(body.political_affiliation, 60);
  const goodDay = str(body.good_day, 60);
  const reason = str(body.reason, 300);
  const path = str(body.path, 200);
  const extra =
    body.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
      ? (body.answers as Record<string, unknown>)
      : {};

  try {
    const svc = getSupabaseServiceClient();
    const { data: existing } = await svc
      .from("leads")
      .select("id, answers")
      .eq("visitor_id", visitorId)
      .maybeSingle();

    const nowIso = new Date().toISOString();
    const prevAnswers =
      existing && typeof existing.answers === "object" && existing.answers
        ? (existing.answers as Record<string, unknown>)
        : {};
    const fields: Record<string, unknown> = {
      last_seen: nowIso,
      answers: { ...prevAnswers, ...extra },
    };
    if (email) fields.email = email;
    if (name) fields.name = name;
    if (source) fields.source = source;
    if (political) fields.political_affiliation = political;
    if (goodDay) fields.good_day = goodDay;
    if (reason) fields.reason = reason;
    if (path) fields.path = path;

    if (existing) {
      await svc.from("leads").update(fields).eq("id", existing.id);
    } else {
      await svc
        .from("leads")
        .insert({ visitor_id: visitorId, first_seen: nowIso, ...fields });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
