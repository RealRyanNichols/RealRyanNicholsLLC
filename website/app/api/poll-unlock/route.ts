import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { buildConfirmationEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

// Poll results unlock: the email gate behind every poll. Voting is free and
// anonymous; seeing the live breakdown costs an email. One unlock opens
// results site-wide for that session/visitor. The email lands in three
// places: poll_unlocks (the gate), leads (the sales-engine profile), and
// notify_signups via signup_or_refresh_v2 (the subscriber pipeline, with
// the standard confirmation email when sending is configured).

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
  sessionId: z.string().min(8).max(64),
  visitorId: z.string().min(8).max(64).nullable().optional(),
  pollKey: z.string().max(200).nullable().optional(),
  path: z.string().max(200).nullable().optional(),
});

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Poll unlock is not configured yet." },
      { status: 503 },
    );
  }

  // Anonymous endpoint — same posture as /api/subscribe.
  const rl = await checkRateLimit({
    request,
    bucket: "poll_unlock",
    windowMinutes: 60,
    maxRequests: 10,
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
  const { email, sessionId } = parsed.data;
  const visitorId = parsed.data.visitorId ?? null;
  const pollKey = parsed.data.pollKey ?? null;
  const path = parsed.data.path ?? null;

  const supabase = getSupabaseServiceClient();

  // 1) The gate: record the unlock (idempotent per session).
  let pollId: string | null = null;
  if (pollKey) {
    const { data: poll } = await supabase
      .from("polls")
      .select("id")
      .eq("poll_key", pollKey)
      .maybeSingle();
    pollId = poll?.id ?? null;
  }
  const { error: unlockErr } = await supabase
    .from("poll_unlocks")
    .upsert(
      {
        session_id: sessionId,
        visitor_id: visitorId,
        email,
        poll_id: pollId,
      },
      { onConflict: "session_id" },
    );
  if (unlockErr) {
    return NextResponse.json(
      { error: "Could not save your unlock. Try again." },
      { status: 500 },
    );
  }

  // 2) The profile: merge into the lead keyed by visitor id.
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
        answers: { ...prevAnswers, poll_unlock: pollKey ?? true },
        ...(path ? { path } : {}),
        ...(existing?.id ? {} : { source: "poll" }),
      };
      if (existing?.id) {
        await supabase.from("leads").update(fields).eq("id", existing.id);
      } else {
        await supabase
          .from("leads")
          .insert({ visitor_id: visitorId, first_seen: nowIso, ...fields });
      }
    } catch {
      // Lead merge is best-effort; the unlock already succeeded.
    }
  }

  // 3) The pipeline: register as a subscriber and send the standard
  // confirmation email when sending is configured (same rules as
  // /api/subscribe — storing is compliant even before sending is on).
  try {
    const { data } = await supabase.rpc("signup_or_refresh_v2", {
      p_email: email,
      p_phone: null,
    });
    const row = (Array.isArray(data) ? data[0] : data) as {
      email_action: string | null;
      email_confirmation_token: string | null;
    } | null;

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    const canSendEmail = Boolean(apiKey && from && SITE.mailingAddress);
    if (
      canSendEmail &&
      row?.email_confirmation_token &&
      (row.email_action === "created" ||
        row.email_action === "reconfirm" ||
        row.email_action === "reactivate")
    ) {
      const envelope = buildConfirmationEmail({
        email,
        confirmationToken: row.email_confirmation_token,
      });
      const resend = new Resend(apiKey!);
      await resend.emails.send({
        from: from!,
        to: email,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
      });
    }
  } catch {
    // Subscriber registration is best-effort; the unlock already succeeded.
  }

  return NextResponse.json({ ok: true });
}
