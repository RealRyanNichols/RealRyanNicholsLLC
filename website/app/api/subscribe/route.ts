import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildConfirmationEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

// Accept either field (or both). Validate the ones provided; require at least one.
const schema = z
  .object({
    email: z.string().email("Please enter a valid email.").optional().or(z.literal("")),
    phone: z.string().min(7, "Phone number is too short.").max(40).optional().or(z.literal("")),
  })
  .refine((v) => (v.email && v.email.length > 0) || (v.phone && v.phone.length > 0), {
    message: "Enter an email or a phone number.",
  });

type EmailAction = "created" | "already_subscribed" | "reconfirm" | "reactivate" | null;
type PhoneAction = "created" | "already_subscribed" | "reactivate" | null;

export async function POST(request: Request) {
  if (!SITE.mailingAddress) {
    return NextResponse.json(
      { error: "Signups are not configured yet." },
      { status: 503 }
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
      { status: 400 }
    );
  }
  const emailIn = parsed.data.email && parsed.data.email.length > 0 ? parsed.data.email : null;
  const phoneIn = parsed.data.phone && parsed.data.phone.length > 0 ? parsed.data.phone : null;

  // Email leg requires Resend creds. If only phone was given we can skip the check.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (emailIn && (!apiKey || !from)) {
    return NextResponse.json(
      { error: "Email sending is not configured yet. Try phone instead." },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("signup_or_refresh_v2", {
    p_email: emailIn,
    p_phone: phoneIn,
  });
  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    const msg = error?.message ?? "Could not save your signup.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
  const row = (Array.isArray(data) ? data[0] : data) as {
    email_action: EmailAction;
    email_confirmation_token: string | null;
    email_unsubscribe_token: string | null;
    phone_action: PhoneAction;
    phone_unsubscribe_token: string | null;
  };

  // Send confirmation email if a new/refreshed email signup was created.
  if (
    emailIn &&
    row.email_confirmation_token &&
    (row.email_action === "created" ||
      row.email_action === "reconfirm" ||
      row.email_action === "reactivate")
  ) {
    const envelope = buildConfirmationEmail({
      email: emailIn,
      confirmationToken: row.email_confirmation_token,
    });
    const resend = new Resend(apiKey!);
    const { error: sendErr } = await resend.emails.send({
      from: from!,
      to: emailIn,
      subject: envelope.subject,
      html: envelope.html,
      text: envelope.text,
    });
    if (sendErr) {
      return NextResponse.json(
        { error: "Could not send confirmation email. Please try again." },
        { status: 502 }
      );
    }
  }

  // Build a friendly message depending on which legs ran.
  const parts: string[] = [];
  if (emailIn) {
    if (row.email_action === "already_subscribed") {
      parts.push("Your email is already on the list.");
    } else {
      parts.push("Check your email to confirm your subscription.");
    }
  }
  if (phoneIn) {
    if (row.phone_action === "already_subscribed") {
      parts.push("Your phone number is already on the list.");
    } else {
      parts.push("Your phone number is saved — SMS updates will start once SMS sending is enabled.");
    }
  }
  return NextResponse.json({
    ok: true,
    email_action: row.email_action,
    phone_action: row.phone_action,
    message: parts.join(" "),
  });
}
