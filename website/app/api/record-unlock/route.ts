import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  mintRecordKey,
  RECORD_COOKIE,
  RECORD_COOKIE_MAX_AGE,
} from "@/lib/record-key";

// Archive unlock. One email box on the document itself.
//
// This replaces an account wall that logged 1,022 blocked document opens
// and never captured a single address off any of them. The trade is the
// same as it always was — the record is free, it is not anonymous — but
// now the price is one field and the file opens on the spot.
//
// Every unlock writes three places: gate_events (the funnel, now with an
// "unlocked" outcome so the archive can be measured), leads (the profile),
// and notify_signups via signup_or_refresh_v2 (the subscriber pipeline).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Enter a working email and the file opens."),
  name: z.string().max(120).nullable().optional(),
  path: z.string().max(300).nullable().optional(),
  resourceType: z.string().max(60).nullable().optional(),
  resourceSlug: z.string().max(200).nullable().optional(),
  sessionId: z.string().max(64).nullable().optional(),
  visitorId: z.string().max(64).nullable().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "The archive unlock is not configured yet." },
      { status: 503 },
    );
  }

  const rl = await checkRateLimit({
    request,
    bucket: "record_unlock",
    windowMinutes: 60,
    maxRequests: 15,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: rl.error },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();
  const name = parsed.data.name?.trim() || null;
  const path = parsed.data.path ?? null;
  const resourceType = parsed.data.resourceType ?? "document";
  const resourceSlug = parsed.data.resourceSlug ?? null;
  const sessionId = parsed.data.sessionId ?? null;
  const visitorId = parsed.data.visitorId ?? null;

  const token = mintRecordKey(email);
  if (!token) {
    return NextResponse.json(
      { error: "The archive unlock is not configured yet." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseServiceClient();

  // 1) The funnel. The wall logs "blocked"; this logs the other half.
  try {
    await supabase.from("gate_events").insert({
      path,
      resource_type: resourceType,
      resource_slug: resourceSlug,
      outcome: "unlocked",
      session_key: sessionId,
    });
  } catch {
    // Never let the log stop the unlock.
  }

  // 2) The profile.
  if (visitorId) {
    try {
      const { data: existing } = await supabase
        .from("leads")
        .select("id, answers")
        .eq("visitor_id", visitorId)
        .maybeSingle();
      const nowIso = new Date().toISOString();
      const prevAnswers =
        existing && typeof existing.answers === "object" && existing.answers
          ? (existing.answers as Record<string, unknown>)
          : {};
      const fields = {
        email,
        last_seen: nowIso,
        answers: {
          ...prevAnswers,
          record_unlock: resourceSlug ?? true,
        },
        ...(name ? { name } : {}),
        ...(path ? { path } : {}),
        ...(existing?.id ? {} : { source: "archive" }),
      };
      if (existing?.id) {
        await supabase.from("leads").update(fields).eq("id", existing.id);
      } else {
        await supabase
          .from("leads")
          .insert({ visitor_id: visitorId, first_seen: nowIso, ...fields });
      }
    } catch {
      // Best effort. The unlock already succeeded.
    }
  }

  // 3) The pipeline. No confirmation email is sent and none is required —
  // that click is exactly what was standing between 1,022 people and the
  // record. Storing an unconfirmed address is compliant; sending to it is
  // what waits on Resend plus a mailing address.
  try {
    await supabase.rpc("signup_or_refresh_v2", {
      p_email: email,
      p_phone: null,
    });
  } catch {
    // Best effort.
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(RECORD_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: RECORD_COOKIE_MAX_AGE,
  });
  return res;
}
