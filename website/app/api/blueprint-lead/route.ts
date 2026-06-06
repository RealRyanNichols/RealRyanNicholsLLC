import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

// A lightweight lead: someone not ready to buy who wants the breakdown or has a
// question. Stored in blueprint_intake with status "lead" so it lives next to
// the full questionnaire submissions.
const schema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  question: z.string().trim().max(2000).optional().or(z.literal("")),
  source: z.string().trim().max(120).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "blueprint_lead",
    windowMinutes: 60,
    maxRequests: 15,
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

  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Not configured yet. Try again soon." },
      { status: 503 },
    );
  }

  const { email, question, source } = parsed.data;
  const supabase = getSupabaseServiceClient();
  const { error } = await supabase.from("blueprint_intake").insert({
    contact_email: email.toLowerCase(),
    anything_else: question?.trim() || null,
    status: "lead",
    responses: source ? { source } : {},
  });

  if (error) {
    console.warn("blueprint_lead_save_failed", error.message);
    return NextResponse.json(
      { error: "Could not save. Try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
