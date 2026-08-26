import type { SupabaseClient } from "@supabase/supabase-js";
import { getXCredentials, publishXPost } from "@/lib/x-api";

type AnySupabase = SupabaseClient;

type ClaimedDispatch = {
  id: string;
  incident_id: string;
  update_id: string;
  post_id: string;
  platform: "x" | "facebook";
  body: string;
  attempt_count: number;
};

export type DeadmanSocialDispatchResult = {
  configured: boolean;
  claimed: boolean;
  posted: boolean;
  dispatch_id: string | null;
  external_url: string | null;
  reason: string;
};

function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown X publishing error.";
  return message.replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, 1200);
}

export async function dispatchNextDeadmanXPost(
  supabase: AnySupabase,
): Promise<DeadmanSocialDispatchResult> {
  const credentials = getXCredentials();
  if (!credentials) {
    return {
      configured: false,
      claimed: false,
      posted: false,
      dispatch_id: null,
      external_url: null,
      reason: "x_credentials_not_configured",
    };
  }

  const { data, error } = await supabase.rpc(
    "claim_next_deadman_social_dispatch",
    { p_platform: "x" },
  );
  if (error) throw error;
  const claimed = (Array.isArray(data) ? data[0] : data) as
    | ClaimedDispatch
    | null;
  if (!claimed?.id) {
    return {
      configured: true,
      claimed: false,
      posted: false,
      dispatch_id: null,
      external_url: null,
      reason: "queue_empty",
    };
  }

  const [incidentResult, dispatchResult] = await Promise.all([
    supabase
      .from("deadman_incidents")
      .select("status, public_release_authorized")
      .eq("id", claimed.incident_id)
      .maybeSingle(),
    supabase
      .from("deadman_social_dispatches")
      .select("status")
      .eq("id", claimed.id)
      .maybeSingle(),
  ]);
  const incident = incidentResult.data;
  if (
    incidentResult.error ||
    dispatchResult.error ||
    incident?.status !== "active" ||
    incident.public_release_authorized !== true ||
    dispatchResult.data?.status !== "posting"
  ) {
    const now = new Date().toISOString();
    await supabase
      .from("deadman_social_dispatches")
      .update({
        status: "skipped",
        error: "Incident was no longer active immediately before dispatch.",
        updated_at: now,
      })
      .eq("id", claimed.id)
      .eq("status", "posting");
    return {
      configured: true,
      claimed: true,
      posted: false,
      dispatch_id: claimed.id,
      external_url: null,
      reason: "incident_inactive_before_publish",
    };
  }

  let published: Awaited<ReturnType<typeof publishXPost>>;
  try {
    published = await publishXPost(claimed.body, credentials);
  } catch (publishError) {
    const message = safeError(publishError);
    const now = new Date().toISOString();
    await supabase
      .from("deadman_social_dispatches")
      .update({ status: "failed", error: message, updated_at: now })
      .eq("id", claimed.id)
      .eq("status", "posting");
    await supabase.from("deadman_event_log").insert({
      incident_id: claimed.incident_id,
      event_type: "social_dispatch_failed",
      actor_id: "deadman-x-api",
      detail: {
        dispatch_id: claimed.id,
        update_id: claimed.update_id,
        platform: "x",
        error: message,
      },
    });
    return {
      configured: true,
      claimed: true,
      posted: false,
      dispatch_id: claimed.id,
      external_url: null,
      reason: "x_publish_failed",
    };
  }

  const now = new Date().toISOString();
  try {
    const { error: ackError, count: ackCount } = await supabase
      .from("deadman_social_dispatches")
      .update({
        status: "posted",
        posted_at: now,
        external_url: published.url,
        error: null,
        updated_at: now,
      }, { count: "exact" })
      .eq("id", claimed.id)
      .in("status", ["posting", "skipped"]);

    if (ackError || ackCount !== 1) {
      // Preserve the non-retryable state (`posting` or a concurrent reversal's
      // `skipped`): the external mutation succeeded, so retrying could duplicate it.
      return {
        configured: true,
        claimed: true,
        posted: true,
        dispatch_id: claimed.id,
        external_url: published.url,
        reason: "posted_but_audit_ack_failed",
      };
    }
  } catch {
    return {
      configured: true,
      claimed: true,
      posted: true,
      dispatch_id: claimed.id,
      external_url: published.url,
      reason: "posted_but_audit_ack_failed",
    };
  }

  try {
    const { error: eventError } = await supabase.from("deadman_event_log").insert({
      incident_id: claimed.incident_id,
      event_type: "social_dispatch_posted",
      actor_id: "deadman-x-api",
      detail: {
        dispatch_id: claimed.id,
        update_id: claimed.update_id,
        platform: "x",
        external_url: published.url,
      },
    });
    if (eventError) {
      return {
        configured: true,
        claimed: true,
        posted: true,
        dispatch_id: claimed.id,
        external_url: published.url,
        reason: "posted_but_event_log_failed",
      };
    }
  } catch {
    return {
      configured: true,
      claimed: true,
      posted: true,
      dispatch_id: claimed.id,
      external_url: published.url,
      reason: "posted_but_event_log_failed",
    };
  }

  return {
    configured: true,
    claimed: true,
    posted: true,
    dispatch_id: claimed.id,
    external_url: published.url,
    reason: "posted",
  };
}
