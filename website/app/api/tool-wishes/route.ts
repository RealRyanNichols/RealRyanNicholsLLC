import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FREE_WISH_LIMIT = 3;
const STARTING_PRICE_CENTS = 999;

const schema = z.object({
  tool_name: z.string().min(3, "Name the tool you want.").max(160),
  problem: z.string().min(10, "Tell us what problem the tool solves.").max(2500),
  who_it_helps: z.string().max(800).optional().or(z.literal("")),
  desired_output: z.string().max(1200).optional().or(z.literal("")),
  current_workaround: z.string().max(1200).optional().or(z.literal("")),
  urgency: z.enum(["normal", "urgent", "community"]).default("normal"),
  contact_email: z.string().email("Use a valid email.").optional().or(z.literal("")),
});

function publicRef(id: string): string {
  return `WISH-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

function tagify(...values: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (value ?? "").split(/[^a-z0-9]+/i))
        .map((value) => value.toLowerCase().trim())
        .filter((value) => value.length >= 3)
        .slice(0, 24),
    ),
  );
}

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    // Anonymous visitors aren't an error. Return a benign signed-out status at
    // 200 so /tools doesn't log a 401 in the browser console on every load.
    return NextResponse.json({ ok: false, signed_in: false }, { status: 200 });
  }

  const { count, error } = await supabase
    .from("tool_wishes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: "Could not read wish count." }, { status: 500 });
  }

  const used = count ?? 0;
  return NextResponse.json({
    ok: true,
    used,
    free_limit: FREE_WISH_LIMIT,
    free_remaining: Math.max(0, FREE_WISH_LIMIT - used),
    next_price_cents: STARTING_PRICE_CENTS,
  });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json(
      { error: "Sign in first so your 3 free tool asks can be counted." },
      { status: 401 },
    );
  }

  const rl = await checkRateLimit({
    request,
    bucket: "tool_wish",
    windowMinutes: 60,
    maxRequests: 8,
    userId: auth.user.id,
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

  const { count, error: countError } = await supabase
    .from("tool_wishes")
    .select("id", { count: "exact", head: true })
    .eq("user_id", auth.user.id);

  if (countError) {
    return NextResponse.json({ error: "Could not read your wish count." }, { status: 500 });
  }

  const used = count ?? 0;
  const freeSlotNumber = used < FREE_WISH_LIMIT ? used + 1 : null;
  const pricingStatus = freeSlotNumber ? "free_request" : "paid_quote_required";
  const id = randomUUID();
  const ref = publicRef(id);
  const data = parsed.data;
  const clueTags = tagify(
    data.tool_name,
    data.problem,
    data.who_it_helps,
    data.desired_output,
    data.urgency,
  );

  const { error } = await supabase.from("tool_wishes").insert({
    id,
    user_id: auth.user.id,
    public_ref: ref,
    tool_name: data.tool_name.trim(),
    problem: data.problem.trim(),
    who_it_helps: data.who_it_helps?.trim() || null,
    desired_output: data.desired_output?.trim() || null,
    current_workaround: data.current_workaround?.trim() || null,
    urgency: data.urgency,
    contact_email: data.contact_email?.trim() || auth.user.email || null,
    free_slot_number: freeSlotNumber,
    pricing_status: pricingStatus,
    estimated_starting_price_cents: freeSlotNumber ? 0 : STARTING_PRICE_CENTS,
    clue_tags: clueTags,
  });

  if (error) {
    return NextResponse.json({ error: "Could not save the tool wish." }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    public_ref: ref,
    free_slot_number: freeSlotNumber,
    free_remaining: Math.max(0, FREE_WISH_LIMIT - used - 1),
    pricing_status: pricingStatus,
    next_price_cents: STARTING_PRICE_CENTS,
    message: freeSlotNumber
      ? `Saved as free tool ask ${freeSlotNumber} of ${FREE_WISH_LIMIT}.`
      : "Saved for a paid quote. Custom tool builds start at $9.99 and scale with complexity, tokens, integrations, and maintenance.",
  });
}
