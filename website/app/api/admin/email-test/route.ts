import { NextResponse } from "next/server";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { requireAdmin } from "@/lib/admin-auth";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const { user, error } = await requireAdmin();
  if (error) return error;

  const when = new Date().toISOString();
  const result = await sendAdminAlert({
    subject: "RealRyanNichols.com admin email test",
    text: [
      "This is a test of the RealRyanNichols.com admin alert pipeline.",
      "",
      `Triggered by: ${user?.email ?? "admin"}`,
      `Time: ${when}`,
      `Admin health: ${SITE.url}/admin/health`,
    ].join("\n"),
    html:
      `<p style="font-family:sans-serif"><strong>Admin email test</strong></p>` +
      `<p style="font-family:sans-serif">The RealRyanNichols.com admin alert pipeline can send email.</p>` +
      `<p style="font-family:sans-serif;color:#555">Time: ${when}</p>` +
      `<p><a href="${SITE.url}/admin/health">Open admin health</a></p>`,
  });

  if (!result.sent) {
    return NextResponse.json(
      {
        ok: false,
        error:
          result.reason === "not_configured"
            ? `Missing ${result.missing.join(", ")}.`
            : result.error,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true, recipients: result.to.length });
}
