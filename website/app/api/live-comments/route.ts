import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getSupabaseStaticClient } from "@/lib/supabase/static";

const schema = z.object({
  live_stream_id: z.string().uuid("Invalid live stream."),
  display_name: z.string().max(80).optional().or(z.literal("")),
  body: z.string().min(1, "Comment cannot be empty.").max(1000, "Comment is too long."),
});

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

  const { error } = await supabase.from("live_comments").insert({
    live_stream_id: parsed.data.live_stream_id,
    display_name: parsed.data.display_name?.trim() || null,
    body: parsed.data.body.trim(),
    status: "approved",
    ip_hash: hashIp(clientIp(request)),
  });

  if (error) {
    return NextResponse.json(
      { error: "Live comments are not available yet." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
