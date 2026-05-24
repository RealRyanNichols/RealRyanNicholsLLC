import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
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

function hashIp(ip: string): string {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "private-message";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

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

  const supabase = getSupabaseStaticClient();
  const ip = clientIp(request);
  const insert = {
    display_name: parsed.data.display_name?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    subject: parsed.data.subject?.trim() || null,
    message: parsed.data.message.trim(),
    source_path: parsed.data.source_path?.trim() || null,
    status: "new",
    ip_hash: hashIp(ip),
    session_id: parsed.data.session_id || null,
    visitor_hash: visitorHash(
      parsed.data.visitor_id || null,
      ip,
      request.headers.get("user-agent"),
    ),
  };

  const { error } = await supabase.from("private_messages").insert(insert);
  if (error && /session_id|visitor_hash|column/i.test(error.message)) {
    const { error: retryError } = await supabase.from("private_messages").insert({
      display_name: insert.display_name,
      email: insert.email,
      phone: insert.phone,
      subject: insert.subject,
      message: insert.message,
      source_path: insert.source_path,
      status: insert.status,
      ip_hash: insert.ip_hash,
    });
    if (!retryError) return NextResponse.json({ ok: true });
  }

  if (error) {
    return NextResponse.json(
      { error: "Private message intake is not available yet." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
