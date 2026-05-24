import { NextResponse } from "next/server";
import { Resend } from "resend";
import { requireAdmin } from "@/lib/admin-auth";
import { buildLiveBroadcastEmail } from "@/lib/email";
import { LIVE_STREAM_COLUMNS, liveUrl } from "@/lib/live";
import { SITE } from "@/lib/site";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { supabase, error } = await requireAdmin();
  if (error) return error;

  const { id } = await params;
  const { data: live } = await supabase
    .from("live_streams")
    .select(LIVE_STREAM_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (!live) {
    return NextResponse.json({ error: "Live stream not found." }, { status: 404 });
  }

  const url = liveUrl(live.slug);
  const copy = `I am live now on RealRyanNichols.com.\n\n${live.title}\n\n${live.description ? `${live.description}\n\n` : ""}Watch here: ${url}\n\nNo algorithm. Come to the source.`;
  const social = {
    copy,
    xUrl: `https://twitter.com/intent/tweet?text=${encodeURIComponent(copy)}`,
    facebookUrl: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  };

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const canSendEmail = Boolean(apiKey && from && SITE.mailingAddress);
  let sent = 0;
  let failed = 0;
  let note: string | null = null;

  if (canSendEmail) {
    const { data: subs, error: subsErr } = await supabase
      .from("notify_signups")
      .select("email, unsubscribe_token")
      .eq("channel", "email")
      .not("email", "is", null)
      .not("confirmed_at", "is", null)
      .is("unsubscribed_at", null);

    if (subsErr) {
      return NextResponse.json(
        { error: "Could not load subscribers." },
        { status: 500 }
      );
    }

    const recipients = (subs ?? []).filter(
      (r): r is { email: string; unsubscribe_token: string } =>
        !!r.email && !!r.unsubscribe_token
    );

    const resend = new Resend(apiKey);
    for (const recipient of recipients) {
      const envelope = buildLiveBroadcastEmail({
        live: {
          title: live.title,
          description: live.description,
          slug: live.slug,
        },
        unsubscribeToken: recipient.unsubscribe_token,
      });
      const { error: sendError } = await resend.emails.send({
        from: from!,
        to: recipient.email,
        subject: envelope.subject,
        html: envelope.html,
        text: envelope.text,
        headers: envelope.headers,
      });
      if (sendError) failed += 1;
      else sent += 1;
    }

    if (recipients.length === 0) {
      note = "No confirmed email subscribers yet.";
    }
  } else {
    note =
      "Email sending is not fully configured. Social share copy was generated.";
  }

  await supabase
    .from("live_streams")
    .update({
      announce_count: (live.announce_count ?? 0) + 1,
      last_announced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", live.id);

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    note,
    social,
  });
}
