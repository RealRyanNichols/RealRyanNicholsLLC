import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { visitorHash } from "@/lib/visitor-hash";

const schema = z.object({
  live_stream_id: z.string().uuid("Invalid live stream."),
  display_name: z.string().max(80).optional().or(z.literal("")),
  body: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long."),
  session_id: z.string().min(8).max(64).optional().or(z.literal("")),
  visitor_id: z.string().min(8).max(80).optional().or(z.literal("")),
});

export const runtime = "nodejs";

function hashIp(ip: string): string {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "live-comments";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "live_comment",
    windowMinutes: 10,
    maxRequests: 20,
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
  const { data: stream } = await supabase
    .from("live_streams")
    .select("id")
    .eq("id", parsed.data.live_stream_id)
    .in("status", ["scheduled", "live", "ended"])
    .maybeSingle();

  if (!stream) {
    return NextResponse.json({ error: "Live room not found." }, { status: 404 });
  }

  const ip = clientIp(request);
  const insert = {
    live_stream_id: parsed.data.live_stream_id,
    display_name: parsed.data.display_name?.trim() || null,
    body: parsed.data.body.trim(),
    status: "approved",
    ip_hash: hashIp(ip),
    session_id: parsed.data.session_id || null,
    visitor_hash: visitorHash(
      parsed.data.visitor_id || null,
      ip,
      request.headers.get("user-agent"),
    ),
  };

  const { error } = await supabase.from("live_comments").insert(insert);
  if (error && /session_id|visitor_hash|column/i.test(error.message)) {
    const { error: retryError } = await supabase.from("live_comments").insert({
      live_stream_id: insert.live_stream_id,
      display_name: insert.display_name,
      body: insert.body,
      status: insert.status,
      ip_hash: insert.ip_hash,
    });
    if (!retryError) return NextResponse.json({ ok: true });
  }

  if (error) {
    return NextResponse.json(
      { error: "Live comments are not available yet." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
