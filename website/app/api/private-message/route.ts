import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE } from "@/lib/site";
import { visitorHash } from "@/lib/visitor-hash";

const schema = z.object({
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(1, "Message cannot be empty.").max(4000, "Message is too long."),
  source_path: z.string().max(300).optional().or(z.literal("")),
  session_id: z.string().min(8).max(64).optional().or(z.literal("")),
  visitor_id: z.string().min(8).max(80).optional().or(z.literal("")),
});

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "private_message",
    windowMinutes: 60,
    maxRequests: 5,
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

  const supabase = getSupabaseServiceClient();
  const ip = clientIp(request);
  const insert = {
    display_name: parsed.data.display_name?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    subject: parsed.data.subject?.trim() || null,
    message: parsed.data.message.trim(),
    source_path: parsed.data.source_path?.trim() || null,
    status: "new",
    ip_hash: rl.ipHash,
    session_id: parsed.data.session_id || null,
    visitor_hash: visitorHash(
      parsed.data.visitor_id || null,
      ip,
      request.headers.get("user-agent"),
    ),
  };

  let messageId: string | null = null;
  const { data: savedMessage, error } = await supabase
    .from("private_messages")
    .insert(insert)
    .select("id")
    .single();
  messageId = savedMessage?.id ?? null;
  if (error && /session_id|visitor_hash|column/i.test(error.message)) {
    const { data: retryMessage, error: retryError } = await supabase
      .from("private_messages")
      .insert({
        display_name: insert.display_name,
        email: insert.email,
        phone: insert.phone,
        subject: insert.subject,
        message: insert.message,
        source_path: insert.source_path,
        status: insert.status,
        ip_hash: insert.ip_hash,
      })
      .select("id")
      .single();
    if (retryError) {
      return NextResponse.json(
        { error: "Private message intake is not available yet." },
        { status: 500 },
      );
    }
    messageId = retryMessage?.id ?? null;
  } else if (error) {
    return NextResponse.json(
      { error: "Private message intake is not available yet." },
      { status: 500 },
    );
  }

  let publicRef: string | null = null;
  if (messageId) {
    try {
      const { data: ledgerItem } = await supabase
        .from("intake_items")
        .select("public_ref")
        .eq("source_type", "private_message")
        .eq("source_id", messageId)
        .maybeSingle();
      publicRef = ledgerItem?.public_ref ?? null;
    } catch {
      publicRef = null;
    }
  }

  // Best-effort admin alert. Do not email the full private message body;
  // sensitive details should stay in the admin inbox instead of spreading
  // through email storage.
  const subject = insert.subject || "Private message";
  const contact = [
    insert.display_name ? `Name: ${insert.display_name}` : "Name: (not given)",
    insert.email ? `Email: ${insert.email}` : "Email: (not given)",
    insert.phone ? `Phone: ${insert.phone}` : "Phone: (not given)",
    insert.source_path ? `Source: ${insert.source_path}` : null,
  ].filter(Boolean);
  const text = [
    `New private message on ${SITE.url}`,
    "",
    `Subject: ${subject}`,
    ...contact,
    "",
    "The private message body is not emailed. Open the admin inbox to read it.",
    `Review in admin: ${SITE.url}/admin/messages?filter=new`,
  ].join("\n");
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html =
    `<p style="font-family:sans-serif"><strong>New private message</strong></p>` +
    `<p style="font-family:sans-serif">Subject: ${esc(subject)}</p>` +
    `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap;font-size:14px;line-height:1.5">${esc(contact.join("\n"))}</pre>` +
    `<p style="font-family:sans-serif;color:#555">The private message body is not emailed. Open the admin inbox to read it.</p>` +
    `<p><a href="${SITE.url}/admin/messages?filter=new">Review in admin →</a></p>`;

  const alert = await sendAdminAlert({
    subject: `New private message: ${subject}`,
    html,
    text,
    replyTo: insert.email,
  });
  if (!alert.sent) {
    console.warn("private_message_admin_alert_failed", alert);
  }

  return NextResponse.json({
    ok: true,
    public_ref: publicRef,
    ledger_url: `${SITE.url}/case/intake`,
  });
}
