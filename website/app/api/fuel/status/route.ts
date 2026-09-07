import { NextResponse } from "next/server";
import { getFuelStatus } from "@/lib/fuel-server";

// Public snapshot for the live meter on /fuel: the bill, this month's fuel,
// people reading right now, and the last few published fuelers. Nothing
// private leaves here: no emails, no notes that were not published, no keys.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getFuelStatus();
  return NextResponse.json(status, {
    headers: {
      "Cache-Control": "public, s-maxage=15, stale-while-revalidate=45",
    },
  });
}
