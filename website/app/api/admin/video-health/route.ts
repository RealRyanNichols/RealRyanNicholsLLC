import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getVideoConfigStatus } from "@/lib/video-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function muxAuthHeader(): string {
  const tokenId = process.env.MUX_TOKEN_ID ?? "";
  const tokenSecret = process.env.MUX_TOKEN_SECRET ?? "";
  return `Basic ${Buffer.from(`${tokenId}:${tokenSecret}`).toString("base64")}`;
}

function readableMuxError(status: number, body: string): string {
  if (status === 401) {
    return "Mux rejected the token ID and secret pair. Create one fresh Mux access token and update MUX_TOKEN_ID and MUX_TOKEN_SECRET together in Vercel.";
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: { type?: string; messages?: string[] };
    };
    const messages = parsed.error?.messages?.filter(Boolean).join("; ");
    if (messages) return `Mux check failed: ${messages}`;
    if (parsed.error?.type) return `Mux check failed: ${parsed.error.type}`;
  } catch {
    // Fall through to the compact raw body below.
  }

  const compact = body.replace(/\s+/g, " ").trim().slice(0, 240);
  return compact
    ? `Mux check failed: ${status} ${compact}`
    : `Mux check failed with status ${status}.`;
}

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const config = getVideoConfigStatus();
  if (!config.muxConfigured) {
    return NextResponse.json(
      {
        ok: false,
        error: "Mux credentials are missing.",
        missing: config.missing,
        webhook_url: config.webhookUrl,
      },
      { status: 503 },
    );
  }

  try {
    const response = await fetch("https://api.mux.com/video/v1/assets?limit=1", {
      headers: {
        Accept: "application/json",
        Authorization: muxAuthHeader(),
      },
      cache: "no-store",
    });
    const body = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: readableMuxError(response.status, body),
          mux_status: response.status,
          ready_for_processing_updates: config.readyForProcessingUpdates,
          webhook_url: config.webhookUrl,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "Mux credentials accepted.",
      ready_for_large_uploads: config.readyForLargeUploads,
      ready_for_processing_updates: config.readyForProcessingUpdates,
      webhook_url: config.webhookUrl,
      missing: config.missing,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? `Mux check could not run: ${error.message}`
            : "Mux check could not run.",
        ready_for_processing_updates: config.readyForProcessingUpdates,
        webhook_url: config.webhookUrl,
      },
      { status: 502 },
    );
  }
}
