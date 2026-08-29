import { NextResponse } from "next/server";
import {
  preparePhysicalBookQueue,
  processNextBookvaultFulfillment,
  syncBookvaultStatuses,
} from "@/lib/bookvault-fulfillment";
import { isSupabaseServiceConfigured } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(request: Request): boolean {
  const secret = process.env.BOOKVAULT_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }

  try {
    const prepared = await preparePhysicalBookQueue();
    const release = await processNextBookvaultFulfillment();
    const synced = await syncBookvaultStatuses();
    return NextResponse.json({
      ok: true,
      eligible: prepared.eligible,
      processed: release.processed,
      reason: release.reason,
      status: release.status,
      synced,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bookvault worker failed." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
