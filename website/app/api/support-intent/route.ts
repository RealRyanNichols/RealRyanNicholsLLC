import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  purpose: z.enum(["site", "children", "officials", "community", "needed"]),
  intended_amount: z.string().max(20).optional().or(z.literal("")),
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  publish_message: z.boolean().default(false),
  display_as: z.enum(["name", "anonymous"]).default("anonymous"),
  show_amount: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Support notes are not configured yet." },
      { status: 503 },
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

  const limit = await checkRateLimit({
    request,
    bucket: "support-intent",
    windowMinutes: 60,
    maxRequests: 8,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.error },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSec) },
      },
    );
  }

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("support_intents")
    .insert({
      purpose: parsed.data.purpose,
      intended_amount: parsed.data.intended_amount?.trim() || null,
      display_name: parsed.data.display_name?.trim() || null,
      email: parsed.data.email?.trim() || null,
      message: parsed.data.message?.trim() || null,
      publish_message: parsed.data.publish_message,
      display_as: parsed.data.display_as,
      show_amount: parsed.data.show_amount,
      ip_hash: limit.ipHash,
      status: "started",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save your note. Try again in a moment." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, intent_id: data.id as string });
}
