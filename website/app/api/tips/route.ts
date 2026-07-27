import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash } from "crypto";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { buildIntakeRoutePlan } from "@/lib/intake-routing";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
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
    profile_slug: z
      .string()
      .max(120)
      .regex(/^[a-z0-9-]+$/, "Invalid profile.")
      .optional()
      .nullable(),
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

  let authenticatedUser: {
    email?: string;
    user_metadata?: Record<string, unknown>;
  } | null = null;
  if (parsed.data.profile_slug) {
    const authClient = await getSupabaseServerClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Sign in before suggesting a profile change." },
        { status: 401 },
      );
    }
    authenticatedUser = user;
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

  let subjectName = parsed.data.defendant_name?.trim() || null;
  if (parsed.data.profile_slug) {
    const { data: profile } = await supabase
      .from("case_people")
      .select("name")
      .eq("slug", parsed.data.profile_slug)
      .eq("visibility", "public")
      .eq("is_j6_defendant", true)
      .maybeSingle();
    if (!profile?.name) {
      return NextResponse.json(
        { error: "That public profile was not found." },
        { status: 404 },
      );
    }
    subjectName = profile.name;
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
    authenticatedUser?.email ||
    (parsed.data.submitter_email && parsed.data.submitter_email.length > 0
      ? parsed.data.submitter_email
      : null);
  const metadataName =
    authenticatedUser?.user_metadata &&
    (authenticatedUser.user_metadata.full_name ||
      authenticatedUser.user_metadata.display_name);
  const submitterName =
    (typeof metadataName === "string" && metadataName.trim()) ||
    parsed.data.submitter_name?.trim() ||
    null;
  const profileUrl = parsed.data.profile_slug
    ? `${SITE.url}/case/people/${parsed.data.profile_slug}`
    : null;
  const urlsForRecord = Array.from(
    new Set([profileUrl, ...(parsed.data.urls ?? [])].filter(Boolean)),
  ) as string[];
  const routePlan = buildIntakeRoutePlan({
    category: parsed.data.category,
    subject: subjectName,
    location: parsed.data.location,
    narrative: parsed.data.narrative,
    urls: urlsForRecord,
  });

  const { data: savedTip, error } = await supabase
    .from("case_tips")
    .insert({
      category: parsed.data.category,
      location: parsed.data.location?.trim() || null,
      submitter_name: submitterName,
      submitter_email: emailIn?.trim() ?? null,
      defendant_name: subjectName,
      narrative: parsed.data.narrative.trim(),
      urls: urlsForRecord,
      ip_hash: ipHash,
      status: "pending",
      route_kind: routePlan.kind,
      route_urgency: routePlan.urgency,
      route_score: routePlan.score,
      route_label: routePlan.label,
      route_reason: routePlan.reason,
      outcome_status: "unworked",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Could not save your tip. Try again in a moment." },
      { status: 500 }
    );
  }

  let publicRef: string | null = null;
  if (savedTip?.id) {
    const { data: ledgerItem } = await supabase
      .from("intake_items")
      .select("public_ref")
      .eq("source_type", "tip")
      .eq("source_id", savedTip.id)
      .maybeSingle();
    publicRef = ledgerItem?.public_ref ?? null;
  }

  // Best-effort admin notification so a new tip doesn't sit unseen in /admin/tips.
  // Keep the sensitive narrative in the admin inbox instead of copying it into
  // email storage.
  const d = parsed.data;
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = [
    `Category: ${d.category}`,
    subjectName ? `Subject/Case: ${subjectName}` : null,
    profileUrl ? `Profile: ${profileUrl}` : null,
    d.location ? `Location: ${d.location.trim()}` : null,
    submitterName ? `From: ${submitterName}` : "From: (anonymous)",
    emailIn ? `Reply-to: ${emailIn.trim()}` : "Reply-to: (none given)",
    urlsForRecord.length
      ? `Links submitted: ${urlsForRecord.length}`
      : "Links submitted: 0",
    publicRef ? `Public intake ref: ${publicRef}` : null,
    `Auto route: ${routePlan.label} (${routePlan.urgency}, ${routePlan.score})`,
  ].filter(Boolean) as string[];
  const body = lines.join("\n");
  const text = [
    `New tip submitted on ${SITE.url}`,
    "",
    body,
    "",
    "The narrative is stored in admin and is not copied into this email.",
    `Review/approve: ${SITE.url}/admin/tips?filter=pending`,
  ].join("\n");
  const html =
    `<p style="font-family:sans-serif"><strong>New tip submitted</strong></p>` +
    `<pre style="font-family:ui-monospace,monospace;white-space:pre-wrap;font-size:14px;line-height:1.5">${esc(body)}</pre>` +
    `<p style="font-family:sans-serif;color:#555">The narrative is stored in admin and is not copied into this email.</p>` +
    `<p><a href="${SITE.url}/admin/tips?filter=pending">Review and approve in admin →</a></p>`;
  const alert = await sendAdminAlert({
    subject: `${profileUrl ? "Profile update" : "New tip"}: ${d.category}${subjectName ? ` — ${subjectName}` : ""}`,
    html,
    text,
    replyTo: emailIn?.trim() ?? null,
  });
  if (!alert.sent) {
    console.warn("tip_admin_alert_failed", alert);
  }

  const receiptAnchor = publicRef
    ? `#receipt-${encodeURIComponent(publicRef)}`
    : "";
  const ledgerUrl = `${SITE.url}/case/intake?route=${routePlan.kind}${receiptAnchor}`;

  return NextResponse.json({
    ok: true,
    public_ref: publicRef,
    ledger_url: ledgerUrl,
    route: {
      kind: routePlan.kind,
      label: routePlan.label,
      urgency: routePlan.urgency,
      score: routePlan.score,
      reason: routePlan.reason,
      next_action: routePlan.nextActions[0] ?? "Ryan will review the receipt and route it to the right lane.",
      tags: routePlan.tags,
    },
  });
}
