import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email."),
  phone: z.string().trim().min(7, "Enter a phone number.").max(40),
  source: z.string().max(80).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "book_waitlist",
    windowMinutes: 60,
    maxRequests: 8,
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
      { error: "The waitlist is not configured yet. Try again soon." },
      { status: 503 },
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.from("book_waitlist").upsert(
    {
      id: randomUUID(),
      name: data.name,
      email,
      phone: data.phone,
      source: data.source?.trim() || "book_page",
      ip_hash: rl.ipHash,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "email" },
  );

  if (error) {
    console.warn("book_waitlist_save_failed", error.message);
    return NextResponse.json(
      { error: "Could not save your spot. Try again." },
      { status: 500 },
    );
  }

  const { count } = await supabase
    .from("book_waitlist")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ ok: true, position: count ?? null });
}
