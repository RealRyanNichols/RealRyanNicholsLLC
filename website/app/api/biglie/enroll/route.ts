import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient, isSupabaseServiceConfigured } from "@/lib/supabase/service";
import { getDay } from "@/lib/biglie/days";
import { renderDayEmail, renderDayText } from "@/lib/biglie/email-shell";
import { makeToken } from "@/lib/biglie/token";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ email: z.string().trim().email() });

/**
 * Sends day 1 of the sequence the instant someone joins, so "immediately" means
 * immediately. Only fires for an email already saved as a consented /thebiglie
 * signup (the gate calls this right after /api/book-signup succeeds). The daily
 * cron is the durable backstop and will never double-send day 1 because it
 * checks biglie_sequence_state first.
 */
export async function POST(request: Request) {
  const rl = await checkRateLimit({ request, bucket: "biglie_enroll", windowMinutes: 60, maxRequests: 10 });
  if (!rl.ok) return NextResponse.json({ error: rl.error }, { status: 429 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email." }, { status: 400 });
  if (!isSupabaseServiceConfigured()) return NextResponse.json({ ok: false }, { status: 200 });

  const email = parsed.data.email.toLowerCase();
  const supabase = getSupabaseServiceClient();

  // Must be a real, consented BIG Lie signup.
  const { data: signup } = await supabase
    .from("book_email_signups")
    .select("email, consent, source_page")
    .eq("email", email)
    .maybeSingle();
  if (!signup || signup.consent !== true) return NextResponse.json({ ok: false }, { status: 200 });

  // Already enrolled? Do nothing (cron owns the rest).
  const { data: state } = await supabase
    .from("biglie_sequence_state")
    .select("email, last_day_sent")
    .eq("email", email)
    .maybeSingle();
  if (state && state.last_day_sent >= 1) return NextResponse.json({ ok: true, already: true });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOK_UPDATES_FROM_EMAIL || process.env.RESEND_FROM_EMAIL;
  let sent = false;
  if (apiKey && from) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const content = getDay(1)!;
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
      sent = true;
    } catch (err) {
      console.warn("biglie_enroll_send_failed", err instanceof Error ? err.message : "unknown");
    }
  }

  await supabase.from("biglie_sequence_state").upsert(
    {
      email,
      last_day_sent: sent ? 1 : 0,
      last_sent_at: sent ? new Date().toISOString() : null,
      send_count: sent ? 1 : 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  return NextResponse.json({ ok: true, sent });
}
