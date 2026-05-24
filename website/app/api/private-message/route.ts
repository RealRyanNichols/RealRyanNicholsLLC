import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

const schema = z.object({
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  phone: z.string().max(40).optional().or(z.literal("")),
  subject: z.string().max(160).optional().or(z.literal("")),
  message: z.string().min(1, "Message cannot be empty.").max(4000, "Message is too long."),
  source_path: z.string().max(300).optional().or(z.literal("")),
});

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
  const { error } = await supabase.from("private_messages").insert({
    display_name: parsed.data.display_name?.trim() || null,
    email: parsed.data.email?.trim() || null,
    phone: parsed.data.phone?.trim() || null,
    subject: parsed.data.subject?.trim() || null,
    message: parsed.data.message.trim(),
    source_path: parsed.data.source_path?.trim() || null,
    status: "new",
    ip_hash: hashIp(clientIp(request)),
  });

  if (error) {
    return NextResponse.json(
      { error: "Private message intake is not available yet." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
