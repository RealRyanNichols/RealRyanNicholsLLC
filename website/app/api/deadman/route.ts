import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  buildInitialCustodyBulletin,
  deadmanKeysConfiguredFor,
  releaseNextDeadmanUpdate,
  type DeadmanCodeVerification,
  verifyDeadmanCodeFor,
} from "@/lib/deadman";
import { dispatchNextDeadmanXPost } from "@/lib/deadman-social";
import {
  DEADMAN_CONFIRMATION_LABELS,
  DEADMAN_CONFIRMATION_TYPES,
  type DeadmanConfirmationType,
} from "@/lib/deadman-constants";
import {
  DEADMAN_EDITORIAL_MODE,
  type DeadmanClaimLabels,
  type DeadmanEvidenceStrength,
  type DeadmanPublicSource,
  validateDeadmanAccountabilityDraft,
} from "@/lib/deadman-editorial";
import { sendAdminAlert } from "@/lib/admin-email-alerts";
import { requireAdminApi } from "@/lib/admin-guard";
import { pingIndexNow } from "@/lib/indexnow";
import { checkRateLimit } from "@/lib/rate-limit";
import { SITE } from "@/lib/site";
import {
  getSupabaseServiceClient,
  isSupabaseServiceConfigured,
} from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const activateSchema = z.object({
  action: z.literal("activate"),
  activator_id: z.string().min(2).max(40).regex(/^[a-z0-9_-]+$/i),
  code: z.string().min(16).max(200),
  confirmation_type: z.enum(DEADMAN_CONFIRMATION_TYPES),
  confirmation_summary: z.string().min(12).max(1200),
  source_url: z.union([z.string().url().max(1000), z.literal("")]).optional(),
  agency: z.string().max(160).optional(),
  facility: z.string().max(160).optional(),
  public_release_authorized: z.literal(true),
});

const reverseSchema = z.object({
  action: z.literal("reverse"),
  code: z.string().min(16).max(200),
  resolution_summary: z.string().min(10).max(1200),
});

const triggerSourceSchema = z.object({
  url: z.string().url().max(1000),
  publisher: z.string().min(2).max(160).optional(),
  headline: z.string().min(3).max(300).optional(),
  published_at: z.string().max(80).optional(),
});

const adminActivateSchema = z.object({
  action: z.literal("admin_activate"),
  confirmed: z.literal(true),
  trigger_sources: z.array(triggerSourceSchema).max(5).optional(),
});

const adminReverseSchema = z.object({
  action: z.literal("admin_reverse"),
  confirmed: z.literal(true),
});

const schema = z.discriminatedUnion("action", [
  activateSchema,
  reverseSchema,
  adminActivateSchema,
  adminReverseSchema,
]);

type VerifiedActor = Extract<DeadmanCodeVerification, { valid: true }>;
type TriggerSource = z.infer<typeof triggerSourceSchema>;
type ActivateInput = {
  confirmation_type: DeadmanConfirmationType;
  confirmation_summary: string;
  source_url?: string;
  agency?: string;
  facility?: string;
  trigger_sources?: TriggerSource[];
};
type ReverseInput = { resolution_summary: string };

function sourceUrlRequired(type: DeadmanConfirmationType): boolean {
  return (
    type === "official_booking_record" ||
    type === "filed_court_order" ||
    type === "custodial_agency_confirmation" ||
    type === "credible_current_reporting"
  );
}

