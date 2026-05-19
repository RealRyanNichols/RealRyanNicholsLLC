import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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

  const supabase = await getSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: post } = await supabase
    .from("posts")
    .select("id, slug, title, body, author_id, status")
    .eq("id", parsed.data.post_id)
    .maybeSingle();
  if (!post || post.status !== "published") {
    return NextResponse.json({ error: "Post not found or not published." }, { status: 404 });
  }

  const isAuthor = post.author_id === auth.user.id;
  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  const isAdmin = !!adminRow;
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const { data: subs, error: subsErr } = await supabase
    .from("notify_signups")
    .select("email")
    .eq("channel", "email")
    .not("email", "is", null);
  if (subsErr) {
    return NextResponse.json({ error: "Could not load subscribers." }, { status: 500 });
  }
  const emails = (subs ?? [])
    .map((r) => r.email as string | null)
    .filter((e): e is string => !!e);
  if (emails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, note: "No subscribers yet." });
  }

  const resend = new Resend(apiKey);
  const url = `${SITE.url}/posts/${post.slug}`;
  const excerpt = post.body.slice(0, 280).replace(/\s+/g, " ").trim();
  const subject = post.title;
  const text = `${post.title}\n\n${excerpt}${post.body.length > 280 ? "…" : ""}\n\nRead the rest: ${url}\n\n— ${SITE.name}\n${SITE.url}`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a;max-width:560px;margin:0 auto;padding:16px;">
      <h1 style="font-size:22px;line-height:1.25;margin:0 0 12px;">${escapeHtml(post.title)}</h1>
      <p style="font-size:15px;line-height:1.6;color:#444;margin:0 0 18px;">${escapeHtml(excerpt)}${post.body.length > 280 ? "…" : ""}</p>
      <p style="margin:0 0 24px;">
        <a href="${url}" style="background:#1a1a1a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;font-weight:600;">Read the rest →</a>
      </p>
      <p style="font-size:13px;color:#888;margin:0;">— ${escapeHtml(SITE.name)} · <a href="${SITE.url}" style="color:#888;">${SITE.url.replace(/^https?:\/\//, "")}</a></p>
    </div>
  `;

  let sent = 0;
  let failed = 0;
  for (const to of emails) {
    const { error } = await resend.emails.send({ from, to, subject, text, html });
    if (error) failed += 1;
    else sent += 1;
  }

  return NextResponse.json({ ok: true, sent, failed, total: emails.length });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
