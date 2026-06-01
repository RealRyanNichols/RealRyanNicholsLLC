import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { Resend } from "resend";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { SITE } from "@/lib/site";

const schema = z
  .object({
    category: z.enum(["j6", "national", "local", "other"]).default("j6"),
    location: z.string().max(200).optional().nullable(),
    submitter_name: z.string().max(200).optional().nullable(),
    submitter_email: z
      .string()
      .email("Please enter a valid email.")
      .optional()
      .or(z.literal("")),
    // Subject is required for J6 case tips (whose case), optional for news.
    defendant_name: z.string().max(200).optional().or(z.literal("")),
    narrative: z
      .string()
      .min(20, "Tell us a bit more — at least a couple sentences.")
      .max(20000, "That's too long for one tip — pick the most important pieces."),
    urls: z.array(z.string().url()).max(20).optional(),
  })
  .refine(
    (d) => d.category !== "j6" || !!(d.defendant_name && d.defendant_name.trim()),
    { path: ["defendant_name"], message: "Whose case is this?" },
  );

function hashIp(ip: string): string {
  const salt = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return createHash("sha256").update(`${salt}|${ip}`).digest("hex");
}

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
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
      { status: 400 }
    );
  }

  const ipHash = hashIp(clientIp(request));
  let supabase: ReturnType<typeof getSupabaseServiceClient>;
  try {
    supabase = getSupabaseServiceClient();
  } catch {
    return NextResponse.json(
      { error: "Tip intake is not configured yet." },
      { status: 503 },
    );
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("case_tips")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneHourAgo);

  if ((recentCount ?? 0) >= 3) {
    return NextResponse.json(
      { error: "You've sent a few tips already. Take a breath, then try again in an hour." },
      { status: 429 }
    );
  }

  const emailIn =
    parsed.data.submitter_email && parsed.data.submitter_email.length > 0
      ? parsed.data.submitter_email
      : null;

  const { error } = await supabase.from("case_tips").insert({
    category: parsed.data.category,
    location: parsed.data.location?.trim() || null,
    submitter_name: parsed.data.submitter_name?.trim() || null,
    submitter_email: emailIn?.trim() ?? null,
    defendant_name: parsed.data.defendant_name?.trim() || null,
    narrative: parsed.data.narrative.trim(),
    urls: parsed.data.urls ?? [],
    ip_hash: ipHash,
    status: "pending",
  });

  if (error) {
    return NextResponse.json(
      { error: "Could not save your tip. Try again in a moment." },
      { status: 500 }
    );
  }

  // Best-effort admin notification so a new tip doesn't sit unseen in /admin/tips.
  // Non-blocking: the tip is already saved; email failure never fails the request.
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (apiKey && from) {
    const adminTo = process.env.ADMIN_NOTIFY_EMAIL ?? from;
    const d = parsed.data;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const lines = [
      `Category: ${d.category}`,
      d.defendant_name ? `Subject/Case: ${d.defendant_name.trim()}` : null,
      d.location ? `Location: ${d.location.trim()}` : null,
      d.submitter_name ? `From: ${d.submitter_name.trim()}` : "From: (anonymous)",
      emailIn ? `Reply-to: ${emailIn.trim()}` : "Reply-to: (none given)",
      d.urls && d.urls.length ? `Links: ${d.urls.join(", ")}` : null,
      "",
      d.narrative.trim(),
    ].filter(Boolean) as string[];
    const body = lines.join("\n");
    const text = `New tip submitted on ${SITE.url}\n\n${body}\n\nReview/approve: ${SITE.url}/admin/tips`;
    const html =
      `<p style="font-family:sans-serif"><strong>New tip submitted</strong></p>` +
      `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap;font-size:14px;line-height:1.5">${esc(body)}</pre>` +
      `<p><a href="${SITE.url}/admin/tips">Review and approve in admin →</a></p>`;
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from,
        to: adminTo,
        subject: `New tip: ${d.category}${d.defendant_name ? ` — ${d.defendant_name.trim()}` : ""}`,
        html,
        text,
        ...(emailIn ? { replyTo: emailIn.trim() } : {}),
      });
    } catch {
      /* non-blocking — tip is saved regardless */
    }
  }

  return NextResponse.json({ ok: true });
}