function incidentCode(now: Date): string {
  const day = now.toISOString().slice(0, 10).replaceAll("-", "");
  return `ENC-${day}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function recordEvent(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: {
    incidentId?: string | null;
    eventType: string;
    actorId: string;
    fingerprint?: string | null;
    detail?: Record<string, unknown>;
  },
) {
  await supabase.from("deadman_event_log").insert({
    incident_id: input.incidentId ?? null,
    event_type: input.eventType,
    actor_id: input.actorId,
    request_fingerprint: input.fingerprint ?? null,
    detail: input.detail ?? {},
  });
}

async function reverseSwitch(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: ReverseInput,
  fingerprint: string,
  verification: VerifiedActor,
) {
  const { data: incident } = await supabase
    .from("deadman_incidents")
    .select("id, incident_code")
    .in("status", ["verifying", "active"])
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!incident) {
    return NextResponse.json({
      ok: true,
      active: false,
      released: 0,
      message: "The emergency publishing switch is already off.",
    });
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("deadman_incidents")
    .update({
      status: "resolved",
      public_release_authorized: false,
      resolved_at: now,
      resolution_summary: input.resolution_summary,
      updated_at: now,
    })
    .eq("id", incident.id)
    .in("status", ["verifying", "active"]);
  if (error) throw error;

  const [withdrawResult, socialResult] = await Promise.all([
    supabase
      .from("deadman_updates")
      .update({
        status: "withdrawn",
        correction_summary: "Withdrawn because the emergency incident was resolved.",
      }, { count: "exact" })
      .eq("incident_id", incident.id)
      .eq("status", "ready"),
    supabase
      .from("deadman_social_dispatches")
      .update({
        status: "skipped",
        error: "Skipped because the emergency incident was resolved before dispatch.",
        updated_at: now,
      }, { count: "exact" })
      .eq("incident_id", incident.id)
      .in("status", ["ready", "failed", "posting"]),
  ]);
  const cleanupIssues = [
    withdrawResult.error ? "ready_update_cleanup" : null,
    socialResult.error ? "social_dispatch_cleanup" : null,
  ].filter((value): value is string => value !== null);

  await recordEvent(supabase, {
    incidentId: incident.id,
    eventType: "switch_reversed",
    actorId: verification.actor_id,
    fingerprint,
    detail: {
      resolution_summary: input.resolution_summary,
      withdrawn_updates: withdrawResult.count ?? 0,
      skipped_social_dispatches: socialResult.count ?? 0,
      cleanup_attention: cleanupIssues,
    },
  });
  if (cleanupIssues.length) {
    await recordEvent(supabase, {
      incidentId: incident.id,
      eventType: "switch_reversal_cleanup_attention",
      actorId: verification.actor_id,
      fingerprint,
      detail: { failed_cleanup_steps: cleanupIssues },
    });
  }

  await sendAdminAlert({
    subject: `Deadman's Switch reversed · ${incident.incident_code}`,
    text: `The emergency publishing switch was turned off.\n\nIncident: ${incident.incident_code}\nResolution: ${input.resolution_summary}`,
    html: `<p>The emergency publishing switch was turned off.</p><p><strong>Incident:</strong> ${escapeHtml(incident.incident_code)}</p><p><strong>Resolution:</strong> ${escapeHtml(input.resolution_summary)}</p>`,
  }).catch(() => null);

  return NextResponse.json({
    ok: true,
    active: false,
    released: 0,
    incident_code: incident.incident_code,
    message: cleanupIssues.length
      ? "Emergency publishing is off. Published records remain intact; a private queue-cleanup task was logged for attention."
      : "Emergency publishing is off. Published records remain intact.",
  });
}

