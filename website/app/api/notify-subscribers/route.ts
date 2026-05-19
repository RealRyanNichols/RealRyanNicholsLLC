import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { buildPostBroadcastEmail } from "@/lib/email";
import { SITE } from "@/lib/site";

const schema = z.object({ post_id: z.string().uuid() });

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json(
      { error: "Email sending is not configured yet." },
      { status: 503 }
    );
  }
  if (!SITE.mailingAddress) {
    return NextResponse.json(
      {
        error:
          "SITE_MAILING_ADDRESS env var is required for CAN-SPAM compliance before sending.",
      },
      { status: 503 }
    );
  }

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input." }, { status: 400 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, slug, title, body, author_id, status")
    .eq("id", parsed.data.post_id)
    .maybeSingle();
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Post not found or not published." }, { status: 404 });
  }

  const isAuthor = !!post.author_id && post.author_id === auth.user.id;
  const { data: adminCheck } = await supabase.rpc("is_admin", { uid: auth.user.id });
  const isAdmin = adminCheck === true;
  if (!isAdmin && !isAuthor) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: subs, error: subsErr } = await supabase
    .from("notify_signups")
    .select("email, unsubscribe_token")
    .eq("channel", "email")
    .not("email", "is", null)
    .not("confirmed_at", "is", null)
    .is("unsubscribed_at", null);
  if (subsErr) {
    return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
  }
  const recipients = (subs ?? []).filter(
    (r): r is { email: string; unsubscribe_token: string } =>
      !!r.email && !!r.unsubscribe_token
  );
  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "No confirmed subscribers yet." });
  }

  const resend = new Resend(apiKey);
  let sent = 0;
  let failed = 0;
  for (const r of recipients) {
    const envelope = buildPostBroadcastEmail({
      post: { title: post.title, body: post.body, slug: post.slug },
      unsubscribeToken: r.unsubscribe_token,
    });
    const { error } = await resend.emails.send({
      from,
      to: r.email,
      subject: envelope.subject,
      html: envelope.html,
      text: envelope.text,
      headers: envelope.headers,
    });
    if (error) failed += 1;
    else sent += 1;
  }

  return NextResponse.json({ ok: true, sent, failed, total: recipients.length });
}
