import { NextResponse } from "next/server";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { getDay, TOTAL_DAYS } from "@/lib/biglie/days";
import { renderDayEmail, renderDayText } from "@/lib/biglie/email-shell";
import { makeToken } from "@/lib/biglie/token";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Cron runs frequently; day 1 goes out within one tick of signup, days 2-30 are
// gated to one per ~20h so the cadence is daily regardless of tick frequency.
const RESEND_INTERVAL_MS = 20 * 60 * 60 * 1000;
const MAX_PER_RUN = 40;

function authorized(request: Request): boolean {
  const secret = process.env.BIGLIE_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

type State = {
  email: string;
  last_day_sent: number;
  last_sent_at: string | null;
  stopped: boolean;
  completed: boolean;
};

async function sendDay(email: string, day: number): Promise<boolean> {
  const content = getDay(day);
  if (!content) return false;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOK_UPDATES_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) return false;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const stopHref = `${SITE.url}/api/biglie/stop?t=${encodeURIComponent(makeToken(email))}`;
    await resend.emails.send({
      from,
      to: email,
      subject: content.subject,
      html: renderDayEmail(content, email),
      text: renderDayText(content),
      headers: {
        "List-Unsubscribe": `<${stopHref}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    return true;
  } catch (err) {
    console.warn("biglie_send_failed", email, err instanceof Error ? err.message : "unknown");
    return false;
  }
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 503 });
  }
  const supabase = getSupabaseServiceClient();
  const now = Date.now();
  let enrolled = 0;
  let sent = 0;

  // 1. Enroll new /thebiglie signups and send day 1 immediately.
  const { data: signups } = await supabase
    .from("book_email_signups")
    .select("email, source_page, consent")
    .ilike("source_page", "thebiglie%")
    .eq("consent", true)
    .limit(500);

  const { data: states } = await supabase
    .from("biglie_sequence_state")
    .select("email, last_day_sent, last_sent_at, stopped, completed");

  const known = new Map<string, State>((states ?? []).map((s) => [s.email, s as State]));

  for (const row of signups ?? []) {
    if (sent >= MAX_PER_RUN) break;
    const email = (row.email as string).toLowerCase();
    if (known.has(email)) continue;
    const ok = await sendDay(email, 1);
    await supabase.from("biglie_sequence_state").upsert(
      {
        email,
        last_day_sent: ok ? 1 : 0,
        last_sent_at: ok ? new Date().toISOString() : null,
        send_count: ok ? 1 : 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );
    known.set(email, { email, last_day_sent: ok ? 1 : 0, last_sent_at: ok ? new Date().toISOString() : null, stopped: false, completed: false });
    if (ok) { enrolled++; sent++; }
  }

  // 2. Advance everyone else one day when their interval has elapsed.
  for (const s of known.values()) {
    if (sent >= MAX_PER_RUN) break;
    if (s.stopped || s.completed) continue;
    if (s.last_day_sent < 1 || s.last_day_sent >= TOTAL_DAYS) {
      if (s.last_day_sent >= TOTAL_DAYS) {
        await supabase.from("biglie_sequence_state").update({ completed: true, updated_at: new Date().toISOString() }).eq("email", s.email);
      }
      continue;
    }
    const last = s.last_sent_at ? new Date(s.last_sent_at).getTime() : 0;
    if (now - last < RESEND_INTERVAL_MS) continue;
    const nextDay = s.last_day_sent + 1;
    const ok = await sendDay(s.email, nextDay);
    if (ok) {
      await supabase
        .from("biglie_sequence_state")
        .update({
          last_day_sent: nextDay,
          last_sent_at: new Date().toISOString(),
          completed: nextDay >= TOTAL_DAYS,
          updated_at: new Date().toISOString(),
        })
        .eq("email", s.email);
      sent++;
    }
  }

  return NextResponse.json({ ok: true, enrolled, sent });
}

export async function GET(request: Request) {
  return run(request);
}
export async function POST(request: Request) {
  return run(request);
}