async function activateSwitch(
  supabase: ReturnType<typeof getSupabaseServiceClient>,
  input: ActivateInput,
  fingerprint: string,
  verification: VerifiedActor,
) {
  const triggerSources = input.trigger_sources ?? [];
  const primarySourceUrl = input.source_url || triggerSources[0]?.url;
  if (sourceUrlRequired(input.confirmation_type) && !primarySourceUrl) {
    return NextResponse.json(
      { error: "A public source URL is required for this confirmation type." },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("deadman_incidents")
    .select("id, incident_code, status")
    .in("status", ["verifying", "active"])
    .order("reported_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await recordEvent(supabase, {
      incidentId: existing.id,
      eventType: "duplicate_activation_ignored",
      actorId: verification.actor_id,
      fingerprint,
    });
    return NextResponse.json({
      ok: true,
      active: existing.status === "active",
      released: 0,
      incident_code: existing.incident_code,
      message: "An emergency incident is already open. This request was recorded without publishing a duplicate.",
    });
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const code = incidentCode(now);
  const { data: incident, error: incidentError } = await supabase
    .from("deadman_incidents")
    .insert({
      incident_code: code,
      status: "verifying",
      activator_id: verification.actor_id,
      activator_label: verification.actor_label,
      confirmation_type: input.confirmation_type,
      confirmation_summary: input.confirmation_summary,
      source_url: primarySourceUrl || null,
      agency: input.agency?.trim() || null,
      facility: input.facility?.trim() || null,
      public_release_authorized: false,
      reported_at: nowIso,
      metadata: {
        protocol_version: 3,
        cadence: "top_of_every_hour",
        editorial_mode: DEADMAN_EDITORIAL_MODE,
        activation_channel: verification.actor_id.startsWith("admin:")
          ? "authenticated_admin_toggle"
          : "trusted_contact_code",
        trigger_sources: triggerSources,
      },
    })
    .select("id, incident_code")
    .single();
  if (incidentError || !incident) {
    if (incidentError?.code === "23505") {
      return NextResponse.json({
        ok: true,
        active: true,
        released: 0,
        message: "An emergency incident was activated by another trusted contact at the same time.",
      });
    }
    throw incidentError ?? new Error("Could not create the incident record.");
  }

  let stagedUpdateId: string | null = null;
  let plannedPublicUrl: string | null = null;
  try {
    const bulletin = buildInitialCustodyBulletin({
      confirmedAt: nowIso,
      confirmationType: input.confirmation_type,
      agency: input.agency,
      facility: input.facility,
      publicSummary: input.confirmation_summary,
      sourceUrl: primarySourceUrl,
    });
    const slug = `custody-response-${nowIso.slice(0, 10)}-${incident.incident_code
      .split("-")
      .at(-1)!
      .toLowerCase()}`;
    const publicUrl = `${SITE.url}/posts/${slug}`;
    plannedPublicUrl = publicUrl;
    const { data: activatedIncident, error: activateError } = await supabase
      .from("deadman_incidents")
      .update({
        status: "active",
        public_release_authorized: true,
        activated_at: nowIso,
        updated_at: nowIso,
      })
      .eq("id", incident.id)
      .eq("status", "verifying")
      .select("id")
      .maybeSingle();
    if (activateError || !activatedIncident) {
      throw activateError ?? new Error("The incident was resolved before activation completed.");
    }

    const sources: DeadmanPublicSource[] = triggerSources.length
      ? triggerSources.map((source, index) => ({
          id: `activation-report-${index + 1}`,
          url: source.url,
          type: input.confirmation_type,
          note: [source.publisher, source.headline, source.published_at]
            .filter(Boolean)
            .join(" · ") || undefined,
        }))
      : primarySourceUrl
        ? [{ id: "activation-confirmation", url: primarySourceUrl, type: input.confirmation_type }]
      : [
          {
            id: "activation-confirmation",
            type: input.confirmation_type,
            note: "Authenticated manual confirmation preserved in the private incident record.",
          },
        ];
    const evidenceStrength: DeadmanEvidenceStrength =
      input.confirmation_type === "credible_current_reporting"
        ? sources.length >= 2
          ? "corroborated"
          : "single_public_source"
        : input.confirmation_type === "official_booking_record" ||
      input.confirmation_type === "filed_court_order" ||
      input.confirmation_type === "custodial_agency_confirmation"
        ? "primary_record"
        : "direct_confirmation";
    const actorDescription = verification.actor_id.startsWith("admin:")
      ? "An authenticated site administrator"
      : "A trusted contact";
    const confirmationLabel = DEADMAN_CONFIRMATION_LABELS[input.confirmation_type];
    const claimLabels: DeadmanClaimLabels = {
      verified_facts: [
        {
          id: "fact-activation",
          claim: `${actorDescription} activated the custody protocol after double confirmation using ${confirmationLabel}.`,
          source_ids: sources.map((source) => source.id),
        },
      ],
      attributed_allegations: [],
      editorial_inferences: [],
      advocacy_positions: [
        {
          id: "advocacy-release",
          claim: "This site calls for Ryan's release unless the government establishes a lawful and documented basis for detention.",
        },
      ],
      unresolved_questions: [
        {
          id: "question-legal-basis",
          claim: "Which office and official supplied the operative legal basis for detention?",
        },
      ],
    };
    const factBasis = {
      editorial_mode: DEADMAN_EDITORIAL_MODE,
      evidence_strength: evidenceStrength,
      accountability_targets: ["Harrison County public agencies"],
      related_topics: [
        "custody legal basis",
        "Harrison County decision chain",
        "source-gated evidence review",
        "exculpatory evidence",
      ],
      official_response_status: "requested",
      claim_labels: claimLabels,
      confirmation_type: input.confirmation_type,
      confirmation_summary_private: true,
      confirmed_at: nowIso,
      agency: input.agency?.trim() || null,
      facility: input.facility?.trim() || null,
      trigger_sources: triggerSources,
    };
    const editorialValidation = validateDeadmanAccountabilityDraft({
      title: bulletin.title,
      body: bulletin.body,
      evidenceStrength,
      sources,
      claimLabels,
      accountabilityTargets: factBasis.accountability_targets,
    });
    if (!editorialValidation.ok) {
      throw new Error(
        `Initial bulletin failed accountability validation: ${editorialValidation.errors.join(" ")}`,
      );
    }
    const { data: updateId, error: stageError } = await supabase.rpc(
      "stage_deadman_update",
      {
        p_incident_id: incident.id,
        p_slug: slug,
        p_title: bulletin.title,
        p_body: bulletin.body,
        p_source_classification: input.confirmation_type,
        p_public_record_sources: sources,
        p_fact_basis: factBasis,
        p_seo_description: bulletin.seoDescription,
        p_created_by: verification.actor_id,
        p_x_post: `Verified custody response: Harrison County must show the lawful, documented basis for holding Ryan Nichols—or release him. Every public decision will be sourced and preserved. Read and share: ${publicUrl}`,
        p_facebook_post: `A verified custody response has been activated for Ryan Nichols.\n\nHarrison County must identify the lawful, documented basis for holding him—or release him. We will preserve the public decision chain, compare official claims with source records, publish exculpatory evidence and contradictions, and request answers from the responsible public offices.\n\nRead and share the source-labeled record. Ask factual questions, submit original records, and do not threaten, harass, dox, or target private people.\n\n${publicUrl}`,
      },
    );
    if (stageError || typeof updateId !== "string") {
      throw stageError ?? new Error("Could not stage the initial custody bulletin.");
    }
    stagedUpdateId = updateId;

    await recordEvent(supabase, {
      incidentId: incident.id,
      eventType: "switch_activated",
      actorId: verification.actor_id,
      fingerprint,
      detail: {
        confirmation_type: input.confirmation_type,
        source_url: primarySourceUrl || null,
        trigger_sources: triggerSources,
        initial_update_id: updateId,
      },
    });

    const release = await releaseNextDeadmanUpdate(supabase, incident.id);
    if (!release.released_ids.includes(updateId)) {
      throw new Error("The initial custody bulletin did not pass the atomic release step.");
    }

    const [indexing, socialResult, alert] = await Promise.allSettled([
      pingIndexNow([`/posts/${slug}`, "/", "/sitemap.xml"]),
      dispatchNextDeadmanXPost(supabase),
      sendAdminAlert({
        subject: `Deadman's Switch activated · ${incident.incident_code}`,
        text: [
          "The custody-response protocol was activated by an authorized operator.",
          `Incident: ${incident.incident_code}`,
          `Activator: ${verification.actor_label}`,
          `Confirmation: ${input.confirmation_type}`,
          `Initial bulletin: ${publicUrl}`,
          "Review the private incident record and preserve all original sources.",
        ].join("\n"),
        html: `<p><strong>The custody-response protocol was activated by an authorized operator.</strong></p><p><strong>Incident:</strong> ${escapeHtml(incident.incident_code)}<br/><strong>Activator:</strong> ${escapeHtml(verification.actor_label)}<br/><strong>Confirmation:</strong> ${escapeHtml(input.confirmation_type)}</p><p><a href="${escapeHtml(publicUrl)}">Open the initial bulletin</a></p><p>Review the private incident record and preserve all original sources.</p>`,
      }),
    ]);
    const sideEffects: Array<[string, PromiseSettledResult<unknown>]> = [
      ["indexing", indexing],
      ["x_dispatch", socialResult],
      ["admin_alert", alert],
    ];
    const sideEffectFailures = sideEffects
      .filter(([, result]) => result.status === "rejected")
      .map(([name]) => name);
    if (sideEffectFailures.length) {
      await recordEvent(supabase, {
        incidentId: incident.id,
        eventType: "activation_side_effect_attention",
        actorId: "deadman-activation-worker",
        detail: { failed_side_effects: sideEffectFailures },
      });
    }
    const social = socialResult.status === "fulfilled" ? socialResult.value : null;

    return NextResponse.json({
      ok: true,
      active: true,
      released: release.released,
      blocked: release.blocked,
      incident_code: incident.incident_code,
      public_url: publicUrl,
      next_eligible_at: release.next_eligible_at,
      x_dispatch: social,
      message:
        "Custody response activated. The initial source-labeled bulletin was published and hourly reporting is live.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Activation failed.";
    if (stagedUpdateId) {
      const [committedUpdateResult, incidentStateResult] = await Promise.all([
        supabase
          .from("deadman_updates")
          .select("status, post_id")
          .eq("id", stagedUpdateId)
          .maybeSingle(),
        supabase
          .from("deadman_incidents")
          .select("status, public_release_authorized")
          .eq("id", incident.id)
          .maybeSingle(),
      ]);
      if (
        committedUpdateResult.error ||
        incidentStateResult.error ||
        !incidentStateResult.data
      ) {
        await recordEvent(supabase, {
          incidentId: incident.id,
          eventType: "activation_commit_status_attention",
          actorId: verification.actor_id,
          fingerprint,
          detail: { error: message, initial_update_id: stagedUpdateId },
        });
        return NextResponse.json(
          {
            ok: false,
            released: 0,
            incident_code: incident.incident_code,
            public_url: null,
            message:
              "Activation completion could not be confirmed. The incident was left unchanged for safe reconciliation.",
          },
          { status: 202 },
        );
      }
      const committedUpdate = committedUpdateResult.data;
      const incidentStillActive =
        incidentStateResult.data.status === "active" &&
        incidentStateResult.data.public_release_authorized === true;
      if (committedUpdate?.status === "published") {
        await recordEvent(supabase, {
          incidentId: incident.id,
          eventType: "activation_post_commit_attention",
          actorId: verification.actor_id,
          fingerprint,
          detail: { error: message, initial_update_id: stagedUpdateId },
        });
        return NextResponse.json({
          ok: true,
          active: incidentStillActive,
          released: 1,
          incident_code: incident.incident_code,
          public_url: plannedPublicUrl,
          message: incidentStillActive
            ? "The initial bulletin is live. A non-public follow-up task needs attention, but the active incident was preserved."
            : "The initial bulletin was published before the reversal completed. The incident is off and no further releases are authorized.",
        });
      }
      const { error: withdrawError } = await supabase
        .from("deadman_updates")
        .update({
          status: "withdrawn",
          correction_summary:
            "Withdrawn because activation failed before the initial bulletin was published.",
        })
        .eq("id", stagedUpdateId)
        .eq("status", "ready");
      if (withdrawError) {
        await recordEvent(supabase, {
          incidentId: incident.id,
          eventType: "activation_failed_queue_cleanup_attention",
          actorId: verification.actor_id,
          fingerprint,
          detail: { initial_update_id: stagedUpdateId },
        });
      }
      if (!incidentStillActive) {
        return NextResponse.json({
          ok: true,
          active: false,
          released: 0,
          incident_code: incident.incident_code,
          public_url: null,
          message:
            "The reversal completed before the initial bulletin published. The incident remains off.",
        });
      }
    }
    await supabase
      .from("deadman_incidents")
      .update({
        status: "activation_failed",
        public_release_authorized: false,
        resolution_summary: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", incident.id)
      .in("status", ["verifying", "active"]);
    await recordEvent(supabase, {
      incidentId: incident.id,
      eventType: "activation_failed",
      actorId: verification.actor_id,
      fingerprint,
      detail: { error: message },
    });
    throw error;
  }
}

export async function POST(request: Request) {
  if (!isSupabaseServiceConfigured()) {
    return NextResponse.json(
      { error: "Deadman's Switch is not fully configured." },
      { status: 503 },
    );
  }

  const supabase = getSupabaseServiceClient();
  const rate = await checkRateLimit({
    request,
    bucket: "deadman-v2",
    windowMinutes: 15,
    maxRequests: 5,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
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

  try {
    if (
      parsed.data.action === "admin_activate" ||
      parsed.data.action === "admin_reverse"
    ) {
      const admin = await requireAdminApi();
      if (!admin.ok) {
        return NextResponse.json(
          { error: admin.error },
          { status: admin.status },
        );
      }
      const verification: VerifiedActor = {
        valid: true,
        actor_id: `admin:${admin.userId}`,
        actor_label: "Authenticated site administrator",
      };
      if (parsed.data.action === "admin_reverse") {
        return await reverseSwitch(
          supabase,
          {
            resolution_summary:
              "An authenticated site administrator turned off the emergency publishing switch after double confirmation.",
          },
          rate.ipHash,
          verification,
        );
      }

      const triggerSources = (parsed.data.trigger_sources ?? []).filter(
        (source, index, all) =>
          all.findIndex((candidate) => candidate.url === source.url) === index,
      );
      const publishers = Array.from(
        new Set(
          triggerSources
            .map((source) => source.publisher?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      );
      return await activateSwitch(
        supabase,
        {
          confirmation_type: triggerSources.length
            ? "credible_current_reporting"
            : "authenticated_admin_confirmation",
          confirmation_summary: triggerSources.length
            ? `The authenticated administrator activated after reviewing current reporting${publishers.length ? ` from ${publishers.join(", ")}` : ""}.`
            : "The authenticated administrator manually activated the custody-response system after double confirmation.",
          source_url: triggerSources[0]?.url,
          trigger_sources: triggerSources,
        },
        rate.ipHash,
        verification,
      );
    }

    if (!(await deadmanKeysConfiguredFor(supabase))) {
      return NextResponse.json(
        { error: "Deadman's Switch is not fully configured." },
        { status: 503 },
      );
    }

    if (parsed.data.action === "reverse") {
      const verification = await verifyDeadmanCodeFor(
        supabase,
        "reverse",
        parsed.data.code,
      );
      if (!verification.valid) {
        await recordEvent(supabase, {
          eventType: "invalid_reversal_code",
          actorId: "unknown",
          fingerprint: rate.ipHash,
        });
        return NextResponse.json({ error: "Invalid code." }, { status: 403 });
      }
      return await reverseSwitch(
        supabase,
        { resolution_summary: parsed.data.resolution_summary },
        rate.ipHash,
        verification,
      );
    }
    const verification = await verifyDeadmanCodeFor(
      supabase,
      "activate",
      parsed.data.code,
      parsed.data.activator_id,
    );
    if (!verification.valid) {
      await recordEvent(supabase, {
        eventType: "invalid_activation_code",
        actorId: parsed.data.activator_id || "unknown",
        fingerprint: rate.ipHash,
      });
      return NextResponse.json(
        { error: "Invalid contact ID or code." },
        { status: 403 },
      );
    }
    return await activateSwitch(
      supabase,
      {
        confirmation_type: parsed.data.confirmation_type,
        confirmation_summary: parsed.data.confirmation_summary,
        source_url: parsed.data.source_url,
        agency: parsed.data.agency,
        facility: parsed.data.facility,
      },
      rate.ipHash,
      verification,
    );
  } catch (error) {
    console.error(
      "deadman_v2_request_failed",
      error instanceof Error ? error.message : "unknown",
    );
    return NextResponse.json(
      { error: "The emergency request could not be completed. No unverified public post was released." },
      { status: 500 },
    );
  }
}
