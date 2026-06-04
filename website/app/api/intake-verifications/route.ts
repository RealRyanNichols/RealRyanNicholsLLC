import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const schema = z.object({
  intake_item_id: z.string().uuid(),
  action: z.enum(["verify", "dispute", "context"]),
  note: z.string().max(2000).nullable().optional(),
  display_name: z.string().max(120).nullable().optional(),
  email: z.string().email().max(254).nullable().optional().or(z.literal("")),
});

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return createHash("sha256").update(`${salt}|intake|${ip}`).digest("hex");
}

function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
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
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof getSupabaseServiceClient>;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return NextResponse.json(
      { error: "The intake ledger is not configured yet." },
      { status: 503 },
    );
  }

  const ipHash = hashIp(clientIp(request));
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("intake_verifications")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((recentCount ?? 0) >= 8) {
    return NextResponse.json(
      { error: "Too many signals in a short window. Try again later." },
      { status: 429 },
    );
  }

  const { data: item, error: itemError } = await supabase
    .from("intake_items")
    .select("id, visibility, public_status")
    .eq("id", parsed.data.intake_item_id)
    .maybeSingle();

  if (itemError || !item || item.visibility !== "public" || item.public_status === "rejected") {
    return NextResponse.json(
      { error: "That intake item is not open for public signals." },
      { status: 404 },
    );
  }

  const email =
    parsed.data.email && parsed.data.email.length > 0
      ? parsed.data.email.trim()
      : null;

  const { error } = await supabase.from("intake_verifications").insert({
    intake_item_id: parsed.data.intake_item_id,
    action: parsed.data.action,
    note: parsed.data.note?.trim() || null,
    display_name: parsed.data.display_name?.trim() || null,
    email,
    ip_hash: ipHash,
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save that signal." },
      { status: 500 },
    );
  }

  const incrementColumn =
    parsed.data.action === "verify"
      ? "verify_count"
      : parsed.data.action === "dispute"
        ? "dispute_count"
        : "context_count";

  const { data: current } = await supabase
    .from("intake_items")
    .select("verify_count, dispute_count, context_count, public_status")
    .eq("id", parsed.data.intake_item_id)
    .single();

  const currentCounts = current as Record<string, unknown> | null;
  const nextCount = Number(currentCounts?.[incrementColumn] ?? 0) + 1;
  const patch: Record<string, unknown> = {
    [incrementColumn]: nextCount,
    last_action_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.action === "verify" && current?.public_status === "received") {
    patch.public_status = "needs_verification";
  }

  await supabase
    .from("intake_items")
    .update(patch)
    .eq("id", parsed.data.intake_item_id);

  return NextResponse.json({ ok: true });
}
