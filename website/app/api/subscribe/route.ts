import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildConfirmationEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

const schema = z.object({
  email: z.string().email("Please enter a valid email."),
});

type SignupAction = "created" | "already_subscribed" | "reconfirm" | "reactivate";

export async function POST(request: Request) {
  if (!SITE.mailingAddress) {
    return NextResponse.json(
      { error: "Email sending is not configured yet." },
      { status: 503 }
    );
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Email sending is not configured yet." },
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

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("signup_or_refresh", {
    p_email: parsed.data.email,
  });
  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: "Could not save your email." }, { status: 500 });
  }
  const row = data[0] as {
    action: SignupAction;
    confirmation_token: string | null;
    unsubscribe_token: string;
  };

  if (row.action === "already_subscribed") {
    return NextResponse.json({
      ok: true,
      action: row.action,
      message: "You're already on the list.",
    });
  }

  if (!row.confirmation_token) {
    return NextResponse.json({ error: "Could not create confirmation token." }, { status: 500 });
  }

  const envelope = buildConfirmationEmail({
    email: parsed.data.email,
    confirmationToken: row.confirmation_token,
  });

  const resend = new Resend(apiKey);
  const { error: sendErr } = await resend.emails.send({
    from,
    to: parsed.data.email,
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

  return NextResponse.json({
    ok: true,
    action: row.action,
    message: "Check your email to confirm your subscription.",
  });
}
