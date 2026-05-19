import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildWelcomeEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/subscribed?status=invalid", SITE.url));
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.rpc("confirm_signup", { p_token: token });
  if (error || !data || data.length === 0 || !data[0].success) {
    return NextResponse.redirect(new URL("/subscribed?status=invalid", SITE.url));
  }

  const { email, unsubscribe_token: unsubscribeToken } = data[0] as {
    success: boolean;
    email: string;
    unsubscribe_token: string;
  };

  // Welcome email is best-effort — the user is already confirmed in the DB.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from && SITE.mailingAddress) {
    try {
      const envelope = buildWelcomeEmail({ email, unsubscribeToken });
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: email,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
        headers: envelope.headers,
      });
    } catch {
      // Swallow — confirmation already succeeded.
    }
  }

  return NextResponse.redirect(new URL("/subscribed?status=ok", SITE.url));
}
