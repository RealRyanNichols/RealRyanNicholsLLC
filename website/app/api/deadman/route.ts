import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deadmanKeysConfigured,
  getDeadmanState,
  releaseApprovedDeadmanDrafts,
  saveDeadmanState,
  verifyDeadmanCode,
} from "@/lib/deadman";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const schema = z.object({
  action: z.enum(["activate", "reverse"]),
  code: z.string().min(16).max(200),
});

const failures = new Map<string, { count: number; resetAt: number }>();

function requestKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || current.resetAt < now) {
    failures.set(key, { count: 0, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  return current.count < 5;
}

function recordFailure(key: string) {
  const now = Date.now();
  const current = failures.get(key);
  if (!current || current.resetAt < now) {
    failures.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return;
  }
  failures.set(key, { ...current, count: current.count + 1 });
}

export async function POST(request: Request) {
  if (!deadmanKeysConfigured() || !isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Deadman switch is not configured." },
      { status: 503 },
    );
  }

  const key = requestKey(request);
  if (!checkRateLimit(key)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait before trying again." },
      { status: 429 },
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  if (!verifyDeadmanCode(parsed.data.action, parsed.data.code)) {
    recordFailure(key);
    return NextResponse.json({ error: "Invalid code." }, { status: 403 });
  }

  const supabase = getSupabaseServiceClient();
  const state = await getDeadmanState(supabase);
  const now = new Date().toISOString();

  if (parsed.data.action === "reverse") {
    const next = {
      ...state,
      active: false,
      reversed_at: now,
    };
    await saveDeadmanState(supabase, next);
    return NextResponse.json({
      ok: true,
      active: false,
      released: 0,
      message: "Deadman publishing mode is off.",
    });
  }

  const release = await releaseApprovedDeadmanDrafts(supabase);
  const next = {
    ...state,
    active: true,
    activated_at: state.activated_at ?? now,
    reversed_at: null,
    last_release_at: now,
    total_released: state.total_released + release.released,
  };
  await saveDeadmanState(supabase, next);

  return NextResponse.json({
    ok: true,
    active: true,
    released: release.released,
    blocked: release.blocked,
    scanned: release.scanned,
    message:
      "Deadman publishing mode is active. Only public-release-approved drafts are eligible.",
  });
}
