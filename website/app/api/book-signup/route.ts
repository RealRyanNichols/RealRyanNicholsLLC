import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";
import { buildBookSignupEmail } from "@/lib/email";

export const runtime = "nodejs";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  name: z.string().trim().max(120).optional().or(z.literal("")),
  source_page: z.string().trim().max(120).optional().or(z.literal("")),
  consent: z
    .boolean()
    .refine((v) => v === true, {
      message: "Please check the consent box to join the list.",
    }),
});

// Best-effort confirmation email. Never throws into the request path: if Resend
// or BOOK_UPDATES_FROM_EMAIL is not configured, we simply skip it (Phase 2 spec:
// do not block launch on email sending).
async function sendConfirmation(email: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.BOOK_UPDATES_FROM_EMAIL;
  if (!apiKey || !from) return;
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const env = buildBookSignupEmail();
    await resend.emails.send({
      from,
      to: email,
      subject: env.subject,
      html: env.html,
      text: env.text,
    });
  } catch (err) {
    console.warn(
      "book_signup_confirmation_failed",
      err instanceof Error ? err.message : "unknown",
    );
  }
}

export async function POST(request: Request) {
  const rl = await checkRateLimit({
    request,
    bucket: "book_signup",
    windowMinutes: 60,
    maxRequests: 10,
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
      { error: "Signups are not configured yet. Try again soon." },
      { status: 503 },
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();
  const supabase = getSupabaseServiceClient();

  // Upsert on the unique email column so repeat submissions never error and the
  // list never holds duplicates.
  const { error } = await supabase.from("book_email_signups").upsert(
    {
      email,
      name: data.name?.trim() || null,
      source_page: data.source_page?.trim() || null,
      consent: true,
    },
    { onConflict: "email", ignoreDuplicates: false },
  );

  if (error) {
    console.warn("book_signup_save_failed", error.message);
    return NextResponse.json(
      { error: "Could not save your signup. Try again." },
      { status: 500 },
    );
  }

  await sendConfirmation(email);

  return NextResponse.json({ ok: true });
}
