import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { getSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  submitter_name: z.string().max(200).optional().nullable(),
  submitter_email: z
    .string()
    .email("Please enter a valid email.")
    .optional()
    .or(z.literal("")),
  defendant_name: z
    .string()
    .min(1, "Whose case is this?")
    .max(200, "Name is too long."),
  narrative: z
    .string()
    .min(20, "Tell us a bit more — at least a couple sentences.")
    .max(20000, "That's too long for one tip — pick the most important pieces."),
  urls: z.array(z.string().url()).max(20).optional(),
});

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export async function POST(request: Request) {
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
      { status: 400 }
    );
  }

  const ipHash = hashIp(clientIp(request));
  const supabase = await getSupabaseServerClient();

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("case_tips")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: "You've sent a few tips already. Take a breath, then try again in an hour." },
      { status: 429 }
    );
  }

  const emailIn =
    parsed.data.submitter_email && parsed.data.submitter_email.length > 0
      ? parsed.data.submitter_email
      : null;

  const { error } = await supabase.from("case_tips").insert({
    submitter_name: parsed.data.submitter_name?.trim() || null,
    submitter_email: emailIn?.trim() ?? null,
    defendant_name: parsed.data.defendant_name.trim(),
    narrative: parsed.data.narrative.trim(),
    urls: parsed.data.urls ?? [],
    ip_hash: ipHash,
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save your tip. Try again in a moment." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
