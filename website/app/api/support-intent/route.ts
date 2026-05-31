import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { createHash, randomUUID } from "crypto";
import { getSupabaseStaticClient } from "@/lib/supabase/static";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { buildSupportThankYouEmail } from "@/lib/email";

const schema = z.object({
  purpose: z.enum(["site", "video", "children", "officials", "community", "needed"]),
  intended_amount: z.string().max(20).optional().or(z.literal("")),
  display_name: z.string().max(120).optional().or(z.literal("")),
  email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
  message: z.string().max(2000).optional().or(z.literal("")),
  publish_message: z.boolean().default(false),
  display_as: z.enum(["name", "anonymous"]).default("anonymous"),
  show_amount: z.boolean().default(false),
});

function hashIp(ip: string): string {
  const salt = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "support-intent";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
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

  const rl = await checkRateLimit({
    request,
    bucket: "support_intent",
    windowMinutes: 60,
    maxRequests: 12,
  });
  if (!rl.ok) {
    return NextResponse.json({ error: rl.error }, { status: 429 });
  }

  const intentId = randomUUID();
  const supabase = getSupabaseStaticClient();
  const { error } = await supabase
    .from("support_intents")
    .insert({
      id: intentId,
      purpose: parsed.data.purpose,
      intended_amount: parsed.data.intended_amount?.trim() || null,
      display_name: parsed.data.display_name?.trim() || null,
      email: parsed.data.email?.trim() || null,
      message: parsed.data.message?.trim() || null,
      publish_message: parsed.data.publish_message,
      display_as: parsed.data.display_as,
      show_amount: parsed.data.show_amount,
      ip_hash: hashIp(clientIp(request)),
      status: "started",
    });

  if (error) {
    return NextResponse.json(
      { error: "Could not save your note. Try again in a moment." },
      { status: 500 },
    );
  }

  let thank_you_sent = false;
  const email = parsed.data.email?.trim();
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (email && apiKey && from) {
    try {
      const envelope = buildSupportThankYouEmail({
        displayName: parsed.data.display_name,
        purpose: parsed.data.purpose,
        amount: parsed.data.intended_amount,
        message: parsed.data.message,
      });
      const resend = new Resend(apiKey);
      const { error: sendError } = await resend.emails.send({
        from,
        to: email,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
      });
      thank_you_sent = !sendError;
    } catch {
      thank_you_sent = false;
    }
  }

  return NextResponse.json({ ok: true, intent_id: intentId, thank_you_sent });
}
