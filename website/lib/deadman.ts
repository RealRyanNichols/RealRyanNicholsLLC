import crypto from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEADMAN_QUEUE_CATEGORY,
  DEADMAN_STATE_SLUG,
} from "@/lib/deadman-constants";
import { getDirectVideoUrl } from "@/lib/direct-video";

export { DEADMAN_QUEUE_CATEGORY, DEADMAN_STATE_SLUG };
export const DEADMAN_BATCH_SIZE = 25;

const SYSTEM_AUTHOR_ID =
  process.env.POSTS_AUTHOR_ID || "6792cdcd-2465-4a3a-9c49-4e270eaf79fa";

type AnySupabase = SupabaseClient;

export type DeadmanState = {
  active: boolean;
  activated_at: string | null;
  reversed_at: string | null;
  last_release_at: string | null;
  total_released: number;
  message: string;
};

type DeadmanPostRow = {
  id: string;
  type: string | null;
  media: unknown;
  mux_status: string | null;
  mux_playback_id: string | null;
  published_at: string | null;
};

export type DeadmanReleaseResult = {
  scanned: number;
  released: number;
  blocked: number;
  released_ids: string[];
};

export function defaultDeadmanState(): DeadmanState {
  return {
    active: false,
    activated_at: null,
    reversed_at: null,
    last_release_at: null,
    total_released: 0,
    message:
      "Emergency publishing mode is limited to public-release-approved drafts only. Private tips, messages, uploads, contact details, and unreviewed submissions are never released by this switch.",
  };
}

export function parseDeadmanState(raw: string | null | undefined): DeadmanState {
  if (!raw) return defaultDeadmanState();
  try {
    const parsed = JSON.parse(raw) as Partial<DeadmanState>;
    return {
      ...defaultDeadmanState(),
      ...parsed,
      active: parsed.active === true,
      total_released:
        typeof parsed.total_released === "number" && Number.isFinite(parsed.total_released)
          ? parsed.total_released
          : 0,
    };
  } catch {
    return defaultDeadmanState();
  }
}

export async function getDeadmanState(supabase: AnySupabase): Promise<DeadmanState> {
  const { data } = await supabase
    .from("posts")
    .select("body")
    .eq("slug", DEADMAN_STATE_SLUG)
    .maybeSingle();
  return parseDeadmanState(data?.body);
}

export async function saveDeadmanState(
  supabase: AnySupabase,
  state: DeadmanState,
): Promise<void> {
  const body = JSON.stringify(state);
  const now = new Date().toISOString();
  const { data: existing, error: selectError } = await supabase
    .from("posts")
    .select("id")
    .eq("slug", DEADMAN_STATE_SLUG)
    .maybeSingle();
  if (selectError) throw selectError;

  if (existing?.id) {
    const { error } = await supabase
      .from("posts")
      .update({
        body,
        status: "hidden",
        title: "Deadman switch state",
        category: "system",
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("posts").insert({
    slug: DEADMAN_STATE_SLUG,
    type: "note",
    status: "hidden",
    title: "Deadman switch state",
    body,
    category: "system",
    author_id: SYSTEM_AUTHOR_ID,
    published_at: null,
    pinned: false,
  });
  if (error) throw error;
}

export function deadmanKeysConfigured(): boolean {
  return !!(
    process.env.DEADMAN_SECRET_SALT &&
    process.env.DEADMAN_ACTIVATION_HASH &&
    process.env.DEADMAN_REVERSAL_HASH
  );
}

export function hashDeadmanCode(code: string): string {
  const salt = process.env.DEADMAN_SECRET_SALT;
  if (!salt) throw new Error("DEADMAN_SECRET_SALT is not configured.");
  return crypto.createHash("sha256").update(`${salt}:${code}`).digest("hex");
}

export function verifyDeadmanCode(
  action: "activate" | "reverse",
  code: string,
): boolean {
  if (!deadmanKeysConfigured() || code.length < 16) return false;
  const expected =
    action === "activate"
      ? process.env.DEADMAN_ACTIVATION_HASH
      : process.env.DEADMAN_REVERSAL_HASH;
  if (!expected || !/^[a-f0-9]{64}$/i.test(expected)) return false;

  const actual = hashDeadmanCode(code);
  const expectedBuffer = Buffer.from(expected.toLowerCase(), "hex");
  const actualBuffer = Buffer.from(actual, "hex");
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function postCanBeReleased(row: DeadmanPostRow): boolean {
  if (row.type !== "video") return true;
  return (
    (!!row.mux_playback_id && row.mux_status === "ready") ||
    !!getDirectVideoUrl(row.media as Parameters<typeof getDirectVideoUrl>[0])
  );
}

export async function releaseApprovedDeadmanDrafts(
  supabase: AnySupabase,
  batchSize = DEADMAN_BATCH_SIZE,
): Promise<DeadmanReleaseResult> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, type, media, mux_status, mux_playback_id, published_at")
    .eq("status", "draft")
    .eq("category", DEADMAN_QUEUE_CATEGORY)
    .neq("slug", DEADMAN_STATE_SLUG)
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (error) throw error;

  const rows = (data ?? []) as DeadmanPostRow[];
  const publishable = rows.filter(postCanBeReleased);
  const ids = publishable.map((row) => row.id);
  if (ids.length === 0) {
    return {
      scanned: rows.length,
      released: 0,
      blocked: rows.length,
      released_ids: [],
    };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("posts")
    .update({
      status: "published",
      published_at: now,
      updated_at: now,
    })
    .in("id", ids);
  if (updateError) throw updateError;

  return {
    scanned: rows.length,
    released: ids.length,
    blocked: rows.length - ids.length,
    released_ids: ids,
  };
}
